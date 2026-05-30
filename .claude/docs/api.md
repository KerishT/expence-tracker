# API

REST API бэкенда. База — `http://localhost:3001/api` (глобальный префикс `/api`).
Интерактивная документация (Swagger UI) — **`http://localhost:3001/api/docs`**.

## Общие правила

- **Аутентификация.** Все эндпоинты, кроме `/auth/*`, требуют заголовок
  `Authorization: Bearer <accessToken>`. Без валидного токена — `401 Unauthorized`.
- **Скоупинг.** Данные всегда ограничены текущим пользователем (`req.user.id`): чужие
  категории/транзакции недоступны и отдают `404`.
- **Валидация.** Тело запроса проходит глобальный `ValidationPipe({ whitelist: true, transform: true })`
  (`class-validator`). Лишние поля отбрасываются, при нарушении правил — `400` с массивом сообщений.
- **`:id`** в путях валидируется `ParseUUIDPipe` — невалидный UUID даёт `400`.
- **Формат тела** — JSON, `Content-Type: application/json`.

### Коды ошибок

| Код | Когда |
| --- | ----- |
| `400` | Ошибка валидации тела/параметров или невалидный UUID |
| `401` | Нет/невалидный JWT |
| `404` | Сущность не найдена или принадлежит другому пользователю |
| `409` | Конфликт уникальности (email занят, категория с таким именем уже есть) |

---

## Auth

### `POST /api/auth/register`

Регистрация нового пользователя. Публичный.

**Тело** (`RegisterDto`):

| Поле       | Тип     | Правила                  |
| ---------- | ------- | ------------------------ |
| `email`    | string  | валидный email           |
| `name`     | string  | непустая строка          |
| `password` | string  | минимум 8 символов       |

```json
{ "email": "user@example.com", "name": "Иван", "password": "secret123" }
```

**Ответ `201`:**

```json
{
  "accessToken": "eyJhbGci...",
  "user": { "id": "uuid", "email": "user@example.com", "name": "Иван" }
}
```

**Ошибки:** `409` — email уже занят; `400` — ошибка валидации.

### `POST /api/auth/login`

Вход. Публичный.

**Тело** (`LoginDto`):

| Поле       | Тип    | Правила        |
| ---------- | ------ | -------------- |
| `email`    | string | валидный email |
| `password` | string | непустая       |

**Ответ `201`:** `{ accessToken, user }` (как в register).

**Ошибки:** `401` — неверные email/пароль (`Invalid credentials`).

> Токен подписывается с payload `{ sub: userId, email }`, TTL — `JWT_EXPIRES_IN`.

---

## Categories

Все требуют JWT. Возвращают `CategoryDto`: `{ id, name, color, icon }` (без `userId`).

### `POST /api/categories`

Создать категорию.

**Тело** (`CreateCategoryDto`):

| Поле    | Тип    | Правила                                   |
| ------- | ------ | ----------------------------------------- |
| `name`  | string | непустая, ≤ 50 символов                   |
| `color` | string | hex-цвет формата `#RRGGBB`                |
| `icon`  | string | непустая, ≤ 50 символов                   |

```json
{ "name": "Продукты", "color": "#4CAF50", "icon": "shopping-cart" }
```

**Ответ `201`:** `CategoryDto`.
**Ошибки:** `409` — категория с таким именем уже есть у пользователя (`@@unique([userId, name])`); `404` — пользователь не найден.

### `GET /api/categories`

Список категорий пользователя, отсортирован по `createdAt` (по возрастанию).

**Ответ `200`:** `CategoryDto[]`.

### `GET /api/categories/:id`

Одна категория по UUID.

**Ответ `200`:** `CategoryDto`. **Ошибки:** `404`.

### `PATCH /api/categories/:id`

Частичное обновление (`UpdateCategoryDto` = `PartialType(CreateCategoryDto)` — все поля опциональны, правила сохраняются).

```json
{ "color": "#FF9800" }
```

**Ответ `200`:** обновлённый `CategoryDto`. **Ошибки:** `404`, `409`, `400`.

### `DELETE /api/categories/:id`

Удалить категорию. Связанные транзакции удаляются каскадно (`onDelete: Cascade`).

**Ответ `204`** (пустое тело). **Ошибки:** `404`.

