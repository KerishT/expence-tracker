# План: модуль Categories

## Контекст

В проекте уже реализованы Auth и Users (через CQRS, см. `backend/src/users/` и `backend/src/auth/`). Нужен новый домен — категории трат. Каждая категория принадлежит одному пользователю; пользователь должен видеть и менять только свои категории. Изоляция данных и валидация ввода — ключевые требования.

Cross-module взаимодействие с пользователями делается через CQRS (есть готовый `GetUserByIdQuery` в `backend/src/users/queries/get-user-by-id.query.ts`). Внутри модуля Categories — обычный сервис поверх Prisma (по аналогии с тем, как `AuthService` оркестрирует свою работу). Это соответствует требованию задачи «Сервис с методами … Взаимодействие с User-модулем через CQRS».

## Архитектурные решения

- **Сервисный слой**: `CategoriesService` инкапсулирует CRUD над таблицей `Category` через `PrismaService`. Это проще, чем заводить отдельный handler на каждую операцию, и соответствует формулировке задачи.
- **CQRS-граница с Users**: при создании категории `CategoriesService` через `QueryBus.execute(new GetUserByIdQuery(userId))` проверяет существование пользователя. Прямого обращения к таблице `User` из модуля Categories нет.
- **Авторизация владельца**: каждый метод сервиса принимает `userId` из JWT (`req.user.id`); запросы к Prisma всегда фильтруются по `userId`. Попытка обратиться к чужой категории → `NotFoundException` (404, без раскрытия факта существования).
- **Валидация**: class-validator на DTO + глобальный `ValidationPipe` (уже сконфигурирован в `backend/src/main.ts` с `whitelist: true, transform: true`).

## Изменения в схеме

Файл: `backend/prisma/schema.prisma`

Добавить модель и связь:

```prisma
model User {
  // ...существующие поля
  categories Category[]
}

model Category {
  id        String   @id @default(uuid())
  name      String
  color     String   // hex, например "#FF5733"
  icon      String   // строковый идентификатор/emoji
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([userId, name])
  @@index([userId])
}
```

Уникальность `(userId, name)` — чтобы у одного пользователя не было двух категорий с одинаковым именем. `onDelete: Cascade` — удаление пользователя забирает его категории.

Миграция: `npm run prisma:migrate -- --name add_category` (из `backend/`).

## Файловая структура

```
backend/src/categories/
├── categories.module.ts
├── categories.controller.ts
├── categories.service.ts
├── domain/
│   └── category.dto.ts
└── dto/
    ├── create-category.dto.ts
    └── update-category.dto.ts
```

Регистрация в `backend/src/app.module.ts`: добавить `CategoriesModule` в `imports`.

## DTO и валидация

`dto/create-category.dto.ts`:
- `name: string` — `@IsString() @IsNotEmpty() @MaxLength(50)`
- `color: string` — `@IsString() @Matches(/^#[0-9A-Fa-f]{6}$/, { message: 'color must be a hex like #RRGGBB' })`
- `icon: string` — `@IsString() @IsNotEmpty() @MaxLength(50)`

`dto/update-category.dto.ts`:
- `extends PartialType(CreateCategoryDto)` из `@nestjs/mapped-types` (или вручную: все поля `@IsOptional()`). Поскольку `@nestjs/mapped-types` уже идёт с NestJS, использовать его.

`domain/category.dto.ts` — выходной тип (без `userId` в ответе):
```ts
export class CategoryDto {
  id!: string;
  name!: string;
  color!: string;
  icon!: string;
}
```

## CategoriesService

Конструктор: `private prisma: PrismaService`, `private queryBus: QueryBus`.

Методы (все возвращают `CategoryDto` либо массив):
- `create(userId, dto)`:
  1. `await this.queryBus.execute<GetUserByIdQuery, UserDto | null>(new GetUserByIdQuery(userId))` — если `null` → `NotFoundException('User not found')`. (В норме user всегда есть, т.к. JWT прошёл, но это и есть та самая CQRS-граница).
  2. `prisma.category.create({ data: { ...dto, userId } })`.
  3. Ловить `P2002` → `ConflictException('Category with this name already exists')`.
- `findAllForUser(userId)`: `prisma.category.findMany({ where: { userId }, orderBy: { createdAt: 'asc' } })`.
- `findOne(userId, id)`: `prisma.category.findFirst({ where: { id, userId } })`; `null` → `NotFoundException`.
- `update(userId, id, dto)`: сначала `findOne` (выкинет 404, если чужая/нет), затем `prisma.category.update({ where: { id }, data: dto })`. Ловить `P2002`.
- `remove(userId, id)`: аналогично — проверить владельца через `findOne`, потом `prisma.category.delete({ where: { id } })`.

