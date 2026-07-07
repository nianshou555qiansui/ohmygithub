import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const source = readFileSync(resolve(__dirname, 'index.vue'), 'utf8')

describe('about settings update button', () => {
  it('shows a real spinner while busy instead of spinning the state icon', () => {
    // The update button carries a state icon (download / refresh / restart). While
    // busy it must swap that icon for a <Spinner>, not rotate the icon itself —
    // a spinning "download" glyph is not a loading spinner.
    expect(source).not.toContain('animate-spin')
    expect(source).toMatch(/<Spinner\s+v-if="updateButtonState.loading"/)
    expect(source).toMatch(/<component\s+:is="updateButtonIcon"\s+v-else/)
  })
})
