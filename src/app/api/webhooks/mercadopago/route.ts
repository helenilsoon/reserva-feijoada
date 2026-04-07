import { sql } from '@/lib/db';
import { NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';

export async function POST(req: Request) {
    try {
        const body = await req.json().catch(() => ({}));
        const url = new URL(req.url);

        console.log('--- Início Webhook Mercado Pago ---');
        console.log('Host:', req.headers.get('host'));
        console.log('Query:', url.search);
        console.log('Body:', JSON.stringify(body));

        // Captura o ID de todas as formas possíveis (Body moderno, Body legado/IPN ou Query String)
        let paymentId = body.data?.id;

        // Se for o formato legado (IPN), o ID vem em "resource" ou no próprio body com "topic"
        if (!paymentId && (body.topic === 'payment' || body.type === 'payment')) {
            paymentId = body.id || (body.resource && body.resource.split('/').pop());
        }

        // Se ainda não achou, tenta na Query String (comum em notificações IPN)
        if (!paymentId && url.searchParams.get('topic') === 'payment') {
            paymentId = url.searchParams.get('id');
        }

        if (paymentId) {
            console.log(`[Webhook] Processando ID: ${paymentId}`);
            const token = process.env.MP_ACCESS_TOKEN;

            if (!token) {
                console.error('[Webhook] ERRO: MP_ACCESS_TOKEN ausente!');
                return NextResponse.json({ error: 'Configuração' }, { status: 500 });
            }

            const client = new MercadoPagoConfig({ accessToken: token });
            const payment = new Payment(client);

            try {
                const details = await payment.get({ id: paymentId });
                const status = details.status?.toLowerCase();
                const reservationId = details.external_reference;

                console.log(`[Webhook TRACE] Pago: ${paymentId}, Status: ${status}, Ref: ${reservationId}`);

                if ((status === 'approved' || status === 'authorized') && reservationId) {
                    if (reservationId.startsWith('manual_')) {
                        console.log(`[Webhook] Pagamento avulso (Maquininha): ${reservationId}`);
                        
                        // Busca o preço atual para estimar o número de marmitas
                        let price = 20.0;
                        try {
                            const settingsResult = await sql`SELECT value FROM settings WHERE key = 'event_config'`;
                            if (settingsResult.length > 0) {
                                price = parseFloat((settingsResult[0].value as any).price || 20.0);
                            }
                        } catch (e) {}

                        const amount = details.transaction_amount || 0;
                        const guests = Math.max(1, Math.round(amount / (price || 20)));

                        console.log(`[Webhook] Criando registro de venda PDV: R$ ${amount} (${guests} marmitas)`);

                        // Cria um registro na tabela reservations vindo do PDV
                        await sql`
                            INSERT INTO reservations (
                                customer_name, customer_email, phone, 
                                reservation_date, reservation_time,
                                guests, total_price,
                                delivery_type, payment_status, 
                                source, created_at
                            ) VALUES (
                                ${details.payer?.first_name || 'Cliente (PDV)'}, 
                                ${details.payer?.email || 'pdv@feijoada.com'}, 
                                'PDV', 
                                CURRENT_DATE,
                                CURRENT_TIME,
                                ${guests}, 
                                ${amount},
                                'retirada', 
                                'Pago', 
                                'pos', 
                                NOW()
                            )
                        `;
                    } else {
                        const id = parseInt(reservationId);
                        console.log(`[Webhook] Tentando atualizar reserva #${id}...`);

                        const result = await sql`
                            UPDATE reservations 
                            SET payment_status = 'Pago' 
                            WHERE id = ${id}
                            RETURNING id, payment_status
                        `;

                        if (result.length > 0) {
                            console.log(`[Webhook SUCCESS] Reserva ${id} agora é: ${result[0].payment_status}`);
                        } else {
                            console.warn(`[Webhook NOT_FOUND] ID ${id} não existe no DB.`);
                        }
                    }
                } else {
                    console.log(`[Webhook SKIP] Ignorado (status: ${status}, ref: ${reservationId})`);
                }
            } catch (sdkError: any) {
                console.error(`[Webhook ERROR] Falha ao consultar MP (ID ${paymentId}):`, sdkError?.message || sdkError);
            }
        } else {
            console.log('[Webhook INFO] Notificação recebida sem ID de pagamento reconhecido (Body: ' + JSON.stringify(body) + ')');
        }

        // Sempre retorna 200 para confirmar recebimento
        return NextResponse.json({ received: true });
    } catch (error) {
        console.error('Erro capturado no manipulador de webhook:', error);
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }
}
