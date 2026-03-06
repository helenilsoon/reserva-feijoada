import { sql } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await req.json();
        const { payment_status, pickup_status } = body;

        if (!id) {
            return NextResponse.json({ error: 'ID é obrigatório.' }, { status: 400 });
        }

        if (payment_status !== undefined) {
            await sql`UPDATE reservations SET payment_status = ${payment_status} WHERE id = ${id}`;
        }

        if (pickup_status !== undefined) {
            await sql`UPDATE reservations SET pickup_status = ${pickup_status} WHERE id = ${id}`;
        }

        return NextResponse.json({ message: 'Status atualizado.' });
    } catch (error) {
        return NextResponse.json({ error: 'Erro ao atualizar status.' }, { status: 500 });
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        if (!id) {
            return NextResponse.json({ error: 'ID é obrigatório.' }, { status: 400 });
        }

        await sql`DELETE FROM reservations WHERE id = ${id}`;
        return NextResponse.json({ message: 'Reserva excluída com sucesso.' });
    } catch (error) {
        return NextResponse.json({ error: 'Erro ao excluir reserva.' }, { status: 500 });
    }
}
