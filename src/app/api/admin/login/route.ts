import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { 
  getUserByEmail, 
  getUserPasswordHash, 
  comparePassword,
  createToken, 
  createSession, 
  cleanExpiredSessions 
} from '@/lib/auth';
import { isRateLimited, getRateLimitHeaders } from '@/lib/rate-limit';

export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
  const limit = 5;
  const window = 600000; // 10 minutos

  if (isRateLimited(`login:${ip}`, limit, window)) {
    return NextResponse.json(
      { error: 'Muitas tentativas de login. Tente novamente em alguns minutos.' },
      { 
        status: 429,
        headers: getRateLimitHeaders(`login:${ip}`, limit, window)
      }
    );
  }

  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email e senha são obrigatórios' }, { status: 400 });
    }

    // Limpa sessões expiradas de forma assíncrona (não bloqueia)
    cleanExpiredSessions().catch(console.error);

    const [user, passwordHash] = await Promise.all([
      getUserByEmail(email),
      getUserPasswordHash(email),
    ]);

    if (!user || !passwordHash) {
      return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 });
    }

    const isValid = await comparePassword(password, passwordHash);

    if (!isValid) {
      return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 });
    }

    // Gera JWT com dados do usuário
    const token = await createToken({ 
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    // Persiste sessão no banco
    const userAgent = req.headers.get('user-agent') || undefined;
    await createSession(user.id, token, ip, userAgent);

    const cookieStore = await cookies();
    cookieStore.set('admin_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24, // 24 horas
      path: '/',
    });

    return NextResponse.json({ 
      success: true,
      user: {
        name: user.name,
        email: user.email,
        role: user.role,
      }
    });
  } catch (error) {
    console.error('Erro no login:', error);
    return NextResponse.json({ error: 'Erro ao processar login' }, { status: 500 });
  }
}
