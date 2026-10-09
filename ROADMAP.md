# Roadmap

## v0.1 · Now

- [x] `/speak` reads the selection or the last reply
- [x] `[ ⏵ Listen ]` and `[ ⏹ Stop ]` under each reply, with a turning reading indicator (0.1.1)
- [x] Language detection (es, en, pt, fr, de, it) and a natural voice for each
- [x] Markdown cleanup: code blocks, links, tables and symbols
- [x] Settings: `rate`, `voices`, `autoRead`
- [x] Experimental Windows support through PowerShell `System.Speech`

## v0.2 · Next

- [ ] Linux: `spd-say` or `espeak-ng`, with stop
- [ ] Windows: confirm the experimental PowerShell `System.Speech` support on real machines
- [ ] A keyboard shortcut to play and stop without typing `/speak`
- [ ] "Code block omitted" instead of skipping code in silence
- [ ] Read the whole reply from any of its blocks
- [ ] Speaking rate per language

## Later

- [ ] Pause and resume. Freezing `say` or `afplay` does not pause the sound on macOS, so it needs a player that can pause, or resuming from the sentence where it stopped
- [ ] Optional neural voices: Kokoro (local), or OpenAI and ElevenLabs with your own key, opt-in since they break the no-network rule
- [ ] Change the speed while reading
- [ ] More languages in `hooks/speech.ts`

## Community

- [x] `CONTRIBUTING.md`, issue templates and CI running `claude plugin validate` and `claude plugin test`
- [ ] Demo GIF in the README
- [ ] Public repository and the `v0.1.0` release
- [ ] Submission to Anthropic's plugin directory
- [ ] Proposal to [awesome-claude-code](https://github.com/hesreallyhim/awesome-claude-code), through its issue form
- [ ] A reply on the Claude Code issues that ask for text-to-speech
- [ ] A post in English and Spanish showing how it was built
