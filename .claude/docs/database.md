# База данных

PostgreSQL 16 (Docker), ORM — **Prisma 6**. Схема: `backend/prisma/schema.prisma`.
Подключение через `DATABASE_URL`. Локально БД поднимается корневым `docker-compose.yml`
(db `expence_tracker`, пользователь/пароль `postgres/postgres`, порт 5432).

## ER-обзор

```
User 1───* Category 1───* Transaction
  └──────────────────────────* Transaction
```

- **User → Category** — один-ко-многим (у пользователя много категорий).
- **User → Transaction** — один-ко-многим (у пользователя много транзакций).
- **Category → Transaction** — один-ко-многим (в категории много транзакций).

Удаление каскадное вниз: удаление `User` уносит его `Category` и `Transaction`;
удаление `Category` уносит её `Transaction` (`onDelete: Cascade`).

---

## Enum `TransactionType`

| Значение  | Смысл  |
| --------- | ------ |
| `income`  | Доход  |
| `expense` | Расход |

---

## Модель `User`

Пользователь системы.

| Поле           | Тип        | Атрибуты                  | Назначение |
| -------------- | ---------- | ------------------------- | ---------- |
| `id`           | String     | `@id @default(uuid())`    | Первичный ключ (UUID). |
| `email`        | String     | `@unique`                 | Email, уникален в системе. Используется при логине. |
| `name`         | String     | —                         | Отображаемое имя. |
| `passwordHash` | String     | —                         | Хеш пароля (`bcrypt`, 10 раундов). **Наружу никогда не отдаётся.** |
| `createdAt`    | DateTime   | `@default(now())`         | Момент создания. |
| `updatedAt`    | DateTime   | `@updatedAt`              | Момент последнего изменения. |
| `categories`   | Category[] | связь                     | Категории пользователя. |
| `transactions` | Transaction[] | связь                  | Транзакции пользователя. |

**Доступ:** только через CQRS (`UsersModule`). Публичная форма — `UserDto` `{ id, email, name }`
(без `passwordHash`). `GetUserByEmailQuery` возвращает расширенный `UserWithHash` (для проверки
пароля в `AuthService`).

---

## Модель `Category`

Категория для группировки транзакций.

| Поле           | Тип        | Атрибуты                                    | Назначение |
| -------------- | ---------- | ------------------------------------------- | ---------- |
| `id`           | String     | `@id @default(uuid())`                      | Первичный ключ (UUID). |
| `name`         | String     | —                                           | Название (≤ 50 символов, валидируется в DTO). |
| `color`        | String     | —                                           | Цвет в hex-формате `#RRGGBB` (валидируется в DTO). |
| `icon`         | String     | —                                           | Идентификатор иконки (≤ 50 символов). |
| `userId`       | String     | FK → `User.id`, `onDelete: Cascade`         | Владелец категории. |
| `createdAt`    | DateTime   | `@default(now())`                           | Момент создания. |
| `updatedAt`    | DateTime   | `@updatedAt`                                | Момент последнего изменения. |
| `transactions` | Transaction[] | связь                                    | Транзакции этой категории. |

**Ограничения и индексы:**

- `@@unique([userId, name])` — у одного пользователя не может быть двух категорий с одинаковым
  именем. Нарушение → Prisma `P2002` → `ConflictException` (409).
- `@@index([userId])` — ускоряет выборку категорий пользователя.

**Публичная форма** — `CategoryDto` `{ id, name, color, icon }` (без `userId`/служебных полей).

---

## Модель `Transaction`

Денежная операция (доход или расход).

| Поле          | Тип             | Атрибуты                                  | Назначение |
| ------------- | --------------- | ----------------------------------------- | ---------- |
| `id`          | String          | `@id @default(uuid())`                    | Первичный ключ (UUID). |
| `amount`      | Decimal         | `@db.Decimal(12, 2)`                      | Сумма: до 12 цифр, 2 после запятой. В DTO приводится к `number`. |
| `type`        | TransactionType | enum                                      | `income` или `expense`. |
| `description` | String?         | nullable                                  | Необязательное описание (≤ 255 символов). |
| `date`        | DateTime        | —                                         | Дата операции (по ней фильтрация и сортировка). |
| `categoryId`  | String          | FK → `Category.id`, `onDelete: Cascade`   | Категория операции. |
| `userId`      | String          | FK → `User.id`, `onDelete: Cascade`       | Владелец операции. |
| `createdAt`   | DateTime        | `@default(now())`                         | Момент создания записи. |

> Примечание: у `Transaction` нет `updatedAt` — обновление поля не отслеживается на уровне схемы.

**Индексы:**

- `@@index([userId])` — все транзакции пользователя.
- `@@index([userId, date])` — выборка по периоду (фильтр `?year=&month=`, сортировка по дате).
- `@@index([categoryId])` — транзакции по категории и каскадные операции.

**Decimal → number.** Prisma возвращает `amount` как `Decimal`; сервисы приводят его к `number`
в приватном `toDto()` перед отдачей наружу. Агрегаты сводки (`groupBy` + `_sum`) тоже
приводятся через `Number(...)`.

---

## Миграции

Каталог `backend/prisma/migrations/`. Применённые на текущий момент:

| Миграция                         | Что добавляет |
| -------------------------------- | ------------- |
| `20260523042405_add_user`        | Таблица `User`. |
| `20260523044105_add_category`    | Таблица `Category` + связь с `User`. |
| `20260526014138_add_transaction` | Таблица `Transaction`, enum `TransactionType`, индексы. |

Команды (из `backend/`):

```bash
npm run prisma:migrate      # prisma migrate dev — создать новую миграцию из изменений schema.prisma и применить
npm run prisma:generate     # prisma generate — перегенерировать Prisma Client
```

Подробнее о процессе изменения схемы — в [dev-guide.md](dev-guide.md).
