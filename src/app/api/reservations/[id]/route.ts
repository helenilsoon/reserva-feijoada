import { NextResponse } from 'next/server';
import { updateReservationSchema } from '@/lib/schemas';
import { ReservationService } from '@/lib/services/reservation-service';

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await req.json();

        // Validate partial update
        const validation = updateReservationSchema.partial().safeParse(body);
        
        if (!validation.success) {
            return NextResponse.json({ 
                error: 'Dados inválidos.', 
                details: validation.error.format() 
            }, { status: 400 });
        }

        if (!id) {
            return NextResponse.json({ error: 'ID é obrigatório.' }, { status: 400 });
        }

        await ReservationService.update(id, validation.data);
        return NextResponse.json({ message: 'Reserva atualizada com sucesso.' });
    } catch (error) {
        console.error('Update error:', error);
        return NextResponse.json({ error: 'Erro ao atualizar reserva.' }, { status: 500 });
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

        await ReservationService.delete(id);
        return NextResponse.json({ message: 'Reserva excluída com sucesso.' });
    } catch (error) {
        return NextResponse.json({ error: 'Erro ao excluir reserva.' }, { status: 500 });
    }
}
