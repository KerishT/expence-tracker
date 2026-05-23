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
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserDto } from '../users/domain/user.dto';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@UseGuards(JwtAuthGuard)
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  create(
    @Req() req: Request & { user: UserDto },
    @Body() dto: CreateCategoryDto,
  ) {
    return this.categoriesService.create(req.user.id, dto);
  }

  @Get()
  findAll(@Req() req: Request & { user: UserDto }) {
    return this.categoriesService.findAllForUser(req.user.id);
  }

  @Get(':id')
  findOne(
    @Req() req: Request & { user: UserDto },
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.categoriesService.findOne(req.user.id, id);
  }

  @Patch(':id')
  update(
    @Req() req: Request & { user: UserDto },
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.categoriesService.update(req.user.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(
    @Req() req: Request & { user: UserDto },
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.categoriesService.remove(req.user.id, id);
  }
}
