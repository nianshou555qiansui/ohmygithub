import type { MaybeRefOrGetter } from 'vue'
import { toValue } from 'vue'
import { useQuery } from '@pinia/colada'

export function useWorkspaceSearchQuery(
  mode: MaybeRefOrGetter<GitHubWorkspaceSearchMode>,
  query: MaybeRefOrGetter<string>,
  page: MaybeRefOrGetter<number>,
  perPage: MaybeRefOrGetter<number>,
  enabled: MaybeRefOrGetter<boolean>,
) {
  return useQuery<GitHubWorkspaceSearchResult>({
    key: () => [
      'github',
      'workspace-search',
      toValue(mode),
      toValue(query),
      toValue(page),
      toValue(perPage),
    ],
    enabled: () => Boolean(toValue(query).trim()) && toValue(enabled),
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 10,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    query: async () => {
      if (!window.ohMyGithub?.search) {
        throw new Error('GitHub search bridge is unavailable')
      }

      return window.ohMyGithub.search.searchWorkspace({
        mode: toValue(mode),
        query: toValue(query),
        page: toValue(page),
        perPage: toValue(perPage),
      })
    },
  })
}
