import { readFileSync } from 'fs';
import { join } from 'path';

export type AIConfig = Record<string, any>;

let cached: AIConfig | null = null;

export function loadAIConfig(): AIConfig {
  if (cached) return cached;
  try {
    // Resolve relative to repo root (assumes CWD is project root during tests/dev)
    const path = join(process.cwd(), 'ai.config.json');
    const raw = readFileSync(path, 'utf-8');
    cached = JSON.parse(raw);
    return cached;
  } catch (err) {
    cached = {};
    return cached;
  }
}

export function getDefaultModel(key: string): string | undefined {
  const cfg = loadAIConfig();
  const entry = cfg[key];
  if (!entry) return undefined;
  return entry.model || entry.modelId || entry.default || undefined;
}
