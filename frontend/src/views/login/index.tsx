import Link from 'next/link';
import { AuthShell } from '@/widgets/auth-shell/ui/AuthShell';
import { LoginForm } from '@/features/auth/ui/LoginForm';

export function LoginView() {
  return (
    <AuthShell
      title="С возвращением"
      description="Введите данные вашего аккаунта"
      footer={
        <>
          <span className="text-muted-foreground">Нет аккаунта?&nbsp;</span>
          <Link href="/register" className="font-semibold text-primary hover:underline underline-offset-4">
            Зарегистрироваться
          </Link>
        </>
      }
    >
      <LoginForm />
    </AuthShell>
  );
}
