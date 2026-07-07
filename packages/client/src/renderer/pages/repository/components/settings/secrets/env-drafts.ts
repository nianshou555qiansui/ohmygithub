import type { EnvEntry } from './parse-env-entries'

export interface EnvDraft {
  id: number
  name: string
  value: string
  error: string | null
}

let nextDraftId = 1

export function createEnvDraft(entry?: EnvEntry): EnvDraft {
  return {
    id: nextDraftId++,
    name: entry?.name ?? '',
    value: entry?.value ?? '',
    error: null,
  }
}
