# Changelog

All notable changes to the Agentage extension are documented here. The format is
based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and this project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.0.1] - 2026-06-21

### Added

- **Auto-install on setup** - the Agentage Memory server registers itself with your editor's AI on activation: VS Code via the native MCP provider API (appears in the MCP servers list, no command), Cursor and Windsurf via their config file (idempotent, merged, never clobbered). VS Code runs OAuth itself on first use (one-time trust + sign-in).
- `Agentage: Connect Memory to this editor` - the same registration on demand (manual re-connect / unknown forks; uses the VS Code install deeplink).
- `agentage.mcpUrl` setting to target a different stack.
