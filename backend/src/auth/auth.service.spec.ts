import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { UserDto } from '../users/domain/user.dto';
import { UserWithHash } from '../users/queries/get-user-by-email.handler';

jest.mock('bcrypt');
const bcryptHash = bcrypt.hash as jest.MockedFunction<typeof bcrypt.hash>;
const bcryptCompare = bcrypt.compare as jest.MockedFunction<typeof bcrypt.compare>;

const mockUser: UserDto = { id: 'uuid-1', email: 'test@example.com', name: 'Test' };
const mockUserWithHash: UserWithHash = { ...mockUser, passwordHash: 'hashed_pw' };

describe('AuthService', () => {
  let service: AuthService;
  let queryBus: jest.Mocked<QueryBus>;
  let commandBus: jest.Mocked<CommandBus>;
  let jwtService: jest.Mocked<JwtService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: QueryBus, useValue: { execute: jest.fn() } },
        { provide: CommandBus, useValue: { execute: jest.fn() } },
        { provide: JwtService, useValue: { sign: jest.fn().mockReturnValue('signed_token') } },
      ],
    }).compile();

    service = module.get(AuthService);
    queryBus = module.get(QueryBus);
    commandBus = module.get(CommandBus);
    jwtService = module.get(JwtService);

    jest.clearAllMocks();
    jwtService.sign.mockReturnValue('signed_token');
  });

  describe('register', () => {
    it('должен зарегистрировать нового пользователя и вернуть токен', async () => {
      queryBus.execute.mockResolvedValue(null);
      (bcryptHash as jest.Mock).mockResolvedValue('hashed_pw');
      commandBus.execute.mockResolvedValue(mockUser);

      const result = await service.register({ email: 'test@example.com', name: 'Test', password: 'pass123' });

      expect(result).toEqual({ accessToken: 'signed_token', user: mockUser });
      expect(jwtService.sign).toHaveBeenCalledWith({ sub: mockUser.id, email: mockUser.email });
    });

    it('должен хешировать пароль с 10 раундами соли', async () => {
      queryBus.execute.mockResolvedValue(null);
      (bcryptHash as jest.Mock).mockResolvedValue('hashed_pw');
      commandBus.execute.mockResolvedValue(mockUser);

      await service.register({ email: 'test@example.com', name: 'Test', password: 'pass123' });

      expect(bcryptHash).toHaveBeenCalledWith('pass123', 10);
    });

    it('должен выбросить ConflictException если email уже занят', async () => {
      queryBus.execute.mockResolvedValue(mockUserWithHash);

      await expect(
        service.register({ email: 'test@example.com', name: 'Test', password: 'pass123' }),
      ).rejects.toThrow(ConflictException);
      expect(commandBus.execute).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('должен вернуть токен и пользователя при корректных учётных данных', async () => {
      queryBus.execute.mockResolvedValue(mockUserWithHash);
      (bcryptCompare as jest.Mock).mockResolvedValue(true);

      const result = await service.login({ email: 'test@example.com', password: 'pass123' });

      expect(result).toEqual({
        accessToken: 'signed_token',
        user: { id: mockUser.id, email: mockUser.email, name: mockUser.name },
      });
      expect(jwtService.sign).toHaveBeenCalledWith({ sub: mockUser.id, email: mockUser.email });
    });

    it('должен выбросить UnauthorizedException если пользователь не найден', async () => {
      queryBus.execute.mockResolvedValue(null);

      await expect(
        service.login({ email: 'unknown@example.com', password: 'pass123' }),
      ).rejects.toThrow(UnauthorizedException);
      expect(bcryptCompare).not.toHaveBeenCalled();
    });

    it('должен выбросить UnauthorizedException если пароль неверный', async () => {
      queryBus.execute.mockResolvedValue(mockUserWithHash);
      (bcryptCompare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.login({ email: 'test@example.com', password: 'wrong_pass' }),
      ).rejects.toThrow(UnauthorizedException);
      expect(jwtService.sign).not.toHaveBeenCalled();
    });
  });
});
