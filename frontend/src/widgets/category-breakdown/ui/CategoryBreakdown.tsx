'use client';

import { useMemo } from 'react';
import { PieChart } from 'lucide-react';
import { formatAmount } from '@/shared/lib/format';
import type { Transaction } from '@/entities/transaction/model/types';
import type { Category } from '@/entities/category/model/types';

interface Props {
  items: Transaction[];
  categories: Category[];
  loading?: boolean;
}

export function CategoryBreakdown({ items, categories, loading }: Props) {
  const rows = useMemo(() => {
    const map = new Map(categories.map((c) => [c.id, c]));
    const totals = new Map<string, number>();
    for (const tx of items) {
      if (tx.type !== 'expense') continue;
      totals.set(tx.categoryId, (totals.get(tx.categoryId) ?? 0) + tx.amount);
    }
    const list = [...totals.entries()]
      .map(([id, total]) => ({ category: map.get(id), total }))
      .filter((r) => r.category)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
    const max = Math.max(...list.map((r) => r.total), 1);
    return list.map((r) => ({ ...r, share: r.total / max }));
  }, [items, categories]);

  return (
    <section className="flex flex-col rounded-2xl bg-card p-5 ring-1 ring-foreground/10">
      <h2 className="font-heading text-lg font-bold tracking-tight">Категории трат</h2>

      <div className="mt-4">
        {loading && (
          <ul className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <li key={i} className="h-10 animate-pulse rounded-xl bg-secondary/60" />
            ))}
          </ul>
        )}

        {!loading && rows.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
            <span className="grid size-12 place-items-center rounded-2xl bg-secondary text-muted-foreground">
              <PieChart className="size-5" />
            </span>
            <p className="text-sm text-muted-foreground">Нет расходов для анализа</p>
          </div>
        )}

        {!loading && rows.length > 0 && (
          <ul className="space-y-4">
            {rows.map(({ category, total, share }) => (
              <li key={category!.id}>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span
                      className="grid size-8 shrink-0 place-items-center rounded-lg text-sm"
                      style={{ backgroundColor: `${category!.color}26`, color: category!.color }}
                    >
                      {category!.icon}
                    </span>
                    <span className="truncate text-sm font-medium">{category!.name}</span>
                  </div>
                  <span className="shrink-0 text-sm font-semibold tabular-nums">
                    {formatAmount(total)}
                  </span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${Math.max(share * 100, 6)}%`, backgroundColor: category!.color }}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
