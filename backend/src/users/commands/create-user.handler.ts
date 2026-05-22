import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserCommand } from './create-user.command';
import { UserDto } from '../domain/user.dto';

@CommandHandler(CreateUserCommand)
export class CreateUserHandler implements ICommandHandler<CreateUserCommand> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: CreateUserCommand): Promise<UserDto> {
    try {
      const user = await this.prisma.user.create({
        data: {
          email: command.email,
          name: command.name,
          passwordHash: command.passwordHash,
        },
        select: { id: true, email: true, name: true },
      });
      return user;
    } catch (err: any) {
      if (err?.code === 'P2002') {
        throw new ConflictException('Email already in use');
      }
      throw err;
    }
  }
}
