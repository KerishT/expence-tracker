import { formatAmount } from '@/shared/lib/format';
import { Card, CardContent } from '@/shared/ui/card';
import { cn } from '@/shared/lib/utils';
import type { TransactionSummary } from '@/entities/transaction/model/types';

interface Props {
  summary: TransactionSummary;
}

export function SummaryCards({ summary }: Props) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">Доходы</p>
          <p className="mt-1 text-2xl font-bold text-green-500">
            {formatAmount(summary.totalIncome)}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">Расходы</p>
          <p className="mt-1 text-2xl font-bold text-red-500">
            {formatAmount(summary.totalExpense)}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">Баланс</p>
          <p
            className={cn(
              'mt-1 text-2xl font-bold',
              summary.balance >= 0 ? 'text-green-500' : 'text-red-500',
            )}
          >
            {formatAmount(summary.balance)}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
