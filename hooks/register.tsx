import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import { VOICES_SCRIPT, parseSapiVoices, powershell, sapiRate, speakScript, toBase64, utf8 } from './sapi'
import { LANGS, cleanForSpeech, detectLanguage, findVoice, isLang, parseVoices, pickVoice } from './speech'
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
const MAX_RATE = 500

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
    rate: (n: number) => `Speaking rate: ${n > 0 ? `${n} words per minute` : 'system default'}.`,
    rateRange: `The rate is a number of words per minute, from 0 (system default) to ${MAX_RATE}.`,
    voice: (lang: string, name: string | undefined) => `Voice for ${lang}: ${name ?? 'automatic'}.`,
    noVoice: (lang: string, name: string, names: string[]) =>
      `No ${lang} voice called "${name}". Installed: ${names.length > 0 ? names.join(', ') : 'none'}.`,
    auto: (isOn: boolean) => `Read every reply: ${isOn ? 'on' : 'off'}.`,
    unknownLang: (lang: string) => `Hablo has no "${lang}": use one of ${LANGS.join(', ')}.`,
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
    rate: (n: number) => `Velocidad: ${n > 0 ? `${n} palabras por minuto` : 'la del sistema'}.`,
    rateRange: `La velocidad es un número de palabras por minuto, de 0 (la del sistema) a ${MAX_RATE}.`,
    voice: (lang: string, name: string | undefined) => `Voz para ${lang}: ${name ?? 'automática'}.`,
    noVoice: (lang: string, name: string, names: string[]) =>
      `No hay ninguna voz de ${lang} llamada "${name}". Instaladas: ${names.length > 0 ? names.join(', ') : 'ninguna'}.`,
    auto: (isOn: boolean) => `Leer cada respuesta: ${isOn ? 'sí' : 'no'}.`,
    unknownLang: (lang: string) => `Hablo no tiene "${lang}": usa uno de ${LANGS.join(', ')}.`,
  },
}

// `hasStatus`: the reading shows on the status line, for when no reply row shows it
// (started from /hablo or autoRead, not from a reply's own button).
type Job = { id: string; text: string; hasStatus: boolean }

// What the person set with /hablo rate, /hablo voice and /hablo auto. It lives in the
// plugin's store, so it lasts across sessions and needs no setup screen at install.
type Settings = { rate: number; voices: Partial<Record<string, string>>; autoRead: boolean }

// /hablo's own words, in English and Spanish. Anything else after /hablo is text to read.
const STOP = /^(stop|parar)$/i
const VOICES = /^(voices|voces)$/i
const RATE = /^(rate|velocidad)(?:\s+(\S+))?$/i
const VOICE = /^(?:voice|voz)\s+([a-z]{2})(?:\s+(.+))?$/i
const AUTO = /^auto(?:\s+(on|off|s[ií]|no))?$/i

// The module's own: they start over on a reload, which also ends any reading.
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

// Read from the store each time, so a change made in another session applies here too.
const loadSettings = async ($: EngineInterface): Promise<Settings> => {
  const rate = await $.store.get('rate')
  const voiceMap = await $.store.get('voices')
  const autoRead = await $.store.get('autoRead')
  const isVoiceMap = typeof voiceMap === 'object' && voiceMap !== null && !Array.isArray(voiceMap)

  return {
    rate: typeof rate === 'number' && rate >= 0 && rate <= MAX_RATE ? rate : 0,
    voices: isVoiceMap
      ? Object.fromEntries(Object.entries(voiceMap).filter((entry): entry is [string, string] => typeof entry[1] === 'string'))
      : {},
    autoRead: autoRead === true,
  }
}

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

const voiceFor = async ($: EngineInterface, text: string, settings: Settings) => {
  const lang = detectLanguage(text) ?? lastLang
  lastLang = lang

  return lang ? pickVoice(await listVoices($), lang, settings.voices) : undefined
}

const kill = ($: EngineInterface, id: string) =>
  $.process.run(synth === 'sapi' ? ['taskkill', '/PID', id, '/F'] : ['kill', id]).catch(() => undefined)

