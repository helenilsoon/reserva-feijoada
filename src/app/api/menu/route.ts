import { NextResponse } from 'next/server';
import { MenuService } from '@/lib/services/menu-service';
import { handleApiError } from '@/lib/error-handler';

export async function GET() {
  try {
    const menuItems = await MenuService.getActive();
    return NextResponse.json(menuItems);
  } catch (error) {
    return handleApiError(error);
  }
}
