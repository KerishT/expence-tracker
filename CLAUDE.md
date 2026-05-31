# Expense Tracker

## Project Overview

Expense Tracker — monorepo with npm workspaces containing a Next.js frontend and NestJS backend.

## Tech Stack

- **Frontend**: Next.js 16 (App Router), React 19, Tailwind CSS 4, TypeScript
- **Backend**: NestJS 11, Prisma 6, PostgreSQL, TypeScript
- **Package Manager**: npm workspaces (root `package.json` defines `frontend` and `backend` workspaces)

## Commands

### Development
```bash
npm run dev:frontend        # Next.js dev server
npm run dev:backend         # Docker up + migrations + NestJS watch mode
docker compose up -d        # Start PostgreSQL on port 5432
```

### Build
```bash
npm run build:frontend
npm run build:backend
```

### Linting & Formatting
```bash
npm run lint                # Lint all workspaces
npm run format              # Prettier across all files
```

### Install Dependencies
```bash
npm install                 # From root — installs all workspaces
```

## Branching (GitHub Flow)

- `main` — всегда стабильная, деплоится напрямую. Не коммитить напрямую.
- Любая новая работа — отдельная ветка от `main`: `feature/<name>`, `fix/<name>`, `chore/<name>`
- Ветка → PR → review → merge в `main` → удалить ветку

## Pull Requests

- Title — Conventional Commits: `<type>(<scope>): <subject>`.
- Body обязательно содержит: **Summary** (что реализовано, затронутые endpoints/модули), **Test plan** (шаги для проверки вручную).
- PR создавать через `gh pr create`; перед созданием запустить `git diff main...HEAD --stat` для составления описания.
- После merge ветку удалять: `git branch -d <branch> && git push origin --delete <branch>`.

## Architecture

Монорепо из двух workspace. Детали каждого — в собственных файлах:

- **`frontend/`** — Next.js App Router (port 3000), Feature Slice Design. См. `frontend/CLAUDE.md`.
- **`backend/`** — NestJS (port 3001, префикс `/api`), Prisma + Postgres, JWT, CQRS-подобные модули. См. `backend/CLAUDE.md`.

**Cross-cutting:**
- Фронт обращается к бэку по относительным `/api/*`; `frontend/next.config.ts` через `rewrites()` проксирует их на `http://localhost:3001/api/*` — единый origin, без CORS.
- Auth — JWT в заголовке `Authorization: Bearer`. Бэк отдаёт `{ accessToken, user }`, фронт хранит сессию в Zustand (`persist`, localStorage ключ `auth`).
- `docker-compose.yml` — PostgreSQL 16 (db: `expence_tracker`, user/pass: `postgres/postgres`, порт 5432).
- БД-подключение и JWT-секрет — через env (`DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`), см. `backend/.env.example`.
- `npm run dev:backend` (из корня) сам поднимает Docker, прогоняет миграции и стартует watch-режим.

## Documents
При добавлении функционала проверяй .claude/docs/*.
Актуализируй файлы при изменении архитектуры или API.
