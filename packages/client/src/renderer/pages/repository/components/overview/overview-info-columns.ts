const MAX_ITEMS_PER_COLUMN = 5
const MIN_COLUMNS = 2
const MAX_COLUMNS = 3

/**
 * Splits info items into vertically-filled columns: column count grows with the
 * item count (max 5 per column) but stays within [2, 3]; items are distributed
 * evenly so no column exceeds its share by more than one row.
 */
export function chunkOverviewInfoItems<T>(items: T[]): T[][] {
  if (items.length === 0) return []

  const columnCount = Math.min(
    MAX_COLUMNS,
    Math.max(MIN_COLUMNS, Math.ceil(items.length / MAX_ITEMS_PER_COLUMN)),
  )
  const rowCount = Math.ceil(items.length / columnCount)
  const columns: T[][] = []

  for (let index = 0; index < items.length; index += rowCount) {
    columns.push(items.slice(index, index + rowCount))
  }

  return columns
}
