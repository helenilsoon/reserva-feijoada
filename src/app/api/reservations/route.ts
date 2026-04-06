import { NextResponse } from 'next/server';
import { reservationSchema } from '@/lib/schemas';
import { ReservationService } from '@/lib/services/reservation-service';
import { handleApiError } from '@/lib/error-handler';
import { isRateLimited, getRateLimitHeaders } from '@/lib/rate-limit';

export async function POST(req: Request) {
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const limit = 3; // 3 reservas
    const window = 300000; // 5 minutos

    if (isRateLimited(`res:${ip}`, limit, window)) {
        return NextResponse.json(
            { error: 'Muitas reservas em pouco tempo. Por favor, aguarde.' },
            { 
                status: 429,
                headers: getRateLimitHeaders(`res:${ip}`, limit, window)
            }
        );
    }

    try {
        const body = await req.json();
        const validatedData = reservationSchema.parse(body);
        const result = await ReservationService.create(validatedData);
        return NextResponse.json({ message: 'Reserva criada com sucesso.', id: result.id }, { status: 201 });
    } catch (error) {
        return handleApiError(error);
    }
}

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
        const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10)));
        const search = searchParams.get('search')?.trim() || undefined;

        const result = await ReservationService.getAll(page, limit, search);
        return NextResponse.json(result);
    } catch (error) {
        return handleApiError(error);
    }
}
