import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PrismaService } from '../../prisma/prisma.service';
import { GetUserByIdQuery } from './get-user-by-id.query';
import { UserDto } from '../domain/user.dto';

/**
 * CQRS-хендлер запроса {@link GetUserByIdQuery}. Читает пользователя из БД,
 * отдавая только публичные поля (без `passwordHash`).
 */
@QueryHandler(GetUserByIdQuery)
export class GetUserByIdHandler implements IQueryHandler<GetUserByIdQuery> {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Находит пользователя по ID.
   * @param query - Запрос с `id` искомого пользователя.
   * @returns `UserDto` найденного пользователя либо `null`, если он не существует.
   */
  async execute(query: GetUserByIdQuery): Promise<UserDto | null> {
    return this.prisma.user.findUnique({
      where: { id: query.id },
      select: { id: true, email: true, name: true },
    });
  }
}
