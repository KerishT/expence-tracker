'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/features/auth/model/store';
import { Button } from '@/shared/ui/button';
import { cn } from '@/shared/lib/utils';

const navItems = [
  { href: '/dashboard', label: 'Дашборд' },
  { href: '/transactions', label: 'Транзакции' },
  { href: '/categories', label: 'Категории' },
];

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  return (
    <aside className="flex h-screen w-60 flex-col border-r bg-background">
      <div className="flex flex-1 flex-col gap-1 p-4">
        <p className="mb-4 px-2 pt-2 text-lg font-semibold tracking-tight">
          Expense Tracker
        </p>
        <nav className="flex flex-col gap-1">
          {navItems.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'rounded-md px-3 py-2 text-sm font-medium transition-colors',
                pathname === href
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="border-t p-4">
        <div className="mb-3">
          <p className="text-sm font-medium">{user?.name}</p>
          <p className="text-xs text-muted-foreground">{user?.email}</p>
        </div>
        <Button variant="outline" size="sm" className="w-full" onClick={handleLogout}>
          Выйти
        </Button>
      </div>
    </aside>
  );
}
