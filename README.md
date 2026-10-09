# Hablo

**Hear Claude Code's replies aloud, in your language.**

[![CI](https://github.com/Jarvizx/hablo/actions/workflows/ci.yml/badge.svg)](https://github.com/Jarvizx/hablo/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

[Leer en español](README.es.md)

<!-- Demo: add docs/demo.gif here once it is recorded. -->

Hablo is a plugin for Claude Code that reads replies aloud. It puts a **Listen** button under each reply, adds a `/speak` command, and picks a natural voice for the language of each reply. It runs on the voices that come with macOS, and on Windows voices in an experimental mode: free, offline, no API keys.

## Why

- Rest your eyes and listen to a long answer while you look at the code.
- Low vision, dyslexia, or simply preferring to listen.
- Practice your listening in a language you are learning.

## Features

- **`[ ⏵ Listen ]` under every reply:** press it to hear that reply. While it reads, the row shows `✻ Reading…  [ ⏹ Stop ]`, with the glyph turning like Claude's own spinner.
- **`/speak`:** reads the text you selected with the mouse, or the last reply when nothing is selected. Run it again to stop, even while Claude is working. It prints nothing in the conversation, so Claude's context stays clean, and a line under the prompt shows that it is reading.
- **Your language:** detects Spanish, English, Portuguese, French, German and Italian, and picks a natural voice installed on your computer for each one.
- **Speakable text:** code blocks, links, tables and markdown symbols are cleaned up before reading.
- **Private:** nothing leaves your machine. See [what Hablo runs](#what-hablo-runs-and-what-data-it-uses).

## Install

At the Claude Code prompt:

```
/plugin install hablo --marketplace Jarvizx/hablo
```

Answer `y` to add the marketplace, then pick a scope (user is the default).

## Usage

| Command | What it does |
| --- | --- |
| `/speak` | Reads the selection, or the last reply. Stops if it is already reading. |
| `/speak stop` | Stops reading. |
| `/speak voices` | Shows the voice used for each language. |
| `/speak <text>` | Reads that text. Handy to try a voice. |

The words also work in Spanish: `parar`, `voces`.

The Listen button shows where Claude Code draws clickable rows: the terminal's fullscreen layout and the desktop app. Everywhere else, use `/speak`.

## Settings

Change them in `/config`, under Hablo:

| Setting | Default | Description |
| --- | --- | --- |
| `rate` | `0` | Words per minute, up to 500. `0` keeps the system default. |
| `voices` | empty | A voice per language, for example `es=Mónica, en=Daniel`. Empty picks one automatically. |
| `autoRead` | `false` | Read every reply as soon as Claude finishes. |

To hear a voice before choosing it, run `say -v Mónica "Hola"` in a terminal, and `say -v '?'` to list them all.

### Better voices

macOS has free **Enhanced** and **Premium** voices that sound much more natural than the default ones. Download them in **System Settings › Accessibility › Spoken Content › System voice › Manage Voices…**. Hablo prefers them automatically.

On Windows, Hablo uses the voices that `System.Speech` sees, such as Microsoft Helena, Sabina or Zira. To add languages, go to **Settings › Time & language › Speech**.

## Compatibility

| Where | Status |
| --- | --- |
| macOS, terminal and desktop app | ✅ Supported |
| VS Code extension | ⚠️ `/speak` works, but Claude Code draws nothing from mods in the extension's chat panel, so there is no button. In VS Code's integrated terminal everything works |
| Windows | 🧪 Experimental: Windows voices through PowerShell, with voice choice and stop. Being tested |
| Linux | ⚠️ Falls back to the system synthesizer Claude Code finds, without voice choice or stop. Untested. Help wanted, see the [roadmap](ROADMAP.md) |
| SSH, VS Code Remote, containers | ❌ The sound plays on the machine where Claude Code runs, not on yours |

Hablo is a [mod](https://code.claude.com/docs/en/plugins/mods/overview): a plugin of function hooks. It needs Claude Code 2.1.287 or later, the first version with mods on by default, and is tested on 2.1.292. The mods API may still change between releases.

## What Hablo runs and what data it uses

Hablo does not use the network and sends nothing anywhere. Speech is synthesized by your operating system on your machine.

| What | When | Why |
| --- | --- | --- |
| `say -v '?'` | Once per session, the first time it reads | Lists the voices installed on your Mac |
| `/bin/sh -c 'echo $$; exec say …'`, with the text on standard input | Each time it reads | Speaks the text, and prints the process id so it can be stopped |
| `kill <pid>` | When you stop a reading | Stops that `say` process |
| `powershell.exe` with `System.Speech`, on Windows | The first time it reads, and each time it reads | Lists the Windows voices, and speaks the text, which it receives as base64 on standard input |
| `taskkill /PID <pid> /F`, on Windows | When you stop a reading | Stops that PowerShell process |

It reads:

- **The text of a reply, or the text you selected,** only to speak it.
- **The `LC_ALL`, `LC_MESSAGES` and `LANG` environment variables,** to show its messages in English or Spanish.
- **The `OS` environment variable,** to tell Windows apart.

It keeps the last reply in the session's memory for `/speak`, and nothing on disk. Your settings live in Claude Code's `settings.json`, like any plugin's.

## How it works

1. When a turn ends, Hablo keeps the reply's text.
2. When you press Listen or run `/speak`, it cleans the markdown, guesses the language from common words, and picks a voice for it.
3. It starts `say` (or, on Windows, a PowerShell script) that first prints its process id, so Stop can end it.

The code is three files: [`hooks/register.tsx`](hooks/register.tsx) (the hooks, the button and `/speak`), [`hooks/speech.ts`](hooks/speech.ts) (markdown cleanup, language detection and voice choice) and [`hooks/sapi.ts`](hooks/sapi.ts) (the Windows scripts).

## Contributing

Issues and pull requests are welcome, especially new languages and Linux or Windows support. Start with [CONTRIBUTING.md](CONTRIBUTING.md) and the [roadmap](ROADMAP.md).

## License

[MIT](LICENSE) © Robin Buitrago

Hablo is an independent project. It is not affiliated with, endorsed by, or sponsored by Anthropic. Claude and Claude Code are trademarks of Anthropic.
