'use client';

import { useTransactions } from '@/features/transactions/model/use-transactions';
import { useCategories } from '@/features/categories/model/use-categories';
import { SummaryCards } from '@/widgets/summary-cards/ui/SummaryCards';
import { RecentTransactions } from '@/widgets/recent-transactions/ui/RecentTransactions';

export function DashboardView() {
  const { data, loading, error } = useTransactions(undefined);
  const { data: categories, loading: catLoading } = useCategories();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Дашборд</h1>
      {data?.summary && <SummaryCards summary={data.summary} />}
      <RecentTransactions
        items={data?.items ?? []}
        categories={categories}
        loading={loading || catLoading}
        error={error}
      />
    </div>
  );
}
