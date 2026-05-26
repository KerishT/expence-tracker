# План: модуль Transactions

## Контекст

В бэкенде (`backend/`, NestJS 11 + Prisma + CQRS) уже есть домены Auth, Users и Categories. Нужен центральный модуль учёта доходов и расходов — транзакции. Каждая транзакция принадлежит одному пользователю и обязательно привязана к одной из его категорий. Изоляция данных по пользователю и валидация ввода — ключевые требования, как и в Categories.

Задача (`/.claude/promts/transactions.md`) требует:
- следовать структуре модуля Categories;
- межмодульное взаимодействие через CQRS;
- `GET /transactions` с агрегацией по month/year;
- class-validator на DTO; не добавлять новые зависимости; после реализации — сборка.

**Решения, согласованные с пользователем:**
1. `GET /transactions` возвращает `{ items, summary }`, где `summary = { totalIncome, totalExpense, balance }`, фильтрация по `month`/`year`.
2. Валидация `categoryId` — через **новый CQRS-запрос** `GetCategoryByIdQuery` в модуле Categories (принцип «взаимодействие через CQRS»).
3. `categoryId` **обязателен** (NOT NULL).

## Архитектурные решения

- **Сервисный слой** `TransactionsService` поверх `PrismaService` — копия паттерна `CategoriesService` (`backend/src/categories/categories.service.ts`): конструктор `(prisma, queryBus)`, методы фильтруют по `userId`, чужой ресурс → `NotFoundException`.
- **Две CQRS-границы при create/update:**
  - проверка пользователя — `GetUserByIdQuery` (`backend/src/users/queries/get-user-by-id.query.ts`), как в Categories;
  - проверка категории и её принадлежности пользователю — новый `GetCategoryByIdQuery` (добавляется в Categories). Прямого `prisma.category.*` в модуле Transactions нет.
- **Авторизация владельца**: `userId` берётся из `req.user.id` (JWT кладёт `UserDto` в `req.user`, см. `backend/src/auth/strategies/jwt.strategy.ts`). Все запросы Prisma фильтруются по `userId`.
- **Тип суммы**: `Decimal` в Prisma (деньги). В DTO `amount` — `number`, положительный. В ответе сериализуется в `number`.
- **Тип транзакции**: Prisma enum `TransactionType { income expense }`, в DTO валидируется `@IsEnum`.
- **Валидация**: class-validator + глобальный `ValidationPipe({ whitelist: true, transform: true })` (уже в `backend/src/main.ts`).

## Изменения в Categories (новая CQRS-граница)

Новые файлы по образцу `get-user-by-id`:

`backend/src/categories/queries/get-category-by-id.query.ts`
```ts
export class GetCategoryByIdQuery {
  constructor(
    public readonly id: string,
    public readonly userId: string,
  ) {}
}
```

`backend/src/categories/queries/get-category-by-id.handler.ts` — `@QueryHandler(GetCategoryByIdQuery)`, конструктор `(prisma: PrismaService)`, возвращает `Promise<CategoryDto | null>` через `prisma.category.findFirst({ where: { id, userId } })` + маппинг в `CategoryDto`.

Зарегистрировать handler в `backend/src/categories/categories.module.ts` (`providers: [CategoriesService, GetCategoryByIdHandler]`). Шина CQRS глобальная (`CqrsModule.forRoot()` в AppModule), поэтому Transactions сможет вызвать запрос без импорта CategoriesModule.

## Изменения в схеме

Файл: `backend/prisma/schema.prisma`

```prisma
enum TransactionType {
  income
  expense
}

model User {
  // ...существующие поля
  transactions Transaction[]
}

model Category {
  // ...существующие поля
  transactions Transaction[]
}

model Transaction {
  id          String          @id @default(uuid())
  amount      Decimal         @db.Decimal(12, 2)
  type        TransactionType
  description String?
  date        DateTime
  categoryId  String
  category    Category        @relation(fields: [categoryId], references: [id], onDelete: Cascade)
  userId      String
  user        User            @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt   DateTime        @default(now())

  @@index([userId])
  @@index([userId, date])
  @@index([categoryId])
}
```

