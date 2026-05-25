import type { User } from '@/entities/user/model/types';

export interface AuthResponse {
  accessToken: string;
  user: User;
}

export interface ApiError {
  message: string | string[];
  statusCode: number;
}
