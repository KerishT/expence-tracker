import { Wallet, TrendingUp, ShieldCheck } from 'lucide-react';

interface Props {
  title: string;
  description: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}

export function AuthShell({ title, description, children, footer }: Props) {
  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel */}
      <aside
        className="relative hidden flex-col justify-between overflow-hidden p-12 lg:flex"
        style={{
          background: 'linear-gradient(145deg, oklch(0.62 0.19 268) 0%, oklch(0.55 0.21 282) 55%, oklch(0.52 0.19 305) 100%)',
          color: 'white',
        }}
      >
        <div className="pointer-events-none absolute -right-20 -top-24 size-80 rounded-full bg-white/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-16 size-80 rounded-full bg-black/15 blur-3xl" />

        <div className="relative flex items-center gap-2.5">
          <span className="grid size-10 place-items-center rounded-xl bg-white/20 backdrop-blur-sm">
            <Wallet className="size-5" strokeWidth={2.4} />
          </span>
          <span className="font-heading text-xl font-extrabold tracking-tight">Expense.</span>
        </div>

        <div className="relative">
          <h2 className="font-heading text-4xl font-extrabold leading-tight tracking-tight">
            Деньги под
            <br />
            контролем.
          </h2>
          <p className="mt-4 max-w-sm text-white/80">
            Отслеживайте доходы и расходы, анализируйте траты по категориям и держите баланс в плюсе.
          </p>

          <ul className="mt-8 space-y-3 text-sm">
            <li className="flex items-center gap-3">
              <span className="grid size-8 place-items-center rounded-lg bg-white/20">
                <TrendingUp className="size-4" />
              </span>
              Наглядная аналитика по неделям
            </li>
            <li className="flex items-center gap-3">
              <span className="grid size-8 place-items-center rounded-lg bg-white/20">
                <ShieldCheck className="size-4" />
              </span>
              Ваши данные под защитой
            </li>
          </ul>
        </div>

        <p className="relative text-xs text-white/60">
          © {new Date().getFullYear()} Expense Tracker
        </p>
      </aside>

      {/* Form panel */}
      <section className="flex items-center justify-center p-6 sm:p-10">
        <div className="animate-rise w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <span className="bg-accent-gradient grid size-9 place-items-center rounded-xl text-primary-foreground">
              <Wallet className="size-5" strokeWidth={2.4} />
            </span>
            <span className="font-heading text-lg font-extrabold tracking-tight">Expense.</span>
          </div>

          <h1 className="font-heading text-2xl font-extrabold tracking-tight">{title}</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>

          <div className="mt-8">{children}</div>

          <div className="mt-6 text-center text-sm">{footer}</div>
        </div>
      </section>
    </main>
  );
}
