import { useQuery } from '@pinia/colada'

export function useWorkspaceOrganizations() {
  return useQuery<GitHubOrganization[]>({
    key: ['workspace', 'organizations'],
    query: async () => {
      if (!window.ohMyGithub?.accounts) {
        throw new Error('GitHub accounts bridge is unavailable')
      }

      return window.ohMyGithub.accounts.listOrganizations()
    }
  })
}
