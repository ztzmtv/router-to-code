# OpenRouter OpenCode Models Updater

[English version](README.md)

---

## Зачем
Скрипт `code-router-updater.mjs` автоматически:
- забирает актуальные модели OpenRouter,
- формирует минимальный `opencode.json`,
- сохраняет резервную копию старого конфига.

## Требования
Зависимостей нет. Нужен Node.js 18+.

## Использование
```bash
node code-router-updater.mjs
```

## Опции
- `--config <path>` путь для записи конфига (по умолчанию `~/.config/opencode/opencode.json`)
- `--backup <path>` путь для backup (по умолчанию `~/.config/opencode/opencode.bak`)
- `--api-key <token>` ключ OpenRouter (опционально)
- `--no-auth` отключить Authorization даже при наличии ключа
- `--timeout-ms <ms>` таймаут запроса (по умолчанию `30000`)

## Результат
Минимальный конфиг:
```json
{
  "$schema": "https://opencode.ai/config.json",
  "provider": {
    "openrouter": {
      "models": {
        "openai/gpt-4o-mini": {
          "name": "GPT 4o Mini"
        }
      }
    }
  }
}
```

## Файлы
- Конфиг: `~/.config/opencode/opencode.json`
- Backup: `~/.config/opencode/opencode.bak`
