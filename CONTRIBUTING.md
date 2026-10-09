# Contributing to Hablo

Thanks for helping. Issues and pull requests are welcome in English or Spanish.

## Good first contributions

- **A new language:** see [Add a language](#add-a-language). It is one file and one test.
- **Linux or Windows support:** see the [roadmap](ROADMAP.md).
- **Trying Hablo in the VS Code extension** and reporting what you see.

Look for issues labeled `good first issue`.

## Run it locally

You need macOS (or Windows, for the experimental support) and Claude Code 2.1.292 or later.

```bash
git clone https://github.com/Jarvizx/hablo
cd hablo
claude --plugin-dir .
```

In that session, `/speak Hello, this is a test` should read aloud. Edits to the plugin's files reload when a turn ends.

## Project layout

| Path | What it holds |
| --- | --- |
| `hooks/register.tsx` | The hooks: the Listen button, `/speak`, the last reply, and the `say` process |
| `hooks/speech.ts` | Pure helpers with no `$`: markdown cleanup, language detection, voice choice |
| `hooks/sapi.ts` | Pure helpers for Windows: the PowerShell scripts and their encoding |
| `types/index.d.ts` | The `$.state` values the plugin keeps |
| `tests/` | Tests for `claude plugin test` |
| `.claude-plugin/` | The plugin manifest and the marketplace file |

Hablo is a [mod](https://code.claude.com/docs/en/plugins/mods/overview). Its API is described in the `.d.ts` files Claude Code writes to `.claude-plugin/types/` the first time it loads the plugin.

## Checks

Run these before opening a pull request. CI runs the first two on every pull request.

```bash
claude plugin validate --strict .
claude plugin test .
npx -p typescript@5 tsc -p .   # after loading the plugin once with claude --plugin-dir .
```

## Add a language

1. In `hooks/speech.ts`, add the language code to `Lang`, its common words to `MARKERS`, any letters that give it away to `LETTERS`, and its natural macOS voices to `PREFERRED`.
2. In `tests/speech.test.ts`, add a sentence that `detectLanguage` should recognize.
3. Run the checks.

Prefer short, very common words for `MARKERS`. A word shared with another language counts for both, so it helps without causing mistakes.

## Rules of the project

- **No network.** Hablo speaks with the voices on the user's machine.
- **No dependencies.** The plugin ships as readable source with nothing to install.
- **Say what it runs.** A change that runs a new command or reads new data also updates "What Hablo runs and what data it uses" in both READMEs.
- **Keep both READMEs in step.** If you only write one language, say so in the pull request and someone will translate it.

## Commits and pull requests

- Keep each pull request to one change.
- Write commit messages in the imperative: `Add Italian voices`, `Fix stop while a reply is loading`.
- Add a line under `Unreleased` in [CHANGELOG.md](CHANGELOG.md).

By contributing you agree that your contribution is licensed under the [MIT License](LICENSE), and to follow the [Code of Conduct](CODE_OF_CONDUCT.md).
