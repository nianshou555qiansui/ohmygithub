import type { MaybeRefOrGetter } from 'vue'
import { toValue } from 'vue'
import { useQuery } from '@pinia/colada'

export function useAccountProfileQuery(
  login: MaybeRefOrGetter<string>,
  enabled: MaybeRefOrGetter<boolean>,
) {
  return useQuery<GitHubAccountProfile>({
    key: () => ['github', 'account-profile', toValue(login)],
    enabled: () => Boolean(toValue(login)) && toValue(enabled),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    query: async () => {
      if (!window.ohMyGithub?.accounts) {
        throw new Error('GitHub accounts bridge is unavailable')
      }

      return window.ohMyGithub.accounts.getProfile(toValue(login))
    },
  })
}

export function useAccountOverviewQuery(
  login: MaybeRefOrGetter<string>,
  enabled: MaybeRefOrGetter<boolean>,
) {
  return useQuery<GitHubAccountOverview>({
    key: () => ['github', 'account-overview', toValue(login)],
    enabled: () => Boolean(toValue(login)) && toValue(enabled),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    query: async () => {
      if (!window.ohMyGithub?.accounts) {
        throw new Error('GitHub accounts bridge is unavailable')
      }

      return window.ohMyGithub.accounts.getOverview(toValue(login))
    },
  })
}

export function useAccountContributionsQuery(
  login: MaybeRefOrGetter<string>,
  year: MaybeRefOrGetter<number | null>,
  enabled: MaybeRefOrGetter<boolean>,
) {
  return useQuery<GitHubAccountContributionYear>({
    key: () => ['github', 'account-contributions', toValue(login), toValue(year) ?? 'current'],
    enabled: () => Boolean(toValue(login)) && Boolean(toValue(year)) && toValue(enabled),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    query: async () => {
      if (!window.ohMyGithub?.accounts) {
        throw new Error('GitHub accounts bridge is unavailable')
      }

      return window.ohMyGithub.accounts.getContributions({
        login: toValue(login),
        year: toValue(year) ?? undefined,
      })
    },
  })
}

export function useAccountRepositoriesQuery(
  login: MaybeRefOrGetter<string>,
  page: MaybeRefOrGetter<number>,
  perPage: MaybeRefOrGetter<number>,
  search: MaybeRefOrGetter<string>,
  enabled: MaybeRefOrGetter<boolean>,
) {
  return useQuery<GitHubAccountRepositoryPage>({
    key: () => [
      'github',
      'account-repositories',
      toValue(login),
      toValue(page),
      toValue(perPage),
      toValue(search).trim(),
    ],
    enabled: () => Boolean(toValue(login)) && toValue(enabled),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    query: async () => {
      if (!window.ohMyGithub?.accounts) {
        throw new Error('GitHub accounts bridge is unavailable')
      }

      return window.ohMyGithub.accounts.listRepositories({
        login: toValue(login),
        page: toValue(page),
        perPage: toValue(perPage),
        search: toValue(search).trim(),
      })
    },
  })
}

export function useAccountStarredRepositoriesQuery(
  login: MaybeRefOrGetter<string>,
  page: MaybeRefOrGetter<number>,
  perPage: MaybeRefOrGetter<number>,
  search: MaybeRefOrGetter<string>,
  enabled: MaybeRefOrGetter<boolean>,
) {
  return useQuery<GitHubAccountRepositoryPage>({
    key: () => [
      'github',
      'account-starred-repositories',
      toValue(login),
      toValue(page),
      toValue(perPage),
      toValue(search).trim(),
    ],
    enabled: () => Boolean(toValue(login)) && toValue(enabled),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    query: async () => {
      if (!window.ohMyGithub?.accounts) {
        throw new Error('GitHub accounts bridge is unavailable')
      }

      return window.ohMyGithub.accounts.listStarredRepositories({
        login: toValue(login),
        page: toValue(page),
        perPage: toValue(perPage),
        search: toValue(search).trim(),
      })
    },
  })
}

export function useAccountViewerStateQuery(
  login: MaybeRefOrGetter<string>,
  enabled: MaybeRefOrGetter<boolean>,
) {
  return useQuery<GitHubAccountViewerState>({
    key: () => ['github', 'account-viewer-state', toValue(login)],
    enabled: () => Boolean(toValue(login)) && toValue(enabled),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    query: async () => {
      if (!window.ohMyGithub?.accounts) {
        throw new Error('GitHub accounts bridge is unavailable')
      }

      return window.ohMyGithub.accounts.getViewerState(toValue(login))
    },
  })
}

export async function setAccountFollowed(login: string, followed: boolean): Promise<void> {
  if (!window.ohMyGithub?.accounts) {
    throw new Error('GitHub accounts bridge is unavailable')
  }

  await window.ohMyGithub.accounts.setFollowed({ login, followed })
}
