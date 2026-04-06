import { NextResponse } from 'next/server';
import { settingsSchema } from '@/lib/schemas';
import { SettingsService } from '@/lib/services/settings-service';
import { handleApiError } from '@/lib/error-handler';

export async function GET() {
  try {
    const settings = await SettingsService.get();
    if (!settings) {
      return NextResponse.json({ error: 'Configurações não encontradas' }, { status: 404 });
    }
    return NextResponse.json(settings);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const validatedData = settingsSchema.parse(body);
    await SettingsService.update(validatedData);
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
