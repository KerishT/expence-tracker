'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/shared/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/ui/dialog';
import { AddTransactionForm } from '@/features/transactions/ui/AddTransactionForm';
import { RecentTransactions } from '@/widgets/recent-transactions/ui/RecentTransactions';
import { useTransactions } from '@/features/transactions/model/use-transactions';
import { useCategories } from '@/features/categories/model/use-categories';

export function TransactionsView() {
  const [open, setOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const { data, loading, error } = useTransactions(undefined, refreshKey);
  const { data: categories } = useCategories();

  const handleSuccess = useCallback(() => {
    setOpen(false);
    setRefreshKey((k) => k + 1);
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Транзакции</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button />}>+ Добавить</DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Новая транзакция</DialogTitle>
            </DialogHeader>
            <AddTransactionForm onSuccess={handleSuccess} />
          </DialogContent>
        </Dialog>
      </div>

      <RecentTransactions
        items={data?.items ?? []}
        categories={categories}
        loading={loading}
        error={error}
      />
    </div>
  );
}
