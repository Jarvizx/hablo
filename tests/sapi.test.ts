import { describe, expect, test } from 'claude-code/testing'

import { parseSapiVoices, powershell, sapiRate, speakScript, toBase64, utf16le, utf8 } from '../hooks/sapi'

describe('base64', () => {
  test('encodes UTF-8 and UTF-16LE as PowerShell expects', () => {
    expect(toBase64(utf8('Hola'))).toBe('SG9sYQ==')
    expect(toBase64(utf8('¿Qué tal?'))).toBe('wr9RdcOpIHRhbD8=')
    expect(toBase64(utf16le('A'))).toBe('QQA=')
  })
})

describe('scripts', () => {
  test('select the voice, quoting it, and set the rate', () => {
    const script = speakScript("Microsoft O'Neil Desktop", 3)

    expect(script).toContain("$s.SelectVoice('Microsoft O''Neil Desktop')")
    expect(script).toContain('$s.Rate = 3')
    expect(speakScript(undefined, 0)).not.toContain('SelectVoice')
  })

  test('run through powershell.exe with an encoded command', () => {
    const argv = powershell('Write-Output 1')

    expect(argv.slice(0, 4)).toEqual(['powershell.exe', '-NoProfile', '-NonInteractive', '-EncodedCommand'])
    expect(argv[4]).toBe(toBase64(utf16le('Write-Output 1')))
  })
})

describe('sapiRate', () => {
  test('maps words per minute onto -10 to 10', () => {
    expect(sapiRate(0)).toBe(0)
    expect(sapiRate(180)).toBe(0)
    expect(sapiRate(220)).toBe(3)
    expect(sapiRate(500)).toBe(10)
    expect(sapiRate(60)).toBe(-8)
  })
})

test('parseSapiVoices reads name and culture', () => {
  expect(parseSapiVoices('Microsoft Helena Desktop|es-ES\r\nMicrosoft Zira Desktop|en-US\r\n')).toEqual([
    { name: 'Microsoft Helena Desktop', locale: 'es_ES' },
    { name: 'Microsoft Zira Desktop', locale: 'en_US' },
  ])
})
