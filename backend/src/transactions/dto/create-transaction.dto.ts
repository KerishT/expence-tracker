import { TransactionType } from '@prisma/client';
import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

/**
 * Входной DTO создания транзакции (тело `POST /transactions`).
 * Валидируется глобальным `ValidationPipe` через `class-validator`:
 * `amount` — положительное число до 2 знаков после запятой;
 * `type` — enum `income`/`expense`; `description` — опциональна, до 255 символов;
 * `date` — ISO-строка даты; `categoryId` — UUID существующей категории.
 */
export class CreateTransactionDto {
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  amount!: number;

  @IsEnum(TransactionType)
  type!: TransactionType;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;

  @IsDateString()
  date!: string;

  @IsUUID()
  categoryId!: string;
}
