# Roadmap

## Done · up to 0.2.0

- [x] `/hablo` reads the selection or the last reply, and stops a reading when run again, even while Claude is working
- [x] `[ ⏵ Listen ]` under each reply, and `✻ Reading…  [ ■ Stop ]` while it reads
- [x] Language detection (es, en, pt, fr, de, it) and a natural voice for each
- [x] Markdown cleanup: code blocks, links, tables and symbols
- [x] Settings: `rate`, `voices`, `autoRead`
- [x] Windows support through PowerShell `System.Speech`, tested on Windows 11
- [x] No glyph with an emoji form, so Windows Terminal draws them as text

## Next · 0.3

- [ ] Linux: `spd-say` or `espeak-ng`, with stop
- [ ] Clearer help on the settings screen: a suggested range for `rate`, and an example voice for each system
- [ ] A keyboard shortcut to play and stop without typing `/hablo`
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
- [x] Public repository and releases up to `v0.2.0`
- [ ] Demo in the README: a GIF, and a short video with sound
- [ ] Submission to Anthropic's plugin directory
- [ ] Proposal to [awesome-claude-code](https://github.com/hesreallyhim/awesome-claude-code), through its issue form, once the repository is two weeks old
- [ ] A reply on the Claude Code issues that ask for text-to-speech
- [ ] A post in English and Spanish showing how it was built
