'use client';

import { useState, useEffect } from 'react';
import { transactionsApi } from '../api/transactions.api';
import type { TransactionListResponse } from '@/entities/transaction/model/types';

export function useTransactions(params?: { year?: number; month?: number }, refreshKey?: number) {
  const [data, setData] = useState<TransactionListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    transactionsApi
      .list(params)
      .then(setData)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params?.year, params?.month, refreshKey]);

  return { data, loading, error };
}
