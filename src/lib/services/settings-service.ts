import { SettingsRepository } from '@/lib/repositories/settings-repository';
import { settingsSchema } from '@/lib/schemas';
import { z } from 'zod';

export type Settings = z.infer<typeof settingsSchema>;

export class SettingsService {
  private static KEY = 'event_config';

  static async get(): Promise<Settings | null> {
    return await SettingsRepository.findByKey(this.KEY);
  }

  static async update(data: Settings) {
    // Business logic before update (validation is already done in controller)
    return await SettingsRepository.upsert(this.KEY, data);
  }
}
