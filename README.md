# Expense Tracker

Веб-приложение для учёта личных доходов и расходов. Пользователь регистрируется,
создаёт категории, добавляет транзакции (доход/расход) и видит сводку за выбранный
месяц: суммарный доход, расход и баланс.

Монорепозиторий на npm workspaces: Next.js-фронтенд и NestJS-бэкенд в одном репозитории.

## Стек

| Слой       | Технологии                                                                 |
| ---------- | -------------------------------------------------------------------------- |
| Frontend   | Next.js 16 (App Router), React 19, Tailwind CSS 4, TypeScript, Zustand, react-hook-form + zod, shadcn/ui |
| Backend    | NestJS 11, Prisma 6, PostgreSQL 16, TypeScript, JWT (passport-jwt), CQRS (`@nestjs/cqrs`) |
| Инфра      | npm workspaces, Docker Compose, Swagger (OpenAPI)                          |

Архитектура фронтенда — Feature Slice Design. Бэкенд — доменные модули с CQRS-границей
между ними. Подробности: [`frontend/CLAUDE.md`](frontend/CLAUDE.md), [`backend/CLAUDE.md`](backend/CLAUDE.md).

## Требования

- **Node.js** ≥ 22 (разработка велась на 22.20)
- **npm** ≥ 10 (workspaces)
- **Docker** + Docker Compose (для PostgreSQL)

## Быстрый старт

### 1. Установка зависимостей

Из корня репозитория — устанавливает зависимости всех workspace сразу:

```bash
git clone https://github.com/KerishT/expence-tracker.git
cd expence-tracker
npm install
```

### 2. Переменные окружения

Бэкенду нужен `.env` в каталоге `backend/`. Скопируйте пример и задайте секрет JWT:

```bash
cp backend/.env.example backend/.env
```

```env
# backend/.env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/expence_tracker"
JWT_SECRET=<любая_случайная_строка>
JWT_EXPIRES_IN=1d
```

| Переменная       | Назначение                                              |
| ---------------- | ------------------------------------------------------- |
| `DATABASE_URL`   | Строка подключения к PostgreSQL                         |
| `JWT_SECRET`     | Секрет подписи JWT (обязателен, иначе бэк не стартует)  |
| `JWT_EXPIRES_IN` | TTL токена: `1d`, `12h`, `3600s` и т.п.                 |

Фронтенду отдельный `.env` не требуется: запросы идут на относительные `/api/*` и
проксируются на бэкенд через `rewrites()` в `frontend/next.config.ts`.

### 3. База данных и миграции

Поднять PostgreSQL в Docker:

```bash
docker compose up -d
```

Применить миграции Prisma (из каталога бэкенда):

```bash
npm run prisma:migrate --workspace=backend
```

> Команда `npm run dev:backend` (см. ниже) делает это автоматически: поднимает Docker,
> прогоняет миграции и стартует watch-режим.

### 4. Запуск dev-серверов

В двух терминалах:

```bash
npm run dev:backend     # Docker up + миграции + NestJS watch → http://localhost:3001
npm run dev:frontend    # Next.js dev server → http://localhost:3000
```

Откройте http://localhost:3000. Swagger-документация API — на бэкенде по адресу
http://localhost:3001/api/docs.

## Полезные команды

Все запускаются из корня репозитория.

```bash
# Разработка
npm run dev:frontend        # Next.js dev server (:3000)
npm run dev:backend         # Docker + миграции + NestJS watch (:3001)
docker compose up -d        # Только PostgreSQL (:5432)

# Сборка
npm run build:frontend
npm run build:backend

# Качество кода
npm run lint                # ESLint по всем workspace
npm run format              # Prettier по всем файлам

# Prisma (из backend/)
npm run prisma:generate --workspace=backend
npm run prisma:migrate  --workspace=backend
```

## Структура проекта

```
expence-tracker/
├── docker-compose.yml        # PostgreSQL 16 (db: expence_tracker, postgres/postgres, :5432)
├── package.json              # npm workspaces + корневые скрипты
│
├── frontend/                 # Next.js (App Router), Feature Slice Design, :3000
│   └── src/
│       ├── app/              # Роутинг App Router: (auth) и (protected) группы
│       ├── views/            # FSD-слой "pages" — композиции страниц
│       ├── widgets/          # Самостоятельные UI-блоки
│       ├── features/         # auth, transactions, categories (api/ model/ ui/)
│       ├── entities/         # Бизнес-объекты: user, category, transaction
│       └── shared/           # api (fetch-обёртка), config, lib, ui (shadcn), hooks
│
└── backend/                  # NestJS, префикс /api, :3001
    ├── prisma/
    │   ├── schema.prisma     # Модели User, Category, Transaction
    │   └── migrations/
    └── src/
        ├── main.ts           # Bootstrap, ValidationPipe, Swagger
        ├── prisma/           # PrismaModule / PrismaService
        ├── auth/             # JWT: register/login, JwtStrategy, JwtAuthGuard
        ├── users/            # Без контроллера — только CQRS handlers
        ├── categories/       # CRUD категорий
        └── transactions/     # CRUD транзакций + сводка
```

Каждый доменный модуль бэкенда: `*.controller.ts`, `*.service.ts`, `*.module.ts`,
`dto/` (входные DTO), `domain/*.dto.ts` (выходные DTO), `commands/`, `queries/` (CQRS).

## Основные эндпоинты

База — `http://localhost:3001/api`. Все запросы, кроме `/auth/*`, требуют заголовок
`Authorization: Bearer <accessToken>`. Данные скоупятся по текущему пользователю.

### Auth

| Метод | Путь             | Описание                                        |
| ----- | ---------------- | ----------------------------------------------- |
| POST  | `/auth/register` | Регистрация. Возвращает `{ accessToken, user }` |
| POST  | `/auth/login`    | Вход. Возвращает `{ accessToken, user }`        |

### Categories

| Метод  | Путь               | Описание                       |
| ------ | ------------------ | ------------------------------ |
| POST   | `/categories`      | Создать категорию              |
| GET    | `/categories`      | Список категорий пользователя  |
| GET    | `/categories/:id`  | Категория по id                |
| PATCH  | `/categories/:id`  | Обновить категорию             |
| DELETE | `/categories/:id`  | Удалить категорию (204)        |

### Transactions

| Метод  | Путь                 | Описание                                          |
| ------ | -------------------- | ------------------------------------------------- |
| POST   | `/transactions`      | Создать транзакцию                                |
| GET    | `/transactions`      | Список + сводка. Фильтры `?year=&month=`          |
| GET    | `/transactions/:id`  | Транзакция по id                                  |
| PATCH  | `/transactions/:id`  | Обновить транзакцию                               |
| DELETE | `/transactions/:id`  | Удалить транзакцию (204)                          |

`GET /transactions` возвращает `{ items, summary: { totalIncome, totalExpense, balance } }`.

Полная интерактивная документация (модели запросов/ответов) доступна в Swagger UI:
**http://localhost:3001/api**.
