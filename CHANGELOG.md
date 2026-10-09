# Changelog

All notable changes to Hablo are listed here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Docs

- Windows is supported: voices, accents, stop and `/clear` tested on Windows 11.

## [0.2.0]

### Changed

- **Breaking:** the command is now `/hablo`, named after the plugin, instead of `/speak`. Mods' commands carry no plugin prefix, so a generic name could clash with another plugin or a future Claude Code command. `/hablo stop`, `/hablo voices` and `/hablo <text>` work as `/speak` did.

### Fixed

- Windows Terminal drew two glyphs as color emoji. The reading indicator no longer uses `✳`, and Stop shows `■` instead of `⏹`. A test checks that no glyph Hablo draws has an emoji form.

## [0.1.3]

### Fixed

- "Reading…" and `[ ⏹ Stop ]` now really share one line. The fix in 0.1.2 missed the cause: they sat in a JSX fragment, which draws as a column.

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
