import { describe, expect, test } from 'claude-code/testing'

import { cleanForSpeech, detectLanguage, parseOverrides, parseVoices, pickVoice } from '../hooks/speech'

const SAY_OUTPUT = [
  'Eddy (Spanish (Mexico)) es_MX    # ¡Hola! Me llamo Eddy.',
  'Paulina             es_MX    # Hola, me llamo Paulina.',
  'Paulina (Enhanced)  es_MX    # Hola, me llamo Paulina.',
  'Mónica              es_ES    # Hola, me llamo Mónica.',
  'Samantha            en_US    # Hello, my name is Samantha.',
  'Bells               en_US    # Time flies when you are having fun.',
  'Thomas              fr_FR    # Bonjour, je m’appelle Thomas.',
].join('\n')

describe('cleanForSpeech', () => {
  test('drops code blocks, urls and markup, keeps the words', () => {
    const text = cleanForSpeech(
      [
        '## Resumen',
        '',
        'Usa **`/speak`** para leer [la guía](https://example.com) 🔊',
        '',
        '```ts',
        'const x = 1',
        '```',
        '- Primer punto',
        '| Opción | Precio |',
        '| --- | --- |',
        '| Mod | Gratis |',
      ].join('\n'),
    )

    expect(text).toBe(['Resumen.', 'Usa /speak para leer la guía.', 'Primer punto.', 'Opción, Precio.', 'Mod, Gratis.'].join('\n'))
  })

  test('leaves nothing for a reply that is only code', () => {
    expect(cleanForSpeech('```bash\nls -la\n```')).toBe('')
  })
})

describe('detectLanguage', () => {
  test('tells Spanish, English and French apart', () => {
    expect(detectLanguage('Hola, esto es una prueba para ver si el mod lee bien')).toBe('es')
    expect(detectLanguage('This is a test to see if the mod can read your replies')).toBe('en')
    expect(detectLanguage('Bonjour, ceci est un test pour vous et les autres')).toBe('fr')
  })

  test('tells a short Spanish phrase', () => {
    expect(detectLanguage('Hola, esto es una prueba de voz')).toBe('es')
  })

  test('gives up on text it cannot tell', () => {
    expect(detectLanguage('OK')).toBeUndefined()
    expect(detectLanguage('de la')).toBeUndefined()
  })
})

describe('pickVoice', () => {
  const voices = parseVoices(SAY_OUTPUT)

  test('parses every voice line', () => {
    expect(voices).toHaveLength(7)
    expect(voices[0]).toEqual({ name: 'Eddy (Spanish (Mexico))', locale: 'es_MX' })
  })

  test('prefers a natural voice, and its enhanced download', () => {
    expect(pickVoice(voices, 'es')).toBe('Paulina (Enhanced)')
    expect(pickVoice(voices, 'en')).toBe('Samantha')
    expect(pickVoice(voices, 'de')).toBeUndefined()
  })

  test('the setting wins', () => {
    expect(pickVoice(voices, 'es', parseOverrides('es=Mónica, en=Samantha'))).toBe('Mónica')
  })
})
