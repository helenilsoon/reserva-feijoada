import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET() {
  try {
    const result = await sql`SELECT value FROM settings WHERE key = 'event_config'`;
    if (result.length === 0) {
      return NextResponse.json({ error: 'Configurações não encontradas' }, { status: 404 });
    }
    return NextResponse.json(result[0].value);
  } catch (error) {
    console.error('Erro ao buscar configurações:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
