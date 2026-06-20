import * as vscode from 'vscode';

export const SCHEME = 'agentage-memory';
export const CLIENT_NAME = 'agentage Memory (VS Code)';

// Read-only search needs only memory:read; offline_access keeps the refresh token.
export const SCOPE = 'memory:read offline_access';

export function getMcpUrl(): string {
  const configured = vscode.workspace
    .getConfiguration('agentage')
    .get<string>('mcpUrl');
  return (configured && configured.trim()) || 'https://memory.agentage.io/mcp';
}
