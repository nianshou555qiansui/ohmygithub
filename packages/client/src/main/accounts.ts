import { createGitHubApi } from '@oh-my-github/api'
import { ipcMain } from 'electron'
import { getAuthenticatedAccessToken } from './auth'

export function registerAccountsIpc(): void {
  ipcMain.handle('accounts:list-organizations', () => listViewerOrganizations())
}

async function listViewerOrganizations() {
  const api = createGitHubApi({
    token: getAuthenticatedAccessToken()
  })

  return api.accounts.listViewerOrganizations()
}
