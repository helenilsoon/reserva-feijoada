import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import { sql } from '@/lib/db';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'fallback-secret-change-me-in-production'
);

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'superadmin' | 'admin';
  is_active: boolean;
  created_at: string;
  created_by: string | null;
}

export interface AdminSession {
  id: string;
  user_id: string;
  expires_at: string;
}

// ─── Senha ────────────────────────────────────────────────────────────────────

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(password, salt);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// ─── JWT ──────────────────────────────────────────────────────────────────────

export async function createToken(payload: Record<string, unknown>) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload;
  } catch {
    return null;
  }
}

// ─── Usuários no banco ────────────────────────────────────────────────────────

export async function getUserByEmail(email: string): Promise<AdminUser | null> {
  const rows = await sql`
    SELECT id, name, email, role, is_active, created_at, created_by
    FROM admin_users
    WHERE email = ${email.toLowerCase()} AND is_active = true
    LIMIT 1
  `;
  return (rows[0] as AdminUser) ?? null;
}

export async function getUserById(id: string): Promise<AdminUser | null> {
  const rows = await sql`
    SELECT id, name, email, role, is_active, created_at, created_by
    FROM admin_users
    WHERE id = ${id}
    LIMIT 1
  `;
  return (rows[0] as AdminUser) ?? null;
}

export async function getUserPasswordHash(email: string): Promise<string | null> {
  const rows = await sql`
    SELECT password_hash FROM admin_users
    WHERE email = ${email.toLowerCase()} AND is_active = true
    LIMIT 1
  `;
  return rows[0] ? (rows[0] as { password_hash: string }).password_hash : null;
}

export async function getAllUsers(): Promise<AdminUser[]> {
  const rows = await sql`
    SELECT id, name, email, role, is_active, created_at, created_by
    FROM admin_users
    ORDER BY created_at DESC
  `;
  return rows as AdminUser[];
}

export async function createUser(data: {
  name: string;
  email: string;
  password: string;
  role: 'superadmin' | 'admin';
  created_by: string;
}): Promise<AdminUser> {
  const passwordHash = await hashPassword(data.password);
  const rows = await sql`
    INSERT INTO admin_users (name, email, password_hash, role, created_by)
    VALUES (${data.name}, ${data.email.toLowerCase()}, ${passwordHash}, ${data.role}, ${data.created_by})
    RETURNING id, name, email, role, is_active, created_at, created_by
  `;
  return rows[0] as AdminUser;
}

export async function updateUser(id: string, data: Partial<{
  name: string;
  email: string;
  role: 'superadmin' | 'admin';
  is_active: boolean;
  password: string;
}>): Promise<AdminUser | null> {
  if (data.password) {
    const passwordHash = await hashPassword(data.password);
    await sql`
      UPDATE admin_users SET password_hash = ${passwordHash}
      WHERE id = ${id}
    `;
  }
  if (data.name !== undefined || data.email !== undefined || data.role !== undefined || data.is_active !== undefined) {
    await sql`
      UPDATE admin_users
      SET
        name = COALESCE(${data.name ?? null}, name),
        email = COALESCE(${data.email ? data.email.toLowerCase() : null}, email),
        role = COALESCE(${data.role ?? null}, role),
        is_active = COALESCE(${data.is_active ?? null}, is_active)
      WHERE id = ${id}
    `;
  }
  return getUserById(id);
}

export async function deleteUser(id: string): Promise<void> {
  await sql`DELETE FROM admin_users WHERE id = ${id}`;
}

// ─── Sessões no banco ─────────────────────────────────────────────────────────

async function hashToken(token: string): Promise<string> {
  const msgUint8 = new TextEncoder().encode(token);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function createSession(
  userId: string,
  token: string,
  ip?: string,
  userAgent?: string
): Promise<string> {
  const tokenHash = await hashToken(token);
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

  const rows = await sql`
    INSERT INTO admin_sessions (user_id, token_hash, expires_at, ip_address, user_agent)
    VALUES (${userId}, ${tokenHash}, ${expiresAt.toISOString()}, ${ip ?? null}, ${userAgent ?? null})
    RETURNING id
  `;
  return (rows[0] as { id: string }).id;
}

export async function validateSession(token: string): Promise<{ user: AdminUser; sessionId: string } | null> {
  const tokenHash = await hashToken(token);

  const rows = await sql`
    SELECT s.id as session_id, s.expires_at,
           u.id, u.name, u.email, u.role, u.is_active, u.created_at, u.created_by
    FROM admin_sessions s
    JOIN admin_users u ON u.id = s.user_id
    WHERE s.token_hash = ${tokenHash}
      AND s.expires_at > NOW()
      AND u.is_active = true
    LIMIT 1
  `;

  if (!rows[0]) return null;

  const row = rows[0] as {
    session_id: string;
    id: string;
    name: string;
    email: string;
    role: 'superadmin' | 'admin';
    is_active: boolean;
    created_at: string;
    created_by: string | null;
  };

  return {
    sessionId: row.session_id,
    user: {
      id: row.id,
      name: row.name,
      email: row.email,
      role: row.role,
      is_active: row.is_active,
      created_at: row.created_at,
      created_by: row.created_by,
    },
  };
}

export async function deleteSession(token: string): Promise<void> {
  const tokenHash = await hashToken(token);
  await sql`DELETE FROM admin_sessions WHERE token_hash = ${tokenHash}`;
}

export async function deleteAllUserSessions(userId: string): Promise<void> {
  await sql`DELETE FROM admin_sessions WHERE user_id = ${userId}`;
}

// Limpa sessões expiradas (pode ser chamado periodicamente ou no login)
export async function cleanExpiredSessions(): Promise<void> {
  await sql`DELETE FROM admin_sessions WHERE expires_at < NOW()`;
}
