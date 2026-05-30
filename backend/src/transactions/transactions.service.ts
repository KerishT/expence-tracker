import { Injectable, NotFoundException } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { Transaction } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { GetUserByIdQuery } from '../users/queries/get-user-by-id.query';
import { UserDto } from '../users/domain/user.dto';
import { GetCategoryByIdQuery } from '../categories/queries/get-category-by-id.query';
import { CategoryDto } from '../categories/domain/category.dto';
import { TransactionDto, TransactionListDto } from './domain/transaction.dto';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { QueryTransactionsDto } from './dto/query-transactions.dto';

/**
 * Бизнес-логика транзакций. Все операции скоупятся по `userId`.
 * Со своей таблицей `transaction` работает через Prisma напрямую, а доступ к
 * чужим данным (user, category) получает через CQRS `QueryBus`.
 */
@Injectable()
export class TransactionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly queryBus: QueryBus,
  ) {}

  /**
   * Создаёт транзакцию для пользователя, предварительно убедившись, что
   * пользователь существует, а категория существует и принадлежит ему.
   * @param userId - ID пользователя-владельца транзакции.
   * @param dto - Данные новой транзакции (сумма, тип, дата, категория, описание).
   * @returns Domain DTO созданной транзакции.
   * @throws {NotFoundException} Если пользователь не найден.
   * @throws {NotFoundException} Если категория не найдена или не принадлежит пользователю.
   */
  async create(userId: string, dto: CreateTransactionDto): Promise<TransactionDto> {
    const user = await this.queryBus.execute<GetUserByIdQuery, UserDto | null>(
      new GetUserByIdQuery(userId),
    );
    if (!user) throw new NotFoundException('User not found');

    const category = await this.queryBus.execute<GetCategoryByIdQuery, CategoryDto | null>(
      new GetCategoryByIdQuery(dto.categoryId, userId),
    );
    if (!category) throw new NotFoundException('Category not found');

    const transaction = await this.prisma.transaction.create({
      data: {
        amount: dto.amount,
        type: dto.type,
        description: dto.description ?? null,
        date: new Date(dto.date),
        categoryId: dto.categoryId,
        userId,
      },
    });
    return this.toDto(transaction);
  }

  /**
   * Возвращает список транзакций пользователя (по убыванию даты) вместе со сводкой
   * доходов/расходов/баланса. При указании `year`/`month` фильтрует по периоду:
   * только год — весь год; год и месяц — конкретный месяц (если задан лишь месяц,
   * берётся текущий год).
   * @param userId - ID пользователя, чьи транзакции запрашиваются.
   * @param query - Опциональные фильтры периода: `year` (2000–2100) и `month` (1–12).
   * @returns Объект `{ items, summary: { totalIncome, totalExpense, balance } }`.
   */
  async findAllForUser(userId: string, query: QueryTransactionsDto): Promise<TransactionListDto> {
    const where: any = { userId };

    if (query.year !== undefined || query.month !== undefined) {
      const year = query.year ?? new Date().getFullYear();
      if (query.month !== undefined) {
        const start = new Date(year, query.month - 1, 1);
        const end = new Date(year, query.month, 1);
        where.date = { gte: start, lt: end };
      } else {
        const start = new Date(year, 0, 1);
        const end = new Date(year + 1, 0, 1);
        where.date = { gte: start, lt: end };
      }
    }

    const items = await this.prisma.transaction.findMany({
      where,
      orderBy: { date: 'desc' },
    });

    const grouped = await this.prisma.transaction.groupBy({
      by: ['type'],
      where,
      _sum: { amount: true },
    });

    let totalIncome = 0;
    let totalExpense = 0;
    for (const g of grouped) {
      const sum = Number(g._sum.amount ?? 0);
      if (g.type === 'income') totalIncome = sum;
      else totalExpense = sum;
    }

    return {
      items: items.map((t) => this.toDto(t)),
      summary: {
        totalIncome,
        totalExpense,
        balance: totalIncome - totalExpense,
      },
    };
  }

  /**
   * Находит одну транзакцию пользователя по её ID.
   * @param userId - ID пользователя-владельца (для скоупинга).
   * @param id - UUID транзакции.
   * @returns Domain DTO найденной транзакции.
   * @throws {NotFoundException} Если транзакция не найдена или не принадлежит пользователю.
   */
  async findOne(userId: string, id: string): Promise<TransactionDto> {
    const transaction = await this.prisma.transaction.findFirst({
      where: { id, userId },
    });
    if (!transaction) throw new NotFoundException('Transaction not found');
    return this.toDto(transaction);
  }

  /**
   * Частично обновляет транзакцию пользователя. Изменяются только переданные поля;
   * при смене категории проверяется, что новая категория принадлежит пользователю.
   * @param userId - ID пользователя-владельца (для скоупинга).
   * @param id - UUID обновляемой транзакции.
   * @param dto - Поля для обновления (любое подмножество полей создания).
   * @returns Domain DTO обновлённой транзакции.
   * @throws {NotFoundException} Если транзакция не найдена или не принадлежит пользователю.
   * @throws {NotFoundException} Если передан `categoryId` несуществующей/чужой категории.
   */
  async update(userId: string, id: string, dto: UpdateTransactionDto): Promise<TransactionDto> {
    await this.findOne(userId, id);

    if (dto.categoryId !== undefined) {
      const category = await this.queryBus.execute<GetCategoryByIdQuery, CategoryDto | null>(
        new GetCategoryByIdQuery(dto.categoryId, userId),
      );
      if (!category) throw new NotFoundException('Category not found');
    }

    const updated = await this.prisma.transaction.update({
      where: { id },
      data: {
        ...(dto.amount !== undefined && { amount: dto.amount }),
        ...(dto.type !== undefined && { type: dto.type }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.date !== undefined && { date: new Date(dto.date) }),
        ...(dto.categoryId !== undefined && { categoryId: dto.categoryId }),
      },
    });
    return this.toDto(updated);
  }

  /**
   * Удаляет транзакцию пользователя, предварительно проверив её принадлежность.
   * @param userId - ID пользователя-владельца (для скоупинга).
   * @param id - UUID удаляемой транзакции.
   * @returns Промис без значения по завершении удаления.
   * @throws {NotFoundException} Если транзакция не найдена или не принадлежит пользователю.
   */
  async remove(userId: string, id: string): Promise<void> {
    await this.findOne(userId, id);
    await this.prisma.transaction.delete({ where: { id } });
  }

  /**
   * Маппит Prisma-модель транзакции в domain DTO, приводя `Decimal` суммы к `number`.
   * @param transaction - Запись транзакции из Prisma.
   * @returns Domain DTO, безопасный для отдачи наружу.
   */
  private toDto(transaction: Transaction): TransactionDto {
    return {
      id: transaction.id,
      amount: Number(transaction.amount),
      type: transaction.type,
      description: transaction.description,
      date: transaction.date,
      categoryId: transaction.categoryId,
    };
  }
}
