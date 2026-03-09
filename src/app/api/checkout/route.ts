import { NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';

export async function POST(req: Request) {
    try {
        const { reservationId, guests, name, amount } = await req.json();

        if (!reservationId && !amount) {
            return NextResponse.json({ error: 'ID da reserva ou valor manual é obrigatório.' }, { status: 400 });
        }

        const token = process.env.MP_ACCESS_TOKEN;
        console.log('DEBUG TOKEN:', token ? `tam=${token.length}, prefixo=${token.substring(0, 8)}` : 'VAZIO/INDEFINIDO');

        if (!token) {
            return NextResponse.json({ error: 'MP_ACCESS_TOKEN não configurado.' }, { status: 500 });
        }

        // Cria o cliente DENTRO da função para garantir que o env seja sempre carregado
        const client = new MercadoPagoConfig({ accessToken: token });
        const payment = new Payment(client);

        const pricePerUnit = 20.00;
        const totalAmount = amount || (pricePerUnit * (guests || 1));

        const webhookUrl = process.env.WEBHOOK_URL || process.env.NEXT_PUBLIC_URL;

        if (!webhookUrl) {
            console.warn('AVISO: WEBHOOK_URL ou NEXT_PUBLIC_URL não configurados. Webhook pode não funcionar.');
        }

        const notificationUrl = `${webhookUrl || 'https://example.com'}/api/webhooks/mercadopago`;
        console.log(`[Checkout] URL de notificação configurada: ${notificationUrl}`);

        const response = await payment.create({
            body: {
                transaction_amount: totalAmount,
                description: amount ? `Pagamento Avulso - R$ ${amount.toFixed(2)}` : `Feijoada Solidária - ${guests} porções`,
                payment_method_id: 'pix',
                notification_url: notificationUrl,
                external_reference: reservationId ? reservationId.toString() : `manual_${Date.now()}`,
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
        console.error('Erro PIX Mercado Pago:', JSON.stringify(mpError));

        const errorMessage = Array.isArray(mpError)
            ? mpError.map((c: any) => c.description || c.code).join(', ')
            : (error?.message || 'Erro desconhecido');

        return NextResponse.json(
            { error: `Erro ao gerar PIX: ${errorMessage}` },
            { status: 500 }
        );
    }
}
