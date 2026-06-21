// Pure helpers for "Connect Memory to this editor" - no 'vscode' import, vitest-testable.
import { join } from 'node:path';

export type Host = 'vscode' | 'cursor' | 'windsurf' | 'vscodium' | 'unknown';

export const SERVER_ID = 'agentage-memory';

/** Thrown when an existing config is non-empty but not parseable - so we never clobber it. */
export class ConfigParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigParseError';
  }
}

/** Branch on vscode.env.uriScheme (stable, lowercase), never appName. */
export function detectHost(uriScheme: string): Host {
  switch (uriScheme) {
    case 'vscode':
    case 'vscode-insiders':
      return 'vscode';
    case 'cursor':
      return 'cursor';
    case 'windsurf':
      return 'windsurf';
    case 'vscodium':
      return 'vscodium';
    default:
      return 'unknown';
  }
}

export interface FileTarget {
  file: string;
  key: 'mcpServers';
  entry: Record<string, string>;
}

/**
 * Config-file target for the forks we write to (Cursor, Windsurf) - both use stable
 * home-relative global paths. Returns null for VS Code/VSCodium/unknown (handled elsewhere).
 * Note the per-editor field names: Cursor `url`, Windsurf `serverUrl`.
 */
export function fileTarget(host: Host, home: string, url: string): FileTarget | null {
  switch (host) {
    case 'cursor':
      return { file: join(home, '.cursor', 'mcp.json'), key: 'mcpServers', entry: { url } };
    case 'windsurf':
      return {
        file: join(home, '.codeium', 'windsurf', 'mcp_config.json'),
        key: 'mcpServers',
        entry: { serverUrl: url },
      };
    default:
      return null;
  }
}

/**
 * Strip // and block comments + trailing commas, string-aware so a string value
 * containing https:// or a literal ",}" / ",]" survives intact.
 */
export function stripJsonc(text: string): string {
  let out = '';
  let inStr = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    const n = text[i + 1];
    if (inStr) {
      out += c;
      if (c === '\\') {
        out += n ?? '';
        i++;
      } else if (c === '"') {
        inStr = false;
      }
      continue;
    }
    if (c === '"') {
      inStr = true;
      out += c;
      continue;
    }
    if (c === '/' && n === '/') {
      while (i < text.length && text[i] !== '\n') i++;
      continue;
    }
    if (c === '/' && n === '*') {
      i += 2;
      while (i < text.length && !(text[i] === '*' && text[i + 1] === '/')) i++;
      i++;
      continue;
    }
    if (c === ',') {
      // drop a trailing comma (only when the next non-space char closes a container)
      let j = i + 1;
      while (j < text.length && /\s/.test(text[j])) j++;
      if (text[j] === '}' || text[j] === ']') continue;
      out += c;
      continue;
    }
    out += c;
  }
  return out;
}

const isPlainObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

/**
 * Merge our server entry into an existing (possibly JSONC) config, preserving siblings.
 * Throws ConfigParseError when an existing non-empty file is not parseable or its shape
 * is unexpected - the caller MUST NOT overwrite the file in that case (no data loss).
 */
export function mergeServer(
  existing: string | null,
  key: 'servers' | 'mcpServers',
  id: string,
  entry: Record<string, unknown>
): string {
  let root: Record<string, unknown> = {};
  if (existing && existing.trim()) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(stripJsonc(existing));
    } catch {
      throw new ConfigParseError('existing config is not valid JSON/JSONC');
    }
    if (!isPlainObject(parsed)) {
      throw new ConfigParseError('existing config root is not an object');
    }
    root = parsed;
  }
  const existingBag = root[key];
  let bag: Record<string, unknown>;
  if (existingBag === undefined) {
    bag = {};
  } else if (isPlainObject(existingBag)) {
    bag = existingBag;
  } else {
    throw new ConfigParseError(`existing "${key}" is not an object`);
  }
  bag[id] = entry;
  root[key] = bag;
  return JSON.stringify(root, null, 2) + '\n';
}
