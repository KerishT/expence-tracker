import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PrismaService } from '../../prisma/prisma.service';
import { GetCategoryByIdQuery } from './get-category-by-id.query';
import { CategoryDto } from '../domain/category.dto';

/**
 * CQRS-хендлер запроса {@link GetCategoryByIdQuery}. Читает категорию из БД
 * со скоупингом по владельцу и маппит её в domain DTO.
 */
@QueryHandler(GetCategoryByIdQuery)
export class GetCategoryByIdHandler implements IQueryHandler<GetCategoryByIdQuery> {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Находит категорию по ID среди категорий конкретного пользователя.
   * @param query - Запрос с `id` категории и `userId` владельца.
   * @returns `CategoryDto` найденной категории либо `null`, если её нет или она чужая.
   */
  async execute(query: GetCategoryByIdQuery): Promise<CategoryDto | null> {
    const category = await this.prisma.category.findFirst({
      where: { id: query.id, userId: query.userId },
    });
    if (!category) return null;
    return {
      id: category.id,
      name: category.name,
      color: category.color,
      icon: category.icon,
    };
  }
}
