import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';

/**
 * DI-модуль транзакций. Подключает `CqrsModule` (для `QueryBus`, через который
 * сервис обращается к users/categories), регистрирует контроллер и сервис.
 */
@Module({
  imports: [CqrsModule],
  controllers: [TransactionsController],
  providers: [TransactionsService],
})
export class TransactionsModule {}
