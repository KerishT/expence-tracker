import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/**
 * Обёртка над `PrismaClient` как инъектируемый Nest-провайдер — единая точка
 * доступа к БД для всех сервисов и CQRS-хендлеров.
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  /**
   * Хук жизненного цикла Nest: устанавливает соединение с БД при инициализации модуля.
   * @returns Промис, разрешающийся после установки соединения.
   */
  async onModuleInit() {
    await this.$connect();
  }
}
