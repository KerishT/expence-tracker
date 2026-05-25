'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { authApi } from '@/features/auth/api/auth.api';
import { useAuthStore } from '@/features/auth/model/store';
import type { LoginFormValues } from '@/features/auth/model/schemas';

export function useLogin() {
  const [isPending, setIsPending] = useState(false);
  const setSession = useAuthStore((s) => s.setSession);
  const router = useRouter();

  const login = async (values: LoginFormValues) => {
    setIsPending(true);
    try {
      const res = await authApi.login(values);
      setSession(res);
      router.push('/dashboard');
    } catch (err) {
      const e = err as Error & { status?: number };
      if (e.status === 401) {
        toast.error('Неверный email или пароль');
      } else {
        toast.error(e.message ?? 'Ошибка входа');
      }
    } finally {
      setIsPending(false);
    }
  };

  return { login, isPending };
}
