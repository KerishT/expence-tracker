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

@Injectable()
export class TransactionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly queryBus: QueryBus,
  ) {}

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

  async findOne(userId: string, id: string): Promise<TransactionDto> {
    const transaction = await this.prisma.transaction.findFirst({
      where: { id, userId },
    });
    if (!transaction) throw new NotFoundException('Transaction not found');
    return this.toDto(transaction);
  }

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

  async remove(userId: string, id: string): Promise<void> {
    await this.findOne(userId, id);
    await this.prisma.transaction.delete({ where: { id } });
  }

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
