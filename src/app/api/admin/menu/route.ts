import { NextResponse } from 'next/server';
import { MenuService } from '@/lib/services/menu-service';
import { menuItemSchema } from '@/lib/schemas';
import { handleApiError } from '@/lib/error-handler';

export async function GET() {
  try {
    const menuItems = await MenuService.getAll();
    return NextResponse.json(menuItems);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validatedData = menuItemSchema.parse(body);
    const newItem = await MenuService.create(validatedData);
    return NextResponse.json(newItem, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
