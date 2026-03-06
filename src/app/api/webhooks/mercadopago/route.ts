import { sql } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        console.log('Mercado Pago Webhook:', body);

        // Mercado Pago sends different types of notifications
        // We are interested in "payment" notifications
        // we are interested in successful payments
        if (body.type === 'payment' && body.data?.id) {
            const paymentId = body.data.id;

            // In a production environment, you would use the Mercado Pago SDK here
            // to fetch the payment details and verify the status before updating:
            // const payment = new Payment(client);
            // const details = await payment.get({ id: paymentId });
            // const reservationId = details.external_reference;
            // if (details.status === 'approved') { ... }

            // For now, if we receive a notification for an action that implies payment success,
            // or if we simply want to simulate the flow for the user's local tests:
            if (body.action === 'payment.created' || body.action === 'payment.updated') {
                // In a real webhook, the external_reference is usually available in the payment details
                // If the user is testing with a manual tool that sends the external_reference in the body:
                const reservationId = body.data.external_reference;
                if (reservationId) {
                    await sql`UPDATE reservations SET payment_status = 'Pago' WHERE id = ${reservationId}`;
                    console.log(`Reservation ${reservationId} marked as PAID via webhook.`);
                }
            }
        }

        return NextResponse.json({ received: true });
    } catch (error) {
        console.error('Webhook error:', error);
        return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
    }
}
