import * as vscode from 'vscode';
import type { MemoryClient } from './mcp-client';
import { hitToQuickItem } from './search-core';
import { SCHEME } from './config';

const DEBOUNCE_MS = 250;

const settingsButton: vscode.QuickInputButton = {
  iconPath: new vscode.ThemeIcon('gear'),
  tooltip: 'Agentage Memory settings',
};

const signOutButton: vscode.QuickInputButton = {
  iconPath: new vscode.ThemeIcon('sign-out'),
  tooltip: 'Sign out of Agentage Memory',
};

/** The one feature: live search-as-you-type, open the hit read-only on accept. */
export function runSearch(memory: MemoryClient, signOut: () => Thenable<void>): void {
  const qp = vscode.window.createQuickPick();
  qp.placeholder = 'Search your memory...';
  qp.buttons = [settingsButton, signOutButton];
  // memory__search is substring, so the snippet contains the query -> matchOnDetail
  // keeps server hits visible past VS Code's own input filter.
  qp.matchOnDescription = true;
  qp.matchOnDetail = true;

  let timer: ReturnType<typeof setTimeout> | undefined;
  let inflight: AbortController | undefined;

  const search = (value: string) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(async () => {
      const query = value.trim();
      if (!query) {
        qp.items = [];
        return;
      }
      inflight?.abort();
      const controller = new AbortController();
      inflight = controller;
      qp.busy = true;
      try {
        const hits = await memory.search(query, 20, controller.signal);
        if (controller.signal.aborted) return;
        qp.items = hits.map(hitToQuickItem);
      } catch (e) {
        if (controller.signal.aborted) return;
        qp.items = [];
        const message = e instanceof Error ? e.message : String(e);
        vscode.window.setStatusBarMessage(`agentage Memory: ${message}`, 4000);
      } finally {
        if (!controller.signal.aborted) qp.busy = false;
      }
    }, DEBOUNCE_MS);
  };

  qp.onDidChangeValue(search);

  qp.onDidTriggerButton(async (button) => {
    if (button === settingsButton) {
      qp.hide();
      await vscode.commands.executeCommand(
        'workbench.action.openSettings',
        '@ext:agentage.agentage-memory'
      );
    } else if (button === signOutButton) {
      qp.hide();
      await signOut();
    }
  });

  qp.onDidAccept(async () => {
    const path = qp.selectedItems[0]?.description;
    qp.hide();
    if (!path) return;
    const uri = vscode.Uri.from({ scheme: SCHEME, path: `/${path}` });
    try {
      const doc = await vscode.workspace.openTextDocument(uri);
      await vscode.languages.setTextDocumentLanguage(doc, 'markdown');
      await vscode.window.showTextDocument(doc, { preview: true });
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      vscode.window.showErrorMessage(`agentage Memory: could not open ${path}: ${message}`);
    }
  });

  qp.onDidHide(() => {
    inflight?.abort();
    if (timer) clearTimeout(timer);
    qp.dispose();
  });

  qp.show();
}
