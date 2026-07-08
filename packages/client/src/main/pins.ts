import type { GitHubAccountRepository } from '@oh-my-github/api'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'
import { ipcMain } from 'electron'

export const MAX_REPOSITORY_PINS = 6

export interface StoredPins {
  version: 1
  /* Pinned workspace sidebar organizations, keyed by lowercase account
     login so each signed-in account keeps its own pin list. */
  organizations: Record<string, string[]>
  /* Viewer-chosen profile pins, keyed by lowercase account login. Full
     repository snapshots so the overview can render them without extra
     API calls; refreshed whenever the selection is saved. */
  repositoryPins: Record<string, GitHubAccountRepository[]>
}

export interface StoredPinsInfo {
  path: string
  hasContent: boolean
  pins: StoredPins
}

export const pinsFilePath = join(homedir(), '.oh-my-github', 'pins.json')

export function registerPinsIpc(): void {
  ipcMain.handle('pins:get', () => readPinsInfo())
  // Both writers merge one login's slice into the stored file instead of
  // overwriting the whole file, so they can't drop each other's data.
  ipcMain.handle('pins:set-organization-pins', (_event, payload: unknown) => {
    const input = payload as Partial<{ login: string; organizations: unknown }>
    const login = String(input?.login ?? '').trim().toLowerCase()

    if (!login) {
      throw new Error('Account login is required')
    }

    const current = readPins()
    const pins = normalizePins({
      ...current,
      organizations: {
        ...current.organizations,
        [login]: Array.isArray(input?.organizations) ? input.organizations : []
      }
    })
    writePins(pins)

    return {
      path: pinsFilePath,
      hasContent: hasPinsContent(pins),
      pins
    }
  })
  ipcMain.handle('pins:set-repository-pins', (_event, payload: unknown) => {
    const input = payload as Partial<{ login: string; repositories: unknown }>
    const login = String(input?.login ?? '').trim().toLowerCase()

    if (!login) {
      throw new Error('Account login is required')
    }

    const current = readPins()
    const pins = normalizePins({
      ...current,
      repositoryPins: {
        ...current.repositoryPins,
        [login]: Array.isArray(input?.repositories) ? input.repositories : []
      }
    })
    writePins(pins)

    return {
      path: pinsFilePath,
      hasContent: hasPinsContent(pins),
      pins
    }
  })
}

function readPinsInfo(): StoredPinsInfo {
  const pins = readPins()

  return {
    path: pinsFilePath,
    hasContent: hasPinsContent(pins),
    pins
  }
}

export function readPins(): StoredPins {
  try {
    const raw = readFileSync(pinsFilePath, 'utf8')
    if (!raw.trim()) {
      const pins = defaultPins()
      writePins(pins)
      return pins
    }

    return normalizePins(JSON.parse(raw) as Partial<StoredPins>)
  } catch (error) {
    if (isMissingFileError(error)) {
      const pins = defaultPins()
      writePins(pins)
      return pins
    }

    throw error
  }
}

function writePins(pins: StoredPins): void {
  mkdirSync(dirname(pinsFilePath), { recursive: true })
  writeFileSync(pinsFilePath, `${JSON.stringify(pins, null, 2)}\n`, 'utf8')
}

export function normalizePins(value: unknown): StoredPins {
  if (!isRecord(value)) return defaultPins()

  return {
    version: 1,
    organizations: normalizeOrganizationPins(value.organizations),
    repositoryPins: normalizeRepositoryPins(value.repositoryPins)
  }
}

function normalizeOrganizationPins(value: unknown): Record<string, string[]> {
  if (!isRecord(value) || Array.isArray(value)) return {}

  const result: Record<string, string[]> = {}

  for (const [login, organizations] of Object.entries(value)) {
    const normalizedLogin = login.trim().toLowerCase()
    if (!normalizedLogin || !Array.isArray(organizations)) continue

    const entries = dedupeLogins(
      organizations.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    )
    if (entries.length > 0) {
      result[normalizedLogin] = entries
    }
  }

  return result
}

function normalizeRepositoryPins(value: unknown): Record<string, GitHubAccountRepository[]> {
  if (!isRecord(value)) return {}

  const result: Record<string, GitHubAccountRepository[]> = {}

  for (const [login, repositories] of Object.entries(value)) {
    const normalizedLogin = login.trim().toLowerCase()
    if (!normalizedLogin || !Array.isArray(repositories)) continue

    const entries = dedupeRepositories(repositories.filter(isStoredRepository)).slice(0, MAX_REPOSITORY_PINS)
    if (entries.length > 0) {
      result[normalizedLogin] = entries
    }
  }

  return result
}

function isStoredRepository(value: unknown): value is GitHubAccountRepository {
  return isRecord(value)
    && typeof value.nameWithOwner === 'string'
    && value.nameWithOwner.trim().length > 0
    && typeof value.name === 'string'
    && typeof value.owner === 'string'
    && typeof value.url === 'string'
}

function dedupeRepositories(repositories: GitHubAccountRepository[]): GitHubAccountRepository[] {
  const seen = new Set<string>()
  const result: GitHubAccountRepository[] = []

  for (const repository of repositories) {
    const key = repository.nameWithOwner.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    result.push(repository)
  }

  return result
}

function dedupeLogins(logins: string[]): string[] {
  const seen = new Set<string>()
  const result: string[] = []

  for (const login of logins) {
    if (seen.has(login)) continue
    seen.add(login)
    result.push(login)
  }

  return result
}

function defaultPins(): StoredPins {
  return {
    version: 1,
    organizations: {},
    repositoryPins: {}
  }
}

function hasPinsContent(pins: StoredPins): boolean {
  return Object.keys(pins.organizations).length > 0 || Object.keys(pins.repositoryPins).length > 0
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isMissingFileError(error: unknown): boolean {
  return isRecord(error) && error.code === 'ENOENT'
}
