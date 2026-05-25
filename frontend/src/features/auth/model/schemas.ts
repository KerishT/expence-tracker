import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Введите корректный email'),
  password: z.string().min(1, 'Введите пароль'),
});

export const registerSchema = z.object({
  name: z.string().min(1, 'Введите имя'),
  email: z.string().email('Введите корректный email'),
  password: z.string().min(8, 'Пароль — минимум 8 символов'),
  terms: z.literal(true, { message: 'Необходимо принять соглашение' }),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
export type RegisterFormValues = z.infer<typeof registerSchema>;
