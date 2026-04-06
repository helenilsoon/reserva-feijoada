import { sql } from '@/lib/db';

export interface MenuItem {
  id?: number;
  category: string;
  title: string;
  description?: string | null;
  items: string[];
  price: number;
  active: boolean;
  order_index: number;
  created_at?: string;
  updated_at?: string;
}

export class MenuService {
  static async getAll(): Promise<MenuItem[]> {
    const results = await sql`
      SELECT * FROM menu_items 
      ORDER BY category ASC, order_index ASC, id ASC
    `;
    return results as MenuItem[];
  }

  static async getActive(): Promise<MenuItem[]> {
    const results = await sql`
      SELECT * FROM menu_items 
      WHERE active = true 
      ORDER BY category ASC, order_index ASC, id ASC
    `;
    return results as MenuItem[];
  }

  static async create(data: Omit<MenuItem, 'id' | 'created_at' | 'updated_at'>): Promise<MenuItem> {
    const results = await sql`
      INSERT INTO menu_items (category, title, description, items, price, active, order_index)
      VALUES (${data.category}, ${data.title}, ${data.description || null}, ${data.items}, ${data.price}, ${data.active}, ${data.order_index})
      RETURNING *
    `;
    return results[0] as MenuItem;
  }

  static async update(id: number, item: Partial<MenuItem>) {
    const result = await sql`
      UPDATE menu_items 
      SET 
        category = COALESCE(${item.category ?? null}, category),
        title = COALESCE(${item.title ?? null}, title),
        description = ${item.description === undefined ? sql`description` : item.description},
        items = COALESCE(${item.items ?? null}, items),
        price = COALESCE(${item.price ?? null}, price),
        active = COALESCE(${item.active ?? null}, active),
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *;
    `;
    return result[0];
  }

  static async delete(id: number): Promise<boolean> {
    const results = await sql`
      DELETE FROM menu_items WHERE id = ${id} RETURNING id
    `;
    return results.length > 0;
  }
}
