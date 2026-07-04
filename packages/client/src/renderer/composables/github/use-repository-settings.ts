import type { MaybeRefOrGetter } from 'vue'
import { toValue } from 'vue'
import { useQuery, useQueryCache } from '@pinia/colada'
import { REPOSITORY_OVERVIEW_QUERY_VERSION } from './use-repositories'

export function useRepositoryGeneralSettingsQuery(
  owner: MaybeRefOrGetter<string>,
  repo: MaybeRefOrGetter<string>,
  enabled: MaybeRefOrGetter<boolean>,
) {
  return useQuery<GitHubRepositoryGeneralSettings>({
    key: () => ['github', 'repository', 'settings', 'general', toValue(owner), toValue(repo)],
    enabled: () => Boolean(toValue(owner)) && Boolean(toValue(repo)) && toValue(enabled),
    staleTime: 1000 * 30,
    gcTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    query: async () => requireBridge().getGeneral(toValue(owner), toValue(repo)),
  })
}

export function useRepositorySettingsInvalidation() {
  const queryCache = useQueryCache()

  return {
    invalidateGeneralSettings(owner: string, repo: string): void {
      void queryCache.invalidateQueries({
        key: ['github', 'repository', 'settings', 'general', owner, repo],
      })
    },
    invalidateRepositoryOverview(owner: string, repo: string): void {
      void queryCache.invalidateQueries({
        key: ['github', 'repository', 'overview', REPOSITORY_OVERVIEW_QUERY_VERSION, owner, repo],
      })
    },
  }
}

function requireBridge() {
  const bridge = window.ohMyGithub?.repositorySettings
  if (!bridge) throw new Error('GitHub repository settings bridge is unavailable')
  return bridge
}

export function updateGeneralSettings(
  owner: string,
  repo: string,
  input: UpdateRepositoryGeneralSettingsInput,
): Promise<void> {
  return requireBridge().updateGeneral(owner, repo, input)
}

export function replaceTopics(owner: string, repo: string, names: string[]): Promise<void> {
  return requireBridge().replaceTopics(owner, repo, names)
}

export function setDiscussionsEnabled(repositoryNodeId: string, enabled: boolean): Promise<void> {
  return requireBridge().setDiscussions(repositoryNodeId, enabled)
}

export function setSponsorshipsEnabled(repositoryNodeId: string, enabled: boolean): Promise<void> {
  return requireBridge().setSponsorships(repositoryNodeId, enabled)
}

export function setImmutableReleases(owner: string, repo: string, enabled: boolean): Promise<void> {
  return requireBridge().setImmutableReleases(owner, repo, enabled)
}

export function transferRepository(
  owner: string,
  repo: string,
  newOwner: string,
  newName?: string,
): Promise<void> {
  return requireBridge().transfer(owner, repo, newOwner, newName)
}

export function deleteRepository(owner: string, repo: string): Promise<void> {
  return requireBridge().deleteRepository(owner, repo)
}
