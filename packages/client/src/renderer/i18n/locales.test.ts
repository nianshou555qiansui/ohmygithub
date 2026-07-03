import { describe, expect, it } from 'vitest'
import { createI18n } from 'vue-i18n'
import en from './locales/en.json'
import zh from './locales/zh.json'

// Every message is compiled by vue-i18n at render time; invalid syntax (an
// unescaped @, |, or stray {) throws inside component rendering and takes the
// whole page down. Compile all of them up front instead.
describe('locale messages', () => {
  const locales = { en, zh }

  for (const [locale, messages] of Object.entries(locales)) {
    it(`compiles every ${locale} message`, () => {
      const i18n = createI18n({
        legacy: false,
        locale,
        fallbackWarn: false,
        missingWarn: false,
        messages: { [locale]: messages },
      })
      const failures: string[] = []

      for (const key of collectMessageKeys(messages)) {
        try {
          i18n.global.t(key)
        } catch (error) {
          failures.push(`${key}: ${error instanceof Error ? error.message.split('\n')[0] : String(error)}`)
        }
      }

      expect(failures).toEqual([])
    })
  }
})

function collectMessageKeys(node: unknown, prefix = ''): string[] {
  if (typeof node === 'string') return [prefix]
  if (!node || typeof node !== 'object') return []

  return Object.entries(node).flatMap(([key, value]) =>
    collectMessageKeys(value, prefix ? `${prefix}.${key}` : key)
  )
}
