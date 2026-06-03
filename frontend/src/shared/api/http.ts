import { API_BASE } from '@/shared/config';
import { storage } from '@/shared/lib/storage';
import { useAuthStore } from '@/features/auth/model/store';

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
}

async function http<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const token = storage.getToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  if (res.status === 401) {
    useAuthStore.getState().logout();
    window.location.replace('/login');
    throw Object.assign(new Error('Unauthorized'), { status: 401 });
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const message = Array.isArray(data.message) ? data.message.join(', ') : (data.message ?? 'Что-то пошло не так');
    const err = new Error(message) as Error & { status: number };
    err.status = res.status;
    throw err;
  }

  return data as T;
}

export const api = {
  post: <T>(path: string, body: unknown) => http<T>(path, { method: 'POST', body }),
  get: <T>(path: string) => http<T>(path, { method: 'GET' }),
};
