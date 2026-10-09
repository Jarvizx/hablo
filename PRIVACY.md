# Privacy policy

Last updated: October 9, 2026

Hablo is an open-source plugin for Claude Code that reads replies aloud on your computer. This policy covers the plugin as published at <https://github.com/Jarvizx/hablo>.

## What Hablo collects

Nothing. Hablo has no servers, no accounts, no analytics and no telemetry, and it makes no network requests.

## What it handles on your machine

- **The text it reads aloud:** a reply, or the text you selected. Hablo passes it to your operating system's speech synthesizer, on your machine: `say` on macOS, and `System.Speech` through PowerShell on Windows. It is not sent anywhere else.
- **Four environment variables:** `LC_ALL`, `LC_MESSAGES` and `LANG`, to show its messages in English or Spanish, and `OS`, to tell Windows apart.

## What it keeps

- **The last reply,** in the memory of the Claude Code session, so `/hablo` can read it. It is gone when the session ends or you run `/clear`.
- **Your settings:** the speaking rate, a voice per language, and whether to read every reply. They are saved in Hablo's own file under `~/.claude/plugins/store/` on your machine. To clear them, run `/hablo rate 0`, `/hablo voice <language>` and `/hablo auto off`, or delete that file.

## Third parties

None. Hablo shares nothing with anyone. The voices belong to your operating system and run locally.

## Changes

Any change to this policy is made in this file, and its history is on GitHub.

## Contact

Open an issue at <https://github.com/Jarvizx/hablo/issues>. For something you would rather not post in public, use **Report a vulnerability** in the repository's **Security** tab.
