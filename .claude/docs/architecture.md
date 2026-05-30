# Архитектура

## Обзор

Expense Tracker — монорепозиторий на **npm workspaces** из двух приложений:

- **`frontend/`** — Next.js 16 (App Router), архитектура Feature Slice Design, порт **3000**.
- **`backend/`** — NestJS 11 + Prisma 6 + PostgreSQL, порт **3001**, глобальный префикс **`/api`**.

Фронт общается с бэком по относительным `/api/*`. `frontend/next.config.ts` через
`rewrites()` проксирует их на `http://localhost:3001/api/*` — единый origin, CORS не возникает.

```
Браузер ──/api/*──▶ Next.js (3000) ──rewrites──▶ NestJS (3001) ──Prisma──▶ PostgreSQL (5432)
```

Аутентификация — JWT в заголовке `Authorization: Bearer`. Бэк отдаёт `{ accessToken, user }`,
фронт хранит сессию в Zustand (`persist`, localStorage-ключ `auth`).

---

## Backend

### Слои внутри доменного модуля

Каждый домен живёт в `backend/src/<module>/`:

```
src/<module>/
  <module>.controller.ts   # HTTP-роуты (тонкие; делегируют в сервис)
  <module>.service.ts      # бизнес-логика
  <module>.module.ts       # DI-описание модуля
  dto/                     # входные DTO (class-validator) — форма запросов
  domain/<name>.dto.ts     # доменный DTO — форма данных наружу (без userId/hash)
  commands/                # CQRS-команды (мутации):  *.command.ts + *.handler.ts
  queries/                 # CQRS-запросы (чтение):   *.query.ts   + *.handler.ts
```

Поток данных запроса:

```
HTTP → Controller → Service → (Prisma | CQRS-шина к чужому модулю) → toDto() → ответ
```

### Состав `AppModule`

`backend/src/app.module.ts` подключает:

- `ConfigModule.forRoot({ isGlobal: true })` — env-конфигурация глобально.
- `CqrsModule.forRoot()` — шина команд/запросов.
- `PrismaModule` — `@Global`, экспортирует `PrismaService` всем модулям.
- `UsersModule`, `AuthModule`, `CategoriesModule`, `TransactionsModule` — домены.

`backend/src/main.ts`: `setGlobalPrefix('api')`, глобальный
`ValidationPipe({ whitelist: true, transform: true })`, Swagger UI на **`/api/docs`**.

### Модули

| Модуль              | Controller | Service | Назначение |
| ------------------- | :--------: | :-----: | ---------- |
| `UsersModule`       | нет        | нет     | Только CQRS-handlers: создание/чтение пользователей. Не имеет публичных HTTP-роутов. |
| `AuthModule`        | да         | да      | `register`/`login`, выпуск JWT, `JwtStrategy`, `JwtAuthGuard`. |
| `CategoriesModule`  | да         | да      | CRUD категорий + handler `GetCategoryByIdQuery` для других модулей. |
| `TransactionsModule`| да         | да      | CRUD транзакций + агрегированная сводка. |
| `PrismaModule`      | —          | —       | `@Global`-провайдер `PrismaService` (обёртка над `PrismaClient`). |

### CQRS-паттерн

CQRS используется **как граница между модулями**, а не повсеместно. Модуль публикует
доступ к своим данным только через команды/запросы на шине — другие модули **не обращаются
к чужим таблицам напрямую**.

- **`UsersModule`** не имеет контроллера и сервиса. Наружу торчат только handlers:
  - `CreateUserCommand` (мутация) → `CreateUserHandler`.
  - `GetUserByEmailQuery` / `GetUserByIdQuery` (чтение) → соответствующие handlers.
- **`AuthModule`** оркеструет user-данные через `CommandBus`/`QueryBus`
  (`commandBus.execute(new CreateUserCommand(...))`), не трогая Prisma для users напрямую.
- **`TransactionsService`** перед записью валидирует пользователя и категорию через
  `queryBus.execute(new GetUserByIdQuery(...))` / `GetCategoryByIdQuery`, а с собственной
  таблицей `transaction` работает через Prisma напрямую.

Анатомия:

- **Query / Command** — простой класс-носитель аргументов в конструкторе (`readonly`).
- **Handler** — класс с `@QueryHandler(Query)` / `@CommandHandler(Command)`, реализует
  `execute(query)`, внедряет `PrismaService`. Регистрируется в `providers` своего модуля.

```ts
// query — носитель аргументов
export class GetCategoryByIdQuery {
  constructor(public readonly id: string, public readonly userId: string) {}
}

// handler — исполнитель на шине
@QueryHandler(GetCategoryByIdQuery)
export class GetCategoryByIdHandler implements IQueryHandler<GetCategoryByIdQuery> {
  constructor(private readonly prisma: PrismaService) {}
  async execute(query: GetCategoryByIdQuery): Promise<CategoryDto | null> { /* ... */ }
}
```

### Auth (JWT)

