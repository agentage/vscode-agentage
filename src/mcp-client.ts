import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { UnauthorizedError } from '@modelcontextprotocol/sdk/client/auth.js';
import type { VsCodeOAuthProvider } from './auth';
import { getMcpUrl } from './config';
import {
  extractBody,
  mapSearchResults,
  type MemoryHit,
} from './search-core';

type ToolResult = {
  content?: Array<{ type: string; text?: string }>;
  structuredContent?: unknown;
};

function textOf(result: ToolResult): string {
  return (result.content ?? [])
    .filter((c) => c.type === 'text' && typeof c.text === 'string')
    .map((c) => c.text as string)
    .join('\n');
}

function jsonOf(result: ToolResult): unknown {
  if (result.structuredContent !== undefined) return result.structuredContent;
  try {
    return JSON.parse(textOf(result));
  } catch {
    return {};
  }
}

/** Lazily-connected MCP client for memory.agentage.io/mcp. Connects (with OAuth) once. */
export class MemoryClient {
  private client?: Client;
  private connecting?: Promise<Client>;

  constructor(private readonly auth: VsCodeOAuthProvider) {}

  private async connect(): Promise<Client> {
    if (this.client) return this.client;
    if (this.connecting) return this.connecting;
    this.connecting = this.doConnect();
    try {
      return await this.connecting;
    } finally {
      this.connecting = undefined;
    }
  }

  private async doConnect(): Promise<Client> {
    const url = new URL(getMcpUrl());
    await this.auth.startCallback();
    const client = new Client(
      { name: 'agentage-vscode', version: '0.0.1' },
      { capabilities: {} }
    );
    try {
      const transport = new StreamableHTTPClientTransport(url, {
        authProvider: this.auth,
      });
      try {
        await client.connect(transport);
      } catch (e) {
        if (!(e instanceof UnauthorizedError)) throw e;
        // First run: browser is opening; capture the loopback redirect, exchange, reconnect.
        const code = await this.auth.waitForCode();
        await transport.finishAuth(code);
        const authed = new StreamableHTTPClientTransport(url, {
          authProvider: this.auth,
        });
        await client.connect(authed);
      }
    } finally {
      this.auth.stopCallback();
    }
    this.client = client;
    return client;
  }

  async search(query: string, limit = 20, signal?: AbortSignal): Promise<MemoryHit[]> {
    const client = await this.connect();
    const result = (await client.callTool(
      { name: 'memory__search', arguments: { query, limit } },
      undefined,
      { signal }
    )) as ToolResult;
    return mapSearchResults(jsonOf(result));
  }

  async read(path: string): Promise<string> {
    const client = await this.connect();
    const result = (await client.callTool({
      name: 'memory__read',
      arguments: { path },
    })) as ToolResult;
    return extractBody(jsonOf(result), textOf(result));
  }

  async disconnect(): Promise<void> {
    try {
      await this.client?.close();
    } catch {
      // ignore
    }
    this.client = undefined;
  }
}
