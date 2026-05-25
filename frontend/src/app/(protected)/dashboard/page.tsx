'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/shared/ui/button';
import { useAuthStore } from '@/features/auth/model/store';

export default function DashboardPage() {
  const { user, logout } = useAuthStore();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-2xl font-bold">Привет, {user?.name}!</h1>
      <p className="text-muted-foreground">{user?.email}</p>
      <Button variant="outline" onClick={handleLogout}>
        Выйти
      </Button>
    </main>
  );
}
