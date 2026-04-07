import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

export async function POST(req: NextRequest) {
    try {
        const { amount, payment_id, customer_name, source = 'pos' } = await req.json();

        if (!process.env.DATABASE_URL) {
            throw new Error('DATABASE_URL is not defined');
        }

        const sql = neon(process.env.DATABASE_URL);

        // Criar reserva manual vinda da maquininha
        const result = await sql`
            INSERT INTO reservations (
                customer_name,
                customer_email,
                phone,
                reservation_date,
                reservation_time,
                guests,
                total_price,
                status,
                payment_status,
                pickup_status,
                source
            ) VALUES (
                ${customer_name || 'Venda Direta (POS)'},
                'pos@legendario.com.br',
                '00000000000',
                CURRENT_DATE,
                CURRENT_TIME,
                1,
                ${amount},
                'CONFIRMED',
                'Pago',
                'Pendente',
                ${source}
            )
            RETURNING id;
        `;

        return NextResponse.json({ 
            success: true, 
            id: result[0].id,
            message: 'Venda registrada com sucesso'
        });
    } catch (error) {
        console.error('Erro ao registrar venda POS:', error);
        return NextResponse.json(
            { success: false, error: 'Falha ao registrar venda' },
            { status: 500 }
        );
    }
}
