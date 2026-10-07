// Pure helpers: turning markdown into speakable text, guessing its language
// and choosing an installed voice for it. Nothing here touches `$`.

export type Lang = 'es' | 'en' | 'pt' | 'fr' | 'de' | 'it'
export type Voice = { name: string; locale: string }

export const MAX_CHARS = 20_000

// Common words of each language; a word shared by several counts for each of them.
const MARKERS: Record<Lang, readonly string[]> = {
  es: ['de', 'la', 'que', 'el', 'en', 'y', 'los', 'las', 'del', 'se', 'por', 'un', 'una', 'con', 'no', 'para', 'es', 'lo', 'como', 'más', 'pero', 'ya', 'este', 'esta', 'esto', 'eso', 'hay', 'muy', 'también', 'sí', 'qué', 'cuando', 'hola', 'gracias', 'puedes', 'tengo', 'está', 'son', 'mi', 'tu'],
  en: ['the', 'and', 'is', 'are', 'you', 'this', 'that', 'with', 'for', 'it', 'of', 'to', 'can', 'will', 'your', 'have', 'not', 'what', 'a', 'in', 'on', 'be', 'do', 'i', 'my', 'hello', 'thanks'],
  pt: ['de', 'que', 'não', 'você', 'é', 'do', 'da', 'em', 'um', 'uma', 'com', 'são', 'isso', 'mais', 'muito', 'pode', 'os', 'ao', 'seu', 'olá', 'obrigado', 'está', 'para', 'eu', 'como'],
  fr: ['le', 'la', 'les', 'de', 'des', 'et', 'est', 'un', 'une', 'pas', 'vous', 'qui', 'dans', 'pour', 'avec', 'sur', 'ce', 'sont', 'il', 'je', 'bonjour', 'merci', 'que', 'en'],
  de: ['der', 'die', 'und', 'ist', 'nicht', 'ein', 'eine', 'mit', 'auf', 'für', 'das', 'sie', 'auch', 'werden', 'ich', 'es', 'zu', 'den', 'hallo', 'danke'],
  it: ['di', 'che', 'è', 'non', 'sono', 'della', 'per', 'gli', 'anche', 'questo', 'più', 'nel', 'alla', 'ci', 'sei', 'il', 'la', 'un', 'una', 'ciao', 'grazie', 'come', 'con'],
}

// Letters that give a language away.
const LETTERS: Record<Lang, RegExp | undefined> = {
  es: /[ñ¿¡]/g,
  en: undefined,
  pt: /[ãõ]/g,
  fr: /[œëàù]/g,
  de: /[ßäöü]/g,
  it: undefined,
}

export const LANGS = Object.keys(MARKERS) as Lang[]

export const detectLanguage = (text: string): Lang | undefined => {
  const words = text.toLowerCase().match(/\p{L}+/gu) ?? []
  const scores = new Map<Lang, number>()

  for (const lang of LANGS) {
    const markers = new Set(MARKERS[lang])
    const hits = words.filter(word => markers.has(word)).length
    const letters = LETTERS[lang] ? (text.toLowerCase().match(LETTERS[lang]) ?? []).length * 3 : 0
    scores.set(lang, hits + letters)
  }

  // The language with the most hits, when no other has as many.
  const [best, second] = [...scores].sort((a, b) => b[1] - a[1])

  return best && best[1] > 0 && best[1] > (second?.[1] ?? 0) ? best[0] : undefined
}

// `say -v '?'` prints one voice per line: `Paulina   es_MX   # Hola, me llamo Paulina.`
export const parseVoices = (output: string): Voice[] =>
  output.split('\n').flatMap(line => {
    const match = /^(.+?)\s+([a-z]{2,3}_[A-Za-z0-9]+)\s+#/.exec(line)

    return match?.[1] && match[2] ? [{ name: match[1].trim(), locale: match[2] }] : []
  })

