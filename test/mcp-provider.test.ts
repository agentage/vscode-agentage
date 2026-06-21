import { describe, it, expect, beforeEach } from 'vitest';
import { state, __reset } from './vscode-mock';
import { registerMcpProvider } from '../src/mcp-provider';

const ctx = () => ({ subscriptions: [] as { dispose(): void }[] });

beforeEach(() => __reset());

describe('registerMcpProvider', () => {
  it('registers the native provider under the contributes id', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ok = registerMcpProvider(ctx() as any);
    expect(ok).toBe(true);
    expect(state.mcpProviderId).toBe('agentageMemory');
  });

  it('provides one http server definition for the configured url', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    registerMcpProvider(ctx() as any);
    const defs = await state.mcpProvider.provideMcpServerDefinitions();
    expect(defs).toHaveLength(1);
    expect(defs[0].label).toBe('Agentage Memory');
    expect(defs[0].uri.toString()).toBe('https://memory.agentage.io/mcp');
  });

  it('honors the agentage.mcpUrl override', async () => {
    state.mcpUrl = 'https://memory.dev.agentage.io/mcp';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    registerMcpProvider(ctx() as any);
    const defs = await state.mcpProvider.provideMcpServerDefinitions();
    expect(defs[0].uri.toString()).toBe('https://memory.dev.agentage.io/mcp');
  });
});
