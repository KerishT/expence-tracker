import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PrismaService } from '../../prisma/prisma.service';
import { GetUserByIdQuery } from './get-user-by-id.query';
import { UserDto } from '../domain/user.dto';

@QueryHandler(GetUserByIdQuery)
export class GetUserByIdHandler implements IQueryHandler<GetUserByIdQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetUserByIdQuery): Promise<UserDto | null> {
    return this.prisma.user.findUnique({
      where: { id: query.id },
      select: { id: true, email: true, name: true },
    });
  }
}
