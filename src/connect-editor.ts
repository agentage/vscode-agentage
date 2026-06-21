import * as vscode from 'vscode';
import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import { dirname, basename } from 'node:path';
import {
  detectHost,
  fileTarget,
  mergeServer,
  ConfigParseError,
  SERVER_ID,
  type Host,
} from './connect-core';
import { getMcpUrl } from './config';

const REPO_HELP = 'https://github.com/agentage/vscode-agentage#how-it-works';

const HOST_MSG: Partial<Record<Host, string>> = {
  vscode:
    'Agentage Memory: confirm the install dialog, then open Copilot Chat in Agent mode and sign in when prompted.',
  vscodium:
    'Agentage Memory: confirm the install dialog, then use it from an MCP-capable chat and sign in when prompted.',
  cursor:
    'Agentage Memory added to Cursor. Open Settings > MCP, enable it, and sign in when prompted.',
  windsurf:
    'Agentage Memory added to Windsurf. Open the Cascade MCP panel, click Refresh, then sign in.',
};

/**
 * Registers the remote MCP server with the HOST editor's agent (Copilot / Cursor / Windsurf)
 * so it can read your memory. Never overwrites an unparseable config (no data loss).
 */
export async function connectEditor(): Promise<void> {
  const url = getMcpUrl();
  const host = detectHost(vscode.env.uriScheme);

  // Cursor / Windsurf: write their stable global config file (read-merge-write).
  const target = fileTarget(host, os.homedir(), url);
  if (target) {
    let existing: string | null = null;
    try {
      existing = await fs.readFile(target.file, 'utf8');
    } catch {
      // no file yet
    }

    let merged: string;
    try {
      merged = mergeServer(existing, target.key, SERVER_ID, target.entry);
    } catch (e) {
      if (e instanceof ConfigParseError) {
        const open = 'Open config';
        const copy = 'Copy entry';
        const pick = await vscode.window.showErrorMessage(
          `Agentage Memory: ${target.file} has invalid JSON, so it was left untouched. Add the server yourself.`,
          open,
          copy
        );
        if (pick === open) {
          await vscode.window.showTextDocument(vscode.Uri.file(target.file));
        } else if (pick === copy) {
          await vscode.env.clipboard.writeText(
            JSON.stringify({ [SERVER_ID]: target.entry }, null, 2)
          );
        }
        return;
      }
      throw e;
    }

    try {
      await fs.mkdir(dirname(target.file), { recursive: true });
      await fs.writeFile(target.file, merged, 'utf8');
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      vscode.window.showErrorMessage(`Agentage Memory: could not write ${target.file}: ${msg}`);
      return;
    }

    const openBtn = `Open ${basename(target.file)}`;
    const pick = await vscode.window.showInformationMessage(HOST_MSG[host]!, openBtn);
    if (pick === openBtn) {
      await vscode.window.showTextDocument(vscode.Uri.file(target.file));
    }
    return;
  }

  // VS Code / VSCodium: host-managed one-click install deeplink (host runs OAuth).
  if (host === 'vscode' || host === 'vscodium') {
    const payload = encodeURIComponent(JSON.stringify({ name: SERVER_ID, type: 'http', url }));
    const link = `${vscode.env.uriScheme}:mcp/install?${payload}`;
    const opened = await vscode.env.openExternal(vscode.Uri.parse(link));
    if (opened) {
      const manual = 'Add manually';
      const pick = await vscode.window.showInformationMessage(HOST_MSG[host]!, manual);
      if (pick === manual) {
        await vscode.env.clipboard.writeText(url);
      }
      return;
    }
  }

  // Unknown fork / declined deeplink: an actionable manual path, not a dead end.
  const copy = 'Copy server URL';
  const guide = 'Setup guide';
  const pick = await vscode.window.showInformationMessage(
    `Add Agentage as a Streamable HTTP MCP server (no command/args) in your editor: ${url}`,
    copy,
    guide
  );
  if (pick === copy) {
    await vscode.env.clipboard.writeText(url);
  } else if (pick === guide) {
    await vscode.env.openExternal(vscode.Uri.parse(REPO_HELP));
  }
}
