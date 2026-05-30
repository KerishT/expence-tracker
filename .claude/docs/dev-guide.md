# Гайд для разработчика

Практические рецепты: как добавить бэкенд-модуль, фронтенд-фичу и миграцию БД.
Контекст архитектуры — в [architecture.md](architecture.md).

## Перед началом

Любая работа — в отдельной ветке от `main` (GitHub Flow):

```bash
git checkout main && git pull
git checkout -b feature/<name>      # или fix/<name>, chore/<name>
```

В `main` напрямую не коммитим. Финал — PR через `gh pr create`, после merge ветку удалить.
Коммиты — Conventional Commits: `<type>(<scope>): <subject>` (lowercase, imperative, без точки).

---

## Backend: добавить доменный модуль

Пример — гипотетический модуль `budgets`. Структура повторяет `categories`/`transactions`.

### 1. Создать каркас

```
backend/src/budgets/
  budgets.controller.ts
  budgets.service.ts
  budgets.module.ts
  dto/
    create-budget.dto.ts
    update-budget.dto.ts
  domain/
    budget.dto.ts
```

### 2. Доменный DTO (`domain/budget.dto.ts`)

Форма данных, отдаваемая наружу — без `userId` и служебных полей:

```ts
export class BudgetDto {
  id!: string;
  limit!: number;
  // ...
}
```

### 3. Входные DTO (`dto/`)

`create-*.dto.ts` — с декораторами `class-validator`; `update-*.dto.ts` — через `PartialType`:

```ts
// create-budget.dto.ts
import { IsNumber, IsPositive } from 'class-validator';
export class CreateBudgetDto {
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  limit!: number;
}

// update-budget.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateBudgetDto } from './create-budget.dto';
export class UpdateBudgetDto extends PartialType(CreateBudgetDto) {}
```

### 4. Сервис (`budgets.service.ts`)

- Внедряет `PrismaService` (своя таблица) и при необходимости `QueryBus` (чужие данные).
- **Все операции скоупятся по `userId`.**
- Возвращает domain DTO через приватный `toDto()` (приводит `Decimal` → `number`).
- Ошибки — Nest-исключения (`NotFoundException`, `ConflictException`). `P2002` → `ConflictException`.

```ts
@Injectable()
export class BudgetsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly queryBus: QueryBus,   // если нужен доступ к user/category
  ) {}

  async findOne(userId: string, id: string): Promise<BudgetDto> {
    const budget = await this.prisma.budget.findFirst({ where: { id, userId } });
    if (!budget) throw new NotFoundException('Budget not found');
    return this.toDto(budget);
  }

  private toDto(b: Budget): BudgetDto { /* ... */ }
}
```

### 5. Контроллер (`budgets.controller.ts`)

- `@UseGuards(JwtAuthGuard)` на классе.
- Текущий пользователь — `@Req() req: Request & { user: UserDto }`, передавать `req.user.id` в сервис.
- `:id` — `@Param('id', new ParseUUIDPipe())`.
- `DELETE` — `@HttpCode(204)`.
- Добавить Swagger-декораторы (`@ApiTags`, `@ApiBearerAuth`, `@ApiOperation`, `@ApiResponse`) —
  см. `transactions.controller.ts` как образец.

### 6. Модуль (`budgets.module.ts`)

```ts
@Module({
  imports: [CqrsModule],            // если используется QueryBus/CommandBus
  controllers: [BudgetsController],
  providers: [BudgetsService],
})
export class BudgetsModule {}
```

### 7. Зарегистрировать в `AppModule`

Добавить `BudgetsModule` в `imports` массива `backend/src/app.module.ts`.

### 8. Если модуль должен отдавать данные другим модулям — CQRS

Не давай другим модулям лезть в твою таблицу напрямую. Опубликуй query/command:

```ts
// queries/get-budget-by-id.query.ts
export class GetBudgetByIdQuery {
  constructor(public readonly id: string, public readonly userId: string) {}
}

// queries/get-budget-by-id.handler.ts
@QueryHandler(GetBudgetByIdQuery)
export class GetBudgetByIdHandler implements IQueryHandler<GetBudgetByIdQuery> {
  constructor(private readonly prisma: PrismaService) {}
  async execute(q: GetBudgetByIdQuery): Promise<BudgetDto | null> { /* ... */ }
}
```

