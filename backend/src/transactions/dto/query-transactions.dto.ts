import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

/**
 * Query-параметры листинга транзакций (`GET /transactions?year=&month=`).
 * Оба поля опциональны и приводятся к числу из строки запроса:
 * `month` — 1–12, `year` — 2000–2100.
 */
export class QueryTransactionsDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  month?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(2000)
  @Max(2100)
  year?: number;
}
