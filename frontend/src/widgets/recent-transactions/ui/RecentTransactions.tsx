'use client';

import { ChevronLeft, ChevronRight, Receipt } from 'lucide-react';
import { usePagination } from '@/features/transactions/model/use-pagination';
import { formatAmount, formatDate } from '@/shared/lib/format';
import { cn } from '@/shared/lib/utils';
import type { Transaction } from '@/entities/transaction/model/types';
import type { Category } from '@/entities/category/model/types';

interface Props {
  items: Transaction[];
  categories: Category[];
  loading?: boolean;
  error?: string | null;
  pageSize?: number;
}

export function RecentTransactions({ items, categories, loading, error, pageSize = 8 }: Props) {
  const categoryMap = new Map(categories.map((c) => [c.id, c]));
  const { pageItems, page, totalPages, canPrev, canNext, prev, next } = usePagination(
    items,
    pageSize,
  );

  return (
    <section className="flex h-full flex-col rounded-2xl bg-card p-5 ring-1 ring-foreground/10">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-lg font-bold tracking-tight">Транзакции</h2>
        {items.length > 0 && (
          <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-muted-foreground">
            {items.length}
          </span>
        )}
      </div>

      <div className="mt-4 flex-1">
        {loading && (
          <ul className="space-y-2.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <li key={i} className="h-14 animate-pulse rounded-xl bg-secondary/60" />
            ))}
          </ul>
        )}

        {!loading && error && <p className="text-sm text-destructive">{error}</p>}

        {!loading && !error && items.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
            <span className="grid size-12 place-items-center rounded-2xl bg-secondary text-muted-foreground">
              <Receipt className="size-5" />
            </span>
            <p className="text-sm text-muted-foreground">Транзакций пока нет</p>
          </div>
        )}

        {!loading && !error && items.length > 0 && (
          <ul className="space-y-1">
            {pageItems.map((tx) => {
              const category = categoryMap.get(tx.categoryId);
              const color = category?.color ?? '#8a8a95';
              const income = tx.type === 'income';
              return (
                <li
                  key={tx.id}
                  className="flex items-center justify-between gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-accent/40"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className="grid size-10 shrink-0 place-items-center rounded-xl text-base"
                      style={{ backgroundColor: `${color}26`, color }}
                    >
                      {category?.icon ?? '•'}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{category?.name ?? '—'}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {tx.description || formatDate(tx.date)}
                      </p>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <p
                      className={cn(
                        'text-sm font-bold tabular-nums',
                        income ? 'text-success' : 'text-foreground',
                      )}
                    >
                      {income ? '+' : '−'}
                      {formatAmount(tx.amount)}
                    </p>
                    <p className="text-xs text-muted-foreground">{formatDate(tx.date)}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
          <button
            type="button"
            onClick={prev}
            disabled={!canPrev}
            className="grid size-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
          >
            <ChevronLeft className="size-4" />
          </button>
          <span className="text-xs font-medium text-muted-foreground">
            {page} / {totalPages}
          </span>
          <button
            type="button"
            onClick={next}
            disabled={!canNext}
            className="grid size-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      )}
    </section>
  );
}
