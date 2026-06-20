import { describe, it, expect } from 'vitest';
import {
  mapSearchResults,
  hitToQuickItem,
  extractBody,
} from '../src/search-core';

describe('mapSearchResults', () => {
  it('maps a structured results array into hits', () => {
    const hits = mapSearchResults({
      results: [
        {
          path: 'work/tasks/plan.md',
          title: 'Plan',
          snippet: '...the plan is...',
          score: 3,
          updated: '2026-06-20',
        },
      ],
    });
    expect(hits).toEqual([
      {
        path: 'work/tasks/plan.md',
        title: 'Plan',
        snippet: '...the plan is...',
        score: 3,
        updated: '2026-06-20',
      },
    ]);
  });

  it('falls back to path as title when title is missing', () => {
    const [hit] = mapSearchResults({ results: [{ path: 'a/b.md' }] });
    expect(hit.title).toBe('a/b.md');
    expect(hit.snippet).toBe('');
  });

  it('drops entries without a path', () => {
    const hits = mapSearchResults({
      results: [{ title: 'no path' }, { path: 'ok.md' }],
    });
    expect(hits).toHaveLength(1);
    expect(hits[0].path).toBe('ok.md');
  });

  it('returns [] for missing or malformed input', () => {
    expect(mapSearchResults(undefined)).toEqual([]);
    expect(mapSearchResults({})).toEqual([]);
    expect(mapSearchResults({ results: 'nope' })).toEqual([]);
  });
});

describe('hitToQuickItem', () => {
  it('uses title as label and path as description', () => {
    const item = hitToQuickItem({
      path: 'notes/x.md',
      title: 'X',
      snippet: 'hello',
    });
    expect(item).toEqual({ label: 'X', description: 'notes/x.md', detail: 'hello' });
  });

  it('omits empty detail', () => {
    const item = hitToQuickItem({ path: 'x.md', title: 'X', snippet: '' });
    expect(item.detail).toBeUndefined();
  });
});

describe('extractBody', () => {
  it('prefers structured body', () => {
    expect(extractBody({ body: 'hi' }, 'fallback')).toBe('hi');
  });

  it('falls back to text when body is absent', () => {
    expect(extractBody({}, 'fallback')).toBe('fallback');
    expect(extractBody(undefined, 'fallback')).toBe('fallback');
  });
});
