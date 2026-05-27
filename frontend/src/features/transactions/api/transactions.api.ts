import { api } from '@/shared/api/http';
import type { Transaction, TransactionListResponse } from '@/entities/transaction/model/types';

function qs(params?: { year?: number; month?: number }): string {
  if (!params) return '';
  const entries = Object.entries(params).filter(([, v]) => v !== undefined);
  if (!entries.length) return '';
  return '?' + entries.map(([k, v]) => `${k}=${v}`).join('&');
}

export interface CreateTransactionPayload {
  amount: number;
  type: 'income' | 'expense';
  description?: string;
  date: string;
  categoryId: string;
}

export const transactionsApi = {
  list: (params?: { year?: number; month?: number }) =>
    api.get<TransactionListResponse>(`/transactions${qs(params)}`),
  create: (payload: CreateTransactionPayload) =>
    api.post<Transaction>('/transactions', payload),
};
