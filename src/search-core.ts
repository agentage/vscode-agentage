// Pure helpers - no 'vscode' import, so they are unit-testable with vitest.

export interface MemoryHit {
  path: string;
  title: string;
  snippet: string;
  score?: number;
  updated?: string;
}

export interface QuickItem {
  label: string;
  description: string;
  detail?: string;
}

/** Normalize a memory__search result (structuredContent or parsed JSON) into hits. */
export function mapSearchResults(data: unknown): MemoryHit[] {
  const results = (data as { results?: unknown })?.results;
  if (!Array.isArray(results)) return [];
  return results
    .map((r): MemoryHit => {
      const row = r as Record<string, unknown>;
      const path = String(row.path ?? '');
      return {
        path,
        title: String(row.title ?? row.path ?? 'Untitled'),
        snippet: String(row.snippet ?? ''),
        score: typeof row.score === 'number' ? row.score : undefined,
        updated: typeof row.updated === 'string' ? row.updated : undefined,
      };
    })
    .filter((h) => h.path.length > 0);
}

/** A hit becomes a QuickPick row: title + path + matched snippet. */
export function hitToQuickItem(hit: MemoryHit): QuickItem {
  return {
    label: hit.title,
    description: hit.path,
    detail: hit.snippet || undefined,
  };
}

/** Strip the read-only doc body out of a memory__read tool result. */
export function extractBody(data: unknown, fallbackText: string): string {
  const body = (data as { body?: unknown })?.body;
  return typeof body === 'string' ? body : fallbackText;
}