// What starts one utterance. Each prints its pid first so it can be stopped:
// on macOS a shell that then becomes `say`, on Windows a PowerShell script.
const speech = (voice: string | undefined, text: string, rate: number) => {
  if (synth === 'sapi') {
    return { argv: powershell(speakScript(voice, sapiRate(rate))), input: toBase64(utf8(text)) }
  }

  const args = [...(voice ? ['-v', voice] : []), ...(rate > 0 ? ['-r', String(rate)] : [])]
  return { argv: ['/bin/sh', '-c', 'echo $$; exec say "$@"', 'hablo', ...args], input: text }
}

const say = async ($: EngineInterface, text: string) => {
  const settings = await loadSettings($)
  const voice = await voiceFor($, text, settings)
  if (synth === 'system') {
    await $.audio.speak(text.slice(0, 4096))
    return
  }

  const child = $.process.spawn(speech(voice, text, settings.rate))
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

// The voices Hablo picks for each language, and the settings, as /hablo voices shows them.
const describe = async ($: EngineInterface) => {
  const settings = await loadSettings($)
  const installed = await listVoices($)
  const rows = LANGS.map(lang => `${lang}: ${pickVoice(installed, lang, settings.voices) ?? t.systemVoice}`)

  return [`${t.voices}:`, ...rows, ...(synth === 'system' ? [t.noSay] : []), '', t.rate(settings.rate), t.auto(settings.autoRead)].join('\n')
}

const setRate = async ($: EngineInterface, value: string | undefined) => {
  if (value === undefined) {
    return t.rate((await loadSettings($)).rate)
  }
  const rate = Number(value)
  if (!Number.isInteger(rate) || rate < 0 || rate > MAX_RATE) {
    return t.rateRange
  }
  await $.store.set('rate', rate)

  return t.rate(rate)
}

// Saves the installed voice the person means, by its full name, so `say` and SAPI find it.
const setVoice = async ($: EngineInterface, lang: Lang, name: string | undefined) => {
  const chosen = { ...(await loadSettings($)).voices }
  if (name === undefined) {
    delete chosen[lang]
  } else {
    const installed = await listVoices($)
    const voice = findVoice(installed, lang, name)
    if (!voice) {
      const names = installed.filter(one => one.locale.toLowerCase().startsWith(`${lang}_`)).map(one => one.name)
      return t.noVoice(lang, name, names)
    }
    chosen[lang] = voice.name
  }
  await $.store.set('voices', chosen)

  return t.voice(lang, chosen[lang])
}

const setAuto = async ($: EngineInterface, value: string | undefined) => {
  if (value === undefined) {
    return t.auto((await loadSettings($)).autoRead)
  }
  const isOn = !/^(off|no)$/i.test(value)
  await $.store.set('autoRead', isOn)

  return t.auto(isOn)
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    const started = await next(e)
    const locale = (await $.env.get('LC_ALL')) || (await $.env.get('LC_MESSAGES')) || (await $.env.get('LANG')) || ''
    t = locale.toLowerCase().startsWith('es') ? MESSAGES.es : MESSAGES.en

    await $.command.register({
      name: 'hablo',
      description: 'Read aloud the selection or the last reply; again to stop',
      argumentHint: '[stop | voices | rate <n> | voice <lang> <name> | auto on|off | text]',
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

  // Keeps the last reply for /hablo, and reads it when /hablo auto is on.
  on('turn.complete', async ($, e, next) => {
    const result = await next(e)
    if (e.reason === 'answer' && result.text.trim() !== '') {
      await update($, lastReply, () => result.text)
      if ((await loadSettings($)).autoRead) {
        await start($, 'last', result.text, true)
      }
    }

    return result
  })

  // Starting and stopping print nothing: the status line shows the reading, and a
  // line in the transcript would also land in what Claude reads. Settings answer in a line.
  on('command.run', { command: 'hablo' }, async ($, e) => {
    const arg = e.args.trim()
    const rate = RATE.exec(arg)
    const voice = VOICE.exec(arg)
    const auto = AUTO.exec(arg)

    if (STOP.test(arg) || (arg === '' && (await read($, speaking)) !== null)) {
      await stop($)
      return {}
    }
    if (VOICES.test(arg)) {
      return { text: await describe($) }
    }
    if (rate) {
      return { text: await setRate($, rate[2]) }
    }
    if (voice?.[1]) {
      const lang = voice[1].toLowerCase()
      return { text: isLang(lang) ? await setVoice($, lang, voice[2]) : t.unknownLang(lang) }
    }
    if (auto) {
      return { text: await setAuto($, auto[1]) }
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
