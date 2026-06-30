# Agentage

> Connect your editor's AI to your [Agentage](https://memory.agentage.io) memory - over MCP.

[![VS Marketplace Version](https://img.shields.io/visual-studio-marketplace/v/agentage.agentage?label=VS%20Marketplace)](https://marketplace.visualstudio.com/items?itemName=agentage.agentage)
[![Open VSX Version](https://img.shields.io/open-vsx/v/agentage/agentage?label=Open%20VSX)](https://open-vsx.org/extension/agentage/agentage)
[![Installs](https://img.shields.io/visual-studio-marketplace/i/agentage.agentage?label=installs)](https://marketplace.visualstudio.com/items?itemName=agentage.agentage)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

![Copilot Chat answering from your Agentage memory through the MCP connection](https://github.com/agentage/vscode-agentage/raw/master/media/demo.gif)

On install, Agentage registers your memory with your editor's AI - GitHub Copilot, Cursor, or Windsurf - at `memory.agentage.io/mcp`. Ask in chat, and the agent reads and answers from the same memory every AI you use shares. No command to run, no copy-paste, no local export.

## Features

- **Auto-installed** - on setup the Agentage Memory server registers itself with your editor's AI (VS Code's MCP provider; Cursor / Windsurf config) and appears in the MCP servers list - no command to run.
- **Works where you work** - VS Code (Copilot Agent mode), Cursor, and Windsurf.
- **Your editor handles sign-in** - OAuth 2.1 runs in the host's own MCP flow on first use. The extension stores no tokens and sends no data of its own.
- **One-time switch-on** - the first time its agent uses the server, VS Code shows a trust prompt + browser sign-in (it does not auto-start authenticated servers, by design); after that it stays on.

## Requirements

- An Agentage Memory account. Your editor prompts you to sign in the first time its AI uses the server.
- An MCP-capable AI in your editor: GitHub Copilot (Agent mode) in VS Code, Cursor, or Windsurf Cascade.

## Getting started

1. Install the extension. The **Agentage Memory** server appears automatically in your editor's MCP servers list.
2. Open your AI chat in agent mode; on first use, approve the trust prompt and sign in.
3. Ask something from your memory.

Didn't appear (older editor / unknown fork)? Run **`Agentage: Connect Memory to this editor`** from the Command Palette to register it manually.

## How it works

On activation the extension registers `memory.agentage.io/mcp` (Streamable HTTP) with your editor: VS Code via the **MCP provider API** (stable since 1.99, so the server appears on startup), Cursor and Windsurf by writing their MCP config file (merged, never overwritten). Your editor's agent runs OAuth 2.1 itself on first use. This extension stores no tokens and sends no data of its own. The `Agentage: Connect Memory to this editor` command does the same registration on demand.

## Settings

| Setting | Default | Description |
| --- | --- | --- |
| `agentage.mcpUrl` | `https://memory.agentage.io/mcp` | The MCP endpoint to register. Point at a different stack here. |

## Commands

| Command | What it does |
| --- | --- |
| `Agentage: Connect Memory to this editor` | Registers the MCP server so your editor's AI can read your memory. |

## Compatibility

VS Code (Copilot Agent mode) and via [Open VSX](https://open-vsx.org/extension/agentage/agentage): **Cursor, Windsurf, VSCodium**.

Auto-install needs VS Code **1.99+** (our minimum; the MCP provider API is stable from 1.99, authenticated MCP smoothest on 1.101+). Cursor and Windsurf are version-independent (the extension writes their MCP config file).

## Privacy

The extension only writes the server URL into your editor's MCP config (or opens the install deeplink). It stores no tokens, collects no telemetry, and sends no data of its own. Sign-in and all memory access happen through your editor's own MCP client.

## License

[MIT](./LICENSE)
