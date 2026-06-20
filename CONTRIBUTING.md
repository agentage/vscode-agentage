# Contributing

## Develop

```bash
npm install
npm run compile      # bundle to dist/extension.js (esbuild)
npm run watch        # rebuild on change
npm test             # vitest unit tests (pure helpers)
npm run check-types  # tsc --noEmit
```

Press **F5** in VS Code to launch the Extension Development Host, then run **`Agentage: Search Memory`** from the command palette.

Point at a non-prod stack while testing via the `agentage.mcpUrl` setting.

## Architecture

A thin [MCP](https://modelcontextprotocol.io) client over `https://memory.agentage.io/mcp` (Streamable HTTP). It calls two of the six memory tools: `memory__search` and `memory__read`. OAuth 2.1 + PKCE + DCR is handled by the MCP SDK's `OAuthClientProvider`; the loopback redirect is captured on `127.0.0.1` and the token is stored in `SecretStorage`.

```
src/extension.ts     activate(): one command + read-only doc provider
src/search.ts        QuickPick: debounce + cancel-in-flight + sign-out button
src/mcp-client.ts    MCP Client + StreamableHTTPClientTransport (connect once)
src/auth.ts          OAuthClientProvider backed by SecretStorage + loopback callback
src/doc-provider.ts  agentage-memory:// read-only document provider
src/search-core.ts   pure helpers (the vitest-tested surface)
```

## Package a .vsix

```bash
npx @vscode/vsce package          # agentage-memory-<version>.vsix
npx @vscode/vsce ls               # confirm only dist/, README, LICENSE, CHANGELOG, icon, package.json ship
code --install-extension agentage-memory-<version>.vsix
```

## Release

Publishing to the VS Code Marketplace and Open VSX is automated by `.github/workflows/publish.yml`, triggered on a `v*` tag. Bump `version`, update `CHANGELOG.md`, dogfood the `.vsix` in VS Code and a fork, then:

```bash
git tag v<version> && git push --tags
```
