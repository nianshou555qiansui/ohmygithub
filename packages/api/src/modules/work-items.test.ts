import { describe, expect, it } from 'vitest'
import { mapLabels } from './work-items'

describe('mapLabels', () => {
  it('maps name, color, and description', () => {
    expect(
      mapLabels({ nodes: [{ name: 'bug', color: 'd73a4a', description: 'A defect' }] })
    ).toEqual([{ name: 'bug', color: 'd73a4a', description: 'A defect' }])
  })

  it('defaults missing color to empty string and missing description to null', () => {
    expect(mapLabels({ nodes: [{ name: 'triage' }] })).toEqual([
      { name: 'triage', color: '', description: null }
    ])
  })

  it('drops nameless and null nodes', () => {
    expect(mapLabels({ nodes: [null, { name: '' } as { name: string }] })).toEqual([])
  })

  it('handles empty / nullish input', () => {
    expect(mapLabels({ nodes: [] })).toEqual([])
    expect(mapLabels(null)).toEqual([])
    expect(mapLabels(undefined)).toEqual([])
  })
})
