import * as vscode from 'vscode';
import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import { dirname } from 'node:path';
import { detectHost, fileTarget, mergeServer, SERVER_ID, type Host } from './connect-core';
import { getMcpUrl } from './config';

const HOST_MSG: Partial<Record<Host, string>> = {
  vscode:
    'Agentage Memory: confirm the install dialog, then open Copilot Chat in Agent mode and sign in when prompted.',
  cursor:
    'Agentage Memory added to Cursor. Open Settings > MCP, enable it, and sign in when prompted.',
  windsurf:
    'Agentage Memory added to Windsurf. Open the Cascade MCP panel, click Refresh, then sign in.',
};

/**
 * Registers the remote MCP server with the HOST editor's agent (Copilot / Cursor / Windsurf)
 * so it can read your memory - distinct from the in-process client behind Search Memory.
 */
export async function connectEditor(): Promise<void> {
  const url = getMcpUrl();
  const host = detectHost(vscode.env.uriScheme);

  // Cursor / Windsurf: write their stable global config file (read-merge-write).
  const target = fileTarget(host, os.homedir(), url);
  if (target) {
    try {
      await fs.mkdir(dirname(target.file), { recursive: true });
      let existing: string | null = null;
      try {
        existing = await fs.readFile(target.file, 'utf8');
      } catch {
        // no file yet
      }
      await fs.writeFile(
        target.file,
        mergeServer(existing, target.key, SERVER_ID, target.entry),
        'utf8'
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      vscode.window.showErrorMessage(`Agentage Memory: could not write ${target.file}: ${msg}`);
      return;
    }
    const pick = await vscode.window.showInformationMessage(HOST_MSG[host]!, 'Open config');
    if (pick === 'Open config') {
      await vscode.window.showTextDocument(vscode.Uri.file(target.file));
    }
    return;
  }

  // VS Code: host-managed one-click install deeplink (global, persists, host runs OAuth).
  if (host === 'vscode') {
    const payload = encodeURIComponent(JSON.stringify({ name: SERVER_ID, type: 'http', url }));
    const link = `${vscode.env.uriScheme}:mcp/install?${payload}`;
    const opened = await vscode.env.openExternal(vscode.Uri.parse(link));
    if (opened) {
      vscode.window.showInformationMessage(HOST_MSG.vscode!);
      return;
    }
  }

  // VSCodium / unknown / deeplink declined: hand the user the URL to add manually.
  const copy = 'Copy server URL';
  const pick = await vscode.window.showInformationMessage(
    `Add this MCP server in your editor to let its AI read your memory: ${url}`,
    copy
  );
  if (pick === copy) {
    await vscode.env.clipboard.writeText(url);
  }
}
