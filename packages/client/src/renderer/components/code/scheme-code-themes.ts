import type { ThemeRegistrationRaw } from 'shiki'
import type { ColorSchemeId } from '@/stores/settings'

/**
 * Code themes are bound to the app color scheme instead of being chosen
 * separately. Each scheme gets a light and a dark theme that share one neutral,
 * high-readability syntax base; only the accent scopes (keywords/storage,
 * function/type names, tags, attributes) are tinted to the scheme's hue.
 *
 * Every theme uses a fully transparent background (`#00000000`) so code blends
 * into the already scheme-tinted panel behind it. The same theme objects feed
 * both Shiki (HTML rendering) and Monaco (editor) via stream-monaco.
 */

const TRANSPARENT = '#00000000'

type ThemeVariant = 'light' | 'dark'

interface NeutralPalette {
  fg: string
  comment: string
  string: string
  number: string
  punctuation: string
  variable: string
  regexp: string
}

interface AccentPalette {
  /** keywords, storage, control flow, tags, headings */
  strong: string
  /** function/type/class names, attributes, decorators */
  soft: string
}

const NEUTRAL: Record<ThemeVariant, NeutralPalette> = {
  light: {
    fg: '#1f2328',
    comment: '#6e7781',
    string: '#116329',
    number: '#0550ae',
    punctuation: '#57606a',
    variable: '#1f2328',
    regexp: '#0a7c3e'
  },
  dark: {
    fg: '#e6edf3',
    comment: '#8b949e',
    string: '#7ee787',
    number: '#79c0ff',
    punctuation: '#8b949e',
    variable: '#e6edf3',
    regexp: '#7ee787'
  }
}

const ACCENTS: Record<ColorSchemeId, Record<ThemeVariant, AccentPalette>> = {
  default: {
    light: { strong: '#0a58ca', soft: '#1f6feb' },
    dark: { strong: '#79c0ff', soft: '#a5d6ff' }
  },
  ocean: {
    light: { strong: '#1263de', soft: '#2f8bff' },
    dark: { strong: '#6cb6ff', soft: '#9fd0ff' }
  },
  forest: {
    light: { strong: '#1a7f37', soft: '#2da44e' },
    dark: { strong: '#56d364', soft: '#7ee787' }
  },
  rose: {
    light: { strong: '#c11d5b', soft: '#e0447a' },
    dark: { strong: '#ff7b9c', soft: '#ffa9c0' }
  },
  amber: {
    light: { strong: '#b45309', soft: '#d97706' },
    dark: { strong: '#e3a54a', soft: '#f0c674' }
  }
}

function buildTokenColors(
  neutral: NeutralPalette,
  accent: AccentPalette
): ThemeRegistrationRaw['settings'] {
  return [
    {
      scope: ['comment', 'punctuation.definition.comment', 'string.comment'],
      settings: { foreground: neutral.comment, fontStyle: 'italic' }
    },
    {
      scope: [
        'string',
        'string.template',
        'constant.other.symbol',
        'punctuation.definition.string'
      ],
      settings: { foreground: neutral.string }
    },
    {
      scope: ['string.regexp', 'constant.character.escape'],
      settings: { foreground: neutral.regexp }
    },
    {
      scope: [
        'constant.numeric',
        'constant.language',
        'constant.character',
        'support.constant'
      ],
      settings: { foreground: neutral.number }
    },
    {
      scope: [
        'punctuation',
        'meta.brace',
        'keyword.operator',
        'punctuation.separator',
        'punctuation.terminator'
      ],
      settings: { foreground: neutral.punctuation }
    },
    {
      scope: [
        'variable',
        'variable.parameter',
        'meta.definition.variable',
        'variable.other.property',
        'meta.object-literal.key',
        'support.variable.property'
      ],
      settings: { foreground: neutral.variable }
    },
    {
      scope: [
        'keyword',
        'storage',
        'storage.type',
        'storage.modifier',
        'keyword.control',
        'entity.name.tag',
        'meta.tag',
        'markup.heading',
        'punctuation.definition.keyword'
      ],
      settings: { foreground: accent.strong }
    },
    {
      scope: [
        'entity.name.function',
        'support.function',
        'meta.function-call',
        'entity.name.type',
        'entity.name.class',
        'support.type',
        'support.class',
        'entity.other.attribute-name',
        'meta.decorator',
        'variable.annotation'
      ],
      settings: { foreground: accent.soft }
    }
  ]
}

function buildTheme(
  scheme: ColorSchemeId,
  variant: ThemeVariant
): ThemeRegistrationRaw {
  const neutral = NEUTRAL[variant]
  const accent = ACCENTS[scheme][variant]

  return {
    name: `omg-${scheme}-${variant}`,
    type: variant,
    bg: TRANSPARENT,
    fg: neutral.fg,
    colors: {
      'editor.background': TRANSPARENT,
      'editor.foreground': neutral.fg
    },
    settings: buildTokenColors(neutral, accent)
  }
}

export type SchemeCodeThemes = {
  light: ThemeRegistrationRaw
  dark: ThemeRegistrationRaw
}

const SCHEME_THEMES = Object.fromEntries(
  (Object.keys(ACCENTS) as ColorSchemeId[]).map((scheme) => [
    scheme,
    { light: buildTheme(scheme, 'light'), dark: buildTheme(scheme, 'dark') }
  ])
) as Record<ColorSchemeId, SchemeCodeThemes>

export function getSchemeCodeThemes(scheme: ColorSchemeId): SchemeCodeThemes {
  return SCHEME_THEMES[scheme] ?? SCHEME_THEMES.default
}

/** Flat list of every scheme theme, for pre-registering with Monaco. */
export const allSchemeThemes: ThemeRegistrationRaw[] = Object.values(
  SCHEME_THEMES
).flatMap((pair) => [pair.light, pair.dark])
