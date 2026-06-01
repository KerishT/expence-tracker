---
name: pr
description: Создать PR в GitHub с заданным названием ветки и заголовком
user_invocable: true
allowedTools:
  - Bash(git *)
  - Bash(gh *)
effort: low
---

## Аргументы

```
/pr <branch> <title>
```

- `<branch>` — название ветки для PR (например, `feature/add-auth`)
- `<title>` — заголовок PR в формате Conventional Commits (например, `feat(backend): добавить авторизацию`)

Если аргументы не переданы — запросить у пользователя.

## Алгоритм

1. Получить аргументы `branch` и `title` из вызова скилла
2. Проверить, что ветка существует: `git branch --list <branch>`
   - Если нет — сообщить об ошибке и остановиться
3. Получить список коммитов ветки относительно `main`:
   ```
   git log main...<branch> --pretty=format:"%h %s%n%b" --reverse
   ```
4. Проверить, что ветка запушена в origin: `git ls-remote --heads origin <branch>`
   - Если нет — запушить: `git push -u origin <branch>`
5. Составить тело PR на основе коммитов:
   - **Summary**: кратко что реализовано, какие модули/endpoints затронуты
   - **Test plan**: конкретные шаги для ручной проверки (основной сценарий + граничные случаи)
6. Создать PR через `gh pr create`:
   ```
   gh pr create --base main --head <branch> --title "<title>" --body "..."
   ```
7. Вывести ссылку на созданный PR

## Формат тела PR

```markdown
## Summary
- <что реализовано>
- <затронутые модули / endpoints>

## Test plan
- [ ] <шаг 1>
- [ ] <шаг 2>
- [ ] <граничный случай>
```

## Правила

- Заголовок PR — Conventional Commits: `<type>(<scope>): <subject>` на русском
- Тело PR — на русском языке
- Никогда не пушить в `main` напрямую
- Не создавать PR если нет коммитов относительно `main`
- Base ветка всегда `main`