Маппер `toDto(entity)` — возвращает только `{ id, name, color, icon }`.

## CategoriesController

Префикс: `@Controller('categories')` (полный путь будет `/api/categories` за счёт глобального prefix в `main.ts`). На весь класс — `@UseGuards(JwtAuthGuard)`.

Эндпоинты:
- `POST   /api/categories`       → `create`
- `GET    /api/categories`       → `findAll`
- `GET    /api/categories/:id`   → `findOne`
- `PATCH  /api/categories/:id`   → `update`
- `DELETE /api/categories/:id`   → `remove` (вернуть `204 No Content` через `@HttpCode(204)`)

`userId` извлекать из `req.user.id` (см. `JwtStrategy.validate`, который кладёт в `req.user` объект `UserDto`). Для типобезопасности — `@Req() req: Request & { user: UserDto }` либо параметр-декоратор (но в проекте такого ещё нет, пока не вводим — `@Req()` достаточно).

`:id` валидировать через `@Param('id', new ParseUUIDPipe())`.

## CategoriesModule

```ts
@Module({
  imports: [CqrsModule, UsersModule], // UsersModule — чтобы handlers query были доступны
  controllers: [CategoriesController],
  providers: [CategoriesService],
})
export class CategoriesModule {}
```

Примечание: `UsersModule` уже регистрирует `GetUserByIdHandler`. Поскольку `CqrsModule` в проекте создан через `CqrsModule.forRoot()` в `AppModule`, шина глобальная — достаточно того, что `UsersModule` загружен в `AppModule`, импорт `UsersModule` в `CategoriesModule` не обязателен. Если возникнут проблемы с регистрацией handlers — добавить импорт.

## Чек-лист задач

- [x] Добавить модель `Category` и связь в `User` в `prisma/schema.prisma`
- [x] Сгенерировать и применить миграцию: `npm run prisma:migrate -- --name add_category`
- [x] `npm run prisma:generate`
- [x] Создать `backend/src/categories/dto/create-category.dto.ts`
- [x] Создать `backend/src/categories/dto/update-category.dto.ts` (через `PartialType`)
- [x] Создать `backend/src/categories/domain/category.dto.ts`
- [x] Создать `backend/src/categories/categories.service.ts`
- [x] Создать `backend/src/categories/categories.controller.ts` с JWT-гардом и `ParseUUIDPipe`
- [x] Создать `backend/src/categories/categories.module.ts`
- [x] Зарегистрировать `CategoriesModule` в `backend/src/app.module.ts`
- [x] Проверить, что `@nestjs/mapped-types` есть в зависимостях; если нет — `npm i @nestjs/mapped-types -w backend`
- [x] Прогнать `npm run build` и `npm run lint`

## Что проверить после каждого шага

**После миграции:**
- `npx prisma migrate status` (из `backend/`) показывает, что миграция применена
- В базе появилась таблица `Category` с FK на `User` (`docker compose exec db psql -U postgres -d expence_tracker -c "\d \"Category\""`)
- Старые данные User не затронуты

**После сборки:**
- `npm run build` в корне или `npm run build:backend` — успешно, без ошибок типов
- `npm run lint` — без ошибок

**Изоляция данных (ручной smoke-тест через curl):**
1. Зарегистрировать двух пользователей A и B (`POST /api/auth/register`), получить их JWT.
2. Под A создать категорию → запомнить `id`.
3. Под B: `GET /api/categories` → пустой массив (не видит категорий A).
4. Под B: `GET /api/categories/<id-A>` → `404`.
5. Под B: `PATCH /api/categories/<id-A>` с любыми данными → `404`.
6. Под B: `DELETE /api/categories/<id-A>` → `404`.
7. Под A: `GET /api/categories/<id-A>` → 200, данные на месте.

**Валидация:**
- `POST /api/categories` без токена → `401`.
- `POST /api/categories` c пустым `name` → `400` с сообщением `name should not be empty`.
- `POST /api/categories` c `color: "red"` → `400` с сообщением про hex.
- `POST /api/categories` с лишним полем `userId` в body → поле отбрасывается (whitelist), категория создаётся под текущим пользователем из JWT.
- Повторное создание категории с тем же `name` у того же пользователя → `409 Conflict`.
- `GET /api/categories/not-a-uuid` → `400` (ParseUUIDPipe).

**CQRS-граница:**
- При создании категории в логах/дебаге видно, что `QueryBus.execute(GetUserByIdQuery)` вызывается; прямого `prisma.user.*` в коде модуля Categories нет (проверяется grep'ом: `grep -r "prisma.user" backend/src/categories` → пусто).
