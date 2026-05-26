import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';
import { GetCategoryByIdHandler } from './queries/get-category-by-id.handler';

@Module({
  imports: [CqrsModule],
  controllers: [CategoriesController],
  providers: [CategoriesService, GetCategoryByIdHandler],
})
export class CategoriesModule {}
