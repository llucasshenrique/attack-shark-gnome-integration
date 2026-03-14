# Changelog

All notable changes to this project will be documented in this file.

## [0.1.3] - 2026-03-14
### Added
- Modular CLI architecture with dedicated layers: `commands`, `core`, `parsers`, `output`, `types`.
- Dedicated parser test files co-located with code: `cli/parsers/dpi.spec.ts` and `cli/parsers/polling.spec.ts`.
- New build scripts for dual artifacts:
	- `build:bin` -> compiled Bun binary `dist/attack-shark-cli`
	- `build:esm` -> ESM bundle `dist/attack-shark-cli.mjs`

### Changed
- CLI entrypoint (`cli/index.ts`) now acts as orchestrator and delegates command logic to module handlers.
- Error handling is centralized in `cli/output/errors.ts` and exit codes in `cli/output/exit-codes.ts`.
- Logger now writes diagnostics explicitly to `stderr` via Bun (`Bun.stderr.write`).
- Test discovery updated to co-located pattern (`cli/**/*.spec.ts`).

### Removed
- Legacy centralized test folder `cli/test/` in favor of co-located tests.

### Documentation
- README updated with Bun-only workflow, new CLI architecture map, co-located test convention, and dual build outputs.

## [0.1.2] - 2026-03-14
### Added
- Automatic packaged extension installation via `scripts/install-extension.sh` in `postpackage`.
- Documentation for `bun run package` build+install flow.

### Changed
- Migrated GNOME extension entrypoint to current class-based `Extension` API style.
- Extension now resolves CLI by preferring bundled `attack-shark-cli` and falling back to Bun in development.
- Extension menu now exposes all configured DPI stages (`800`, `1600`, `2400`, `3200`, `5000`, `22000`) and polling rates (`125`, `250`, `500`, `1000`).

### Fixed
- Corrected DPI switching mismatch between extension UI values and CLI accepted parameters.
- CLI `dpi` command now accepts stage input and mapped DPI values used by the extension.

## [0.1.0] - 2026-03-14
### Added
- Initial implementation of CLI commands: `battery`, `dpi`, `polling` with JSON output.
- GNOME Shell extension (GNOME 45+ compatible) providing tray UI for battery, DPI and polling configuration.
- `install.sh` script to install dependencies and copy the extension to the user extensions folder.
- udev rules file `cli/udev/99-attack-shark.rules` and documentation to avoid needing sudo for normal usage.

### Fixed
- Ensure CLI outputs JSON on stdout and logs to stderr to avoid breaking the GNOME extension parser.

### Notes
- Driver dependency is included via Git: `github:HarukaYamamoto0/attack-shark-x11-driver`.
