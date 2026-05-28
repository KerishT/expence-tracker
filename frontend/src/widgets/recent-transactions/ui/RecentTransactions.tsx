'use client';

import { usePagination } from '@/features/transactions/model/use-pagination';
import { formatAmount, formatDate } from '@/shared/lib/format';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { cn } from '@/shared/lib/utils';
import type { Transaction } from '@/entities/transaction/model/types';
import type { Category } from '@/entities/category/model/types';

interface Props {
  items: Transaction[];
  categories: Category[];
  loading?: boolean;
  error?: string | null;
}

export function RecentTransactions({ items, categories, loading, error }: Props) {
  const categoryMap = new Map(categories.map((c) => [c.id, c]));
  const { pageItems, page, totalPages, canPrev, canNext, prev, next } = usePagination(
    items,
    10,
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Последние транзакции</CardTitle>
      </CardHeader>
      <CardContent>
        {loading && (
          <p className="text-sm text-muted-foreground">Загрузка...</p>
        )}
        {!loading && error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
        {!loading && !error && items.length === 0 && (
          <p className="text-sm text-muted-foreground">Транзакций пока нет</p>
        )}
        {!loading && !error && items.length > 0 && (
          <>
            <ul className="divide-y">
              {pageItems.map((tx) => {
                const category = categoryMap.get(tx.categoryId);
                return (
                  <li key={tx.id} className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      <span
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm"
                        style={{ backgroundColor: category?.color ?? '#888888' }}
                      >
                        {category?.icon ?? '?'}
                      </span>
                      <div>
                        <p className="text-sm font-medium">{category?.name ?? '—'}</p>
                        {tx.description && (
                          <p className="text-xs text-muted-foreground">{tx.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p
                        className={cn(
                          'text-sm font-semibold',
                          tx.type === 'income' ? 'text-green-500' : 'text-red-500',
                        )}
                      >
                        {tx.type === 'income' ? '+' : '−'}
                        {formatAmount(tx.amount)}
                      </p>
                      <p className="text-xs text-muted-foreground">{formatDate(tx.date)}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
            {totalPages > 1 && (
              <div className="mt-4 flex items-center justify-between">
                <Button variant="outline" size="sm" onClick={prev} disabled={!canPrev}>
                  ←
                </Button>
                <span className="text-sm text-muted-foreground">
                  {page} / {totalPages}
                </span>
                <Button variant="outline" size="sm" onClick={next} disabled={!canNext}>
                  →
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
