import { NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';

export async function POST(req: Request) {
    try {
        const { reservationId, guests, name } = await req.json();

        if (!reservationId) {
            return NextResponse.json({ error: 'ID da reserva é obrigatório.' }, { status: 400 });
        }

        const token = process.env.MP_ACCESS_TOKEN;
        console.log('TOKEN DEBUG:', token ? `len=${token.length}, prefix=${token.substring(0, 8)}` : 'EMPTY/UNDEFINED');

        if (!token) {
            return NextResponse.json({ error: 'MP_ACCESS_TOKEN não configurado.' }, { status: 500 });
        }

        // Create client INSIDE the function so env is always loaded
        const client = new MercadoPagoConfig({ accessToken: token });
        const payment = new Payment(client);

        const pricePerUnit = 20.00;
        const totalAmount = pricePerUnit * (guests || 1);

        const response = await payment.create({
            body: {
                transaction_amount: totalAmount,
                description: `Feijoada Solidária - ${guests} porções`,
                payment_method_id: 'pix',
                notification_url: `${process.env.WEBHOOK_URL || process.env.NEXT_PUBLIC_URL || 'https://example.com'}/api/webhooks/mercadopago`,
                external_reference: reservationId.toString(),
                payer: {
                    email: 'pagador@feijoada.com',
                    first_name: name || 'Cliente',
                },
            },
        });

        const qr_code = response.point_of_interaction?.transaction_data?.qr_code;
        const qr_code_base64 = response.point_of_interaction?.transaction_data?.qr_code_base64;

        if (!qr_code) {
            console.error('MP response sem qr_code:', JSON.stringify(response));
            return NextResponse.json({ error: 'PIX gerado mas sem QR Code na resposta.' }, { status: 500 });
        }

        return NextResponse.json({
            id: response.id,
            qr_code,
            qr_code_base64,
            ticket_url: response.point_of_interaction?.transaction_data?.ticket_url,
        });
    } catch (error: any) {
        const mpError = error?.cause ?? error?.message ?? String(error);
        console.error('Mercado Pago PIX Error:', JSON.stringify(mpError));

        const errorMessage = Array.isArray(mpError)
            ? mpError.map((c: any) => c.description || c.code).join(', ')
            : (error?.message || 'Erro desconhecido');

        return NextResponse.json(
            { error: `Erro ao gerar PIX: ${errorMessage}` },
            { status: 500 }
        );
    }
}
