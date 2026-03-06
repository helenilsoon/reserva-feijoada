import { sql } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { name, email, phone, date, time, guests } = body;

        if (!name || !phone || !date || !time || !guests) {
            return NextResponse.json({ error: 'Os campos Nome, Telefone, Data, Horário e Pessoas são obrigatórios.' }, { status: 400 });
        }

        // Insert reservation into Neon
        const result = await sql`
      INSERT INTO reservations (customer_name, customer_email, phone, reservation_date, reservation_time, guests)
      VALUES (${name}, ${email || ''}, ${phone}, ${date}, ${time}, ${guests})
      RETURNING id
    `;

        const reservationId = result[0].id;

        return NextResponse.json({ message: 'Reserva criada com sucesso.', id: reservationId }, { status: 201 });
    } catch (error) {
        console.error('Reservation error:', error);
        return NextResponse.json({ error: 'Erro interno ao processar reserva.' }, { status: 500 });
    }
}

export async function GET() {
    try {
        const reservations = await sql`SELECT id, customer_name, customer_email, phone, reservation_date, reservation_time, guests, payment_status, pickup_status, created_at FROM reservations ORDER BY created_at DESC LIMIT 50`;
        return NextResponse.json(reservations);
    } catch (error) {
        return NextResponse.json({ error: 'Erro ao buscar reservas.' }, { status: 500 });
    }
}
