import { PartialType } from '@nestjs/mapped-types';
import { CreateTransactionDto } from './create-transaction.dto';

/**
 * Входной DTO частичного обновления транзакции (тело `PATCH /transactions/:id`).
 * Через `PartialType` все поля {@link CreateTransactionDto} становятся опциональными,
 * сохраняя их правила валидации.
 */
export class UpdateTransactionDto extends PartialType(CreateTransactionDto) {}