- `onDelete: Cascade` на обеих связях. На категории — чтобы существующий `CategoriesService.remove` (делает `prisma.category.delete`) не падал с P2003 при наличии транзакций. Транзакции удаляются вместе с категорией/пользователем.
- `@@index([userId, date])` — под фильтрацию по периоду в `GET`.
- `description` — опционально (`String?`).

Миграция (из `backend/`): `npm run prisma:migrate -- --name add_transaction`, затем `npm run prisma:generate`.

## Файловая структура (по образцу Categories)

```
backend/src/transactions/
├── transactions.module.ts
├── transactions.controller.ts
├── transactions.service.ts
├── domain/
│   └── transaction.dto.ts
└── dto/
    ├── create-transaction.dto.ts
    ├── update-transaction.dto.ts
    └── query-transactions.dto.ts
```

Регистрация `TransactionsModule` в `backend/src/app.module.ts` (`imports`).

## DTO и валидация

`dto/create-transaction.dto.ts`:
- `amount: number` — `@IsNumber({ maxDecimalPlaces: 2 })` `@IsPositive()`
- `type: TransactionType` — `@IsEnum(TransactionType)` (enum импортируется из `@prisma/client`)
- `description?: string` — `@IsOptional() @IsString() @MaxLength(255)`
- `date: string` — `@IsDateString()` (ISO; `transform: true` оставляет строку, в сервисе `new Date(dto.date)`)
- `categoryId: string` — `@IsUUID()`

`dto/update-transaction.dto.ts`: `export class UpdateTransactionDto extends PartialType(CreateTransactionDto) {}` (`@nestjs/mapped-types`, уже в зависимостях).

`dto/query-transactions.dto.ts` (фильтры GET):
- `month?: number` — `@IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(12)`
- `year?: number` — `@IsOptional() @Type(() => Number) @IsInt() @Min(2000) @Max(2100)`
- (`@Type` из class-transformer — уже в зависимостях; query-параметры приходят строками)

`domain/transaction.dto.ts` — выходной тип (без `userId`):
```ts
export class TransactionDto {
  id!: string;
  amount!: number;
  type!: 'income' | 'expense';
  description!: string | null;
  date!: Date;
  categoryId!: string;
}
```
И тип ответа списка:
```ts
export class TransactionsSummaryDto {
  totalIncome!: number;
  totalExpense!: number;
  balance!: number;
}
export class TransactionListDto {
  items!: TransactionDto[];
  summary!: TransactionsSummaryDto;
}
```

## TransactionsService

Конструктор: `(private prisma: PrismaService, private queryBus: QueryBus)`.

- `create(userId, dto)`:
  1. `GetUserByIdQuery(userId)` → `null` → `NotFoundException('User not found')`.
  2. `GetCategoryByIdQuery(dto.categoryId, userId)` → `null` → `NotFoundException('Category not found')` (закрывает и «нет категории», и «чужая категория»).
  3. `prisma.transaction.create({ data: { amount: dto.amount, type: dto.type, description: dto.description ?? null, date: new Date(dto.date), categoryId: dto.categoryId, userId } })`.
- `findAllForUser(userId, query)` → `TransactionListDto`:
  - если заданы `month`/`year` — построить диапазон `[start, end)` и добавить `where.date`. Поддержать: только `year` (весь год), `year`+`month` (один месяц). Если задан `month` без `year` → использовать текущий год (или 400 — уточнить при реализации; по умолчанию текущий год).
  - `items = prisma.transaction.findMany({ where, orderBy: { date: 'desc' } })`.
  - `summary` считать в БД через `prisma.transaction.groupBy({ by: ['type'], where, _sum: { amount: true } })`; `balance = totalIncome - totalExpense`.
- `findOne(userId, id)`: `prisma.transaction.findFirst({ where: { id, userId } })`; `null` → `NotFoundException`.
- `update(userId, id, dto)`: `findOne` (404 при чужой/нет) → если в dto есть `categoryId`, проверить через `GetCategoryByIdQuery` → `prisma.transaction.update`.
- `remove(userId, id)`: `findOne` → `prisma.transaction.delete`.

