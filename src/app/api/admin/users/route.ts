import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { validateSession, getAllUsers, createUser } from '@/lib/auth';

async function getSuperadminSession(req: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_session')?.value;
  if (!token) return null;
  const result = await validateSession(token);
  if (!result || result.user.role !== 'superadmin') return null;
  return result;
}

// GET /api/admin/users — Lista todos os usuários (só superadmin)
export async function GET(req: Request) {
  const session = await getSuperadminSession(req);
  if (!session) {
    return NextResponse.json({ error: 'Acesso restrito a superadmin' }, { status: 403 });
  }

  try {
    const users = await getAllUsers();
    return NextResponse.json(users);
  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    return NextResponse.json({ error: 'Erro ao listar usuários' }, { status: 500 });
  }
}

// POST /api/admin/users — Criar novo usuário (só superadmin)
export async function POST(req: Request) {
  const session = await getSuperadminSession(req);
  if (!session) {
    return NextResponse.json({ error: 'Acesso restrito a superadmin' }, { status: 403 });
  }

  try {
    const { name, email, password, role } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Nome, email e senha são obrigatórios' }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'A senha deve ter pelo menos 8 caracteres' }, { status: 400 });
    }

    const validRoles = ['admin', 'superadmin'];
    if (role && !validRoles.includes(role)) {
      return NextResponse.json({ error: 'Role inválida' }, { status: 400 });
    }

    const user = await createUser({
      name,
      email,
      password,
      role: role ?? 'admin',
      created_by: session.user.id,
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error: any) {
    if (error?.message?.includes('duplicate') || error?.code === '23505') {
      return NextResponse.json({ error: 'Este email já está cadastrado' }, { status: 409 });
    }
    console.error('Erro ao criar usuário:', error);
    return NextResponse.json({ error: 'Erro ao criar usuário' }, { status: 500 });
  }
}
