# Changelog

All notable changes to Hablo are listed here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow [Semantic Versioning](https://semver.org/).

## [Unreleased]

## [0.1.0]

### Added

- A `[ ⏵ Listen ]` button under each reply, which turns into `[ ⏹ Stop ]` while it reads.
- `/speak`: reads the selection or the last reply, and stops a reading when run again. `/speak stop`, `/speak voices` and `/speak <text>`, with Spanish words too.
- Language detection for Spanish, English, Portuguese, French, German and Italian, with a natural macOS voice for each.
- Markdown cleanup before reading: code blocks, links, tables and symbols.
- Settings: `rate`, `voices` and `autoRead`.
