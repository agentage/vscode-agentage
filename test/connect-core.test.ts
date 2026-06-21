import { describe, it, expect } from 'vitest';
import {
  detectHost,
  fileTarget,
  stripJsonc,
  mergeServer,
  hasServerEntry,
  ConfigParseError,
} from '../src/connect-core';

const URL = 'https://memory.agentage.io/mcp';

describe('detectHost', () => {
  it('maps known schemes', () => {
    expect(detectHost('vscode')).toBe('vscode');
    expect(detectHost('vscode-insiders')).toBe('vscode');
    expect(detectHost('cursor')).toBe('cursor');
    expect(detectHost('windsurf')).toBe('windsurf');
    expect(detectHost('vscodium')).toBe('vscodium');
  });
  it('falls back to unknown', () => {
    expect(detectHost('something-else')).toBe('unknown');
  });
});

describe('fileTarget', () => {
  it('cursor uses mcpServers + url', () => {
    const t = fileTarget('cursor', '/home/u', URL);
    expect(t?.file).toBe('/home/u/.cursor/mcp.json');
    expect(t?.key).toBe('mcpServers');
    expect(t?.entry).toEqual({ url: URL });
  });
  it('windsurf uses mcpServers + serverUrl', () => {
    const t = fileTarget('windsurf', '/home/u', URL);
    expect(t?.file).toBe('/home/u/.codeium/windsurf/mcp_config.json');
    expect(t?.entry).toEqual({ serverUrl: URL });
  });
  it('returns null for vscode/vscodium/unknown', () => {
    expect(fileTarget('vscode', '/home/u', URL)).toBeNull();
    expect(fileTarget('vscodium', '/home/u', URL)).toBeNull();
    expect(fileTarget('unknown', '/home/u', URL)).toBeNull();
  });
});

describe('stripJsonc', () => {
  it('preserves https:// inside strings', () => {
    const out = stripJsonc(`{ "url": "${URL}" }`);
    expect(JSON.parse(out).url).toBe(URL);
  });
  it('strips line + block comments and trailing commas', () => {
    const out = stripJsonc(`{
      // a comment
      "a": 1, /* block */
      "b": 2,
    }`);
    expect(JSON.parse(out)).toEqual({ a: 1, b: 2 });
  });
  it('preserves a string value containing ",}" (no trailing-comma corruption)', () => {
    const out = stripJsonc('{ "env": { "TOKEN": "ghp_x,}" }, }');
    expect(JSON.parse(out).env.TOKEN).toBe('ghp_x,}');
  });
});

describe('mergeServer', () => {
  it('creates a fresh config when none exists', () => {
    const out = mergeServer(null, 'mcpServers', 'agentage-memory', { url: URL });
    expect(JSON.parse(out)).toEqual({ 'mcpServers': { 'agentage-memory': { url: URL } } });
  });
  it('preserves sibling servers', () => {
    const existing = JSON.stringify({ mcpServers: { other: { url: 'http://x' } } });
    const out = mergeServer(existing, 'mcpServers', 'agentage-memory', { url: URL });
    const obj = JSON.parse(out);
    expect(obj.mcpServers.other).toEqual({ url: 'http://x' });
    expect(obj.mcpServers['agentage-memory']).toEqual({ url: URL });
  });
  it('overwrites only our id and tolerates JSONC input', () => {
    const existing = `{
      // user notes
      "mcpServers": { "agentage-memory": { "url": "http://old" } },
    }`;
    const out = mergeServer(existing, 'mcpServers', 'agentage-memory', { url: URL });
    expect(JSON.parse(out).mcpServers['agentage-memory']).toEqual({ url: URL });
  });
  it('throws ConfigParseError on an unparseable non-empty file (never clobbers)', () => {
    expect(() => mergeServer('{ "mcpServers": { broken', 'mcpServers', 'agentage-memory', { url: URL })).toThrow(
      ConfigParseError
    );
  });
  it('throws when the root or the servers key is not an object', () => {
    expect(() => mergeServer('[1,2,3]', 'mcpServers', 'agentage-memory', { url: URL })).toThrow(
      ConfigParseError
    );
    expect(() => mergeServer('{ "mcpServers": [] }', 'mcpServers', 'agentage-memory', { url: URL })).toThrow(
      ConfigParseError
    );
  });
});

describe('hasServerEntry', () => {
  it('true only when the exact entry is already present', () => {
    const cfg = JSON.stringify({ mcpServers: { 'agentage-memory': { url: URL } } });
    expect(hasServerEntry(cfg, 'mcpServers', 'agentage-memory', { url: URL })).toBe(true);
  });
  it('false for absent / different / null / corrupt', () => {
    expect(hasServerEntry(null, 'mcpServers', 'agentage-memory', { url: URL })).toBe(false);
    expect(hasServerEntry('{}', 'mcpServers', 'agentage-memory', { url: URL })).toBe(false);
    expect(
      hasServerEntry(
        JSON.stringify({ mcpServers: { 'agentage-memory': { url: 'http://old' } } }),
        'mcpServers',
        'agentage-memory',
        { url: URL }
      )
    ).toBe(false);
    expect(hasServerEntry('{ broken', 'mcpServers', 'agentage-memory', { url: URL })).toBe(false);
  });
});
