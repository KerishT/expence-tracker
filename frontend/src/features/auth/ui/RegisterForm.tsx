'use client';

import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/shared/ui/form';
import { registerSchema, type RegisterFormValues } from '@/features/auth/model/schemas';
import { useRegister } from '@/features/auth/model/use-register';

export function RegisterForm() {
  const { register, isPending } = useRegister();

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', password: '', terms: undefined },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(register)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Имя</FormLabel>
              <FormControl>
                <Input placeholder="Иван Иванов" autoComplete="name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="you@example.com" autoComplete="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Пароль</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" autoComplete="new-password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="terms"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-start gap-2">
                <FormControl>
                  <input
                    type="checkbox"
                    id="terms"
                    className="mt-0.5 h-4 w-4 shrink-0 accent-primary cursor-pointer"
                    checked={!!field.value}
                    onChange={(e) => field.onChange(e.target.checked || undefined)}
                  />
                </FormControl>
                <label htmlFor="terms" className="text-sm leading-snug cursor-pointer select-none">
                  Согласен с{' '}
                  <Link href="/terms" className="underline underline-offset-4 hover:text-primary">
                    пользовательским соглашением
                  </Link>{' '}
                  и{' '}
                  <Link href="/privacy" className="underline underline-offset-4 hover:text-primary">
                    политикой обработки данных
                  </Link>
                </label>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? 'Регистрируем...' : 'Создать аккаунт'}
        </Button>
      </form>
    </Form>
  );
}
