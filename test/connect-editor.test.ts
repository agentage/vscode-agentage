import { describe, it, expect, beforeEach } from 'vitest';
import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import { state, __reset } from './vscode-mock';
import { connectEditor } from '../src/connect-editor';

const URL = 'https://memory.agentage.io/mcp';
let home: string;

beforeEach(async () => {
  __reset();
  home = await fs.mkdtemp(path.join(os.tmpdir(), 'ag-home-'));
  process.env.HOME = home;
});

describe('connectEditor - Cursor', () => {
  it('writes ~/.cursor/mcp.json with mcpServers + url', async () => {
    state.uriScheme = 'cursor';
    await connectEditor();
    const obj = JSON.parse(await fs.readFile(path.join(home, '.cursor', 'mcp.json'), 'utf8'));
    expect(obj.mcpServers['agentage-memory']).toEqual({ url: URL });
    expect(state.infoMessages[0].message).toContain('Cursor');
    expect(state.openExternalCalls).toHaveLength(0);
  });
});

describe('connectEditor - Windsurf', () => {
  it('writes mcp_config.json with serverUrl and preserves existing servers', async () => {
    state.uriScheme = 'windsurf';
    const file = path.join(home, '.codeium', 'windsurf', 'mcp_config.json');
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file, JSON.stringify({ mcpServers: { other: { url: 'http://x' } } }));
    await connectEditor();
    const obj = JSON.parse(await fs.readFile(file, 'utf8'));
    expect(obj.mcpServers.other).toEqual({ url: 'http://x' });
    expect(obj.mcpServers['agentage-memory']).toEqual({ serverUrl: URL });
  });
});

describe('connectEditor - VS Code', () => {
  it('opens the mcp/install deeplink and writes no file', async () => {
    state.uriScheme = 'vscode';
    await connectEditor();
    expect(state.openExternalCalls).toHaveLength(1);
    expect(state.openExternalCalls[0]).toContain('vscode:mcp/install?');
    expect(state.openExternalCalls[0]).toContain(encodeURIComponent(URL));
  });
});

describe('connectEditor - VSCodium', () => {
  it('uses the vscodium mcp/install deeplink', async () => {
    state.uriScheme = 'vscodium';
    await connectEditor();
    expect(state.openExternalCalls).toHaveLength(1);
    expect(state.openExternalCalls[0]).toContain('vscodium:mcp/install?');
  });
});

describe('connectEditor - corrupt existing config', () => {
  it('does NOT overwrite an unparseable Cursor config (no data loss)', async () => {
    state.uriScheme = 'cursor';
    const file = path.join(home, '.cursor', 'mcp.json');
    await fs.mkdir(path.dirname(file), { recursive: true });
    const corrupt = '{ "mcpServers": { "other": { "url": "http://x" } '; // missing braces
    await fs.writeFile(file, corrupt);
    await connectEditor();
    expect(await fs.readFile(file, 'utf8')).toBe(corrupt); // untouched
    expect(state.errorMessages).toHaveLength(1);
    expect(state.errorMessages[0].message).toContain('invalid JSON');
  });
});

describe('connectEditor - unknown host', () => {
  it('hands the user the server URL to add manually', async () => {
    state.uriScheme = 'emacs';
    await connectEditor();
    expect(state.openExternalCalls).toHaveLength(0);
    expect(state.infoMessages[0].message).toContain(URL);
  });
});

describe('connectEditor - respects agentage.mcpUrl override', () => {
  it('registers the configured endpoint', async () => {
    state.uriScheme = 'cursor';
    state.mcpUrl = 'https://memory.dev.agentage.io/mcp';
    await connectEditor();
    const obj = JSON.parse(await fs.readFile(path.join(home, '.cursor', 'mcp.json'), 'utf8'));
    expect(obj.mcpServers['agentage-memory']).toEqual({ url: 'https://memory.dev.agentage.io/mcp' });
  });
});
