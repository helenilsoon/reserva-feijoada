import { sql } from '@/lib/db';
import { z } from 'zod';
import { reservationSchema, updateReservationSchema } from '@/lib/schemas';

export type ReservationResponse = {
  id: string;
  name: string;
  email: string;
  phone: string;
  date: string;
  time: string;
  guests: number;
  payment_status: string;
  pickup_status: string;
  delivery_type: string;
  address: string | null;
  created_at: Date;
};


export type PaginatedResult<T> = {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export class ReservationRepository {
  static async findAll(
    page = 1,
    pageSize = 20,
    search?: string
  ): Promise<PaginatedResult<ReservationResponse>> {
    const offset = (page - 1) * pageSize;

    let data: ReservationResponse[];
    let countResult: { count: string }[];

    if (search) {
      const term = `%${search}%`;
      data = await sql`
        SELECT 
          id, 
          customer_name as name, 
          customer_email as email, 
          phone, 
          reservation_date as date, 
          reservation_time as time, 
          guests, 
          payment_status, 
          pickup_status, 
          delivery_type, 
          address, 
          created_at 
        FROM reservations 
        WHERE 
          customer_name ILIKE ${term} OR 
          phone ILIKE ${term} OR 
          CAST(id AS TEXT) = ${search}
        ORDER BY created_at DESC 
        LIMIT ${pageSize} OFFSET ${offset}
      ` as unknown as ReservationResponse[];

      countResult = await sql`
        SELECT COUNT(*) as count FROM reservations
        WHERE 
          customer_name ILIKE ${term} OR 
          phone ILIKE ${term} OR
          CAST(id AS TEXT) = ${search}
      ` as unknown as { count: string }[];
    } else {
      data = await sql`
        SELECT 
          id, 
          customer_name as name, 
          customer_email as email, 
          phone, 
          reservation_date as date, 
          reservation_time as time, 
          guests, 
          payment_status, 
          pickup_status, 
          delivery_type, 
          address, 
          created_at 
        FROM reservations 
        ORDER BY created_at DESC 
        LIMIT ${pageSize} OFFSET ${offset}
      ` as unknown as ReservationResponse[];

      countResult = await sql`
        SELECT COUNT(*) as count FROM reservations
      ` as unknown as { count: string }[];
    }

    const total = parseInt(countResult[0]?.count ?? '0', 10);

    return {
      data,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }


  static async findById(id: string): Promise<ReservationResponse | null> {
    const results = await sql`
      SELECT 
        id, 
        customer_name as name, 
        customer_email as email, 
        phone, 
        reservation_date as date, 
        reservation_time as time, 
        guests, 
        payment_status, 
        pickup_status, 
        delivery_type, 
        address, 
        created_at 
      FROM reservations 
      WHERE id = ${id}
    `;
    return (results[0] as unknown as ReservationResponse) || null;
  }

  static async create(data: z.infer<typeof reservationSchema>): Promise<{ id: string }> {
    const { name, email, phone, date, time, guests, delivery_type, address } = data;
    const result = await sql`
      INSERT INTO reservations (
        customer_name, 
        customer_email, 
        phone, 
        reservation_date, 
        reservation_time, 
        guests, 
        delivery_type, 
        address
      )
      VALUES (
        ${name}, 
        ${email || ''}, 
        ${phone}, 
        ${date}, 
        ${time}, 
        ${guests}, 
        ${delivery_type}, 
        ${address || null}
      )
      RETURNING id
    `;
    return result[0] as { id: string };
  }

  /**
   * Performs an efficient dynamic UPDATE in a single query.
   */
  static async update(id: string, data: Partial<z.infer<typeof updateReservationSchema>>) {
    const fieldMap: Record<string, string> = {
      name: 'customer_name',
      email: 'customer_email',
      phone: 'phone',
      date: 'reservation_date',
      time: 'reservation_time',
      guests: 'guests',
      payment_status: 'payment_status',
      pickup_status: 'pickup_status',
      delivery_type: 'delivery_type',
      address: 'address'
    };

    const updates: { column: string; value: any }[] = [];
    
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && fieldMap[key]) {
        updates.push({ column: fieldMap[key], value });
      }
    });

    if (updates.length === 0) return;

    // Building a single dynamic query for Neon
    // Since Neon template literals handle parameterization securely, 
    // we build the string parts carefully.
    
    let queryParts = ["UPDATE reservations SET "];
    const values: any[] = [];

    updates.forEach((update, index) => {
      queryParts.push(`${update.column} = $${index + 1}`);
      values.push(update.value);
      if (index < updates.length - 1) {
        queryParts.push(", ");
      }
    });

    queryParts.push(` WHERE id = $${updates.length + 1}`);
    values.push(id);

    const finalQuery = queryParts.join("");
    
    // Using the neon driver's parameter support directly if possible, 
    // or through multiple template interpolation if forced.
    // The safest way with the 'neon' function from @neondatabase/serverless 
    // is to pass the array of values.
    
    return await (sql as any)(finalQuery, values);
  }

  static async delete(id: string) {
    return await sql`DELETE FROM reservations WHERE id = ${id}`;
  }
}
