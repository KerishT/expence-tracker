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
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserDto } from '../users/domain/user.dto';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { QueryTransactionsDto } from './dto/query-transactions.dto';

@UseGuards(JwtAuthGuard)
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post()
  create(
    @Req() req: Request & { user: UserDto },
    @Body() dto: CreateTransactionDto,
  ) {
    return this.transactionsService.create(req.user.id, dto);
  }

  @Get()
  findAll(
    @Req() req: Request & { user: UserDto },
    @Query() query: QueryTransactionsDto,
  ) {
    return this.transactionsService.findAllForUser(req.user.id, query);
  }

  @Get(':id')
  findOne(
    @Req() req: Request & { user: UserDto },
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.transactionsService.findOne(req.user.id, id);
  }

  @Patch(':id')
  update(
    @Req() req: Request & { user: UserDto },
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateTransactionDto,
  ) {
    return this.transactionsService.update(req.user.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(
    @Req() req: Request & { user: UserDto },
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.transactionsService.remove(req.user.id, id);
  }
}
