# Changelog

All notable changes to Hablo are listed here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow [Semantic Versioning](https://semver.org/).

## [Unreleased]

## [0.1.2]

### Fixed

- "Reading…" and `[ ⏹ Stop ]` share one line under the reply. Some terminals stacked them on two.

## [0.1.1]

### Added

- While a reply is read, its row shows a turning glyph in Claude's accent color and "Reading…" beside `[ ⏹ Stop ]`.

### Changed

- The status line under the prompt shows only for readings started with `/speak` or `autoRead`. A reading started from a reply's button shows on that row instead.
- `/speak` prints nothing when it starts or stops a reading, so nothing extra lands in Claude's context. It still answers `voices`, and says when there is nothing to read.
- `/speak` runs at once while Claude is working, so it can stop a reading mid-turn.

### Fixed

- `/clear`, `/resume` and `/branch` stop the voice. Before, it went on with no way left to stop it.

### Docs

- The VS Code extension's chat panel draws nothing from mods: `/speak` works there, without the button.
- Hablo needs Claude Code 2.1.287 or later.

## [0.1.0]

### Added

- A `[ ⏵ Listen ]` button under each reply, which turns into `[ ⏹ Stop ]` while it reads.
- `/speak`: reads the selection or the last reply, and stops a reading when run again. `/speak stop`, `/speak voices` and `/speak <text>`, with Spanish words too.
- Language detection for Spanish, English, Portuguese, French, German and Italian, with a natural macOS voice for each.
- Markdown cleanup before reading: code blocks, links, tables and symbols.
- Settings: `rate`, `voices` and `autoRead`.
- Experimental Windows support: Windows voices through PowerShell `System.Speech`, with voice choice and stop.
