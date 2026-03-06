import { NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';

const client = new MercadoPagoConfig({
    accessToken: process.env.MP_ACCESS_TOKEN || '',
});

export async function POST(req: Request) {
    try {
        const { reservationId, guests, name } = await req.json();

        if (!reservationId) {
            return NextResponse.json({ error: 'ID da reserva é obrigatório.' }, { status: 400 });
        }

        const pricePerUnit = 20.00;
        const totalAmount = pricePerUnit * guests;

        const payment = new Payment(client);

        const response = await payment.create({
            body: {
                transaction_amount: totalAmount,
                description: `Feijoada Solidária - ${guests} porções`,
                payment_method_id: 'pix',
                notification_url: `${process.env.WEBHOOK_URL || 'https://your-domain.com'}/api/webhooks/mercadopago`,
                external_reference: reservationId.toString(),
                payer: {
                    email: 'comprador@email.com', // MP requires an email
                    first_name: name || 'Cliente',
                },
            },
        });

        return NextResponse.json({
            id: response.id,
            qr_code: response.point_of_interaction?.transaction_data?.qr_code,
            qr_code_base64: response.point_of_interaction?.transaction_data?.qr_code_base64,
            ticket_url: response.point_of_interaction?.transaction_data?.ticket_url,
        });
    } catch (error: any) {
        console.error('Mercado Pago PIX Error:', error.message || error);
        return NextResponse.json({ error: 'Erro ao gerar PIX. Verifique se o Access Token está configurado.' }, { status: 500 });
    }
}
