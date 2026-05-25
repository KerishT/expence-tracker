import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/shared/ui/card';
import { LoginForm } from '@/features/auth/ui/LoginForm';

export function LoginView() {
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Войти</CardTitle>
          <CardDescription>Введите данные вашего аккаунта</CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
        <CardFooter className="justify-center text-sm">
          <span className="text-muted-foreground">Нет аккаунта?&nbsp;</span>
          <Link href="/register" className="underline underline-offset-4 hover:text-primary">
            Зарегистрироваться
          </Link>
        </CardFooter>
      </Card>
    </main>
  );
}
