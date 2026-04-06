import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { validateSession, updateUser, deleteUser, getUserById, deleteAllUserSessions } from '@/lib/auth';

async function getSuperadminSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_session')?.value;
  if (!token) return null;
  const result = await validateSession(token);
  if (!result || result.user.role !== 'superadmin') return null;
  return result;
}

// PATCH /api/admin/users/[id] — Atualizar usuário
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSuperadminSession();
  if (!session) {
    return NextResponse.json({ error: 'Acesso restrito a superadmin' }, { status: 403 });
  }

  const { id } = await params;

  try {
    const target = await getUserById(id);
    if (!target) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    // Não permite alterar outro superadmin (exceto a si mesmo)
    if (target.role === 'superadmin' && target.id !== session.user.id) {
      return NextResponse.json({ error: 'Não é possível alterar outro superadmin' }, { status: 403 });
    }

    const body = await req.json();
    const { name, email, role, is_active, password } = body;

    // Validação mínima de senha
    if (password !== undefined && password.length < 8) {
      return NextResponse.json({ error: 'A senha deve ter pelo menos 8 caracteres' }, { status: 400 });
    }

    try {
      const updated = await updateUser(id, { name, email, role, is_active, password });

      // Se desativou, invalida todas as sessões dele
      if (is_active === false) {
        await deleteAllUserSessions(id);
      }

      return NextResponse.json(updated);
    } catch (error: any) {
      if (error?.message?.includes('duplicate') || error?.code === '23505') {
        return NextResponse.json({ error: 'Este email já está em uso' }, { status: 409 });
      }
      throw error;
    }
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    return NextResponse.json({ error: 'Erro ao atualizar usuário' }, { status: 500 });
  }
}

// DELETE /api/admin/users/[id] — Deletar usuário
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSuperadminSession();
  if (!session) {
    return NextResponse.json({ error: 'Acesso restrito a superadmin' }, { status: 403 });
  }

  const { id } = await params;

  if (id === session.user.id) {
    return NextResponse.json({ error: 'Você não pode deletar a própria conta' }, { status: 400 });
  }

  try {
    const target = await getUserById(id);
    if (!target) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    if (target.role === 'superadmin') {
      return NextResponse.json({ error: 'Não é possível deletar um superadmin' }, { status: 403 });
    }

    await deleteUser(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao deletar usuário:', error);
    return NextResponse.json({ error: 'Erro ao deletar usuário' }, { status: 500 });
  }
}
