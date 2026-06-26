# Agentage VS Code extension — CLAUDE.md

Editor extension (dir `vscode-memory`, **repo `vscode-agentage`**, published id `agentage.agentage`).
On activation it registers the cloud MCP server `memory.agentage.io/mcp` with the editor's AI
(Copilot / Cursor / Windsurf). **Stores no tokens, sends no data of its own** — the editor's
own MCP client runs OAuth and all memory access. Keep that boundary.

## Layout (src/)
- `extension.ts` — activate: register the MCP provider + the connect command.
- `mcp-provider.ts` — VS Code **MCP provider API** path (stable 1.99+; server appears on startup).
- `connect-editor.ts` — Cursor / Windsurf path: write their MCP config file (**merge, never overwrite**).
- `connect-core.ts` — shared registration logic behind both paths.
- `config.ts` — the `agentage.mcpUrl` setting (default `https://memory.agentage.io/mcp`).

## Rules
- Two registration paths: VS Code via the provider API, Cursor/Windsurf via config-file write. Both go through `connect-core`.
- Never persist tokens or telemetry. The only thing written is the server URL into the editor's MCP config.
- Min engine `vscode ^1.99.0` (MCP provider API stable from 1.99; authenticated MCP smoothest 1.101+).

## Build / publish
`npm run compile` (esbuild) · `npm run watch` (dev) · `npm run package` (vsix). Published to **VS Marketplace + Open VSX** (NOT npm) via CI — never local publish.
