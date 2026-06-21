# Contributing

## Develop

```bash
npm install
npm run compile      # bundle to dist/extension.js (esbuild)
npm run watch        # rebuild on change
npm test             # vitest unit tests (pure helpers)
npm run check-types  # tsc --noEmit
```

Press **F5** in VS Code to launch the Extension Development Host, then run **`Agentage: Connect Memory to this editor`** from the command palette.

Point at a non-prod stack via the `agentage.mcpUrl` setting before connecting.

## Architecture

The extension registers the remote MCP server (`memory.agentage.io/mcp`) with the
host editor's AI agent - it does not talk to MCP itself, and it has no runtime
dependencies. The host editor runs OAuth 2.1 when its agent first uses the server.

```
src/extension.ts      activate(): auto-register (provider + fork config) + the manual command
src/mcp-provider.ts   VS Code native MCP provider (onStartupFinished) - server appears with no command
src/connect-editor.ts the manual command + autoConnectForks (silent idempotent Cursor/Windsurf write)
src/connect-core.ts   pure helpers (host detect, per-editor JSON, JSONC-safe merge, idempotency check) - vitest-tested
src/config.ts         the agentage.mcpUrl setting
```

Auto-install: VS Code is contributed via `contributes.mcpServerDefinitionProviders` + `registerMcpServerDefinitionProvider` (the id must match; activation is `onStartupFinished`). The forks have no such API, so the extension writes their config file directly.

Per-editor config shapes differ - VS Code `servers` + `type:http` + `url`, Cursor
`mcpServers` + `url`, Windsurf `mcpServers` + `serverUrl` - so existing config is
read-merged, never overwritten.

## Package a .vsix

```bash
npx @vscode/vsce package          # agentage-<version>.vsix
npx @vscode/vsce ls               # confirm only dist/, README, LICENSE, CHANGELOG, icon, package.json ship
code --install-extension agentage-<version>.vsix
```

## Release

Publishing to the VS Code Marketplace and Open VSX is automated by
`.github/workflows/publish.yml`, triggered on a `v*` tag. Bump `version`, update
`CHANGELOG.md`, dogfood the `.vsix` in VS Code and a fork, then:

```bash
git tag v<version> && git push --tags
```
