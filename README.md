# Agentage Memory

> Connect VS Code to your [Agentage Memory](https://memory.agentage.io) in the cloud, and search it - read-only, over MCP.

[![VS Marketplace Version](https://img.shields.io/visual-studio-marketplace/v/agentage.agentage-memory?label=VS%20Marketplace)](https://marketplace.visualstudio.com/items?itemName=agentage.agentage-memory)
[![Open VSX Version](https://img.shields.io/open-vsx/v/agentage/agentage-memory?label=Open%20VSX)](https://open-vsx.org/extension/agentage/agentage-memory)
[![Installs](https://img.shields.io/visual-studio-marketplace/i/agentage.agentage-memory?label=installs)](https://marketplace.visualstudio.com/items?itemName=agentage.agentage-memory)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

![Copilot Chat answering from your Agentage Memory through the MCP connection](https://github.com/agentage/vscode-memory/raw/master/media/demo.gif)

This extension connects your editor to your **cloud memory over MCP** - the hosted Agentage Memory endpoint at `memory.agentage.io/mcp`, the same memory every AI you use already reads and writes. One sign-in, then search it from the command palette. No local copy, no API keys.

## Features

- **Connect to the cloud MCP** - one-click **OAuth 2.1** (PKCE + Dynamic Client Registration) sign-in to `memory.agentage.io/mcp` (Streamable HTTP). The connection is the product; everything below runs on top of it.
- **Search your memory** - `Agentage: Search Memory` runs live search-as-you-type; each hit shows its title, file path, and the matched line.
- **Open read-only** - press Enter to open a hit as a read-only Markdown document. No writes, ever.
- **Point at any stack** - a gear button in the search box (and the `agentage.mcpUrl` setting) lets you target prod, dev, or self-hosted.
- **Sign out** - a button in the search box disconnects and clears the token.

## Requirements

- An Agentage Memory account. The first search opens your browser to sign in.

## Getting started

1. Run **`Agentage: Search Memory`** from the Command Palette (`Ctrl/Cmd+Shift+P`).
2. The status bar shows the sign-in host and your browser opens - approve the connection to `auth.agentage.io`.
3. Back in the editor, type to search; press **Enter** on a result to open it.
4. Use the **gear** button to open settings, or the **sign-out** button to disconnect.

## Authentication & privacy

- Sign-in is **OAuth 2.1 + PKCE + Dynamic Client Registration** against `auth.agentage.io` (opens your browser; the redirect comes back to a local loopback port).
- Your token is stored in **VS Code SecretStorage** (your OS keychain) - never in settings or logs.
- Only your typed query and the path you open are sent to the MCP endpoint.
- **Read-only. No writes. No telemetry.**

## Settings

| Setting | Default | Description |
| --- | --- | --- |
| `agentage.mcpUrl` | `https://memory.agentage.io/mcp` | The cloud memory MCP endpoint (Streamable HTTP). Point at a different stack here. |

## Compatibility

VS Code, and forks via [Open VSX](https://open-vsx.org/extension/agentage/agentage-memory): **Cursor, Windsurf, VSCodium**.

## Known limitations (v1)

- Search is literal substring (`git grep`), not semantic.
- Each keystroke is a live network round-trip (debounced, prior request cancelled).
- A single memory is assumed; multi-vault selection lands later.

## Links

[Homepage](https://memory.agentage.io) · [Repository](https://github.com/agentage/vscode-memory) · [Issues](https://github.com/agentage/vscode-memory/issues) · [Changelog](./CHANGELOG.md)

## License

[MIT](./LICENSE)
