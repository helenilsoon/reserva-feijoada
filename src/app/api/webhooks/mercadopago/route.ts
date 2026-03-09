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
            console.log(`[Webhook] Processando pagamento ID: ${paymentId}`);
            const token = process.env.MP_ACCESS_TOKEN;

            if (!token) {
                console.error('[Webhook] ERRO: MP_ACCESS_TOKEN não configurado no servidor');
                return NextResponse.json({ error: 'Erro de configuração' }, { status: 500 });
            }

            const client = new MercadoPagoConfig({ accessToken: token });
            const payment = new Payment(client);

            try {
                console.log(`[Webhook] Buscando detalhes do pagamento ${paymentId} no Mercado Pago...`);
                const details = await payment.get({ id: paymentId });
                const status = details.status;
                const reservationId = details.external_reference;

                console.log(`[Webhook] Resposta MP: ID=${paymentId}, Status=${status}, RefExterna=${reservationId}`);

                if (status === 'approved' && reservationId) {
                    if (reservationId.startsWith('manual_')) {
                        console.log(`[Webhook] Pagamento manual ${reservationId} aprovado. OK.`);
                    } else {
                        const resIdFormatted = parseInt(reservationId);
                        console.log(`[Webhook] Atualizando reserva ${resIdFormatted} para 'Pago'...`);

                        const result = await sql`
                            UPDATE reservations 
                            SET payment_status = 'Pago' 
                            WHERE id = ${resIdFormatted}
                            RETURNING id
                        `;

                        if (result && result.length > 0) {
                            console.log(`[Webhook] SUCESSO: Reserva ${resIdFormatted} atualizada.`);
                        } else {
                            console.warn(`[Webhook] AVISO: Reserva ${resIdFormatted} não encontrada no banco.`);
                        }
                    }
                } else {
                    console.log(`[Webhook] Pagamento ${paymentId} ignorado (Status: ${status}, Ref: ${reservationId})`);
                }
            } catch (sdkError) {
                console.error(`[Webhook] Erro ao consultar API Mercado Pago para ID ${paymentId}:`, sdkError);
            }
        } else {
            console.log('[Webhook] Notificação recebida, mas nenhum ID de pagamento (topic=payment) foi identificado.');
        }

        // Sempre retorna 200 para confirmar recebimento
        return NextResponse.json({ received: true });
    } catch (error) {
        console.error('Erro capturado no manipulador de webhook:', error);
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }
}
