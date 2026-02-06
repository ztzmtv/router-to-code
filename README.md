# OpenRouter OpenCode Models Updater

[Русская версия](README.ru.md)

---

## Why
`code-router-updater.mjs` automatically:
- fetches current OpenRouter models,
- builds a minimal `opencode.json`,
- keeps a backup of the previous config.

## Requirements
No dependencies. Node.js 18+ required.

## Usage
```bash
node code-router-updater.mjs
```

## Options
- `--config <path>` output config path (default: `~/.config/opencode/opencode.json`)
- `--backup <path>` backup path (default: `~/.config/opencode/opencode.bak`)
- `--api-key <token>` OpenRouter API key (optional)
- `--no-auth` disable Authorization header
- `--timeout-ms <ms>` request timeout (default: `30000`)

## Output
Minimal config example:
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

## Files
- Config: `~/.config/opencode/opencode.json`
- Backup: `~/.config/opencode/opencode.bak`
