import { NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { sql } from '@/lib/db';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { reservationId, guests, name, amount, delivery_type } = body;

        if (!reservationId && !amount) {
            return NextResponse.json({ error: 'ID da reserva ou valor manual é obrigatório.' }, { status: 400 });
        }

        const token = process.env.MP_ACCESS_TOKEN;
        if (!token) {
            return NextResponse.json({ error: 'MP_ACCESS_TOKEN não configurado.' }, { status: 500 });
        }

        const client = new MercadoPagoConfig({ accessToken: token });
        const payment = new Payment(client);

        // Busca o preço dinâmico do banco de dados
        let pricePerUnit = 20.00; // fallback
        let deliveryFee = 0;
        try {
            const settingsResult = await sql`SELECT value FROM settings WHERE key = 'event_config'`;
            if (settingsResult.length > 0) {
                const config = settingsResult[0].value as any;
                if (config.price) pricePerUnit = parseFloat(config.price);
                if (delivery_type === 'entrega' && config.delivery_enabled) {
                    deliveryFee = parseFloat(config.delivery_fee || 0);
                }
            }
        } catch (err) {
            console.error('Erro ao buscar preço dinâmico:', err);
        }
        
        const totalAmountInput = amount ? parseFloat(amount.toString()) : null;
        const totalAmount = totalAmountInput || (pricePerUnit * (guests || 1)) + deliveryFee;

        if (!totalAmount || totalAmount <= 0) {
            return NextResponse.json({ error: 'Valor total inválido.' }, { status: 400 });
        }

        const webhookUrl = process.env.MP_WEBHOOK_URL || process.env.WEBHOOK_URL || process.env.NEXT_PUBLIC_URL;
        
        // Constrói a URL de notificação garantindo que não haja barras duplas e que seja HTTPS
        let notificationUrl = '';
        if (webhookUrl) {
            const baseUrl = webhookUrl.replace(/\/$/, '');
            notificationUrl = `${baseUrl}/api/webhooks/mercadopago`;
        }

        console.log(`[Checkout] Token (prefix): ${token.substring(0, 7)}...`);
        console.log(`[Checkout] Webhook URL: ${notificationUrl || 'NÃO CONFIGURADA'}`);

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
        
        // Debug para arquivo local caso o console não seja acessível
        const fs = require('fs');
        try {
            fs.appendFileSync('checkout_error_log.txt', `[${new Date().toISOString()}] Error: ${JSON.stringify(mpError)}\n`);
        } catch (e) {}

        const errorMessage = Array.isArray(mpError)
            ? mpError.map((c: any) => c.description || c.code).join(', ')
            : (error?.message || 'Erro desconhecido');

        // Se o erro for de token inválido, dar uma dica melhor
        const finalError = errorMessage.toLowerCase().includes('jwt') || errorMessage.toLowerCase().includes('token')
            ? 'Token do Mercado Pago Inválido em .env.local. Por favor, verifique suas credenciais.'
            : errorMessage;

        return NextResponse.json(
            { error: `Erro ao gerar PIX: ${finalError}` },
            { status: 500 }
        );
    }
}