- `JwtModule.registerAsync` берёт `JWT_SECRET` / `JWT_EXPIRES_IN` из `ConfigService`.
- `JwtStrategy` (`passport-jwt`): токен из `Authorization: Bearer`; в `validate(payload)`
  подтягивает пользователя через `GetUserByIdQuery` и кладёт `UserDto` в `req.user`.
- Защита роутов — `@UseGuards(JwtAuthGuard)` на контроллере. Внутри:
  `@Req() req: Request & { user: UserDto }`, текущий пользователь — `req.user.id`.
- Пароли хешируются `bcrypt` (10 раундов). Payload токена: `{ sub: user.id, email }`.

### Скоупинг и DTO-конвенции

- **Все** данные (кроме `/auth/*`) скоупятся по `req.user.id` — пользователь видит только своё.
- Сервисы возвращают **domain DTO** (`domain/*.dto.ts`), не Prisma-модели; маппинг — в
  приватном `toDto()`. `Decimal` суммы приводятся к `number`, служебные поля
  (`userId`, `passwordHash`) наружу не попадают.
- Входные DTO — в `dto/`, валидируются `class-validator`; `UpdateDto` строится через
  `PartialType` (`@nestjs/mapped-types`).
- Ошибки — стандартные Nest-исключения: `NotFoundException`, `ConflictException`,
  `UnauthorizedException`. Конфликт уникальности Prisma (`P2002`) → `ConflictException`.

---

## Frontend

### Feature Slice Design

`frontend/src/` — слои FSD поверх Next.js App Router. Импорты текут **только вниз**:

```
app → views → widgets → features → entities → shared
```

Слой не импортирует из равного или вышестоящего.

```
src/
  app/        # Next.js App Router — ТОЛЬКО роутинг (тонкие page.tsx/layout.tsx)
  views/      # FSD-слой "pages" (переименован, чтобы не конфликтовать с Next). Композиции страниц.
  widgets/    # Самостоятельные UI-блоки (app-sidebar, summary-cards, recent-transactions)
  features/   # Пользовательские сценарии: auth, transactions, categories. Внутри — api/ model/ ui/
  entities/   # Бизнес-объекты: user, category, transaction (model/types.ts)
  shared/     # Инфраструктура: api/ (http.ts), config/, lib/, ui/ (shadcn), hooks/
```

Внутри feature-слайса: `api/` (вызовы бэка), `model/` (стор, хуки, zod-схемы), `ui/` (компоненты).
`src/app/` содержит только роутинг: `page.tsx` рендерит соответствующий `views/*`.

### Роутинг и группы

- `(auth)` — публичные: `/login`, `/register`.
- `(protected)` — защищённые: `/dashboard`, `/transactions`, `/categories`.
  `(protected)/layout.tsx` — client-компонент: рендерит `AppSidebar` + `main`, редиректит
  на `/login`, если не авторизован.

**Гидрация:** стор поднимает токен из `localStorage` асинхронно. `layout.tsx` ждёт флаг
`_hasHydrated` (возвращает `null` до гидрации) и только потом проверяет `isAuthenticated` —
иначе будет ложный редирект на первом рендере.

### Сетевой слой

- Единственная точка fetch — `shared/api/http.ts`: экспортирует `api.get<T>` / `api.post<T>`.
  Сам подставляет `Authorization: Bearer <token>` (из `storage.getToken()`), сериализует body,
  парсит ошибки (`message` массивом или строкой) в `Error & { status }`.
- `API_BASE = '/api'` (`shared/config`).
- Feature-уровень: `features/<name>/api/<name>.api.ts` — типизированные обёртки над `api`
  (напр. `transactionsApi.list/create`). Компоненты вызывают их через хуки в `model/`.

### Состояние и формы

- **Zustand** + `persist`: `features/auth/model/store.ts`, ключ `auth`, `partialize` сохраняет
  `{ token, user, isAuthenticated }`. `setSession()` пишет сессию, `logout()` чистит,
  `_hasHydrated`/`setHydrated` — отметка завершения регидрации (`onRehydrateStorage`).
- `shared/lib/storage.ts` читает токен из той же persisted-структуры (`{ state: { token } }`) —
  используется в `http.ts`, где нет доступа к React-хукам.
- **Формы**: react-hook-form + zod через `@hookform/resolvers/zod`. Схемы — в
  `features/<name>/model/schemas.ts`, тип значений через `z.infer`. UI — `shared/ui/form.tsx` (shadcn).
- **UI**: shadcn/ui в `shared/ui/` (style `base-nova`, реестр `@base-ui/react`, иконки
  `lucide-react`). `cn()` из `shared/lib/utils` — слияние классов. Тосты — `sonner`.

---

## Связанные документы

- [api.md](api.md) — полный справочник эндпоинтов.
- [database.md](database.md) — схема БД и назначение полей.
- [dev-guide.md](dev-guide.md) — как добавить модуль, фичу, миграцию.
