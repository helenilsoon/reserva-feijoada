import { ReservationRepository, PaginatedResult, ReservationResponse } from '@/lib/repositories/reservation-repository';
import { reservationSchema, updateReservationSchema } from '@/lib/schemas';
import { z } from 'zod';

export type Reservation = z.infer<typeof reservationSchema> & {
  id: string;
  payment_status: string;
  pickup_status: string;
  created_at: Date;
};

export class ReservationService {
  static async getAll(
    page = 1,
    pageSize = 20,
    search?: string
  ): Promise<PaginatedResult<ReservationResponse>> {
    return await ReservationRepository.findAll(page, pageSize, search);
  }

  static async create(data: z.infer<typeof reservationSchema>) {
    return await ReservationRepository.create(data);
  }

  static async update(id: string, data: Partial<z.infer<typeof updateReservationSchema>>) {
    // Business logic before update can be added here
    return await ReservationRepository.update(id, data);
  }

  static async delete(id: string) {
    return await ReservationRepository.delete(id);
  }
}
