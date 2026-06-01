---
name: test
description: Сгенерировать unit-тесты для указанного файла
user_invocable: true
allowedTools:
  - Read
  - Write
  - Edit
  - Bash(find *)
  - Bash(cat *)
  - Bash(ls *)
  - Bash(npm *)
  - Bash(grep *)
effort: medium
---

## Аргументы

```
/test <filepath>
```

- `<filepath>` — путь к файлу, для которого нужно написать тесты (относительный или абсолютный).

Если аргумент не передан — запросить у пользователя.

## Алгоритм

1. Получить `filepath` из вызова скилла. Если не передан — спросить пользователя.

2. Прочитать целевой файл и понять его содержимое:
   - Какие функции / классы / хуки экспортируются
   - Какие зависимости инжектируются или импортируются (для мокирования)
   - Какова бизнес-логика каждого публичного метода

3. Определить workspace по пути:
   - Путь содержит `/backend/` → **Jest** (NestJS-стандарт)
   - Путь содержит `/frontend/` → **Vitest** (React/Next.js)
   - Иначе — уточнить у пользователя

4. Проверить наличие тест-раннера в `package.json` соответствующего workspace:
   - Backend: наличие `@nestjs/testing`, `jest`, `ts-jest` в devDependencies
   - Frontend: наличие `vitest`, `@testing-library/react` в devDependencies
   - Если не установлено — предупредить пользователя и предложить установить:
     - Backend: `npm install -D jest ts-jest @nestjs/testing @types/jest --workspace=backend`
     - Frontend: `npm install -D vitest @testing-library/react @testing-library/user-event jsdom --workspace=frontend`
   - Дождаться подтверждения пользователя перед установкой

5. Определить путь к файлу тестов:
   - Backend: рядом с файлом, суффикс `.spec.ts` (например, `src/auth/auth.service.spec.ts`)
   - Frontend: рядом с файлом, суффикс `.test.ts` / `.test.tsx` (например, `features/auth/model/use-login.test.ts`)
   - Если файл тестов уже существует — дополнить его, а не перезаписывать

6. Написать тесты, соблюдая правила ниже, и создать файл.

7. Сообщить пользователю:
   - Путь к созданному файлу тестов
   - Команду для запуска: `npm test --workspace=backend` / `npm test --workspace=frontend`
   - Краткий список того, что покрыто тестами

## Правила написания тестов

### Общие
- Покрывать все публичные методы / экспортируемые функции
- Для каждого метода: happy path + граничные случаи + обработка ошибок
- Моки только для внешних зависимостей (Prisma, HTTP, JWT); внутреннюю логику не мокировать
- Тест-кейсы называть описательно на русском: `'должен вернуть пользователя по email'`
- Группировать в `describe` по методу / функции
- Не тестировать реализацию — тестировать поведение

### Backend (NestJS + Jest)
- Использовать `Test.createTestingModule()` из `@nestjs/testing`
- Провайдеры-зависимости мокировать через объект с `jest.fn()`:
  ```ts
  { provide: PrismaService, useValue: { user: { findUnique: jest.fn() } } }
  ```
- Ассерты: `expect(...).toBe(...)`, `expect(...).toThrow(...)`, `expect(...).rejects.toThrow(...)`
- Async-тесты через `async/await`

### Frontend (Vitest + Testing Library)
- Для хуков: `renderHook` из `@testing-library/react`
- Для компонентов: `render` + запросы по роли / тексту (`getByRole`, `getByText`)
- Моки модулей: `vi.mock('../path/to/module')`
- Ассерты: `expect(...).toBe(...)`, `expect(...).toBeInTheDocument()`
- Не использовать `getByTestId` — предпочитать семантические запросы

## Пример структуры файла тестов (backend)

```ts
import { Test, TestingModule } from '@nestjs/testing';
import { SomeService } from './some.service';
import { PrismaService } from '../prisma/prisma.service';

describe('SomeService', () => {
  let service: SomeService;
  let prisma: jest.Mocked<PrismaService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SomeService,
        { provide: PrismaService, useValue: { model: { findUnique: jest.fn() } } },
      ],
    }).compile();

    service = module.get(SomeService);
    prisma = module.get(PrismaService);
  });

  describe('methodName', () => {
    it('должен вернуть результат при корректных данных', async () => {
      prisma.model.findUnique.mockResolvedValue({ id: '1' });
      const result = await service.methodName('1');
      expect(result).toEqual({ id: '1' });
    });

    it('должен выбросить NotFoundException если запись не найдена', async () => {
      prisma.model.findUnique.mockResolvedValue(null);
      await expect(service.methodName('999')).rejects.toThrow(NotFoundException);
    });
  });
});
```

## Правила

- Никогда не изменять исходный файл, только создавать/дополнять файл тестов
- Не добавлять тесты для приватных методов
- Не устанавливать пакеты без подтверждения пользователя
- Base ветка не затрагивается — тесты пишутся в текущей ветке
