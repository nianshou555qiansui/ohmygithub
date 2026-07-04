import { describe, expect, it } from 'vitest'
import { FALLBACK_LANGUAGE_COLOR } from './language-colors'
import { computeLanguageShares } from './overview-language-shares'

describe('computeLanguageShares', () => {
  it('returns an empty list when there are no bytes', () => {
    expect(computeLanguageShares([])).toEqual([])
    expect(computeLanguageShares([{ name: 'Go', bytes: 0 }])).toEqual([])
  })

  it('computes one-decimal percentages with linguist colors', () => {
    const shares = computeLanguageShares([
      { name: 'Go', bytes: 663 },
      { name: 'Vue', bytes: 169 },
      { name: 'TypeScript', bytes: 136 },
      { name: 'CSS', bytes: 32 },
    ])

    expect(shares).toEqual([
      { name: 'Go', percent: 66.3, color: '#00ADD8' },
      { name: 'Vue', percent: 16.9, color: '#41b883' },
      { name: 'TypeScript', percent: 13.6, color: '#3178c6' },
      { name: 'CSS', percent: 3.2, color: '#663399' },
    ])
  })

  it('aggregates languages beyond the sixth into an "Other" bucket', () => {
    const shares = computeLanguageShares([
      { name: 'Go', bytes: 700 },
      { name: 'Vue', bytes: 100 },
      { name: 'TypeScript', bytes: 100 },
      { name: 'CSS', bytes: 40 },
      { name: 'Shell', bytes: 30 },
      { name: 'JavaScript', bytes: 20 },
      { name: 'Makefile', bytes: 6 },
      { name: 'Dockerfile', bytes: 4 },
    ])

    expect(shares).toHaveLength(7)
    expect(shares[6]).toEqual({ name: null, percent: 1, color: FALLBACK_LANGUAGE_COLOR })
  })

  it('falls back to a neutral color for unknown languages and drops zero-percent shares', () => {
    const shares = computeLanguageShares([
      { name: 'TotallyMadeUpLang', bytes: 999_999 },
      { name: 'Go', bytes: 1 },
    ])

    expect(shares).toEqual([
      { name: 'TotallyMadeUpLang', percent: 100, color: FALLBACK_LANGUAGE_COLOR },
    ])
  })
})
