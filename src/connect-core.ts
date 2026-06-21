// Pure helpers for "Connect Memory to this editor" - no 'vscode' import, vitest-testable.
import { join } from 'node:path';

export type Host = 'vscode' | 'cursor' | 'windsurf' | 'vscodium' | 'unknown';

export const SERVER_ID = 'agentage-memory';

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

/** Strip // and block comments + trailing commas, string-aware so https:// in values survives. */
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
    out += c;
  }
  return out.replace(/,(\s*[}\]])/g, '$1');
}

/** Merge our server entry into an existing (possibly JSONC) config, preserving siblings. */
export function mergeServer(
  existing: string | null,
  key: 'servers' | 'mcpServers',
  id: string,
  entry: Record<string, unknown>
): string {
  let root: Record<string, unknown> = {};
  if (existing && existing.trim()) {
    try {
      const parsed = JSON.parse(stripJsonc(existing));
      if (parsed && typeof parsed === 'object') root = parsed as Record<string, unknown>;
    } catch {
      root = {};
    }
  }
  const bag =
    root[key] && typeof root[key] === 'object'
      ? (root[key] as Record<string, unknown>)
      : {};
  bag[id] = entry;
  root[key] = bag;
  return JSON.stringify(root, null, 2) + '\n';
}
