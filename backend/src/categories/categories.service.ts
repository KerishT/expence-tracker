import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { PrismaService } from '../prisma/prisma.service';
import { GetUserByIdQuery } from '../users/queries/get-user-by-id.query';
import { UserDto } from '../users/domain/user.dto';
import { CategoryDto } from './domain/category.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Category } from '@prisma/client';

@Injectable()
export class CategoriesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly queryBus: QueryBus,
  ) {}

  async create(userId: string, dto: CreateCategoryDto): Promise<CategoryDto> {
    const user = await this.queryBus.execute<GetUserByIdQuery, UserDto | null>(
      new GetUserByIdQuery(userId),
    );
    if (!user) {
      throw new NotFoundException('User not found');
    }

    try {
      const category = await this.prisma.category.create({
        data: { ...dto, userId },
      });
      return this.toDto(category);
    } catch (err: any) {
      if (err?.code === 'P2002') {
        throw new ConflictException('Category with this name already exists');
      }
      throw err;
    }
  }

  async findAllForUser(userId: string): Promise<CategoryDto[]> {
    const categories = await this.prisma.category.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });
    return categories.map(this.toDto);
  }

  async findOne(userId: string, id: string): Promise<CategoryDto> {
    const category = await this.prisma.category.findFirst({
      where: { id, userId },
    });
    if (!category) {
      throw new NotFoundException('Category not found');
    }
    return this.toDto(category);
  }

  async update(
    userId: string,
    id: string,
    dto: UpdateCategoryDto,
  ): Promise<CategoryDto> {
    await this.findOne(userId, id);

    try {
      const category = await this.prisma.category.update({
        where: { id },
        data: dto,
      });
      return this.toDto(category);
    } catch (err: any) {
      if (err?.code === 'P2002') {
        throw new ConflictException('Category with this name already exists');
      }
      throw err;
    }
  }

  async remove(userId: string, id: string): Promise<void> {
    await this.findOne(userId, id);
    await this.prisma.category.delete({ where: { id } });
  }

  private toDto(category: Category): CategoryDto {
    return {
      id: category.id,
      name: category.name,
      color: category.color,
      icon: category.icon,
    };
  }
}
