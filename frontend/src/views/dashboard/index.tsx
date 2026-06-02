'use client';

import { useTransactions } from '@/features/transactions/model/use-transactions';
import { useCategories } from '@/features/categories/model/use-categories';
import { useAuthStore } from '@/features/auth/model/store';
import { SummaryCards } from '@/widgets/summary-cards/ui/SummaryCards';
import { AnalysisChart } from '@/widgets/analysis-chart/ui/AnalysisChart';
import { CategoryBreakdown } from '@/widgets/category-breakdown/ui/CategoryBreakdown';
import { RecentTransactions } from '@/widgets/recent-transactions/ui/RecentTransactions';

const EMPTY_SUMMARY = { totalIncome: 0, totalExpense: 0, balance: 0 };

export function DashboardView() {
  const { data, loading, error } = useTransactions(undefined);
  const { data: categories, loading: catLoading } = useCategories();
  const { user } = useAuthStore();

  const items = data?.items ?? [];
  const firstName = user?.name?.split(/\s+/)[0];

  return (
    <div className="flex flex-col gap-6">
      <header>
        <p className="text-sm text-muted-foreground">
          С возвращением{firstName ? `, ${firstName}` : ''} 👋
        </p>
        <h1 className="font-heading text-3xl font-extrabold tracking-tight">Дашборд</h1>
      </header>

      <SummaryCards summary={data?.summary ?? EMPTY_SUMMARY} />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          <AnalysisChart items={items} loading={loading} />
          <CategoryBreakdown items={items} categories={categories} loading={loading || catLoading} />
        </div>
        <RecentTransactions
          items={items}
          categories={categories}
          loading={loading || catLoading}
          error={error}
        />
      </div>
    </div>
  );
}
