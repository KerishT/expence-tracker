# Frontend

Next.js 16 (App Router) + React 19 + Tailwind CSS 4 + TypeScript. Архитектура — Feature Slice Design.

## Commands

```bash
npm run dev                 # next dev (по умолчанию :3000)
npm run build               # next build
npm run start               # next start (prod)
npm run lint                # eslint . (flat config, eslint-config-next)
```

Path alias: `@/*` → `src/*`.

## Architecture (Feature Slice Design)

`frontend/src/` follows **Feature Slice Design** layered on top of Next.js App Router.

```
src/
  app/          # Next.js App Router — routing only (thin page.tsx/layout.tsx files)
  views/        # FSD "pages" layer (renamed to avoid conflict with Next). Page compositions.
  widgets/      # Independent UI blocks composed of features/entities
  features/     # User interactions: auth, transactions, categories. Each has api/, model/, ui/
  entities/     # Business objects: user, category, transaction (model/types.ts)
  shared/       # Reusable infrastructure
    api/        # fetch wrapper (http.ts) + response types (types.ts)
    config/     # constants (API_BASE = '/api')
    lib/        # utils (cn), storage (token helper), format (даты/суммы)
    ui/         # shadcn/ui components (button, input, card, form, dialog, select, sonner, label)
    hooks/      # shared React hooks
```

**Rules:**
- Imports flow **downward only**: `app → views → widgets → features → entities → shared`. Слой не импортирует из равного или вышестоящего.
- `src/app/` — только роутинг, без бизнес-логики. `page.tsx` рендерит соответствующий `views/*`.
- Внутри feature-слайса: `api/` (вызовы бэка), `model/` (стор, хуки, zod-схемы), `ui/` (компоненты).

## Routing

App Router с route-группами:
- `(auth)` — публичные: `/login`, `/register`.
- `(protected)` — защищённые: `/dashboard`, `/transactions`, `/categories`. `(protected)/layout.tsx` — client-компонент, рендерит `AppSidebar` + `main`, редиректит на `/login`, если не авторизован.

**Гидрация:** стор поднимает токен из `localStorage` асинхронно. `layout.tsx` ждёт флаг `_hasHydrated` (возвращает `null` до гидрации), и только потом проверяет `isAuthenticated` — иначе будет ложный редирект на первом рендере. Учитывать это в любой логике, зависящей от auth-состояния.

## API calls

- Относительные пути `/api/*`. `next.config.ts` через `rewrites()` проксирует их на `http://localhost:3001/api/*` — CORS не возникает.
- Единственная точка fetch — `shared/api/http.ts`: экспортирует `api.get<T>` / `api.post<T>`. Сам подставляет `Authorization: Bearer <token>` (из `storage.getToken()`), сериализует body, парсит ошибки (`message` массивом или строкой) в `Error & { status }`.
- Слой feature: `features/<name>/api/<name>.api.ts` — типизированные обёртки над `api` (напр. `transactionsApi.list/create`). Компоненты вызывают их через хуки в `model/` (`use-create-transaction.ts` хранит `isPending`/`error`).

## Auth state

- **Zustand** + `persist` middleware: `features/auth/model/store.ts`, ключ localStorage `auth`, `partialize` сохраняет `{ token, user, isAuthenticated }`.
- `setSession(response)` пишет сессию, `logout()` чистит. `_hasHydrated` / `setHydrated` — отметка завершения регидрации (`onRehydrateStorage`).
- `shared/lib/storage.ts` читает токен из той же persisted-структуры (`{ state: { token } }`) — используется в `http.ts`, где нет доступа к React-хукам.

## Forms

- **react-hook-form** + **zod** через `@hookform/resolvers/zod`. Схемы — в `features/<name>/model/schemas.ts`, тип значений выводится через `z.infer`.
- UI формы — компоненты `shared/ui/form.tsx` (shadcn) поверх RHF.

## UI / shadcn

- Компоненты shadcn живут в `shared/ui/`. Добавлять: `npx shadcn@latest add <component>` (алиасы настроены в `components.json`, style `base-nova`, реестр `@base-ui/react`, иконки `lucide-react`).
- `cn()` из `shared/lib/utils` — слияние классов (`clsx` + `tailwind-merge`).
- Тосты — `sonner`. Tailwind CSS 4 (через `@tailwindcss/postcss`), глобальные стили в `src/app/globals.css`.
