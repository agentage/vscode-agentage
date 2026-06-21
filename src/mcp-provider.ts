import * as vscode from 'vscode';
import { getMcpUrl } from './config';

// Must match contributes.mcpServerDefinitionProviders[].id in package.json.
const PROVIDER_ID = 'agentageMemory';

/**
 * Auto-registers the Agentage Memory server with VS Code's MCP so it appears in the
 * MCP servers list on startup - no command needed. Returns false (no-op) on editors
 * without the native API (older VS Code, Cursor, Windsurf). VS Code drives OAuth itself
 * the first time its agent starts the server (one-time trust + sign-in - it does not
 * auto-start auth'd servers, by design).
 */
export function registerMcpProvider(context: vscode.ExtensionContext): boolean {
  if (typeof vscode.lm?.registerMcpServerDefinitionProvider !== 'function') {
    return false;
  }
  const didChange = new vscode.EventEmitter<void>();
  const provider: vscode.McpServerDefinitionProvider = {
    onDidChangeMcpServerDefinitions: didChange.event,
    provideMcpServerDefinitions: () => [
      new vscode.McpHttpServerDefinition('Agentage Memory', vscode.Uri.parse(getMcpUrl())),
    ],
    resolveMcpServerDefinition: (server) => server,
  };
  context.subscriptions.push(
    didChange,
    vscode.lm.registerMcpServerDefinitionProvider(PROVIDER_ID, provider)
  );
  return true;
}
