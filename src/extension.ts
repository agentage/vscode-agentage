import * as vscode from 'vscode';
import { VsCodeOAuthProvider } from './auth';
import { MemoryClient } from './mcp-client';
import { MemoryDocProvider } from './doc-provider';
import { runSearch } from './search';
import { SCHEME } from './config';

export function activate(context: vscode.ExtensionContext): void {
  const auth = new VsCodeOAuthProvider(context.secrets);
  const memory = new MemoryClient(auth);

  const signOut = async () => {
    await memory.disconnect();
    await auth.signOut();
    vscode.window.showInformationMessage('Agentage Memory: signed out.');
  };

  context.subscriptions.push(
    vscode.workspace.registerTextDocumentContentProvider(
      SCHEME,
      new MemoryDocProvider(memory)
    ),
    vscode.commands.registerCommand('agentage.searchMemory', () =>
      runSearch(memory, signOut)
    )
  );
}

export function deactivate(): void {
  // nothing to tear down: the MCP client is stateless HTTP
}
