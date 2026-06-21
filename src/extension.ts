import * as vscode from 'vscode';
import { connectEditor, autoConnectForks } from './connect-editor';
import { registerMcpProvider } from './mcp-provider';

export function activate(context: vscode.ExtensionContext): void {
  // Auto-install the server so it's available without running a command:
  // VS Code via the native MCP provider; Cursor/Windsurf via their config file.
  registerMcpProvider(context);
  void autoConnectForks();

  // Manual command for re-connecting, unknown forks, or hosts the auto path skipped.
  context.subscriptions.push(
    vscode.commands.registerCommand('agentage.connectEditor', () => connectEditor())
  );
}

export function deactivate(): void {
  // nothing to tear down
}
