/**
 * Доменный DTO транзакции — форма, отдаваемая наружу. `amount` уже приведён
 * из Prisma `Decimal` к `number`; `passwordHash`/`userId` наружу не попадают.
 */
export class TransactionDto {
  id!: string;
  amount!: number;
  type!: 'income' | 'expense';
  description!: string | null;
  date!: Date;
  categoryId!: string;
}

/**
 * Агрегированная сводка по выборке транзакций: суммы доходов, расходов и баланс
 * (`totalIncome - totalExpense`).
 */
export class TransactionsSummaryDto {
  totalIncome!: number;
  totalExpense!: number;
  balance!: number;
}

/**
 * Ответ листинга транзакций: список элементов плюс агрегированная сводка.
 */
export class TransactionListDto {
  items!: TransactionDto[];
  summary!: TransactionsSummaryDto;
}
