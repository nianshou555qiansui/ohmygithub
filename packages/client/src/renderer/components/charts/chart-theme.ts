import type { Ref } from 'vue'
import { onBeforeUnmount, onMounted, ref } from 'vue'

/**
 * Bumps a counter whenever the document theme changes so chart option computeds
 * re-read the CSS variables (echarts canvases can't react to CSS on their own).
 */
export function useChartThemeVersion(): Ref<number> {
  const themeVersion = ref(0)
  let observer: MutationObserver | null = null

  onMounted(() => {
    themeVersion.value += 1
    observer = new MutationObserver(() => {
      themeVersion.value += 1
    })
    observer.observe(document.documentElement, {
      attributeFilter: ['class', 'style', 'data-theme'],
      attributes: true,
    })
  })

  onBeforeUnmount(() => {
    observer?.disconnect()
    observer = null
  })

  return themeVersion
}

export function cssColorVar(name: string, fallback: string): string {
  return normalizeChartColor(cssVar(name, fallback), fallback)
}

function cssVar(name: string, fallback: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback
}

/** echarts canvas colors can't use oklch(), which the design tokens are written in. */
function normalizeChartColor(value: string, fallback: string): string {
  if (!value.startsWith('oklch(')) return value

  return oklchToRgb(value) ?? fallback
}

function oklchToRgb(value: string): string | null {
  const match = value.match(/^oklch\(\s*([0-9.]+%?)\s+([0-9.]+%?)\s+([0-9.]+)(?:deg)?(?:\s*\/\s*([0-9.]+%?))?\s*\)$/)
  if (!match) return null

  const l = parseCssNumber(match[1], 100)
  const c = parseCssNumber(match[2], 100)
  const h = Number(match[3])
  const alpha = match[4] ? parseCssNumber(match[4], 100) : 1
  if (![l, c, h, alpha].every(Number.isFinite)) return null

  const hue = h * Math.PI / 180
  const a = c * Math.cos(hue)
  const b = c * Math.sin(hue)
  const labL = l + 0.3963377774 * a + 0.2158037573 * b
  const labM = l - 0.1055613458 * a - 0.0638541728 * b
  const labS = l - 0.0894841775 * a - 1.2914855480 * b
  const labL3 = labL ** 3
  const labM3 = labM ** 3
  const labS3 = labS ** 3
  const red = 4.0767416621 * labL3 - 3.3077115913 * labM3 + 0.2309699292 * labS3
  const green = -1.2684380046 * labL3 + 2.6097574011 * labM3 - 0.3413193965 * labS3
  const blue = -0.0041960863 * labL3 - 0.7034186147 * labM3 + 1.7076147010 * labS3
  const rgb = [red, green, blue].map(linearSrgbToRgb)
  const normalizedAlpha = clamp(alpha, 0, 1)

  if (normalizedAlpha < 1) {
    return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${Number(normalizedAlpha.toFixed(3))})`
  }

  return `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`
}

function parseCssNumber(value: string, percentageBase: number): number {
  return value.endsWith('%') ? Number(value.slice(0, -1)) / percentageBase : Number(value)
}

function linearSrgbToRgb(value: number): number {
  const normalized = clamp(value, 0, 1)
  const converted = normalized <= 0.0031308
    ? 12.92 * normalized
    : 1.055 * normalized ** (1 / 2.4) - 0.055

  return Math.round(clamp(converted, 0, 1) * 255)
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}
