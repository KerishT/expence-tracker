import { Tags } from 'lucide-react';

export default function CategoriesPage() {
  return (
    <div className="flex flex-col gap-6">
      <header>
        <p className="text-sm text-muted-foreground">Управление категориями трат</p>
        <h1 className="font-heading text-3xl font-extrabold tracking-tight">Категории</h1>
      </header>

      <div className="flex flex-col items-center justify-center gap-4 rounded-2xl bg-card py-20 text-center ring-1 ring-foreground/10">
        <span
          className="grid size-14 place-items-center rounded-2xl"
          style={{
            background: 'linear-gradient(135deg, oklch(0.62 0.19 268), oklch(0.52 0.19 305))',
            color: 'white',
            boxShadow: '0 16px 40px -16px oklch(0.64 0.17 272 / 50%)',
          }}
        >
          <Tags className="size-6" strokeWidth={2.2} />
        </span>
        <div>
          <p className="font-heading text-lg font-bold">Раздел в разработке</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Скоро здесь появится управление категориями.
          </p>
        </div>
      </div>
    </div>
  );
}
