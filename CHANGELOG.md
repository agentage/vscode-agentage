# Changelog

All notable changes to the Agentage Memory extension are documented here. The
format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and
this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.0.1] - 2026-06-21

### Added

- `Agentage: Search Memory` - live search-as-you-type over your remote memory, results show title, path, and matched line.
- Open a hit as a read-only Markdown document via the `agentage-memory://` scheme.
- OAuth 2.1 + PKCE + Dynamic Client Registration sign-in; token stored in VS Code SecretStorage.
- Settings (gear) and sign-out buttons inside the search box.
- `agentage.mcpUrl` setting to target a different stack.
