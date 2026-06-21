# Agentage

> Connect your editor's AI to your [Agentage](https://memory.agentage.io) memory - over MCP.

[![VS Marketplace Version](https://img.shields.io/visual-studio-marketplace/v/agentage.agentage?label=VS%20Marketplace)](https://marketplace.visualstudio.com/items?itemName=agentage.agentage)
[![Open VSX Version](https://img.shields.io/open-vsx/v/agentage/agentage?label=Open%20VSX)](https://open-vsx.org/extension/agentage/agentage)
[![Installs](https://img.shields.io/visual-studio-marketplace/i/agentage.agentage?label=installs)](https://marketplace.visualstudio.com/items?itemName=agentage.agentage)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

![Copilot Chat answering from your Agentage memory through the MCP connection](https://github.com/agentage/vscode-agentage/raw/master/media/demo.gif)

One command wires your editor's AI - GitHub Copilot, Cursor, or Windsurf - to your Agentage memory at `memory.agentage.io/mcp`. Ask in chat, and the agent reads and answers from the same memory every AI you use shares. No copy-paste, no local export.

## Features

- **One command** - `Agentage: Connect Memory to this editor` registers the Agentage MCP server with your editor's AI.
- **Works where you work** - VS Code (Copilot Agent mode), Cursor, and Windsurf.
- **Your editor handles sign-in** - OAuth 2.1 runs in the host's own MCP flow. The extension stores no tokens and sends no data of its own.

## Requirements

- An Agentage Memory account. Your editor prompts you to sign in the first time its AI uses the server.
- An MCP-capable AI in your editor: GitHub Copilot (Agent mode) in VS Code, Cursor, or Windsurf Cascade.

## Getting started

1. Run **`Agentage: Connect Memory to this editor`** from the Command Palette (`Ctrl/Cmd+Shift+P`).
2. VS Code: confirm the install dialog. Cursor / Windsurf: enable or refresh the server in the MCP panel.
3. Open your AI chat in agent mode and ask something from your memory - sign in when prompted.

## How it works

The command registers `memory.agentage.io/mcp` (Streamable HTTP) with your editor's MCP configuration - the VS Code install deeplink, or the Cursor / Windsurf config file (merged, never overwritten). Your editor's agent then connects and runs OAuth 2.1 itself. This extension stores no tokens and sends no data of its own.

## Settings

| Setting | Default | Description |
| --- | --- | --- |
| `agentage.mcpUrl` | `https://memory.agentage.io/mcp` | The MCP endpoint to register. Point at a different stack here. |

## Commands

| Command | What it does |
| --- | --- |
| `Agentage: Connect Memory to this editor` | Registers the MCP server so your editor's AI can read your memory. |

## Compatibility

VS Code (Copilot Agent mode), and via [Open VSX](https://open-vsx.org/extension/agentage/agentage): **Cursor, Windsurf, VSCodium**.

## Privacy

The extension only writes the server URL into your editor's MCP config (or opens the install deeplink). It stores no tokens, collects no telemetry, and sends no data of its own. Sign-in and all memory access happen through your editor's own MCP client.

## License

[MIT](./LICENSE)
