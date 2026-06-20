import * as vscode from 'vscode';
import type { MemoryClient } from './mcp-client';

/** Serves memory bodies on the agentage-memory:// scheme. These docs are read-only. */
export class MemoryDocProvider implements vscode.TextDocumentContentProvider {
  constructor(private readonly memory: MemoryClient) {}

  async provideTextDocumentContent(uri: vscode.Uri): Promise<string> {
    const path = uri.path.replace(/^\/+/, '');
    try {
      return await this.memory.read(path);
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      return `> agentage Memory: failed to load \`${path}\`\n>\n> ${message}`;
    }
  }
}
