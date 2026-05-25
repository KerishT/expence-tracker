'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { authApi } from '@/features/auth/api/auth.api';
import { useAuthStore } from '@/features/auth/model/store';
import type { RegisterFormValues } from '@/features/auth/model/schemas';

export function useRegister() {
  const [isPending, setIsPending] = useState(false);
  const setSession = useAuthStore((s) => s.setSession);
  const router = useRouter();

  const register = async (values: RegisterFormValues) => {
    setIsPending(true);
    try {
      const res = await authApi.register(values);
      setSession(res);
      router.push('/dashboard');
    } catch (err) {
      const e = err as Error & { status?: number };
      if (e.status === 409) {
        toast.error('Этот email уже занят');
      } else if (e.status === 400) {
        toast.error(e.message);
      } else {
        toast.error(e.message ?? 'Ошибка регистрации');
      }
    } finally {
      setIsPending(false);
    }
  };

  return { register, isPending };
}
