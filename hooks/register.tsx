import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import { VOICES_SCRIPT, parseSapiVoices, powershell, sapiRate, speakScript, toBase64, utf8 } from './sapi'
import { LANGS, cleanForSpeech, detectLanguage, parseOverrides, parseVoices, pickVoice } from './speech'
import type { Lang, Voice } from './speech'

// What is being read now (a message id, `last` or `selection`), the frame of its
// reading indicator, and the last reply.
const speaking = atom({ plugin: 'hablo', key: 'speaking' } as const, null)
const frame = atom({ plugin: 'hablo', key: 'frame' } as const, 0)
const lastReply = atom({ plugin: 'hablo', key: 'lastReply' } as const, '')

// The glyphs of Claude Code's own spinner, there and back, without ✳: it has an emoji
// form, which some terminals (Windows Terminal) draw in color. None of these has one.
const GLYPHS = ['·', '✢', '✶', '✻', '✽', '✻', '✶', '✢']
// Under the 10 redraws a second a transcript row is allowed.
const FRAME_MS = 140

const MESSAGES = {
  en: {
    reading: '⏵ Reading aloud · /hablo to stop',
    readingShort: 'Reading…',
    nothing: 'Nothing to read yet.',
    voices: 'Voices',
    systemVoice: 'system default',
    noSay: 'No macOS or Windows voices were found: using the system synthesizer, which cannot be stopped.',
    failed: 'could not read aloud',
    listen: 'Listen',
    stop: 'Stop',
  },
  es: {
    reading: '⏵ Leyendo en voz alta · /hablo para parar',
    readingShort: 'Leyendo…',
    nothing: 'Todavía no hay nada que leer.',
    voices: 'Voces',
    systemVoice: 'la del sistema',
    noSay: 'No se encontraron voces de macOS ni de Windows: se usa el sintetizador del sistema, que no se puede parar.',
    failed: 'no se pudo leer en voz alta',
    listen: 'Escuchar',
    stop: 'Parar',
  },
}

// `hasStatus`: the reading shows on the status line, for when no reply row shows it
// (started from /hablo or autoRead, not from a reply's own button).
type Job = { id: string; text: string; hasStatus: boolean }

// The words /hablo takes, in English and Spanish.
const ACTIONS: Partial<Record<string, 'stop' | 'voices'>> = {
  stop: 'stop',
  parar: 'stop',
  voices: 'voices',
  voces: 'voices',
}

// The module's own: they start over on a reload, which also ends any reading.
let rate = 0
let overrides: Partial<Record<string, string>> = {}
let isAutoRead = false
let t = MESSAGES.en
let voices: Voice[] | undefined
// Who speaks: macOS `say`, Windows SAPI through PowerShell, or the engine's own synthesizer.
let synth: 'say' | 'sapi' | 'system' = 'system'
let queue: Job[] = []
let isWorking = false
let pid: string | undefined
let isStopping = false
// A text too short or ambiguous to tell is read in the language read last.
let lastLang: Lang | undefined

// Finds the synthesizer and its voices once per load.
const listVoices = async ($: EngineInterface) => {
  if (voices === undefined) {
    const isWindows = (await $.env.get('OS')) === 'Windows_NT'
    try {
      const { exitCode, stdout } = await $.process.run(isWindows ? powershell(VOICES_SCRIPT) : ['say', '-v', '?'])
      synth = exitCode !== 0 ? 'system' : isWindows ? 'sapi' : 'say'
      voices = synth === 'system' ? [] : isWindows ? parseSapiVoices(stdout) : parseVoices(stdout)
    } catch {
      synth = 'system'
      voices = []
    }
  }

  return voices
}

const voiceFor = async ($: EngineInterface, text: string) => {
  const lang = detectLanguage(text) ?? lastLang
  lastLang = lang

  return lang ? pickVoice(await listVoices($), lang, overrides) : undefined
}

const kill = ($: EngineInterface, id: string) =>
  $.process.run(synth === 'sapi' ? ['taskkill', '/PID', id, '/F'] : ['kill', id]).catch(() => undefined)

// What starts one utterance. Each prints its pid first so it can be stopped:
// on macOS a shell that then becomes `say`, on Windows a PowerShell script.
const speech = (voice: string | undefined, text: string) => {
  if (synth === 'sapi') {
    return { argv: powershell(speakScript(voice, sapiRate(rate))), input: toBase64(utf8(text)) }
  }

  const args = [...(voice ? ['-v', voice] : []), ...(rate > 0 ? ['-r', String(rate)] : [])]
  return { argv: ['/bin/sh', '-c', 'echo $$; exec say "$@"', 'hablo', ...args], input: text }
}

const say = async ($: EngineInterface, text: string) => {
  const voice = await voiceFor($, text)
  if (synth === 'system') {
    await $.audio.speak(text.slice(0, 4096))
    return
  }

  const child = $.process.spawn(speech(voice, text))
  let errors = ''

  for await (const { stream, text: out } of child) {
    if (stream === 'stderr') {
      errors += out
    } else if (pid === undefined) {
      pid = out.trim().split('\n')[0]
      if (isStopping && pid) {
        await kill($, pid)
      }
    }
  }

  const end = await child.result
  if (end.code !== 0 && end.signal === null && !isStopping) {
    throw new Error(errors.trim() || `${synth} exited with ${end.code}`)
  }
}

