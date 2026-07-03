import { describe, expect, it, vi } from 'vitest'
import type { GitHubOctokit } from '../transport'
import { CONTRIBUTOR_STATS_PENDING } from '../types'
import { RepositoriesApi } from './repositories'

const WEEK_SECONDS = 7 * 24 * 60 * 60
const BASE_WEEK = 1_735_430_400 // Sunday, 2024-12-29 00:00:00 UTC

function createApi() {
  const request = vi.fn()
  const api = new RepositoriesApi({ request } as unknown as GitHubOctokit)

  return { api, request }
}

function statsEntry(login: string, weeks: Array<[number, number, number, number]>, total?: number) {
  return {
    author: { id: 1, login, avatar_url: `https://avatars.example/${login}`, type: 'User' },
    total: total ?? weeks.reduce((sum, [, , , c]) => sum + c, 0),
    weeks: weeks.map(([w, a, d, c]) => ({ w, a, d, c })),
  }
}

describe('RepositoriesApi contributor stats', () => {
  it('polls through 202 responses until data is ready', async () => {
    const { api, request } = createApi()
    request
      .mockResolvedValueOnce({ status: 202, data: {} })
      .mockResolvedValueOnce({
        status: 200,
        data: [statsEntry('octocat', [[BASE_WEEK, 10, 2, 3]])],
      })

    const result = await api.getContributorStats({ owner: 'octo-org', repo: 'hello-world', retryDelayMs: 0 })

    expect(request).toHaveBeenCalledTimes(2)
    expect(request).toHaveBeenCalledWith('GET /repos/{owner}/{repo}/stats/contributors', {
      owner: 'octo-org',
      repo: 'hello-world',
    })
    expect(result.contributors).toHaveLength(1)
    expect(result.contributors[0]?.author.login).toBe('octocat')
  })

  it('throws the pending sentinel when 202 persists across all attempts', async () => {
    const { api, request } = createApi()
    request.mockResolvedValue({ status: 202, data: {} })

    await expect(
      api.getContributorStats({ owner: 'octo-org', repo: 'hello-world', maxAttempts: 3, retryDelayMs: 0 })
    ).rejects.toThrow(CONTRIBUTOR_STATS_PENDING)
    expect(request).toHaveBeenCalledTimes(3)
  })

  it('returns an empty result for 204 and empty payloads', async () => {
    const { api, request } = createApi()
    request
      .mockResolvedValueOnce({ status: 204, data: undefined })
      .mockResolvedValueOnce({ status: 200, data: [] })

    const empty = { contributors: [], firstWeek: null, lastWeek: null, hasLineStats: false }
    await expect(api.getContributorStats({ owner: 'a', repo: 'b', retryDelayMs: 0 })).resolves.toEqual(empty)
    await expect(api.getContributorStats({ owner: 'a', repo: 'b', retryDelayMs: 0 })).resolves.toEqual(empty)
  })

  it('drops anonymous authors and sorts contributors by total descending', async () => {
    const { api, request } = createApi()
    request.mockResolvedValueOnce({
      status: 200,
      data: [
        statsEntry('small', [[BASE_WEEK, 1, 1, 1]]),
        { author: null, total: 99, weeks: [{ w: BASE_WEEK, a: 5, d: 5, c: 9 }] },
        statsEntry('big', [[BASE_WEEK, 100, 50, 50]]),
      ],
    })

    const result = await api.getContributorStats({ owner: 'a', repo: 'b', retryDelayMs: 0 })

    expect(result.contributors.map((contributor) => contributor.author.login)).toEqual(['big', 'small'])
  })

  it('sparsifies weeks while keeping the full raw week range', async () => {
    const { api, request } = createApi()
    const weeks: Array<[number, number, number, number]> = [
      [BASE_WEEK, 0, 0, 0],
      [BASE_WEEK + WEEK_SECONDS, 4, 2, 1],
      [BASE_WEEK + 2 * WEEK_SECONDS, 0, 0, 0],
    ]
    request.mockResolvedValueOnce({ status: 200, data: [statsEntry('octocat', weeks)] })

    const result = await api.getContributorStats({ owner: 'a', repo: 'b', retryDelayMs: 0 })

    expect(result.firstWeek).toBe(BASE_WEEK)
    expect(result.lastWeek).toBe(BASE_WEEK + 2 * WEEK_SECONDS)
    expect(result.contributors[0]?.weeks).toEqual([{ w: BASE_WEEK + WEEK_SECONDS, a: 4, d: 2, c: 1 }])
    expect(result.hasLineStats).toBe(true)
  })

  it('reports hasLineStats false when GitHub omits additions and deletions', async () => {
    const { api, request } = createApi()
    request.mockResolvedValueOnce({
      status: 200,
      data: [statsEntry('octocat', [[BASE_WEEK, 0, 0, 7]])],
    })

    const result = await api.getContributorStats({ owner: 'a', repo: 'b', retryDelayMs: 0 })

    expect(result.hasLineStats).toBe(false)
    expect(result.contributors[0]?.weeks).toEqual([{ w: BASE_WEEK, a: 0, d: 0, c: 7 }])
  })
})
