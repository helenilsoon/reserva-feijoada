import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { SettingsService } from '@/lib/services/settings-service';
import { handleApiError } from '@/lib/error-handler';

export async function GET() {
  try {
    // Busca as configurações para saber o preço atual por marmita
    const settings = await SettingsService.get();
    const price = settings?.price || 0;
    const deliveryFee = settings?.delivery_fee || 0;

    // Agrega dados das reservas em uma única query para eficiência
    const stats = await sql`
      SELECT 
        COUNT(*) as total_reservations,
        SUM(guests) as total_guests,
        COUNT(CASE WHEN payment_status = 'Pago' THEN 1 END) as paid_count,
        COUNT(CASE WHEN payment_status = 'Pendente' THEN 1 END) as pending_count,
        SUM(CASE WHEN payment_status = 'Pago' THEN guests ELSE 0 END) as paid_guests,
        SUM(CASE WHEN payment_status = 'Pendente' THEN guests ELSE 0 END) as pending_guests,
        COUNT(CASE WHEN delivery_type = 'entrega' THEN 1 END) as delivery_count,
        COUNT(CASE WHEN delivery_type = 'retirada' THEN 1 END) as pickup_count,
        COUNT(CASE WHEN source = 'pos' THEN 1 END) as pos_count,
        COUNT(CASE WHEN source = 'web' OR source IS NULL THEN 1 END) as web_count
      FROM reservations
    `;

    const s = stats[0] as any;
    const totalGuests = parseInt(s.total_guests || '0');
    const paidGuests = parseInt(s.paid_guests || '0');
    const pendingGuests = parseInt(s.pending_guests || '0');
    const deliveryCount = parseInt(s.delivery_count || '0');

    // Cálculos financeiros
    const totalRevenue = paidGuests * price + (deliveryCount ? deliveryCount * deliveryFee : 0);
    const pendingRevenue = pendingGuests * price;
    const potentialRevenue = totalRevenue + pendingRevenue;

    return NextResponse.json({
      summary: {
        totalReservations: parseInt(s.total_reservations || '0'),
        totalGuests: totalGuests,
        paidCount: parseInt(s.paid_count || '0'),
        pendingCount: parseInt(s.pending_count || '0'),
        deliveryCount: deliveryCount,
        pickupCount: parseInt(s.pickup_count || '0'),
        posCount: parseInt(s.pos_count || '0'),
        webCount: parseInt(s.web_count || '0'),
      },
      financial: {
        pricePerUnit: price,
        deliveryFee: deliveryFee,
        totalRevenue: totalRevenue,
        pendingRevenue: pendingRevenue,
        potentialRevenue: potentialRevenue,
      }
    });

  } catch (error) {
    return handleApiError(error);
  }
}
