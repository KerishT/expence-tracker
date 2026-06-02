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
import { Plus } from 'lucide-react';
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
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Все ваши доходы и расходы</p>
          <h1 className="font-heading text-3xl font-extrabold tracking-tight">Транзакции</h1>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button size="lg" />}>
            <Plus />
            Добавить
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Новая транзакция</DialogTitle>
            </DialogHeader>
            <AddTransactionForm onSuccess={handleSuccess} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="mx-auto w-full max-w-2xl">
        <RecentTransactions
          items={data?.items ?? []}
          categories={categories}
          loading={loading}
          error={error}
          pageSize={12}
        />
      </div>
    </div>
  );
}
