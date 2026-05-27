# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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
npm run dev:backend         # NestJS watch mode
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

### Prisma (run from backend/)
```bash
npm run prisma:generate     # Generate Prisma client
npm run prisma:migrate      # Run migrations
```

### Install Dependencies
```bash
npm install                 # From root — installs all workspaces
```

## Branching (GitHub Flow)

- `main` — всегда стабильная, деплоится напрямую. Не коммитить напрямую.
- Любая новая работа — отдельная ветка от `main`: `feature/<name>`, `fix/<name>`, `chore/<name>`
- Ветка → PR → review → merge в `main` → удалить ветку

## Commits

Conventional Commits: `<type>(<scope>): <subject>` — lowercase, imperative, no dot.
Types: `feat`, `fix`, `refactor`, `chore`, `docs`, `test`.

## Architecture

- `frontend/` — Next.js App Router. Entry: `src/app/layout.tsx`, `src/app/page.tsx`. Path alias `@/*` maps to `src/*`.
  - Route groups: `(auth)` — публичные страницы (login, register); `(protected)` — защищённые (dashboard и др.), `layout.tsx` проверяет токен.
- `backend/` — NestJS. Entry: `src/main.ts`. API prefix `/api`, port 3001. Prisma schema in `prisma/schema.prisma`.
  - Auth: JWT (`@nestjs/jwt` + `passport-jwt`). Защищённые роуты используют `JwtAuthGuard`.
  - Backend-модули (`users`, `categories`, `transactions`) следуют CQRS-подобному паттерну: `commands/` (мутации), `queries/` (чтение), `domain/` (DTO доменного слоя).
- `docker-compose.yml` — PostgreSQL 16 (db: `expence_tracker`, user/pass: `postgres/postgres`).
- Database URL configured via `DATABASE_URL` env var (see `backend/.env.example`).

## Frontend Architecture (Feature Slice Design)

`frontend/src/` follows **Feature Slice Design** layered on top of Next.js App Router.

```
src/
  app/          # Next.js App Router — routing only (thin page.tsx/layout.tsx files)
  views/        # FSD "pages" layer (renamed to avoid conflict with Next). Page compositions.
  widgets/      # Independent UI blocks composed of features/entities
  features/     # User interactions: auth, expenses, etc. Each has api/, model/, ui/
  entities/     # Business objects: user, category, expense (model/types.ts)
  shared/       # Reusable infrastructure
    api/        # fetch wrapper (http.ts) + response types
    config/     # constants (API_BASE)
    lib/        # utils (cn), storage (localStorage token helpers)
    ui/         # shadcn/ui components (button, input, card, form, sonner, …)
    hooks/      # shared React hooks
```

**Rules:**
- Imports flow **downward only**: `app → views → widgets → features → entities → shared`.
- `src/app/` contains only routing — no business logic.
- shadcn components live in `shared/ui/`. Add with `npx shadcn@latest add <component>` (aliases already configured in `components.json`).
- Auth state: **Zustand** store with `persist` middleware (`features/auth/model/store.ts`).
- Forms: **react-hook-form** + **zod** (`@hookform/resolvers/zod`).
- API calls: relative `/api/*` paths — Next rewrites proxy them to `http://localhost:3001/api/*` (no CORS issues).
