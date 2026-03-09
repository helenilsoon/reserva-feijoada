import { sql } from '@/lib/db';
import { NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        console.log('Webhook Mercado Pago Recebido:', JSON.stringify(body));

        // Estamos interessados em notificações de "payment"
        // Estamos interessados em notificações de "payment"
        if (body.type === 'payment' && body.data?.id) {
            const paymentId = body.data.id;
            console.log(`[Webhook] Processando pagamento ID: ${paymentId}`);
            const token = process.env.MP_ACCESS_TOKEN;

            if (!token) {
                console.error('Erro no Webhook: MP_ACCESS_TOKEN não configurado');
                return NextResponse.json({ error: 'Erro de configuração do servidor' }, { status: 500 });
            }

            const client = new MercadoPagoConfig({ accessToken: token });
            const payment = new Payment(client);

            try {
                const details = await payment.get({ id: paymentId });
                const status = details.status;
                const reservationId = details.external_reference;

                console.log(`Detalhes do Pagamento: ID=${paymentId}, Status=${status}, RefExterna=${reservationId}`);

                if (status === 'approved' && reservationId) {
                    // Verifica se é um pagamento manual ou uma reserva
                    if (reservationId.startsWith('manual_')) {
                        console.log(`[Webhook] Pagamento manual ${reservationId} aprovado. Nenhuma atualização de reserva necessária.`);
                    } else {
                        // Converte para número para garantir compatibilidade com o tipo 'integer' do banco de dados id
                        const resIdFormatted = parseInt(reservationId);

                        console.log(`[Webhook] Tentando atualizar reserva ID: ${resIdFormatted}`);

                        const result = await sql`
                            UPDATE reservations 
                            SET payment_status = 'Pago' 
                            WHERE id = ${resIdFormatted}
                            RETURNING id
                        `;

                        if (result && result.length > 0) {
                            console.log(`[Webhook] Sucesso: Reserva ${resIdFormatted} marcada como PAGA.`);
                        } else {
                            console.warn(`[Webhook] Aviso: Reserva ${resIdFormatted} não encontrada no banco de dados.`);
                        }
                    }
                } else {
                    console.log(`[Webhook] Pagamento ${paymentId} recebido com status: ${status}. Nenhuma ação tomada.`);
                }
            } catch (sdkError) {
                console.error(`Erro ao buscar pagamento ${paymentId} no Mercado Pago:`, sdkError);
            }
        }

        // Sempre retorna 200 para confirmar recebimento
        return NextResponse.json({ received: true });
    } catch (error) {
        console.error('Erro capturado no manipulador de webhook:', error);
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }
}
