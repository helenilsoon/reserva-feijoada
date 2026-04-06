import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { validateSession } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_session')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const result = await validateSession(token);

    if (!result) {
      return NextResponse.json({ error: 'Sessão inválida' }, { status: 401 });
    }

    return NextResponse.json({
      user: {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
        role: result.user.role,
      }
    });
  } catch (error) {
    console.error('Erro ao buscar usuário atual:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
