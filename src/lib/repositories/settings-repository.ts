import { sql } from '@/lib/db';
import { settingsSchema } from '@/lib/schemas';
import { z } from 'zod';

export type Settings = z.infer<typeof settingsSchema>;

export class SettingsRepository {
  static async findByKey(key: string): Promise<Settings | null> {
    const result = await sql`SELECT value FROM settings WHERE key = ${key}`;
    if (result.length === 0) return null;
    return result[0].value as Settings;
  }

  static async upsert(key: string, value: Settings) {
    return await sql`
      INSERT INTO settings (key, value)
      VALUES (${key}, ${JSON.stringify(value)}::jsonb)
      ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
    `;
  }
}