// Reads the queue until it is empty; started by whoever queues the first job.
// While it reads, a timer turns the indicator of the row being read.
const work = async ($: EngineInterface) => {
  isWorking = true
  const spinner = $.clock.every(FRAME_MS, () => void update($, frame, n => (n + 1) % GLYPHS.length))
  try {
    for (let job = queue.shift(); job; job = queue.shift()) {
      isStopping = false
      await update($, speaking, () => job.id)
      $.ui.status(job.hasStatus ? t.reading : undefined)
      try {
        await say($, job.text)
      } catch (error) {
        $.ui.toast(`hablo: ${t.failed}: ${error instanceof Error ? error.message : String(error)}`)
      }
      pid = undefined
    }
  } finally {
    spinner.cancel()
    isWorking = false
    await update($, speaking, () => null)
    $.ui.status(undefined)
  }
}

const stop = async ($: EngineInterface) => {
  queue = []
  isStopping = true
  if (pid) {
    await kill($, pid)
  }
}

const start = async ($: EngineInterface, id: string, markdown: string, hasStatus: boolean) => {
  const text = cleanForSpeech(markdown)
  if (text === '') {
    return false
  }

  await stop($)
  queue = [{ id, text, hasStatus }]
  if (!isWorking) {
    void work($)
  }

  return true
}

export const register: Register = (on, options) => {
  rate = typeof options.rate === 'number' ? options.rate : 0
  overrides = parseOverrides(typeof options.voices === 'string' ? options.voices : '')
  isAutoRead = options.autoRead === true

  on('session.start', async ($, e, next) => {
    const started = await next(e)
    const locale = (await $.env.get('LC_ALL')) || (await $.env.get('LC_MESSAGES')) || (await $.env.get('LANG')) || ''
    t = locale.toLowerCase().startsWith('es') ? MESSAGES.es : MESSAGES.en

    await $.command.register({
      name: 'hablo',
      description: 'Read aloud the selection or the last reply; again to stop',
      argumentHint: '[stop | voices | text]',
      // So that /hablo stops a reading at once, even while Claude is working.
      immediate: true,
    })
    // A reading cut by a reload leaves its id behind.
    await update($, speaking, () => null)

    return started
  })

  // /clear, /resume and /branch reset the plugin's state: stop the voice with it,
  // or it would go on with nothing left on screen to stop it.
  on('session.end', async ($, e, next) => {
    await stop($)

    return next(e)
  })

  // Keeps the last reply for /hablo, and reads it when autoRead is on.
  on('turn.complete', async ($, e, next) => {
    const result = await next(e)
    if (e.reason === 'answer' && result.text.trim() !== '') {
      await update($, lastReply, () => result.text)
      if (isAutoRead) {
        await start($, 'last', result.text, true)
      }
    }

    return result
  })

  // Starting and stopping print nothing: the status line shows the reading, and a
  // line in the transcript would also land in what Claude reads.
  on('command.run', { command: 'hablo' }, async ($, e) => {
    const arg = e.args.trim()
    // Bare /hablo reads, or stops a reading.
    const action = ACTIONS[arg.toLowerCase()] ?? (arg === '' && (await read($, speaking)) !== null ? 'stop' : undefined)

    if (action === 'stop') {
      await stop($)
      return {}
    }

    if (action === 'voices') {
      const installed = await listVoices($)
      const rows = LANGS.map(lang => `${lang}: ${pickVoice(installed, lang, overrides) ?? t.systemVoice}`)
      return { text: [`${t.voices}:`, ...rows, ...(synth === 'system' ? [t.noSay] : [])].join('\n') }
    }

    const selection = arg === '' ? await $.ui.selection() : undefined
    const source = arg !== '' ? arg : selection?.text ?? (await read($, lastReply))
    const isStarted = await start($, selection ? 'selection' : 'last', source, true)

    return isStarted ? {} : { text: t.nothing }
  })

  // Under each reply: [ ⏵ Listen ]. While that reply is read: a turning glyph in
  // Claude's accent color, "Reading…", and [ ■ Stop ].
  on('ui.render', { component: 'AssistantMessage' }, async ($, e, next) => {
    const own = await next(e)
    const hasPointer = e.surface !== 'terminal' || e.viewport?.isFullscreen === true
    if (!hasPointer || e.props.text.trim() === '') {
      return own
    }

    const { Box, Button, Text } = $.ui.resolve(e)
    const isReading = (await read($, speaking)) === e.requestId
    // Only the row being read reads the frame, so only it redraws as it turns.
    const glyph = isReading ? GLYPHS[(await read($, frame)) % GLYPHS.length] : undefined

    return (
      <Box flexDirection="column">
        {own}
        <Box flexDirection="row" alignItems="center" paddingLeft={2} columnGap={2}>
          {/* A list, not <>…</>: a fragment draws as a column Box and would stack them. */}
          {isReading ? (
            [
              <Text key="reading" color="claude">
                {glyph} {t.readingShort}
              </Text>,
              <Button key="stop" variant="primary" label={`■ ${t.stop}`} onPress={() => stop($)} />,
            ]
          ) : (
            <Button
              key="play"
              variant="primary"
              label={`⏵ ${t.listen}`}
              onPress={() => start($, e.requestId, e.props.text, false)}
            />
          )}
        </Box>
      </Box>
    )
  })
}
