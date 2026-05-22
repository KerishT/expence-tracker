# План: авторизация по JWT с CQRS-взаимодействием Auth ↔ User

## Контекст

В `backend/` сейчас голый каркас NestJS 11 (только `AppModule`/`AppController`/`AppService`),
пустая Prisma-схема и отсутствует какая-либо инфраструктура аутентификации.
Нужно добавить:

- модуль `User` с полями `name`, `email`, `passwordHash`;
- модуль `Auth` с эндпоинтами `POST /api/auth/register` и `POST /api/auth/login`, выдающими JWT;
- взаимодействие модулей **только через CQRS** (`@nestjs/cqrs`) — без прямых импортов
  `UserService`/репозиториев из `AuthModule`. `AuthModule` не должен импортировать `UserModule`,
  и наоборот. Общими остаются только `CqrsModule` (для шины) и `PrismaModule` (инфраструктура).

Решения, согласованные с пользователем:
- хэширование — `bcrypt`;
- валидация DTO — `class-validator` + `class-transformer`, глобальный `ValidationPipe`;
- `PrismaService` живёт в глобальном `PrismaModule` (`@Global()`).

## Чек-лист задач

### Подготовка
- [x] Установить зависимости в `backend/`:
  ```bash
  npm i @nestjs/cqrs @nestjs/jwt @nestjs/passport @nestjs/config \
        passport passport-jwt bcrypt class-validator class-transformer
  npm i -D @types/passport-jwt @types/bcrypt
  ```
- [x] Добавить в `backend/.env.example`: `JWT_SECRET=`, `JWT_EXPIRES_IN=1d`.
- [x] Создать локальный `backend/.env` со значениями.

### Prisma
- [x] В `prisma/schema.prisma` добавить модель `User`:
  ```prisma
  model User {
    id           String   @id @default(uuid())
    email        String   @unique
    name         String
    passwordHash String
    createdAt    DateTime @default(now())
    updatedAt    DateTime @updatedAt
  }
  ```
- [ ] `docker compose up -d` (если ещё не запущено).
- [ ] `npm run prisma:migrate -- --name add-user` (требует запущенного Docker).

### PrismaModule (глобальный)
- [x] `src/prisma/prisma.service.ts` — `extends PrismaClient implements OnModuleInit`, `$connect` в `onModuleInit`.
- [x] `src/prisma/prisma.module.ts` — `@Global()`, `providers: [PrismaService]`, `exports: [PrismaService]`.

### UsersModule
- [x] `src/users/users.module.ts` — `imports: [CqrsModule]`, `providers: [...CommandHandlers, ...QueryHandlers]`. **Не импортирует** AuthModule.
- [x] `src/users/domain/user.dto.ts` — внешний `UserDto { id, email, name }` (без `passwordHash`).
- [x] `src/users/commands/create-user.command.ts` — `class CreateUserCommand { email, name, passwordHash }`.
- [x] `src/users/commands/create-user.handler.ts` — `@CommandHandler`, инжектит `PrismaService`, `prisma.user.create`, возвращает `UserDto`. На Prisma `P2002` — `ConflictException`.
- [x] `src/users/queries/get-user-by-email.query.ts` — `{ email }`.
- [x] `src/users/queries/get-user-by-email.handler.ts` — возвращает `{ id, email, name, passwordHash } | null` (внутренний контракт для Auth).
- [x] `src/users/queries/get-user-by-id.query.ts`.
- [x] `src/users/queries/get-user-by-id.handler.ts` — возвращает `UserDto | null`.

### AuthModule
- [x] `src/auth/auth.module.ts` — `imports: [CqrsModule, PassportModule, JwtModule.registerAsync({...})]`. **Не импортирует** UsersModule.
- [x] `src/auth/dto/register.dto.ts` — `@IsEmail`, `@IsString`, `@MinLength(8)` для пароля.
- [x] `src/auth/dto/login.dto.ts` — `@IsEmail`, `@IsString`.
- [x] `src/auth/auth.service.ts` — инжектит `CommandBus`, `QueryBus`, `JwtService`:
  - `register`: `QueryBus.execute(GetUserByEmailQuery)` → 409 если найден; `bcrypt.hash`; `CommandBus.execute(CreateUserCommand)`; подписать JWT.
  - `login`: `QueryBus.execute(GetUserByEmailQuery)`; `bcrypt.compare` → 401 при неудаче; подписать JWT.
- [x] `src/auth/auth.controller.ts` — `@Controller('auth')`, `POST register`, `POST login`.
- [x] `src/auth/strategies/jwt.strategy.ts` — `PassportStrategy(Strategy)`, `validate(payload)` через `QueryBus.execute(GetUserByIdQuery)`.
- [x] `src/auth/guards/jwt-auth.guard.ts` — `AuthGuard('jwt')`.

### AppModule / main.ts
- [x] `app.module.ts`: `ConfigModule.forRoot({ isGlobal: true })`, `CqrsModule.forRoot()`, `PrismaModule`, `UsersModule`, `AuthModule`.
- [x] `main.ts`: `app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }))`.

### Архитектурный инвариант (CQRS вместо прямых импортов)

`AuthService` импортирует из `users/` **только** классы команд/запросов (`*.command.ts`, `*.query.ts`) —
это payload-контракты шины, аналог DTO. Сервисы, репозитории, модуль User в `auth/` не импортируются.
`UsersModule` про `auth/` ничего не знает.

### Верификация
- [ ] `npm run start:dev` стартует без ошибок (требует Docker + миграции).
- [ ] `POST /api/auth/register` → `{ accessToken, user: { id, email, name } }`; `passwordHash` отсутствует в ответе.
- [ ] Повторный `register` с тем же email → `409 Conflict`.
- [ ] `POST /api/auth/login` с верным паролем → `{ accessToken, user }`.
- [ ] `login` с неверным паролем → `401 Unauthorized`.
- [ ] `register` с невалидным email или паролем < 8 символов → `400 Bad Request`.
- [x] `grep -R "from '.*users" backend/src/auth` показывает только импорты `*.command` / `*.query` / `user.dto`.
- [x] `grep -R "from '.*auth" backend/src/users` пуст.
