export interface EnvEntry {
  name: string
  value: string
}

const ENTRY_PATTERN = /^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=(.*)$/

export function parseEnvEntries(text: string): EnvEntry[] {
  const entries = new Map<string, string>()

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue

    const match = ENTRY_PATTERN.exec(line)
    if (!match) continue

    const [, name, rawValue] = match
    entries.set(name, parseValue(rawValue.trim()))
  }

  return [...entries].map(([name, value]) => ({ name, value }))
}

function parseValue(value: string): string {
  const quote = value[0]
  if ((quote === '"' || quote === "'") && value.length > 1 && value.endsWith(quote)) {
    return value.slice(1, -1)
  }

  const commentStart = value.indexOf(' #')
  return (commentStart === -1 ? value : value.slice(0, commentStart)).trim()
}
