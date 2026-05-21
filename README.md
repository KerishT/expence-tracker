# Expense Tracker

Приложение для учёта личных расходов. Монорепозиторий с Next.js-фронтендом и NestJS-бэкендом.

## Стек

| Слой | Технологии |
|---|---|
| Frontend | Next.js 16 (App Router), React 19, Tailwind CSS 4, TypeScript |
| Backend | NestJS 11, Prisma 6, PostgreSQL 16, TypeScript |
| Инфраструктура | Docker Compose, npm workspaces |

## Требования

- Node.js 20+
- Docker + Docker Compose

## Быстрый старт

```bash
# 1. Клонировать репозиторий
git clone https://github.com/KerishT/expence-tracker.git
cd expence-tracker

# 2. Установить зависимости
npm install

# 3. Настроить переменные окружения
cp backend/.env.example backend/.env

# 4. Поднять базу данных
docker compose up -d

# 5. Применить миграции
cd backend && npm run prisma:migrate

# 6. Запустить приложение
cd ..
npm run dev:frontend   # http://localhost:3000
npm run dev:backend    # http://localhost:3001
```

## Структура проекта

```
expence-tracker/
├── frontend/          # Next.js приложение
│   └── src/app/       # App Router страницы и layout
├── backend/           # NestJS приложение
│   ├── src/           # Исходный код
│   └── prisma/        # Схема и миграции БД
├── docker-compose.yml # PostgreSQL
└── package.json       # Корневой workspace
```

## Команды

```bash
npm run dev:frontend      # Next.js dev-сервер
npm run dev:backend       # NestJS в режиме watch
npm run build:frontend    # Сборка фронтенда
npm run build:backend     # Сборка бэкенда
npm run lint              # Линтинг всех workspace-ов
npm run format            # Prettier по всем файлам
```

### Prisma (из директории `backend/`)

```bash
npm run prisma:generate   # Генерация Prisma Client
npm run prisma:migrate    # Запуск миграций
```

## Переменные окружения

`backend/.env`:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/expence_tracker"
```
