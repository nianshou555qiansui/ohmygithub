export interface LabelColorVars {
  '--label-r': number
  '--label-g': number
  '--label-b': number
  '--label-h': number
  '--label-s': number
  '--label-l': number
  // Allow assignment to Vue's CSSProperties, which carries a `--${string}` index signature.
  [key: `--${string}`]: number
}

const HEX_RE = /^[0-9a-f]{6}$/

export function labelColorVars(color: string): LabelColorVars | null {
  const hex = color.trim().replace(/^#/, '').toLowerCase()
  if (!HEX_RE.test(hex)) return null

  const r = Number.parseInt(hex.slice(0, 2), 16)
  const g = Number.parseInt(hex.slice(2, 4), 16)
  const b = Number.parseInt(hex.slice(4, 6), 16)

  const [h, s, l] = rgbToHsl(r, g, b)

  return {
    '--label-r': r,
    '--label-g': g,
    '--label-b': b,
    '--label-h': h,
    '--label-s': s,
    '--label-l': l
  }
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  const rn = r / 255
  const gn = g / 255
  const bn = b / 255
  const max = Math.max(rn, gn, bn)
  const min = Math.min(rn, gn, bn)
  const delta = max - min
  const l = (max + min) / 2

  let h = 0
  let s = 0

  if (delta !== 0) {
    s = delta / (1 - Math.abs(2 * l - 1))

    switch (max) {
      case rn:
        h = ((gn - bn) / delta) % 6
        break
      case gn:
        h = (bn - rn) / delta + 2
        break
      default:
        h = (rn - gn) / delta + 4
    }

    h *= 60
    if (h < 0) h += 360
  }

  return [Math.round(h), Math.round(s * 100), Math.round(l * 100)]
}
