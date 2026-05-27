# План: Главный экран (Dashboard) Expense Tracker

## Context

Сейчас `(protected)/dashboard/page.tsx` — заглушка с приветствием и кнопкой выхода. Нужен полноценный главный экран: навигация к транзакциям и категориям, профиль пользователя (имя), список последних транзакций с пагинацией. Архитектура — Feature Slice Design.

Ключевые ограничения бэкенда:
- `GET /api/transactions?year&month` возвращает `{ items[], summary }` — **без серверной пагинации**, отсортировано по дате убыванию. → пагинация клиентская, по 10.
- Транзакция содержит только `categoryId` (без имени/цвета). → подтягиваем `GET /api/categories` и джойним на клиенте для отображения.
- Нет `/users/me` — имя пользователя берём из `useAuthStore().user`.

Решения пользователя: **sidebar**-навигация; для меню создаём **страницы-заглушки** `/transactions` и `/categories`; пагинация **клиентская по 10**.

## Сущности (entities)

Создать типы (downward imports, без бизнес-логики):

- `entities/transaction/model/types.ts`
  ```ts
  export type TransactionType = 'income' | 'expense';
  export interface Transaction {
    id: string;
    amount: number;
    type: TransactionType;
    description: string | null;
    date: string;          // ISO
    categoryId: string;
  }
  export interface TransactionSummary {
    totalIncome: number;
    totalExpense: number;
    balance: number;
  }
  export interface TransactionListResponse {
    items: Transaction[];
    summary: TransactionSummary;
  }
  ```
- `entities/category/model/types.ts`
  ```ts
  export interface Category {
    id: string;
    name: string;
    color: string;   // #RRGGBB
    icon: string;
  }
  ```

## Features

### `features/transactions`
- `api/transactions.api.ts` — использует существующий `api.get` из `shared/api/http.ts`:
  ```ts
  export const transactionsApi = {
    list: (params?: { year?: number; month?: number }) =>
      api.get<TransactionListResponse>(`/transactions${qs(params)}`),
  };
  ```
  (helper `qs` для query-строки — локально в файле или `shared/lib`).
- `model/use-transactions.ts` — хук загрузки: `useState` (data/loading/error) + `useEffect`. Без новых библиотек (react-query в проекте нет).
- `model/use-pagination.ts` — клиентская пагинация: принимает массив `items` и `pageSize=10`, возвращает `{ pageItems, page, totalPages, next, prev, canPrev, canNext }`.

### `features/categories`
- `api/categories.api.ts` — `list: () => api.get<Category[]>('/categories')`.
- `model/use-categories.ts` — загрузка списка категорий (для джойна по `categoryId`).

## Widgets (создать каталог `src/widgets/`)

- `widgets/app-sidebar/ui/AppSidebar.tsx` — вертикальное меню слева:
  - Профиль сверху: имя пользователя (`user.name`), email, кнопка «Выйти» (`logout()` + redirect `/login`) — логика из текущего `dashboard/page.tsx`.
  - Навигация: ссылки (`next/link`) «Дашборд» `/dashboard`, «Транзакции» `/transactions`, «Категории» `/categories`. Активный пункт через `usePathname()`.
- `widgets/recent-transactions/ui/RecentTransactions.tsx` — карточка со списком последних транзакций:
  - Использует `use-transactions` + `use-categories` + `use-pagination`.
  - Каждая строка: иконка/цвет категории (по `categoryId`), название категории, описание, дата (formatDate), сумма (formatAmount, цвет по `type`: income зелёный / expense красный).
  - Низ карточки: контролы пагинации (← страница X из N →), кнопки disabled на границах.
  - Состояния: loading (скелет/текст), пустой список, ошибка.
- (опционально) `widgets/summary-cards/ui/SummaryCards.tsx` — три карточки: доход/расход/баланс из `summary`. Лёгкое добавление, улучшает экран. Включить, если не раздувает scope.

## Shared

- `shared/lib/format.ts` — `formatAmount(n, type?)` (через `Intl.NumberFormat('ru-RU', { style:'currency', currency:'RUB' })`) и `formatDate(iso)` (`Intl.DateTimeFormat('ru-RU')`).
- Доп. shadcn-компоненты при необходимости: `npx shadcn@latest add separator avatar` (если нужно для sidebar/профиля). Минимально — обойтись имеющимися Button/Card.

## Views & routing

- `views/dashboard/index.tsx` — композиция: `<RecentTransactions />` (+ `SummaryCards`, если делаем). Без sidebar (он в layout).
- Sidebar-layout для всей `(protected)`-группы: вынести в `app/(protected)/layout.tsx` (сейчас там только проверка авторизации). Обернуть `children` во flex-контейнер с `<AppSidebar />` слева и `<main>` справа. Так sidebar появится и на страницах-заглушках.
- `app/(protected)/dashboard/page.tsx` — тонкий: рендерит `<DashboardView />`.
- Заглушки (тонкие `page.tsx`, тема «в разработке»):
  - `app/(protected)/transactions/page.tsx`
  - `app/(protected)/categories/page.tsx`

## Критичные файлы

- Изменить: `app/(protected)/layout.tsx` (добавить sidebar-обёртку), `app/(protected)/dashboard/page.tsx`.
- Создать: entities (transaction, category), features (transactions, categories), widgets (app-sidebar, recent-transactions, [summary-cards]), views/dashboard, заглушки страниц, `shared/lib/format.ts`.
- Переиспользовать: `shared/api/http.ts` (`api.get`), `useAuthStore` (`features/auth/model/store.ts`), `shared/ui/{button,card}`, `shared/lib/utils.ts` (`cn`).

## Проверка (end-to-end)

1. `docker compose up -d` + `npm run dev:backend` + `npm run dev:frontend`.
2. Залогиниться → редирект на `/dashboard`.
3. Sidebar показывает имя пользователя; пункты «Транзакции»/«Категории» ведут на страницы-заглушки (без 404), активный пункт подсвечен.
4. Создать через API/UI >10 транзакций; убедиться, что список показывает по 10, кнопки пагинации листают, на границах disabled; названия/цвета категорий подтянуты корректно; суммы и даты отформатированы (ru-RU).
5. Кнопка «Выйти» очищает сессию и редиректит на `/login`.
6. `npm run lint` — без ошибок.
