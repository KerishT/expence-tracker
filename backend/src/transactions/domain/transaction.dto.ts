export class TransactionDto {
  id!: string;
  amount!: number;
  type!: 'income' | 'expense';
  description!: string | null;
  date!: Date;
  categoryId!: string;
}

export class TransactionsSummaryDto {
  totalIncome!: number;
  totalExpense!: number;
  balance!: number;
}

export class TransactionListDto {
  items!: TransactionDto[];
  summary!: TransactionsSummaryDto;
}