Зарегистрировать handler в `providers` модуля. Потребитель вызывает
`queryBus.execute(new GetBudgetByIdQuery(id, userId))` (как `TransactionsService` обращается
к категориям). Чисто «безголовый» провайдер данных без HTTP — см. `UsersModule`
(контроллера и сервиса нет, только handlers в `providers`).

### Документация (обязательно)

- После изменения методов — обновлять **JSDoc**.
- Для DTO и контроллеров — добавлять/обновлять **Swagger**-декораторы.
- Обновить [api.md](api.md) и эндпоинты в `README.md` / `backend/CLAUDE.md`.

---

## Backend: добавить миграцию

При любом изменении `backend/prisma/schema.prisma`:

```bash
cd backend
# 1. Отредактировать schema.prisma (модель, поле, индекс, enum)
# 2. Создать и применить миграцию (имя — в snake_case, по смыслу изменения):
npm run prisma:migrate        # prisma migrate dev → спросит имя миграции
# 3. Prisma Client регенерируется автоматически; вручную при необходимости:
npm run prisma:generate
```

Что учесть при правке схемы:

- **Скоупинг по пользователю** — добавляй `userId` + связь с `User` и `onDelete: Cascade`.
- **Индексы** — `@@index([userId])` для выборок пользователя; составные (`@@index([userId, date])`)
  под конкретные фильтры.
- **Уникальность в пределах пользователя** — `@@unique([userId, name])` (как у `Category`).
- **Деньги** — `Decimal @db.Decimal(12, 2)`, в сервисе приводить к `number` в `toDto()`.

Миграции коммитятся вместе с кодом (каталог `prisma/migrations/`). Не редактируй уже
применённые миграции — создавай новую.

---

## Frontend: добавить фичу

Пример — фича `categories` (создание/листинг). FSD: импорты текут вниз
`app → views → widgets → features → entities → shared`.

### 1. Entity (если появляется новый бизнес-объект)

`src/entities/<entity>/model/types.ts` — типы данных:

```ts
export interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
}
```

### 2. API-обёртка (`features/<name>/api/<name>.api.ts`)

Типизированные вызовы поверх `shared/api/http` (`api.get`/`api.post` сами подставляют токен):

```ts
import { api } from '@/shared/api/http';
import type { Category } from '@/entities/category/model/types';

export const categoriesApi = {
  list: () => api.get<Category[]>('/categories'),
  create: (payload: { name: string; color: string; icon: string }) =>
    api.post<Category>('/categories', payload),
};
```

### 3. Модель: схемы и хуки (`features/<name>/model/`)

- `schemas.ts` — zod-схемы форм, тип через `z.infer`.
- `use-*.ts` — хуки, инкапсулирующие вызов API и состояние (`isPending`/`error`),
  как `use-create-transaction.ts`.

```ts
// model/schemas.ts
import { z } from 'zod';
export const categorySchema = z.object({
  name: z.string().min(1).max(50),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  icon: z.string().min(1),
});
export type CategoryFormValues = z.infer<typeof categorySchema>;
```

### 4. UI (`features/<name>/ui/`)

Компоненты на react-hook-form + `@hookform/resolvers/zod`, форма из `shared/ui/form.tsx` (shadcn).
Тосты — `sonner`. Новые shadcn-компоненты: `npx shadcn@latest add <component>` (попадут в `shared/ui/`).

### 5. Композиция и роут

- Сложную страницу собирай в `src/views/<page>/index.tsx` (и при необходимости в
  `src/widgets/*` — самостоятельные блоки).
- Роут — тонкий `src/app/.../page.tsx`, который рендерит соответствующий `views/*`.
  Защищённые страницы кладутся в группу `(protected)`, публичные — в `(auth)`.

### Про auth-состояние

- Сессия — Zustand `useAuthStore` (`features/auth/model/store.ts`), `persist`, ключ `auth`.
- Любая логика, зависящая от авторизации, должна ждать `_hasHydrated` перед проверкой
  `isAuthenticated` — иначе ложный редирект на первом рендере (см. `(protected)/layout.tsx`).

---

## Перед PR

```bash
npm run lint        # из корня — ESLint по всем workspace
npm run format      # Prettier
npm run build:backend && npm run build:frontend   # сборка проходит
git diff main...HEAD --stat                       # для описания PR
gh pr create        # title — Conventional Commits; body — Summary + Test plan
```

См. также [architecture.md](architecture.md), [api.md](api.md), [database.md](database.md).
