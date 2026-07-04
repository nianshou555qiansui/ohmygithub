import { FALLBACK_LANGUAGE_COLOR, getLanguageColor } from './language-colors'

const MAX_VISIBLE_LANGUAGES = 6

export interface OverviewLanguageShare {
  /** null identifies the aggregated "Other" bucket; callers translate the label. */
  name: string | null
  percent: number
  color: string
}

export function computeLanguageShares(
  languages: Array<{ name: string, bytes: number }>,
): OverviewLanguageShare[] {
  const totalBytes = languages.reduce((sum, language) => sum + Math.max(0, language.bytes), 0)
  if (totalBytes <= 0) return []

  const visible = languages.slice(0, MAX_VISIBLE_LANGUAGES)
  const shares: OverviewLanguageShare[] = visible.map((language) => ({
    name: language.name,
    percent: roundPercent((Math.max(0, language.bytes) / totalBytes) * 100),
    color: getLanguageColor(language.name),
  }))

  const otherBytes = languages
    .slice(MAX_VISIBLE_LANGUAGES)
    .reduce((sum, language) => sum + Math.max(0, language.bytes), 0)
  if (otherBytes > 0) {
    shares.push({
      name: null,
      percent: roundPercent((otherBytes / totalBytes) * 100),
      color: FALLBACK_LANGUAGE_COLOR,
    })
  }

  return shares.filter((share) => share.percent > 0)
}

function roundPercent(value: number): number {
  return Math.round(value * 10) / 10
}