// `es=Paulina, en=Samantha` -> { es: 'Paulina', en: 'Samantha' }
export const parseOverrides = (setting: string): Partial<Record<string, string>> =>
  Object.fromEntries(
    setting
      .split(',')
      .map(pair => pair.split('=').map(part => part.trim()))
      .filter((pair): pair is [string, string] => pair.length === 2 && pair[0] !== '' && pair[1] !== ''),
  )

const PREFERRED: Record<Lang, readonly string[]> = {
  es: ['Paulina', 'Mónica', 'Monica', 'Jorge', 'Juan', 'Diego'],
  en: ['Samantha', 'Alex', 'Daniel', 'Karen', 'Moira', 'Tessa'],
  pt: ['Luciana', 'Joana', 'Felipe'],
  fr: ['Thomas', 'Amélie', 'Amelie', 'Audrey'],
  de: ['Anna', 'Markus', 'Petra', 'Yannick'],
  it: ['Alice', 'Federica', 'Luca'],
}

// Voices macOS ships for fun or with a robotic sound: picked only when nothing else is installed.
const NOVELTY = new Set([
  'Albert', 'Bad News', 'Bahh', 'Bells', 'Boing', 'Bubbles', 'Cellos', 'Eddy', 'Flo', 'Fred',
  'Good News', 'Grandma', 'Grandpa', 'Jester', 'Junior', 'Kathy', 'Organ', 'Ralph', 'Reed',
  'Rocko', 'Sandy', 'Shelley', 'Superstar', 'Trinoids', 'Whisper', 'Wobble', 'Zarvox',
])

const baseName = (name: string) => name.replace(/\s*\(.*\)\s*$/, '')

// Premium and Enhanced downloads sound better than the compact voice of the same name.
const quality = (name: string) => (/premium/i.test(name) ? 2 : /enhanced|mejorada/i.test(name) ? 1 : 0)

export const pickVoice = (
  voices: readonly Voice[],
  lang: Lang,
  overrides: Partial<Record<string, string>> = {},
): string | undefined => {
  const chosen = overrides[lang]
  if (chosen) {
    return chosen
  }

  const ofLang = voices.filter(voice => voice.locale.toLowerCase().startsWith(`${lang}_`))
  const byQuality = (list: readonly Voice[]) => [...list].sort((a, b) => quality(b.name) - quality(a.name))

  for (const name of PREFERRED[lang]) {
    const [best] = byQuality(ofLang.filter(voice => baseName(voice.name) === name))
    if (best) {
      return best.name
    }
  }

  const [plain] = byQuality(ofLang.filter(voice => !NOVELTY.has(baseName(voice.name))))

  return (plain ?? ofLang[0])?.name
}

const isTableRow = (line: string) => /^\|.*\|$/.test(line)
const isTableRule = (line: string) => /^\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)*\|?$/.test(line)

// Markdown as a reader would say it: no code blocks, links read by their text,
// no markup symbols, one sentence per line so `say` pauses between them.
export const cleanForSpeech = (markdown: string): string =>
  markdown
    .replace(/```[\s\S]*?(```|$)/g, '\n')
    .replace(/<[^>\n]+>/g, ' ')
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/https?:\/\/\S+/g, ' ')
    .replace(/`([^`\n]*)`/g, '$1')
    .replace(/(\*\*|__|~~)(\S[\s\S]*?)\1/g, '$2')
    .replace(/\*(\S[^*\n]*?)\*/g, '$1')
    .replace(/\p{Extended_Pictographic}️?/gu, '')
    .split('\n')
    .map(line => line.trim())
    .filter(line => line !== '' && !isTableRule(line))
    .map(line =>
      isTableRow(line)
        ? line.slice(1, -1).split('|').map(cell => cell.trim()).filter(Boolean).join(', ')
        : line,
    )
    .map(line => line.replace(/^#{1,6}\s+/, '').replace(/^>\s?/, '').replace(/^(?:[-*+]|\d+[.)])\s+/, ''))
    .filter(line => /[\p{L}\p{N}]/u.test(line))
    .map(line => (/[.!?:;,]$/.test(line) ? line : `${line}.`))
    .join('\n')
    .slice(0, MAX_CHARS)
