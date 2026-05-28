'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/shared/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/shared/ui/select';

const TYPE_LABELS: Record<string, string> = {
  expense: 'Расход',
  income: 'Доход',
};
import { createTransactionSchema, type CreateTransactionFormValues } from '../model/schemas';
import { useCreateTransaction } from '../model/use-create-transaction';
import { useCategories } from '@/features/categories/model/use-categories';

interface Props {
  onSuccess: () => void;
}

export function AddTransactionForm({ onSuccess }: Props) {
  const { data: categories, loading: categoriesLoading } = useCategories();
  const { create, isPending, error } = useCreateTransaction(onSuccess);

  const today = new Date().toISOString().split('T')[0];

  const form = useForm<CreateTransactionFormValues>({
    resolver: zodResolver(createTransactionSchema),
    defaultValues: { amount: '', type: 'expense', categoryId: '', description: '', date: today },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(create)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Сумма</FormLabel>
                <FormControl>
                  <Input type="number" min="0.01" step="0.01" placeholder="0.00" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="type"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel>Тип</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full" aria-invalid={!!fieldState.error}>
                    <span className={field.value ? '' : 'text-muted-foreground'}>
                      {TYPE_LABELS[field.value] ?? 'Выберите тип'}
                    </span>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="expense">Расход</SelectItem>
                    <SelectItem value="income">Доход</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="categoryId"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel>Категория</FormLabel>
              <Select
                value={field.value}
                onValueChange={field.onChange}
                disabled={categoriesLoading}
              >
                <SelectTrigger className="w-full" aria-invalid={!!fieldState.error}>
                  <span className={field.value ? '' : 'text-muted-foreground'}>
                    {field.value
                      ? (categories.find((c) => c.id === field.value)?.name ?? 'Выберите категорию')
                      : categoriesLoading ? 'Загрузка...' : 'Выберите категорию'}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      <span className="flex items-center gap-2">
                        <span
                          className="inline-block h-3 w-3 rounded-full"
                          style={{ backgroundColor: cat.color }}
                        />
                        {cat.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Дата</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Описание <span className="text-muted-foreground">(необязательно)</span>
              </FormLabel>
              <FormControl>
                <Input placeholder="Кофе, такси, зарплата…" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {error && <p className="text-destructive text-sm">{error}</p>}

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? 'Сохраняем...' : 'Добавить транзакцию'}
        </Button>
      </form>
    </Form>
  );
}
