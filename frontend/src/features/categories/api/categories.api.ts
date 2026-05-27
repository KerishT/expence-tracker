import { api } from '@/shared/api/http';
import type { Category } from '@/entities/category/model/types';

export const categoriesApi = {
  list: () => api.get<Category[]>('/categories'),
};
