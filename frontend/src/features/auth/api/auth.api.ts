import { api } from '@/shared/api/http';
import type { AuthResponse } from '@/shared/api/types';
import type { LoginFormValues, RegisterFormValues } from '@/features/auth/model/schemas';

type RegisterDto = Omit<RegisterFormValues, 'terms'>;

export const authApi = {
  login: (dto: LoginFormValues) => api.post<AuthResponse>('/auth/login', dto),
  register: (dto: RegisterDto) => api.post<AuthResponse>('/auth/register', dto),
};