---

## Transactions

Все требуют JWT. Возвращают `TransactionDto`:

```ts
{
  id: string;
  amount: number;            // Decimal приведён к number
  type: "income" | "expense";
  description: string | null;
  date: string;              // ISO-дата
  categoryId: string;
}
```

### `POST /api/transactions`

Создать транзакцию. Перед записью проверяется, что пользователь существует, а категория
существует и принадлежит ему.

**Тело** (`CreateTransactionDto`):

| Поле          | Тип            | Правила                                        |
| ------------- | -------------- | ---------------------------------------------- |
| `amount`      | number         | положительное, ≤ 2 знаков после запятой        |
| `type`        | enum           | `income` \| `expense`                          |
| `description` | string?        | опционально, ≤ 255 символов                    |
| `date`        | string         | ISO-строка даты (`IsDateString`)               |
| `categoryId`  | string (UUID)  | UUID существующей категории пользователя       |

```json
{
  "amount": 1500.50,
  "type": "expense",
  "description": "Магазин",
  "date": "2026-05-30T00:00:00.000Z",
  "categoryId": "uuid-категории"
}
```

**Ответ `201`:** `TransactionDto`. **Ошибки:** `404` — пользователь или категория не найдены; `400`.

### `GET /api/transactions`

Список транзакций пользователя (по убыванию `date`) + агрегированная сводка.

**Query-параметры** (`QueryTransactionsDto`, опциональны):

| Параметр | Тип | Правила   | Поведение |
| -------- | --- | --------- | --------- |
| `year`   | int | 2000–2100 | Фильтр по году |
| `month`  | int | 1–12      | Фильтр по месяцу |

Логика периода:
- ни `year`, ни `month` — все транзакции;
- только `year` — весь указанный год;
- `year` + `month` — конкретный месяц;
- только `month` — этот месяц **текущего** года.

**Ответ `200`** (`TransactionListDto`):

```json
{
  "items": [ /* TransactionDto[] */ ],
  "summary": {
    "totalIncome": 50000,
    "totalExpense": 32000,
    "balance": 18000
  }
}
```

`balance = totalIncome − totalExpense`. Суммы агрегируются Prisma `groupBy` по `type`.

### `GET /api/transactions/:id`

Одна транзакция по UUID. **Ответ `200`:** `TransactionDto`. **Ошибки:** `404`.

### `PATCH /api/transactions/:id`

Частичное обновление (`UpdateTransactionDto` = `PartialType(CreateTransactionDto)`). Изменяются
только переданные поля; при смене `categoryId` проверяется принадлежность новой категории.

```json
{ "amount": 1800, "categoryId": "другой-uuid" }
```

**Ответ `200`:** обновлённый `TransactionDto`. **Ошибки:** `404` — транзакция или новая категория; `400`.

### `DELETE /api/transactions/:id`

Удалить транзакцию. **Ответ `204`** (пустое тело). **Ошибки:** `404`.

---

## Сводная таблица

| Метод  | Путь                       | Auth | Тело / Query              | Успех |
| ------ | -------------------------- | :--: | ------------------------- | ----- |
| POST   | `/api/auth/register`       | —    | `RegisterDto`             | 201   |
| POST   | `/api/auth/login`          | —    | `LoginDto`                | 201   |
| POST   | `/api/categories`          | ✅   | `CreateCategoryDto`       | 201   |
| GET    | `/api/categories`          | ✅   | —                         | 200   |
| GET    | `/api/categories/:id`      | ✅   | —                         | 200   |
| PATCH  | `/api/categories/:id`      | ✅   | `UpdateCategoryDto`       | 200   |
| DELETE | `/api/categories/:id`      | ✅   | —                         | 204   |
| POST   | `/api/transactions`        | ✅   | `CreateTransactionDto`    | 201   |
| GET    | `/api/transactions`        | ✅   | `?year=&month=`           | 200   |
| GET    | `/api/transactions/:id`    | ✅   | —                         | 200   |
| PATCH  | `/api/transactions/:id`    | ✅   | `UpdateTransactionDto`    | 200   |
| DELETE | `/api/transactions/:id`    | ✅   | —                         | 204   |

См. также [architecture.md](architecture.md) и [database.md](database.md).
