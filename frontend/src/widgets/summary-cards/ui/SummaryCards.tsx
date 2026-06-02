import { ArrowDownLeft, ArrowUpRight, Wallet } from 'lucide-react';
import { formatAmount } from '@/shared/lib/format';
import { cn } from '@/shared/lib/utils';
import type { TransactionSummary } from '@/entities/transaction/model/types';

interface Props {
  summary: TransactionSummary;
}

function Ring({ value, className }: { value: number; className?: string }) {
  const r = 18;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(1, value));
  return (
    <svg viewBox="0 0 44 44" className={cn('size-12 -rotate-90', className)}>
      <circle cx="22" cy="22" r={r} fill="none" strokeWidth="5" className="stroke-current opacity-15" />
      <circle
        cx="22"
        cy="22"
        r={r}
        fill="none"
        strokeWidth="5"
        strokeLinecap="round"
        className="stroke-current"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - pct)}
      />
    </svg>
  );
}

export function SummaryCards({ summary }: Props) {
  const total = summary.totalIncome + summary.totalExpense;
  const incomeShare = total > 0 ? summary.totalIncome / total : 0;
  const expenseShare = total > 0 ? summary.totalExpense / total : 0;

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      {/* Balance hero */}
      <div
        className="animate-rise relative flex flex-col justify-between overflow-hidden rounded-2xl p-5 xl:col-span-2"
        style={{
          background: 'linear-gradient(135deg, oklch(0.62 0.19 268) 0%, oklch(0.55 0.21 282) 55%, oklch(0.52 0.19 305) 100%)',
          color: 'white',
          boxShadow: '0 24px 60px -24px oklch(0.64 0.17 272 / 55%)',
        }}
      >
        <div className="pointer-events-none absolute -right-10 -top-12 size-40 rounded-full bg-white/15 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-16 right-10 size-40 rounded-full bg-black/10 blur-2xl" />
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-medium text-white/85">
            <Wallet className="size-4" strokeWidth={2.2} />
            Текущий баланс
          </div>
          <span className="rounded-full bg-white/25 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-sm">
            Всего
          </span>
        </div>
        <div className="relative mt-6">
          <p className="font-heading text-4xl font-extrabold tracking-tight">
            {formatAmount(summary.balance)}
          </p>
          <p className="mt-2 text-sm text-white/70">
            Доходы за вычетом расходов
          </p>
        </div>
      </div>

      {/* Income */}
      <div className="animate-rise flex items-center justify-between rounded-2xl bg-card p-5 ring-1 ring-foreground/10 [animation-delay:60ms]">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="grid size-9 place-items-center rounded-xl bg-success/15 text-success">
              <ArrowDownLeft className="size-[1.15rem]" strokeWidth={2.3} />
            </span>
            <p className="text-sm font-medium text-muted-foreground">Доходы</p>
          </div>
          <p className="mt-3 font-heading text-2xl font-bold tracking-tight">
            {formatAmount(summary.totalIncome)}
          </p>
        </div>
        <div className="relative grid shrink-0 place-items-center text-success">
          <Ring value={incomeShare} />
          <span className="absolute text-[0.7rem] font-bold text-foreground">
            {Math.round(incomeShare * 100)}%
          </span>
        </div>
      </div>

      {/* Expense */}
      <div className="animate-rise flex items-center justify-between rounded-2xl bg-card p-5 ring-1 ring-foreground/10 [animation-delay:120ms]">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="grid size-9 place-items-center rounded-xl bg-destructive/15 text-destructive">
              <ArrowUpRight className="size-[1.15rem]" strokeWidth={2.3} />
            </span>
            <p className="text-sm font-medium text-muted-foreground">Расходы</p>
          </div>
          <p className="mt-3 font-heading text-2xl font-bold tracking-tight">
            {formatAmount(summary.totalExpense)}
          </p>
        </div>
        <div className="relative grid shrink-0 place-items-center text-destructive">
          <Ring value={expenseShare} />
          <span className="absolute text-[0.7rem] font-bold text-foreground">
            {Math.round(expenseShare * 100)}%
          </span>
        </div>
      </div>
    </div>
  );
}
