import { z } from 'zod';

export const reservationSchema = z.object({
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  phone: z.string().regex(/^\(\d{2}\) \d{5}-\d{4}$/, 'Telefone deve estar no formato (XX) XXXXX-XXXX'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida'),
  time: z.string().regex(/^\d{2}:\d{2}$/, 'Horário inválido'),
  guests: z.number().int().min(1, 'Mínimo de 1 marmita').max(50, 'Máximo de 50 marmitas'),
  delivery_type: z.enum(['retirada', 'entrega']).default('retirada'),
  address: z.string().optional().nullable(),
});

export const updateReservationSchema = reservationSchema.partial().extend({
  id: z.number(),
  payment_status: z.enum(['Pendente', 'Pago']).optional(),
  pickup_status: z.enum(['Pendente', 'Retirado']).optional(),
});

export const settingsSchema = z.object({
  title: z.string().min(3),
  price: z.coerce.number().min(0),
  date: z.string(),
  time: z.string(),
  location: z.string(),
  delivery_enabled: z.boolean().default(true),
  delivery_fee: z.coerce.number().min(0).default(0),
});

export const loginSchema = z.object({
  password: z.string().min(1, 'Senha é obrigatória'),
});

export const menuItemSchema = z.object({
  category: z.string().min(1, 'Categoria é obrigatória'),
  title: z.string().min(1, 'Título é obrigatório'),
  description: z.string().optional().nullable(),
  items: z.array(z.string()).min(1, 'Pelo menos um item é necessário'),
  price: z.coerce.number().min(0, 'O preço deve ser maior ou igual a zero').default(0),
  active: z.boolean().default(true),
  order_index: z.coerce.number().int().default(0),
});

