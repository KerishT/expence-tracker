# План: фронтенд страницы логина и регистрации (Next.js + shadcn/ui + FSD)

## Контекст

`frontend/` — Next.js 16 (App Router) + React 19 + Tailwind 4 (CSS-based config),
path-алиас `@/* -> src/*`. Бэкенд auth-API готов:

- `POST /api/auth/register` — body `{ email, name, password }` (password ≥ 8), ответ `{ accessToken, user: { id, email, name } }`.
- `POST /api/auth/login` — body `{ email, password }`, ответ тот же.
- Токен возвращается **в теле** (не cookie), живёт 1 день. Эндпоинта `/me` нет — `user` приходит при логине/регистрации.
- CORS на бэкенде выключен, порт `3001`, префикс `/api`.

Решения, согласованные с пользователем:
- **Хранение токена**: `localStorage` + клиентский guard (без серверной защиты роутов/SSR-доступа к токену).
- **CORS**: Next rewrites-прокси — фронт обращается к `/api/*`, Next проксирует на `http://localhost:3001/api/*`. Бэкенд не трогаем.
- **State**: Zustand с `persist` в localStorage.

### Нюансы реализации (обнаружены в процессе)

- shadcn 4.8 использует `@base-ui/react` вместо `@radix-ui`. Компонент `form` shadcn не сгенерировал автоматически — создан вручную. Для `FormControl` (Slot-поведение) установлен `@radix-ui/react-slot` отдельно.
- `next lint` удалён в Next.js 16. Проверка типов: `npx tsc --noEmit`.
- `ThemeProvider` из `next-themes` добавлен в root layout — нужен для `sonner.tsx`, который использует `useTheme()`.
- `.env.local` не создан — `API_BASE = '/api'` хранится как константа в `shared/config/index.ts`.
- **Баг (исправлен):** `shared/lib/storage.ts` читал ключ `'access_token'`, но Zustand persist кладёт состояние под ключ `'auth'` как JSON `{ state: { token, user, isAuthenticated }, version }`. `storage.getToken()` возвращал `null` → Authorization header не отправлялся. Исправлено: `storage.ts` теперь читает `localStorage['auth'].state.token`.

## Архитектура (FSD поверх Next App Router)

```
frontend/src/
  app/                          # Next App Router — только роутинг
    layout.tsx                  # ThemeProvider + Toaster (sonner)
    page.tsx                    # главная страница (заглушка)
    (auth)/
      login/page.tsx
      register/page.tsx
    (protected)/
      layout.tsx                # client AuthGuard
      dashboard/page.tsx        # плейсхолдер
  views/                        # FSD «pages»
    login/index.tsx
    register/index.tsx
  features/
    auth/
      api/auth.api.ts
      model/schemas.ts
      model/store.ts
      model/use-login.ts
      model/use-register.ts
      ui/LoginForm.tsx
      ui/RegisterForm.tsx
  entities/
    user/model/types.ts
  shared/
    api/http.ts                 # fetch-обёртка с Authorization Bearer
    api/types.ts                # AuthResponse
    config/index.ts             # API_BASE = '/api'
    lib/utils.ts                # cn() — shadcn
    lib/storage.ts              # localStorage токен (ключ 'access_token')
    ui/                         # button, card, form, input, label, sonner
```

Импорты строго вниз: `app → views → features → entities → shared`.

## Чек-лист задач

### Подготовка зависимостей
- [x] `npm i zustand react-hook-form zod @hookform/resolvers @radix-ui/react-slot`
- [x] Инициализировать shadcn (`npx shadcn@latest init --defaults`). Использует `@base-ui/react`, Tailwind v4, CSS-variables.
- [x] Обновить `components.json`: алиасы на FSD-пути (`shared/ui`, `shared/lib`, `shared/lib/utils`, `shared/hooks`).
- [x] Добавить компоненты: `button`, `input`, `label`, `card`, `sonner`. Компонент `form` — создан вручную (`src/shared/ui/form.tsx`).
- [x] Убедиться, что shadcn прописал theme-токены в `globals.css` (`@theme inline { ... }`). ✓

