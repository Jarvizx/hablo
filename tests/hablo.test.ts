import { expect, mock, test } from 'claude-code/testing'
import type { On } from 'claude-code'

import { powershell, speakScript, toBase64, utf8 } from '../hooks/sapi'

const VOICES = 'Paulina             es_MX    # Hola, me llamo Paulina.\nSamantha            en_US    # Hello, my name is Samantha.\n'
const SAPI_VOICES = 'Microsoft Helena Desktop|es-ES\r\nMicrosoft Zira Desktop|en-US\r\n'

const command = (args: string) =>
  ({
    command: 'speak',
    args,
    origin: { kind: 'composer' },
    presentation: { isFullscreen: true, columns: 120 },
  }) as const

const reply = (surface: 'terminal' | 'desktop', text: string) =>
  ({
    plugin: 'hablo',
    surface,
    component: 'AssistantMessage',
    requestId: `msg-${surface}`,
    props: { text, isFirstOfReply: true },
    viewport: { columns: 100, rows: 40, isFullscreen: true },
  }) as const

// Stands in for the host: lists the voices, records each `say` it is asked to run and
// each `kill`, and resolves `idle` once the reading is over and the status line cleared.
const host = (on: On, env: Record<string, string> = {}) => {
  const spoken: { argv: readonly string[]; input?: string }[] = []
  const killed: string[] = []
  let markIdle = () => {}
  const idle = new Promise<void>(resolve => (markIdle = resolve))
  let markStarted = () => {}
  const started = new Promise<void>(resolve => (markStarted = resolve))
  // With `isLong`, `say` runs until `kill` reaches it.
  let isLong = false
  let endSay = () => {}

  mock.env(on, env)
  on('process.run', (_, e) => {
    if (e.argv[0] === 'kill' || e.argv[0] === 'taskkill') {
      killed.push(e.argv.at(e.argv[0] === 'kill' ? 1 : 2) ?? '')
      endSay()
    }
    const stdout = e.argv[0] === 'powershell.exe' ? SAPI_VOICES : VOICES

    return { value: { exitCode: 0, stdout, stderr: '', isStdoutTruncated: false, isStderrTruncated: false } }
  })
  on('process.spawn', async function* (_, e) {
    spoken.push({ argv: e.argv, input: e.input })
    yield { stream: 'stdout' as const, text: '4242\n' }
    markStarted()
    if (isLong) {
      await new Promise<void>(resolve => (endSay = resolve))
      return { value: { code: null, signal: 'SIGTERM' } }
    }

    return { value: { code: 0, signal: null } }
  })
  on('ui.selection', () => ({ value: undefined }))
  on('ui.status', (_, e) => {
    if (e.text === undefined) {
      markIdle()
    }

    return { value: undefined }
  })
  on('ui.toast', () => ({ value: undefined }))
  // The engine's own drawing of the reply, which the plugin wraps.
  on('ui.render', () => ({ type: 'engine' as const, ref: 0 }))

  return { spoken, killed, idle, started, readUntilKilled: () => (isLong = true) }
}

test('/speak with nothing to read says so', async ($, on) => {
  host(on)
  const res = await $.command.run(command(''))

  expect(res.text).toBe('Nothing to read yet.')
})

test('/speak <text> reads it with a Spanish voice', async ($, on) => {
  const { spoken, idle } = host(on)
  await $.command.run(command('Hola, esto es una prueba para ver si el mod lee bien'))
  await idle

  expect(spoken).toHaveLength(1)
  expect(spoken[0]?.argv).toContain('Paulina')
  expect(spoken[0]?.input).toBe('Hola, esto es una prueba para ver si el mod lee bien.')
})

test('/speak again stops the reading', async ($, on) => {
  const { killed, idle, started, readUntilKilled } = host(on)
  readUntilKilled()

  await $.command.run(command('This is a long reply that you will want to stop before the end'))
  await started
  const res = await $.command.run(command(''))
  await idle

  expect(res.text).toBe('Stopped.')
  expect(killed).toEqual(['4242'])
})

test('/speak parar stops it too', async ($, on) => {
  const { killed, idle, started, readUntilKilled } = host(on)
  readUntilKilled()

  await $.command.run(command('This is a long reply that you will want to stop before the end'))
  await started
  await $.command.run(command('parar'))
  await idle

  expect(killed).toEqual(['4242'])
})

test('[ ⏵ Listen ] under a reply reads it, and [ ⏹ Stop ] stops it', async ($, on) => {
  const { spoken, killed, idle, started, readUntilKilled } = host(on)
  readUntilKilled()
  const ui = await $.ui.mount(reply('desktop', 'This is a long reply that you will want to stop before the end'))

  void ui.press({ key: 'play' })
  await started
  expect(spoken[0]?.argv).toContain('Samantha')
  expect(await ui.find({ key: 'play' })).toBeUndefined()

  await ui.press({ key: 'stop' })
  await idle

  expect(killed).toEqual(['4242'])
  expect(await ui.find({ key: 'play' })).toBeDefined()
  await ui.unmount()
})

test('the button shows on the terminal too, in its fullscreen layout', async ($, on) => {
  host(on)
  const ui = await $.ui.mount(reply('terminal', 'This is a reply that the person may want to hear'))

  expect(await ui.find({ key: 'play' })).toBeDefined()
  await ui.unmount()
})

test('on Windows it speaks through PowerShell with a Windows voice, and stops with taskkill', async ($, on) => {
  const { spoken, killed, idle, started, readUntilKilled } = host(on, { OS: 'Windows_NT' })
  readUntilKilled()
  const text = 'Hola, esto es una prueba para ver si el mod lee bien en Windows'

  await $.command.run(command(text))
  await started

  expect(spoken[0]?.argv).toEqual(powershell(speakScript('Microsoft Helena Desktop', 0)))
  expect(spoken[0]?.input).toBe(toBase64(utf8(`${text}.`)))

  await $.command.run(command('stop'))
  await idle
  expect(killed).toEqual(['4242'])
})

test('/speak voices lists the Windows voices on Windows', async ($, on) => {
  host(on, { OS: 'Windows_NT' })
  const res = await $.command.run(command('voices'))

  expect(res.text).toContain('es: Microsoft Helena Desktop')
  expect(res.text).toContain('en: Microsoft Zira Desktop')
})
