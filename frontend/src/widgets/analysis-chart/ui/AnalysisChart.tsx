'use client';

import { useId, useMemo, useState } from 'react';
import { formatAmount } from '@/shared/lib/format';
import { cn } from '@/shared/lib/utils';
import type { Transaction, TransactionType } from '@/entities/transaction/model/types';

interface Props {
  items: Transaction[];
  loading?: boolean;
}

const W = 640;
const H = 240;
const PAD_X = 16;
const PAD_TOP = 28;
const PAD_BOTTOM = 34;
const WEEKDAYS = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];

/** Build the last 7 calendar days ending today as buckets. */
function buildSeries(items: Transaction[], type: TransactionType) {
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - (6 - i));
    return { date: d, label: WEEKDAYS[d.getDay()], value: 0 };
  });

  for (const tx of items) {
    if (tx.type !== type) continue;
    const d = new Date(tx.date);
    d.setHours(0, 0, 0, 0);
    const bucket = days.find((b) => b.date.getTime() === d.getTime());
    if (bucket) bucket.value += tx.amount;
  }
  return days;
}

/** Catmull-Rom → cubic bezier for a smooth line through all points. */
function smoothPath(points: { x: number; y: number }[]) {
  if (points.length < 2) return '';
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }
  return d;
}

export function AnalysisChart({ items, loading }: Props) {
  const [type, setType] = useState<TransactionType>('expense');
  const gradId = useId();

  const { points, peak, max } = useMemo(() => {
    const series = buildSeries(items, type);
    const maxVal = Math.max(...series.map((d) => d.value), 1);
    const innerW = W - PAD_X * 2;
    const innerH = H - PAD_TOP - PAD_BOTTOM;
    const pts = series.map((d, i) => ({
      x: PAD_X + (series.length === 1 ? innerW / 2 : (innerW * i) / (series.length - 1)),
      y: PAD_TOP + innerH * (1 - d.value / maxVal),
      label: d.label,
      value: d.value,
    }));
    let peakIdx = 0;
    series.forEach((d, i) => {
      if (d.value > series[peakIdx].value) peakIdx = i;
    });
    return { points: pts, peak: pts[peakIdx], max: maxVal };
  }, [items, type]);

  const line = smoothPath(points);
  const area = `${line} L ${points[points.length - 1].x} ${H - PAD_BOTTOM} L ${points[0].x} ${H - PAD_BOTTOM} Z`;
  const accent = type === 'expense' ? 'text-primary' : 'text-success';

  return (
    <div className="rounded-2xl bg-card p-5 ring-1 ring-foreground/10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-heading text-lg font-bold tracking-tight">Аналитика</h2>
        <div className="inline-flex rounded-xl bg-secondary p-1">
          {(['income', 'expense'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={cn(
                'rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors',
                type === t
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {t === 'income' ? 'Доходы' : 'Расходы'}
            </button>
          ))}
        </div>
      </div>

      <div className={cn('relative mt-4', accent)}>
        {loading ? (
          <div className="h-[240px] animate-pulse rounded-xl bg-secondary/60" />
        ) : (
          <svg viewBox={`0 0 ${W} ${H}`} className="h-[240px] w-full overflow-visible">
            <defs>
              <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="currentColor" stopOpacity="0.28" />
                <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* horizontal guide lines */}
            {[0, 0.5, 1].map((g) => {
              const y = PAD_TOP + (H - PAD_TOP - PAD_BOTTOM) * g;
              return (
                <line
                  key={g}
                  x1={PAD_X}
                  x2={W - PAD_X}
                  y1={y}
                  y2={y}
                  className="stroke-foreground/10"
                  strokeWidth="1"
                  strokeDasharray="4 6"
                />
              );
            })}

            <path d={area} fill={`url(#${gradId})`} />
            <path
              d={line}
              fill="none"
              className="stroke-current"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* peak marker + tooltip */}
            {max > 1 && (
              <g>
                <circle cx={peak.x} cy={peak.y} r="5.5" className="fill-background stroke-current" strokeWidth="3" />
                <g transform={`translate(${Math.min(Math.max(peak.x, 44), W - 44)}, ${Math.max(peak.y - 34, 12)})`}>
                  <rect x="-38" y="-15" width="76" height="26" rx="8" className="fill-popover stroke-foreground/10" />
                  <text textAnchor="middle" y="3" className="fill-foreground text-[12px] font-semibold">
                    {formatAmount(peak.value)}
                  </text>
                </g>
              </g>
            )}

            {/* x-axis labels */}
            {points.map((p, i) => (
              <text
                key={i}
                x={p.x}
                y={H - 10}
                textAnchor="middle"
                className="fill-muted-foreground text-[12px]"
              >
                {p.label}
              </text>
            ))}
          </svg>
        )}
      </div>
    </div>
  );
}
