import { z } from 'zod';

export const createTransactionSchema = z.object({
  amount: z
    .string()
    .min(1, 'Введите сумму')
    .refine((v) => !isNaN(Number(v)) && Number(v) > 0, 'Сумма должна быть положительным числом'),
  type: z.enum(['income', 'expense'], { message: 'Выберите тип' }),
  categoryId: z.string().uuid('Выберите категорию'),
  description: z.string().max(255).optional(),
  date: z.string().min(1, 'Введите дату'),
});

export type CreateTransactionFormValues = z.infer<typeof createTransactionSchema>;
