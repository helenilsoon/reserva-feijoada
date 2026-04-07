import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: paymentId } = await params;
    const token = process.env.MP_ACCESS_TOKEN;

    if (!token) {
        return NextResponse.json({ error: 'MP_ACCESS_TOKEN is missing' }, { status: 500 });
    }

    try {
        const client = new MercadoPagoConfig({ accessToken: token });
        const payment = new Payment(client);

        const details = await payment.get({ id: paymentId });
        const status = details.status?.toLowerCase();

        return NextResponse.json({
            id: paymentId,
            status: status === 'approved' ? 'Pago' : status,
            mp_status: status
        });
    } catch (error: any) {
        console.error(`[POS Status] Erro ao consultar pagamento ${paymentId}:`, error?.message);
        return NextResponse.json({ error: 'Erro ao consultar status' }, { status: 500 });
    }
}
