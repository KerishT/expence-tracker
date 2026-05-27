'use client';

import { useState } from 'react';
import { transactionsApi } from '../api/transactions.api';
import type { CreateTransactionFormValues } from './schemas';

export function useCreateTransaction(onSuccess?: () => void) {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function create(values: CreateTransactionFormValues) {
    setIsPending(true);
    setError(null);
    try {
      await transactionsApi.create({
        amount: Number(values.amount),
        type: values.type,
        categoryId: values.categoryId,
        description: values.description || undefined,
        date: new Date(values.date).toISOString(),
      });
      onSuccess?.();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setIsPending(false);
    }
  }

  return { create, isPending, error };
}
