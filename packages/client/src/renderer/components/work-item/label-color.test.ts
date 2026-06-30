import { describe, expect, it } from 'vitest'
import { labelColorVars } from './label-color'

describe('labelColorVars', () => {
  it('parses a pure red hex into RGB + HSL CSS variables', () => {
    expect(labelColorVars('ff0000')).toEqual({
      '--label-r': 255,
      '--label-g': 0,
      '--label-b': 0,
      '--label-h': 0,
      '--label-s': 100,
      '--label-l': 50
    })
  })

  it('parses green and blue primaries', () => {
    expect(labelColorVars('00ff00')?.['--label-h']).toBe(120)
    expect(labelColorVars('0000ff')?.['--label-h']).toBe(240)
  })

  it('tolerates a leading # and uppercase', () => {
    expect(labelColorVars('#FFFFFF')).toEqual({
      '--label-r': 255,
      '--label-g': 255,
      '--label-b': 255,
      '--label-h': 0,
      '--label-s': 0,
      '--label-l': 100
    })
  })

  it('returns 0 saturation for a neutral gray', () => {
    expect(labelColorVars('808080')?.['--label-s']).toBe(0)
  })

  it('returns null for empty or malformed input', () => {
    expect(labelColorVars('')).toBeNull()
    expect(labelColorVars('xyz')).toBeNull()
    expect(labelColorVars('12345')).toBeNull()
    expect(labelColorVars('1234567')).toBeNull()
  })
})
