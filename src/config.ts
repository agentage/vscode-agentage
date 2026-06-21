import * as vscode from 'vscode';

/** The MCP endpoint registered with the editor's AI. Override to target a different stack. */
export function getMcpUrl(): string {
  const configured = vscode.workspace
    .getConfiguration('agentage')
    .get<string>('mcpUrl');
  return (configured && configured.trim()) || 'https://memory.agentage.io/mcp';
}