### Конфигурация
- [x] `frontend/next.config.ts` — rewrites: `'/api/:path*' → 'http://localhost:3001/api/:path*'`.
- [x] `shared/config/index.ts` — `API_BASE = '/api'` (вместо `.env.local`).

### shared
- [x] `shared/lib/utils.ts` — `cn()` (создан shadcn).
- [x] `shared/lib/storage.ts` — `storage.getToken / setToken / removeToken` (ключ `'access_token'`).
- [x] `shared/api/http.ts` — fetch-обёртка: `Authorization: Bearer`, JSON, на не-2xx кидает `Error` с полем `status`.
- [x] `shared/api/types.ts` — `AuthResponse { accessToken, user }`, `ApiError`.

### entities/user
- [x] `entities/user/model/types.ts` — `interface User { id, email, name }`.

### features/auth
- [x] `features/auth/model/schemas.ts` — `loginSchema`, `registerSchema` (zod). Экспортирует типы `LoginFormValues`, `RegisterFormValues`.
- [x] `features/auth/model/store.ts` — Zustand + persist: `{ user, token, isAuthenticated, _hasHydrated }`, `setSession`, `logout`, `setHydrated`.
- [x] `features/auth/api/auth.api.ts` — `authApi.login(dto)`, `authApi.register(dto)`.
- [x] `features/auth/model/use-login.ts` — хук: login → setSession → push('/dashboard'); toast 401.
- [x] `features/auth/model/use-register.ts` — хук: register → setSession → push('/dashboard'); toast 409/400.
- [x] `features/auth/ui/LoginForm.tsx` — `'use client'`, RHF + zodResolver, поля email/password, loading state.
- [x] `features/auth/ui/RegisterForm.tsx` — то же + поле name.

### views
- [x] `views/login/index.tsx` — `<Card>` с `LoginForm`, ссылка на `/register`.
- [x] `views/register/index.tsx` — `<Card>` с `RegisterForm`, ссылка на `/login`.

### app (роутинг)
- [x] `app/layout.tsx` — `ThemeProvider` + `<Toaster richColors />` (sonner).
- [x] `app/(auth)/login/page.tsx`, `app/(auth)/register/page.tsx` — рендер соответствующих views.
- [x] `app/(protected)/layout.tsx` — `'use client'` AuthGuard: ждёт `_hasHydrated`, при отсутствии токена `router.replace('/login')`.
- [x] `app/(protected)/dashboard/page.tsx` — приветствие с именем пользователя + кнопка logout.

### Документация
- [x] `CLAUDE.md` — добавлен раздел **Frontend Architecture (Feature Slice Design)**.
- [x] `.claude/plans/auth-frontend.md` — план сохранён в репозитории.

## Верификация

```bash
# 1. Поднять инфраструктуру
docker compose up -d
npm run dev:backend          # порт 3001

# 2. Запустить фронтенд
npm run dev:frontend         # порт 3000
```

Сценарии для проверки (все пройдены Playwright, 11/11 ✓):

- [x] `http://localhost:3000/register` — форма отображается, заголовок «Регистрация», 3 поля ввода.
- [x] Регистрация валидной формы → редирект на `/dashboard`, токен сохранён в `localStorage['auth'].state.token`.
- [x] Повторная регистрация того же email → toast «Этот email уже занят» (409).
- [x] Пустые поля → 3 zod-ошибки под полями; пароль < 8 символов → ошибка «минимум 8 символов».
- [x] `http://localhost:3000/login` — логин неверным паролем → toast «Неверный email или пароль» (401).
- [x] Логин верными данными → редирект на `/dashboard`.
- [x] Прямой переход на `/dashboard` без токена → редирект на `/login`.
- [x] Запросы идут на `http://localhost:3000/api/auth/...` (прокси, не напрямую на 3001).
- [x] Token доступен для `Authorization: Bearer …` в последующих API-запросах.
- [x] `npx tsc --noEmit` — без ошибок.
