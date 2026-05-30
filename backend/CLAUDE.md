# Backend

NestJS 11 API for Expense Tracker. Prisma 6 + PostgreSQL. JWT auth. CQRS-подобный паттерн в доменных модулях.

## Commands

```bash
npm run start:dev           # nest start --watch
npm run build               # nest build → dist/
npm run start:prod          # node dist/main
npm run lint                # eslint src/**/*.ts
npm run prisma:generate     # prisma generate
npm run prisma:migrate      # prisma migrate dev (создаёт миграцию + применяет)
```

Сервер: `src/main.ts`, порт **3001**, глобальный префикс **`/api`**. Глобальный `ValidationPipe({ whitelist: true, transform: true })` — DTO-валидация через `class-validator`.

## Environment

`.env` (см. `.env.example`):
- `DATABASE_URL` — строка подключения Postgres.
- `JWT_SECRET` — секрет подписи токена (обязателен, `getOrThrow`).
- `JWT_EXPIRES_IN` — TTL токена, формат `1d` / `3600s` / `12h`.

Postgres поднимается через корневой `docker-compose.yml` (db `expence_tracker`, `postgres/postgres`, порт 5432).

## Module structure

`AppModule` подключает: `ConfigModule.forRoot({ isGlobal: true })`, `CqrsModule.forRoot()`, `PrismaModule`, `UsersModule`, `AuthModule`, `CategoriesModule`, `TransactionsModule`.

Каждый доменный модуль — папка в `src/`:

```
src/<module>/
  <module>.controller.ts   # HTTP-роуты (нет в users — у него нет контроллера)
  <module>.service.ts      # бизнес-логика
  <module>.module.ts       # DI-описание
  dto/                     # входные DTO (class-validator) для запросов
  domain/<name>.dto.ts     # доменный DTO — форма данных, возвращаемая наружу
  commands/                # CQRS-команды (мутации): *.command.ts + *.handler.ts
  queries/                 # CQRS-запросы (чтение): *.query.ts + *.handler.ts
```

## CQRS-паттерн

Используется как граница между модулями, а не повсеместно. Модуль публикует доступ к своим данным только через команды/запросы на шине CQRS — другие модули не обращаются к чужим таблицам напрямую.

- **`UsersModule`** — без контроллера/сервиса. Экспортирует только handlers: `CreateUserCommand` (мутация), `GetUserByEmailQuery` / `GetUserByIdQuery` (чтение). Регистрируются как providers.
- **`AuthModule`** — оркеструет user-данные через `CommandBus`/`QueryBus` (`commandBus.execute(new CreateUserCommand(...))`), не трогая Prisma напрямую для users.
- **`TransactionsService`** — перед записью валидирует юзера и категорию через `queryBus.execute(new GetUserByIdQuery(...))` / `GetCategoryByIdQuery`, а с собственной таблицей `transaction` работает напрямую через Prisma.

Handler: класс с `@QueryHandler(Query)` / `@CommandHandler(Command)`, реализует `execute(query)`. Внедряет `PrismaService`. Query/Command — простые классы-носители аргументов в конструкторе.

## Auth (JWT)

- `JwtModule.registerAsync` берёт `JWT_SECRET` / `JWT_EXPIRES_IN` из `ConfigService`.
- `JwtStrategy` (`passport-jwt`): токен из `Authorization: Bearer`, в `validate(payload)` подтягивает юзера через `GetUserByIdQuery` и кладёт `UserDto` в `req.user`.
- Защита роутов: `@UseGuards(JwtAuthGuard)` на контроллере. Внутри — `@Req() req: Request & { user: UserDto }`, текущий юзер — `req.user.id`.
- `AuthController` (`/auth`): `POST /auth/register`, `POST /auth/login` — оба возвращают `{ accessToken, user }`. Пароли хешируются `bcrypt` (10 раундов).

## Endpoints

Все, кроме `/auth/*`, требуют JWT. Данные всегда скоупятся по `req.user.id`.

- `POST /api/auth/register`, `POST /api/auth/login`
- `categories`: `POST` `/`, `GET` `/`, `GET` `/:id`, `PATCH` `/:id`, `DELETE` `/:id` (204)
- `transactions`: `POST` `/`, `GET` `/` (фильтры `?year=&month=`), `GET` `/:id`, `PATCH` `/:id`, `DELETE` `/:id` (204)

`GET /transactions` возвращает `{ items, summary: { totalIncome, totalExpense, balance } }`. `:id` валидируется `ParseUUIDPipe`.

## Data model (`prisma/schema.prisma`)

- **User** — `id` (uuid), `email` (unique), `name`, `passwordHash`. Связи: `categories[]`, `transactions[]`.
- **Category** — `name`, `color`, `icon`, `userId`. `@@unique([userId, name])`, каскад при удалении юзера.
- **Transaction** — `amount Decimal(12,2)`, `type` (enum `income`/`expense`), `description?`, `date`, `categoryId`, `userId`. Индексы по `userId`, `[userId, date]`, `categoryId`.

`Decimal` из Prisma приводится к `number` в `toDto` сервисов перед отдачей наружу.

## Conventions

- Сервисы возвращают **domain DTO** (`domain/*.dto.ts`), не Prisma-модели напрямую — маппинг в приватном `toDto`.
- Ошибки — стандартные Nest-исключения: `NotFoundException`, `ConflictException`, `UnauthorizedException`.
- Входные DTO — в `dto/`, валидируются `class-validator`; `UpdateDto` строится через `PartialType` (`@nestjs/mapped-types`).
- TypeScript strict, `target ES2021`, `module commonjs`.

## Documentation
После изменения методов — обновляй JSDoc.
Для DTO и контроллеров — добавляй/обновляй Swagger декораторы.
