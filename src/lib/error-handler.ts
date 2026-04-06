import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class ValidationError extends AppError {
  constructor(public details: any) {
    super('Dados inválidos ou incompletos.', 400, 'VALIDATION_ERROR');
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Recurso não encontrado.') {
    super(message, 404, 'NOT_FOUND');
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Acesso não autorizado.') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

export function handleApiError(error: unknown) {
  console.error('[API Error]:', error);

  if (error instanceof AppError) {
    return NextResponse.json(
      { error: error.message, code: error.code, details: (error as any).details },
      { status: error.statusCode }
    );
  }

  if (error instanceof ZodError) {
    return NextResponse.json(
      { error: 'Erro de validação.', details: error.format() },
      { status: 400 }
    );
  }

  // Fallback para erros desconhecidos (não vaza detalhes internos)
  return NextResponse.json(
    { error: 'Ocorreu um erro interno no servidor.', code: 'INTERNAL_SERVER_ERROR' },
    { status: 500 }
  );
}
