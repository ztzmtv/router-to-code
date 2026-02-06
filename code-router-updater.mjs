#!/usr/bin/env node
import fs from "fs/promises";
import path from "path";
import os from "os";

const DEFAULT_CONFIG = "~/.config/opencode/opencode.json";
const DEFAULT_BACKUP = "~/.config/opencode/opencode.bak";
const DEFAULT_TIMEOUT_MS = 30000;
const MODELS_URL = "https://openrouter.ai/api/v1/models";

function printUsage() {
  console.log(`Usage: node code-router-updater.mjs [options]

Options:
  --config <path>       Config output path (default: ${DEFAULT_CONFIG})
  --backup <path>       Backup path (default: ${DEFAULT_BACKUP})
  --api-key <token>     OpenRouter API key (optional)
  --no-auth             Disable Authorization header
  --timeout-ms <ms>     Request timeout in ms (default: ${DEFAULT_TIMEOUT_MS})
  -h, --help            Show this help
`);
}

function expandHome(p) {
  if (!p) return p;
  if (p === "~") return os.homedir();
  if (p.startsWith("~/")) return path.join(os.homedir(), p.slice(2));
  return p;
}

function toTitleCase(str) {
  return str
    .split(" ")
    .filter(Boolean)
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" ");
}

function nameFromId(id) {
  const tail = id.includes("/") ? id.split("/").pop() : id;
  const spaced = tail.replace(/[-_]+/g, " ");
  return toTitleCase(spaced);
}

function parseArgs(argv) {
  const args = {
    config: DEFAULT_CONFIG,
    backup: DEFAULT_BACKUP,
    apiKey: undefined,
    noAuth: false,
    timeoutMs: DEFAULT_TIMEOUT_MS,
  };

  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--config") {
      args.config = argv[++i];
    } else if (arg === "--backup") {
      args.backup = argv[++i];
    } else if (arg === "--api-key") {
      args.apiKey = argv[++i];
    } else if (arg === "--no-auth") {
      args.noAuth = true;
    } else if (arg === "--timeout-ms") {
      args.timeoutMs = Number(argv[++i]);
    } else if (arg === "-h" || arg === "--help") {
      printUsage();
      process.exit(0);
    } else {
      console.error(`Unknown аргумент: ${arg}`);
      printUsage();
      process.exit(1);
    }
  }

  if (!Number.isFinite(args.timeoutMs) || args.timeoutMs <= 0) {
    console.error("timeout-ms должен быть положительным числом");
    process.exit(1);
  }

  return args;
}

async function fetchModels({ apiKey, noAuth, timeoutMs }) {
  const headers = {};
  if (apiKey && !noAuth) {
    headers.Authorization = `Bearer ${apiKey}`;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(MODELS_URL, {
      method: "GET",
      headers,
      signal: controller.signal,
    });

    if (res.status === 401 || res.status === 403) {
      throw new Error(
        "OpenRouter API требует ключ. Повторите с --api-key <token>."
      );
    }

    if (!res.ok) {
      throw new Error(`OpenRouter API ошибка: HTTP ${res.status}`);
    }

    const payload = await res.json();
    if (!payload || !Array.isArray(payload.data)) {
      throw new Error("Неверный формат ответа OpenRouter (ожидался data[])");
    }

    return payload.data;
  } finally {
    clearTimeout(timeout);
  }
}

function buildModels(models) {
  const result = {};
  for (const model of models) {
    if (!model || !model.id) continue;
    const name =
      typeof model.name === "string" && model.name.trim().length > 0
        ? model.name.trim()
        : nameFromId(model.id);
    result[model.id] = { name };
  }
  return result;
}

async function ensureDirForFile(filePath) {
  const dir = path.dirname(filePath);
  await fs.mkdir(dir, { recursive: true });
}

async function backupFileIfExists(configPath, backupPath) {
  try {
    await fs.access(configPath);
  } catch {
    return false;
  }
  await ensureDirForFile(backupPath);
  await fs.copyFile(configPath, backupPath);
  return true;
}

async function writeConfig(configPath, config) {
  await ensureDirForFile(configPath);
  const content = JSON.stringify(config, null, 2) + "\n";
  await fs.writeFile(configPath, content, "utf8");
}

async function main() {
  const args = parseArgs(process.argv);
  const configPath = expandHome(args.config);
  const backupPath = expandHome(args.backup);

  const models = await fetchModels({
    apiKey: args.apiKey,
    noAuth: args.noAuth,
    timeoutMs: args.timeoutMs,
  });

  const modelsBlock = buildModels(models);

  if (Object.keys(modelsBlock).length === 0) {
    console.warn("Внимание: список моделей пустой.");
  }

  const config = {
    $schema: "https://opencode.ai/config.json",
    provider: {
      openrouter: {
        models: modelsBlock,
      },
    },
  };

  const backedUp = await backupFileIfExists(configPath, backupPath);
  await writeConfig(configPath, config);

  console.log(`Записано моделей: ${Object.keys(modelsBlock).length}`);
  console.log(`Конфиг: ${configPath}`);
  if (backedUp) {
    console.log(`Backup: ${backupPath}`);
  } else {
    console.log("Backup: не был создан (файла не было).");
  }
}

main().catch((err) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error(`Ошибка: ${message}`);
  process.exit(1);
});
