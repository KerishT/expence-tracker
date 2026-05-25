import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/shared/ui/card';
import { RegisterForm } from '@/features/auth/ui/RegisterForm';

export function RegisterView() {
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Регистрация</CardTitle>
          <CardDescription>Создайте аккаунт, чтобы начать</CardDescription>
        </CardHeader>
        <CardContent>
          <RegisterForm />
        </CardContent>
        <CardFooter className="justify-center text-sm">
          <span className="text-muted-foreground">Уже есть аккаунт?&nbsp;</span>
          <Link href="/login" className="underline underline-offset-4 hover:text-primary">
            Войти
          </Link>
        </CardFooter>
      </Card>
    </main>
  );
}
