import { sql } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const id = params.id;
        const result = await sql`SELECT payment_status FROM reservations WHERE id = ${id}`;

        if (result.length === 0) {
            return NextResponse.json({ error: 'Reserva não encontrada' }, { status: 404 });
        }

        return NextResponse.json({ status: result[0].payment_status });
    } catch (error) {
        return NextResponse.json({ error: 'Erro ao buscar status' }, { status: 500 });
    }
}
