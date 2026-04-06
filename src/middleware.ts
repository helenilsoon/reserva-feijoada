import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth';

// Rotas acessíveis só por superadmin
const SUPERADMIN_ROUTES = ['/admin/usuarios', '/api/admin/users'];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ── Protege /admin/* (exceto /admin/login) ────────────────────────────────
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
    const token = req.cookies.get('admin_session')?.value;
    const payload = token ? await verifyToken(token) : null;

    if (!payload) {
      const loginUrl = new URL('/admin/login', req.url);
      return NextResponse.redirect(loginUrl);
    }

    // Rotas exclusivas de superadmin
    const isSuperadminRoute = SUPERADMIN_ROUTES.some(r => pathname.startsWith(r));
    if (isSuperadminRoute && payload.role !== 'superadmin') {
      // Redireciona para dashboard se não for superadmin
      return NextResponse.redirect(new URL('/admin', req.url));
    }
  }

  // ── Protege /api/admin/* ──────────────────────────────────────────────────
  if (pathname.startsWith('/api/admin/') && !pathname.startsWith('/api/admin/login')) {
    const token = req.cookies.get('admin_session')?.value;
    const payload = token ? await verifyToken(token) : null;

    if (!payload) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Rotas exclusivas de superadmin
    const isSuperadminRoute = SUPERADMIN_ROUTES.some(r => pathname.startsWith(r));
    if (isSuperadminRoute && payload.role !== 'superadmin') {
      return NextResponse.json({ error: 'Acesso restrito a superadmin' }, { status: 403 });
    }
  }

  // ── Protege /api/reservations (somente leitura requer auth) ──────────────
  if (pathname.startsWith('/api/reservations')) {
    if (req.method !== 'POST') {
      const token = req.cookies.get('admin_session')?.value;
      const payload = token ? await verifyToken(token) : null;
      if (!payload) {
        return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
      }
    }
  }

  // ── APIs Públicas (Configurações e Checkout) ──────────────────────────────
  // Deixamos passar sem auth para o cliente conseguir ver preços e pagar
  if (pathname.startsWith('/api/settings') || pathname.startsWith('/api/checkout')) {
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*', '/api/reservations/:path*', '/api/settings/:path*', '/api/checkout/:path*'],
};
