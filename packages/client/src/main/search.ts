import { createGitHubApi, type GitHubWorkspaceSearchMode, type SearchWorkspaceOptions } from '@oh-my-github/api'
import { ipcMain } from 'electron'
import { getAuthenticatedAccessToken } from './auth'
import { resolveGitHubProxyUrl } from './proxy'

export function registerSearchIpc(): void {
  ipcMain.handle('search:resolve-goto', (_event, input: string) => resolveWorkspaceGoto(input))
  ipcMain.handle('search:workspace', (_event, options: SearchWorkspaceOptions) => searchWorkspace(options))
}

async function resolveWorkspaceGoto(input: string) {
  const normalizedInput = String(input ?? '').trim()

  if (!normalizedInput) {
    throw new Error('Search input is required')
  }

  const api = await createAuthenticatedGitHubApi()

  return api.search.resolveWorkspaceGoto(normalizedInput)
}

async function searchWorkspace(options: SearchWorkspaceOptions) {
  const normalizedOptions = normalizeSearchOptions(options)
  const api = await createAuthenticatedGitHubApi()

  return api.search.searchWorkspace(normalizedOptions)
}

function normalizeSearchOptions(options: SearchWorkspaceOptions): SearchWorkspaceOptions {
  const query = String(options?.query ?? '').trim()

  if (!query) {
    throw new Error('Search query is required')
  }

  return {
    mode: normalizeSearchMode(options?.mode),
    query,
    page: normalizePositiveInteger(options?.page),
    perPage: normalizePositiveInteger(options?.perPage),
  }
}

function normalizeSearchMode(mode: GitHubWorkspaceSearchMode | undefined): GitHubWorkspaceSearchMode {
  return mode === 'users' || mode === 'orgs' || mode === 'repos' || mode === 'all' ? mode : 'all'
}

function normalizePositiveInteger(value: number | undefined): number | undefined {
  if (value === undefined) return undefined
  const parsed = Math.floor(Number(value))

  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined
}

async function createAuthenticatedGitHubApi() {
  return createGitHubApi({
    token: getAuthenticatedAccessToken(),
    proxyUrl: await resolveGitHubProxyUrl()
  })
}
