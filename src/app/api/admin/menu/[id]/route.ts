import { NextResponse } from 'next/server';
import { MenuService } from '@/lib/services/menu-service';
import { menuItemSchema } from '@/lib/schemas';
import { handleApiError } from '@/lib/error-handler';

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    const body = await req.json();
    const validatedData = menuItemSchema.partial().parse(body);
    const updatedItem = await MenuService.update(id, validatedData);
    
    if (!updatedItem) {
      return NextResponse.json({ error: 'Item não encontrado' }, { status: 404 });
    }
    
    return NextResponse.json(updatedItem);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    const deleted = await MenuService.delete(id);
    
    if (!deleted) {
      return NextResponse.json({ error: 'Item não encontrado' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
