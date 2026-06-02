import Link from 'next/link';
import { AuthShell } from '@/widgets/auth-shell/ui/AuthShell';
import { RegisterForm } from '@/features/auth/ui/RegisterForm';

export function RegisterView() {
  return (
    <AuthShell
      title="Создайте аккаунт"
      description="Начните контролировать свои финансы"
      footer={
        <>
          <span className="text-muted-foreground">Уже есть аккаунт?&nbsp;</span>
          <Link href="/login" className="font-semibold text-primary hover:underline underline-offset-4">
            Войти
          </Link>
        </>
      }
    >
      <RegisterForm />
    </AuthShell>
  );
}
