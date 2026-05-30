import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserDto } from '../users/domain/user.dto';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { QueryTransactionsDto } from './dto/query-transactions.dto';
import { TransactionDto, TransactionListDto } from './domain/transaction.dto';

/**
 * HTTP-роуты транзакций (`/api/transactions`). Все защищены `JwtAuthGuard`;
 * текущий пользователь берётся из `req.user`, данные скоупятся по `req.user.id`.
 */
@ApiTags('transactions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  /**
   * `POST /transactions` — создаёт новую транзакцию текущего пользователя.
   * @param req - Запрос с авторизованным пользователем в `req.user`.
   * @param dto - Валидированное тело запроса с данными транзакции.
   * @returns Domain DTO созданной транзакции.
   */
  @Post()
  @ApiOperation({ summary: 'Создать транзакцию' })
  @ApiResponse({
    status: 201,
    description: 'Транзакция создана',
    type: TransactionDto,
  })
  @ApiResponse({ status: 400, description: 'Ошибка валидации тела запроса' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({
    status: 404,
    description: 'Пользователь или категория не найдены',
  })
  create(@Req() req: Request & { user: UserDto }, @Body() dto: CreateTransactionDto) {
    return this.transactionsService.create(req.user.id, dto);
  }

  /**
   * `GET /transactions` — список транзакций текущего пользователя со сводкой.
   * @param req - Запрос с авторизованным пользователем в `req.user`.
   * @param query - Опциональные фильтры периода `?year=&month=`.
   * @returns Объект `{ items, summary }`.
   */
  @Get()
  @ApiOperation({
    summary: 'Список транзакций со сводкой',
    description: 'Опциональные фильтры периода: ?year= и ?month=.',
  })
  @ApiResponse({
    status: 200,
    description: 'Список транзакций и агрегированная сводка',
    type: TransactionListDto,
  })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  findAll(@Req() req: Request & { user: UserDto }, @Query() query: QueryTransactionsDto) {
    return this.transactionsService.findAllForUser(req.user.id, query);
  }

  /**
   * `GET /transactions/:id` — одна транзакция текущего пользователя по ID.
   * @param req - Запрос с авторизованным пользователем в `req.user`.
   * @param id - UUID транзакции (валидируется `ParseUUIDPipe`).
   * @returns Domain DTO найденной транзакции.
   * @throws {NotFoundException} Если транзакция не найдена или чужая.
   */
  @Get(':id')
  @ApiOperation({ summary: 'Получить транзакцию по ID' })
  @ApiResponse({ status: 200, description: 'Найденная транзакция', type: TransactionDto })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 404, description: 'Транзакция не найдена' })
  findOne(@Req() req: Request & { user: UserDto }, @Param('id', new ParseUUIDPipe()) id: string) {
    return this.transactionsService.findOne(req.user.id, id);
  }

  /**
   * `PATCH /transactions/:id` — частично обновляет транзакцию текущего пользователя.
   * @param req - Запрос с авторизованным пользователем в `req.user`.
   * @param id - UUID обновляемой транзакции (валидируется `ParseUUIDPipe`).
   * @param dto - Валидированное тело с полями для обновления.
   * @returns Domain DTO обновлённой транзакции.
   * @throws {NotFoundException} Если транзакция или новая категория не найдены/чужие.
   */
  @Patch(':id')
  @ApiOperation({ summary: 'Частично обновить транзакцию' })
  @ApiResponse({ status: 200, description: 'Обновлённая транзакция', type: TransactionDto })
  @ApiResponse({ status: 400, description: 'Ошибка валидации тела запроса' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 404, description: 'Транзакция или категория не найдены' })
  update(
    @Req() req: Request & { user: UserDto },
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateTransactionDto,
  ) {
    return this.transactionsService.update(req.user.id, id, dto);
  }

  /**
   * `DELETE /transactions/:id` — удаляет транзакцию текущего пользователя (статус 204).
   * @param req - Запрос с авторизованным пользователем в `req.user`.
   * @param id - UUID удаляемой транзакции (валидируется `ParseUUIDPipe`).
   * @returns Промис без значения (ответ с пустым телом и кодом 204).
   * @throws {NotFoundException} Если транзакция не найдена или чужая.
   */
  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Удалить транзакцию' })
  @ApiResponse({ status: 204, description: 'Транзакция удалена' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 404, description: 'Транзакция не найдена' })
  remove(@Req() req: Request & { user: UserDto }, @Param('id', new ParseUUIDPipe()) id: string) {
    return this.transactionsService.remove(req.user.id, id);
  }
}
