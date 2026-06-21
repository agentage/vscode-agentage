import * as vscode from 'vscode';
import { connectEditor } from './connect-editor';

export function activate(context: vscode.ExtensionContext): void {
  context.subscriptions.push(
    vscode.commands.registerCommand('agentage.connectEditor', () => connectEditor())
  );
}

export function deactivate(): void {
  // nothing to tear down
}