Приватный `toDto(entity)`: `amount` через `Number(entity.amount)` (Decimal → number), `date` как есть, без `userId`.

## TransactionsController

`@UseGuards(JwtAuthGuard)` на класс, `@Controller('transactions')` (полный путь `/api/transactions`).

- `POST   /api/transactions`     → `create(req.user.id, dto)`
- `GET    /api/transactions`     → `findAll(req.user.id, query)` — `@Query() query: QueryTransactionsDto`
- `GET    /api/transactions/:id` → `findOne` — `@Param('id', new ParseUUIDPipe())`
- `PATCH  /api/transactions/:id` → `update`
- `DELETE /api/transactions/:id` → `remove`, `@HttpCode(204)`

`userId` — `@Req() req: Request & { user: UserDto }` → `req.user.id` (как в Categories).

## TransactionsModule

```ts
@Module({
  imports: [CqrsModule],
  controllers: [TransactionsController],
  providers: [TransactionsService],
})
export class TransactionsModule {}
```
PrismaModule глобальный; CQRS-шина глобальная — `GetCategoryByIdHandler` и `GetUserByIdHandler` доступны через QueryBus при условии, что их модули загружены в AppModule.

## Чек-лист задач

- [x] Categories: `queries/get-category-by-id.query.ts` + `.handler.ts`, зарегистрировать handler в `categories.module.ts`
- [x] `schema.prisma`: enum `TransactionType`, модель `Transaction`, обратные связи в `User` и `Category`
- [x] Миграция `add_transaction` + `prisma:generate`
- [x] `transactions/dto/*` (create, update, query)
- [x] `transactions/domain/transaction.dto.ts` (+ summary/list DTO)
- [x] `transactions/transactions.service.ts`
- [x] `transactions/transactions.controller.ts`
- [x] `transactions/transactions.module.ts`
- [x] Зарегистрировать `TransactionsModule` в `app.module.ts`
- [x] `npm run build:backend` — без ошибок (lint отсутствует в проекте изначально)

## Проверка (end-to-end)

Запуск: `npm run dev:backend` (поднимет БД, применит миграции). Зарегистрировать двух юзеров A и B (`POST /api/auth/register`), получить JWT.

**Миграция:** `npx prisma migrate status` — применена; таблица `Transaction` с FK на `User` и `Category` есть; старые данные не затронуты.

**Happy path (A):**
- Создать категорию у A → `catId`.
- `POST /api/transactions` с `{ amount: 100.50, type: "expense", date: "2026-05-01T00:00:00Z", categoryId: catId, description: "lunch" }` → 201, в ответе нет `userId`, `amount` = число.
- `GET /api/transactions` → `{ items: [...], summary: { totalIncome, totalExpense, balance } }`.
- `GET /api/transactions?year=2026&month=5` → только майские; summary корректна. `?year=2026&month=4` → пусто, summary нули.
- `PATCH`/`DELETE` по своему id → 200 / 204.

**Изоляция (B):**
- `GET /api/transactions` под B → пусто.
- `GET|PATCH|DELETE /api/transactions/<id-A>` под B → 404.
- `POST` под B с `categoryId = catId` (категория A) → 404 (`Category not found`).

**Валидация:**
- Без токена → 401.
- `amount: -5` → 400; `amount: 1.999` → 400 (maxDecimalPlaces).
- `type: "foo"` → 400 (IsEnum).
- `date: "not-a-date"` → 400.
- `categoryId: "not-uuid"` → 400.
- Лишнее поле `userId` в body → отброшено whitelist, транзакция на текущем юзере.
- `GET /api/transactions/not-a-uuid` → 400 (ParseUUIDPipe).

**CQRS-граница:** `grep -r "prisma.category" backend/src/transactions` → пусто; проверка категории идёт через `GetCategoryByIdQuery`.

**Сборка:** `npm run build:backend` и `npm run lint` — без ошибок.
