# Changelog

All notable changes to the Agentage extension are documented here. The format is
based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and this project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.0.1] - 2026-06-21

### Added

- `Agentage: Connect Memory to this editor` - registers the Agentage MCP server (`memory.agentage.io/mcp`) with your editor's AI so it can read your memory. VS Code uses the install deeplink; Cursor and Windsurf get their config file written (merged, never clobbered).
- `agentage.mcpUrl` setting to target a different stack.
