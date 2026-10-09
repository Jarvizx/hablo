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

## What Hablo runs and what data it uses

Hablo does not use the network and sends nothing anywhere. Your operating system synthesizes the speech on your machine.

| What | When | Why |
| --- | --- | --- |
| `say -v '?'` | Once per session, on macOS | Lists the voices installed on your Mac |
| `/bin/sh -c 'echo $$; exec say …'`, with the text on standard input | Each reading, on macOS | Speaks the text, and prints the process id so it can be stopped |
| `kill <pid>` | When you stop a reading, on macOS | Stops that `say` process |
| `powershell.exe` with `System.Speech` | Once per session, and each reading, on Windows | Lists the Windows voices, and speaks the text, which it receives as base64 on standard input |
| `taskkill /PID <pid> /F` | When you stop a reading, on Windows | Stops that PowerShell process |

It reads:

- **The text of a reply, or the text you selected,** only to speak it.
- **The `LC_ALL`, `LC_MESSAGES` and `LANG` environment variables,** to show its messages in English or Spanish, and **`OS`**, to tell Windows apart.

It keeps the last reply in the session's memory, for `/hablo`. It saves only your settings (rate, a voice per language, and `auto`) in its own store file under `~/.claude/plugins/store/`.

## Contributing

Issues and pull requests are welcome, especially new languages and Linux support. Start with [CONTRIBUTING.md](CONTRIBUTING.md), which also explains how Hablo works, and the [roadmap](ROADMAP.md).

## License

[MIT](LICENSE) © Robin Buitrago

Hablo is an independent project. It is not affiliated with, endorsed by, or sponsored by Anthropic. Claude and Claude Code are trademarks of Anthropic.
