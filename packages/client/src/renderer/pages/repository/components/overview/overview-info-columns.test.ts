import { describe, expect, it } from 'vitest'
import { chunkOverviewInfoItems } from './overview-info-columns'

function items(count: number): number[] {
  return Array.from({ length: count }, (_, index) => index)
}

describe('chunkOverviewInfoItems', () => {
  it('returns no columns for an empty list', () => {
    expect(chunkOverviewInfoItems([])).toEqual([])
  })

  it('uses at least two columns even for short lists', () => {
    expect(chunkOverviewInfoItems(items(4))).toEqual([[0, 1], [2, 3]])
    expect(chunkOverviewInfoItems(items(3))).toEqual([[0, 1], [2]])
  })

  it('keeps two columns up to ten items, filling vertically', () => {
    expect(chunkOverviewInfoItems(items(10))).toEqual([
      [0, 1, 2, 3, 4],
      [5, 6, 7, 8, 9],
    ])
    expect(chunkOverviewInfoItems(items(7))).toEqual([
      [0, 1, 2, 3],
      [4, 5, 6],
    ])
  })

  it('grows to three columns past ten items', () => {
    expect(chunkOverviewInfoItems(items(11))).toEqual([
      [0, 1, 2, 3],
      [4, 5, 6, 7],
      [8, 9, 10],
    ])
    expect(chunkOverviewInfoItems(items(14))).toEqual([
      [0, 1, 2, 3, 4],
      [5, 6, 7, 8, 9],
      [10, 11, 12, 13],
    ])
  })

  it('caps at three columns for very long lists', () => {
    const columns = chunkOverviewInfoItems(items(20))
    expect(columns).toHaveLength(3)
    expect(columns.flat()).toEqual(items(20))
  })
})
