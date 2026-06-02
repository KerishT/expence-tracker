'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutGrid, ArrowRightLeft, Tags, LogOut, Sparkles, Wallet } from 'lucide-react';
import { useAuthStore } from '@/features/auth/model/store';
import { cn } from '@/shared/lib/utils';

const navItems = [
  { href: '/dashboard', label: 'Дашборд', icon: LayoutGrid },
  { href: '/transactions', label: 'Транзакции', icon: ArrowRightLeft },
  { href: '/categories', label: 'Категории', icon: Tags },
];

function initials(name?: string) {
  if (!name) return '··';
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
}

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col gap-8 bg-sidebar px-5 py-6">
      {/* Brand */}
      <Link href="/dashboard" className="flex items-center gap-2.5 px-2">
        <span
          className="grid size-9 place-items-center rounded-xl"
          style={{
            background: 'linear-gradient(135deg, oklch(0.62 0.19 268), oklch(0.52 0.19 305))',
            color: 'white',
            boxShadow: '0 8px 24px -8px oklch(0.64 0.17 272 / 50%)',
          }}
        >
          <Wallet className="size-5" strokeWidth={2.4} />
        </span>
        <span className="font-heading text-lg font-extrabold tracking-tight">
          Expense<span className="text-primary">.</span>
        </span>
      </Link>

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-1.5">
        <p className="mb-1 px-3 text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground/70">
          Меню
        </p>
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all',
                active
                  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
                  : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground',
              )}
            >
              <Icon
                className={cn('size-[1.15rem] transition-transform group-hover:scale-110')}
                strokeWidth={2.1}
              />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Promo card */}
      <div
        className="relative overflow-hidden rounded-2xl p-4"
        style={{
          background: 'linear-gradient(135deg, oklch(0.62 0.19 268) 0%, oklch(0.55 0.21 282) 55%, oklch(0.52 0.19 305) 100%)',
          color: 'white',
        }}
      >
        <div className="pointer-events-none absolute -right-6 -top-8 size-24 rounded-full bg-white/15 blur-xl" />
        <div className="pointer-events-none absolute -bottom-10 -left-6 size-24 rounded-full bg-black/10 blur-xl" />
        <Sparkles className="size-5" strokeWidth={2.2} />
        <p className="mt-3 font-heading text-sm font-bold leading-snug text-white">
          Контроль над финансами
        </p>
        <p className="mt-1 text-xs leading-relaxed text-white/75">
          Добавляйте траты и следите за балансом каждый день.
        </p>
      </div>

      {/* User */}
      <div className="flex items-center gap-3 border-t border-sidebar-border pt-4">
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-secondary text-xs font-bold text-foreground">
          {initials(user?.name)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{user?.name ?? 'Гость'}</p>
          <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          aria-label="Выйти"
          title="Выйти"
          className="grid size-8 shrink-0 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
        >
          <LogOut className="size-4" strokeWidth={2.1} />
        </button>
      </div>
    </aside>
  );
}
