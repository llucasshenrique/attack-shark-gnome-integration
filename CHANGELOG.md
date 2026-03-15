# Changelog

All notable changes to this project will be documented in this file.

## [0.1.7] - 2026-03-14
### Added
- Linux packaging pipeline for `.deb` and `.rpm` using `nfpm` (`nfpm.yaml`, `scripts/nfpm.sh`, `scripts/package-deb.sh`, `scripts/package-rpm.sh`).
- Post-install automation for package setup (`scripts/nfpm-postinstall.sh`).
- Containerized package validation flow with dedicated test scripts and Dockerfiles (`scripts/test-install-*.sh`, `scripts/test-packages-containers.sh`, `.docker/Dockerfile.*`).

### Changed
- Release and CI workflows updated to support package artifacts and safer release orchestration.
- Release execution now uses tag/release concurrency serialization to avoid overlapping runs.
- CLI internals (`driver`, parsers, JSON/error output and command handlers) adjusted for packaged binary/runtime behavior.
- Extension integration and project documentation updated to match new packaging/distribution flow.

## [0.1.6] - 2026-03-14
### Changed
- Release workflow asset upload made idempotent and retry-based.

### Fixed
- Reduced release failures caused by transient upload errors or re-upload attempts of existing assets.

## [0.1.5] - 2026-03-14
### Added
- Packaging strategy to produce extension artifact by UUID and a separate pure CLI artifact.

### Changed
- Release workflow reorganized to publish split artifacts instead of a single bundled output.

## [0.1.4] - 2026-03-14
### Changed
- Release workflow now uploads extension ZIP assets directly to the existing GitHub Release via `gh` CLI.
- NPM publish step removed from release flow.
- Redundant `gh auth` setup step removed (runner token is used directly).

## [0.1.3] - 2026-03-14
### Added
- Modular CLI architecture with dedicated layers: `commands`, `core`, `parsers`, `output`, `types`.
- Dedicated parser test files co-located with implementation: `cli/parsers/dpi.spec.ts` and `cli/parsers/polling.spec.ts`.
- New build scripts for dual outputs:
	- `build:bin` -> compiled Bun binary `dist/attack-shark-cli`
	- `build:esm` -> ESM bundle `dist/attack-shark-cli.mjs`

### Changed
- CLI entrypoint (`cli/index.ts`) became an orchestrator delegating command logic to module handlers.
- Error handling centralized in `cli/output/errors.ts` and exit codes in `cli/output/exit-codes.ts`.
- Logger now writes diagnostics explicitly to `stderr` with Bun.
- Test discovery updated to co-located pattern (`cli/**/*.spec.ts`).
- Release workflow updated to use `NPM_TOKEN` from environment.

### Removed
- Legacy centralized test folder `cli/test/` in favor of co-located tests.

### Documentation
- README updated with Bun-only workflow, architecture map, co-located test convention, and dual build outputs.

## [0.1.2] - 2026-03-14
### Added
- Automatic packaged extension installation via `scripts/install-extension.sh` in `postpackage`.
- Documentation for `bun run package` build-and-install flow.

### Changed
- CI and release workflows migrated to Bun-based execution and updated test/build commands.
- Installer now requires Bun in environment.
- Migrated GNOME extension entrypoint to class-based `Extension` API style.
- Extension now resolves CLI by preferring bundled `attack-shark-cli` and falling back to Bun in development.
- Extension menu now exposes all configured DPI stages (`800`, `1600`, `2400`, `3200`, `5000`, `22000`) and polling rates (`125`, `250`, `500`, `1000`).

### Fixed
- Corrected DPI switching mismatch between extension UI values and CLI accepted parameters.
- CLI `dpi` command now accepts stage input and mapped DPI values used by the extension.
- Removed deprecated `bin/asx11-cli` path from active flow.

## [0.1.1] - 2026-03-14
### Changed
- CI and release workflows updated to newer GitHub Actions setup.
- Added modern dependency caching strategy in automation pipelines.

## [0.1.0] - 2026-03-14
### Added
- Initial CLI commands implementation: `battery`, `dpi`, `polling` with JSON output.
- GNOME Shell extension (GNOME 45+ compatible) with tray UI for battery, DPI and polling configuration.
- `install.sh` script to install dependencies and copy extension to user extensions directory.
- udev rules file `cli/udev/99-attack-shark.rules` and documentation to avoid requiring `sudo` in normal usage.
- Driver dependency via Git: `github:HarukaYamamoto0/attack-shark-x11-driver`.

### Fixed
- CLI JSON output routed to `stdout` and logs to `stderr` to keep extension parsing stable.
