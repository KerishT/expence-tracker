import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { CreateUserCommand } from '../users/commands/create-user.command';
import { GetUserByEmailQuery } from '../users/queries/get-user-by-email.query';
import { UserWithHash } from '../users/queries/get-user-by-email.handler';
import { UserDto } from '../users/domain/user.dto';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<{ accessToken: string; user: UserDto }> {
    const existing = await this.queryBus.execute<GetUserByEmailQuery, UserWithHash | null>(
      new GetUserByEmailQuery(dto.email),
    );
    if (existing) throw new ConflictException('Email already in use');

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.commandBus.execute<CreateUserCommand, UserDto>(
      new CreateUserCommand(dto.email, dto.name, passwordHash),
    );

    const accessToken = this.jwtService.sign({ sub: user.id, email: user.email });
    return { accessToken, user };
  }

  async login(dto: LoginDto): Promise<{ accessToken: string; user: UserDto }> {
    const record = await this.queryBus.execute<GetUserByEmailQuery, UserWithHash | null>(
      new GetUserByEmailQuery(dto.email),
    );
    if (!record) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(dto.password, record.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    const user: UserDto = { id: record.id, email: record.email, name: record.name };
    const accessToken = this.jwtService.sign({ sub: user.id, email: user.email });
    return { accessToken, user };
  }
}
