// Windows: the voices of System.Speech (SAPI), driven through Windows PowerShell.
// Pure helpers: the scripts, their encoding, and parsing what they print.
// (PowerShell 7 has no System.Speech, so these target powershell.exe, which every Windows has.)

import type { Voice } from './speech'

const BASE64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'

export const toBase64 = (bytes: Uint8Array): string => {
  let out = ''
  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i] ?? 0
    const b = bytes[i + 1]
    const c = bytes[i + 2]
    out += BASE64.charAt(a >> 2)
    out += BASE64.charAt(((a & 3) << 4) | ((b ?? 0) >> 4))
    out += b === undefined ? '=' : BASE64.charAt(((b & 15) << 2) | ((c ?? 0) >> 6))
    out += c === undefined ? '=' : BASE64.charAt(c & 63)
  }

  return out
}

export const utf8 = (text: string) => new TextEncoder().encode(text)

// -EncodedCommand takes the script as base64 of its UTF-16LE text.
export const utf16le = (text: string) => {
  const bytes = new Uint8Array(text.length * 2)
  for (let i = 0; i < text.length; i += 1) {
    const code = text.charCodeAt(i)
    bytes[i * 2] = code & 0xff
    bytes[i * 2 + 1] = code >> 8
  }

  return bytes
}

const quote = (value: string) => `'${value.replace(/'/g, "''")}'`

// SAPI's rate runs from -10 to 10, 0 being about 180 words per minute.
export const sapiRate = (wordsPerMinute: number) =>
  wordsPerMinute > 0 ? Math.max(-10, Math.min(10, Math.round((wordsPerMinute - 180) / 15))) : 0

export const VOICES_SCRIPT = [
  'Add-Type -AssemblyName System.Speech',
  '$s = New-Object System.Speech.Synthesis.SpeechSynthesizer',
  "$s.GetInstalledVoices() | Where-Object { $_.Enabled } | ForEach-Object { $_.VoiceInfo.Name + '|' + $_.VoiceInfo.Culture.Name }",
].join('\n')

// Prints its pid first so it can be stopped, then reads the text as base64 of UTF-8 on
// standard input: plain ASCII, whatever code page the console uses.
export const speakScript = (voice: string | undefined, rate: number) =>
  [
    "$ErrorActionPreference = 'Stop'",
    '[Console]::Out.WriteLine($PID)',
    '[Console]::Out.Flush()',
    'Add-Type -AssemblyName System.Speech',
    '$s = New-Object System.Speech.Synthesis.SpeechSynthesizer',
    ...(voice ? [`$s.SelectVoice(${quote(voice)})`] : []),
    `$s.Rate = ${rate}`,
    '$t = [Text.Encoding]::UTF8.GetString([Convert]::FromBase64String([Console]::In.ReadToEnd().Trim()))',
    '$s.Speak($t)',
  ].join('\n')

export const powershell = (script: string) => [
  'powershell.exe',
  '-NoProfile',
  '-NonInteractive',
  '-EncodedCommand',
  toBase64(utf16le(script)),
]

// `Microsoft Helena Desktop|es-ES` -> { name: 'Microsoft Helena Desktop', locale: 'es_ES' }
export const parseSapiVoices = (output: string): Voice[] =>
  output.split(/\r?\n/).flatMap(line => {
    const [name, culture] = line.trim().split('|')

    return name && culture ? [{ name, locale: culture.replace('-', '_') }] : []
  })
