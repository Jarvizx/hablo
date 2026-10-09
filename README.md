# Hablo

**Hear Claude Code's replies aloud, in your language.**

[![CI](https://github.com/Jarvizx/hablo/actions/workflows/ci.yml/badge.svg)](https://github.com/Jarvizx/hablo/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

[Leer en español](README.es.md)

<!-- Demo: add docs/demo.gif here once it is recorded. -->

Hablo is a plugin for Claude Code that reads replies aloud: to rest your eyes, to listen while you look at the code, or to practice a language you are learning. It puts a **Listen** button under each reply, adds a `/hablo` command, and picks a natural voice for the language of each reply. It uses the voices that come with macOS and Windows: free, offline, no API keys.

## Install

At the Claude Code prompt:

```
/plugin install hablo --marketplace Jarvizx/hablo
```

Answer `y` to add the marketplace and pick a scope (user is the default). There is nothing to configure.

**Requirements:** Claude Code 2.1.287 or later, on macOS or Windows.

## Use

- **`[ ⏵ Listen ]` under every reply:** press it to hear that reply. While it reads, the row shows `✻ Reading…  [ ■ Stop ]`. The button shows in Claude Code's fullscreen layout (turn it on with `/tui fullscreen`) and in the desktop app.
- **`/hablo`:** reads the text you selected with the mouse, or the last reply. Run it again to stop, even while Claude is working. It prints nothing in the conversation, so Claude's context stays clean.

| Command | What it does |
| --- | --- |
| `/hablo` | Reads the selection or the last reply. Stops if it is already reading. |
| `/hablo stop` | Stops reading. |
| `/hablo <text>` | Reads that text. |
| `/hablo voices` | Shows the voice for each language, and your settings. |

Hablo detects Spanish, English, Portuguese, French, German and Italian, and leaves out code blocks, links and markdown symbols when it reads.

## Settings

It works with no setup. To change it:

| Command | What it does |
| --- | --- |
| `/hablo rate 220` | Words per minute, up to 500. `0` goes back to the system's speed. |
| `/hablo voice es Mónica` | The voice for a language. `/hablo voice es` goes back to the automatic one. |
| `/hablo auto on` | Reads every reply as soon as Claude finishes. `off` turns it off. |

The words also work in Spanish: `parar`, `voces`, `velocidad`, `voz`, and `sí` or `no` after `auto`. Settings stay on your machine for every session.

**Better voices:** macOS has free **Enhanced** and **Premium** voices that sound far more natural. Download them in **System Settings › Accessibility › Spoken Content › System voice › Manage Voices…**, and Hablo prefers them automatically. On Windows, add languages in **Settings › Time & language › Speech**.

## Compatibility

| Where | Status |
| --- | --- |
| macOS, terminal | ✅ Tested |
| Windows, terminal | ✅ Tested on Windows 11 |
| VS Code, integrated terminal | ✅ Tested |
| Desktop app (Code tab) | ⚠️ The mods API draws there and the tests cover it, but it has not been tried by hand yet |
| VS Code extension, chat panel | ⚠️ No button: Claude Code draws nothing from mods there. `/hablo` is untested |
| Linux | ⚠️ Falls back to the speech synthesizer Claude Code finds, without voice choice or stop. Untested, help wanted |
| SSH, VS Code Remote, containers | ❌ The sound plays on the machine where Claude Code runs, not on yours |

Hablo is a [mod](https://code.claude.com/docs/en/plugins/mods/overview), a plugin of function hooks, tested on Claude Code 2.1.292. The mods API may still change between releases.

## What Hablo sends, runs and keeps

**Network:** none. Hablo makes no network requests.

**What it sends, and where:** only the text it reads aloud, a reply or the text you selected, and only to your operating system's speech synthesizer on your machine, on standard input: to `say` on macOS, and to a PowerShell script that uses Windows' `System.Speech` on Windows. It goes nowhere else.

**Programs it runs, and why:**

| System | Command | Why |
| --- | --- | --- |
| macOS | `say -v '?'` | Once per session: lists the installed voices |
| macOS | `/bin/sh -c 'echo $$; exec say "$@"' hablo [-v <voice>] [-r <rate>]`, with the text on standard input | Each reading: the shell prints its process id, then becomes `say` and speaks the text |
| macOS | `kill <pid>` | Stops that `say` process when you stop a reading |
| Windows | `powershell.exe -NoProfile -NonInteractive -EncodedCommand <script>` | Once per session, a fixed script lists the voices; each reading, a fixed script loads `System.Speech`, selects the voice and rate, reads the text as base64 from standard input and speaks it |
| Windows | `taskkill /PID <pid> /F` | Stops that PowerShell process when you stop a reading |

`<voice>` is a voice installed on your machine, `<rate>` your `/hablo rate`, and `<pid>` the process Hablo started. The Windows scripts are encoded only so that PowerShell receives them whole: their plain text is in [`hooks/sapi.ts`](hooks/sapi.ts), and nothing else in them changes.

**Its hooks:**

| Hook | What it does |
| --- | --- |
| `session.start` | Registers `/hablo`, and picks English or Spanish for its messages from `LC_ALL`, `LC_MESSAGES` or `LANG` |
| `turn.complete` | Keeps the reply's text for `/hablo`, and reads it when `/hablo auto` is on |
| `command.run` for `/hablo` | Starts or stops a reading, and shows or changes the settings |
| `ui.render` for each reply | Draws `[ ⏵ Listen ]` under it, or `✻ Reading…  [ ■ Stop ]` while it reads |
| `session.end` | Stops the voice on `/clear`, `/resume`, `/branch` and when the session ends |

**What it reads and keeps:** the text of a reply or of your selection, only to speak it; the `LC_ALL`, `LC_MESSAGES`, `LANG` and `OS` environment variables. It keeps the last reply in the session's memory, and saves only your settings (rate, a voice per language, and `auto`) in its own store file under `~/.claude/plugins/store/`.

Hablo uses only Claude Code's own mods API, and calls no other plugin.

## Contributing

Issues and pull requests are welcome, especially new languages and Linux support. Start with [CONTRIBUTING.md](CONTRIBUTING.md), which also explains how Hablo works, and the [roadmap](ROADMAP.md).

## License

[MIT](LICENSE) © Robin Buitrago

Hablo is an independent project. It is not affiliated with, endorsed by, or sponsored by Anthropic. Claude and Claude Code are trademarks of Anthropic.
