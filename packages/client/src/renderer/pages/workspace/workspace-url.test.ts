import { describe, expect, it } from 'vitest'
import {
  createActionRunWorkspaceUrl,
  createWorkspaceTabFromUrl,
  normalizeWorkspaceUrl,
} from './workspace-url'

describe('action run workspace URLs', () => {
  it('preserves the selected workflow job in the query string', () => {
    expect(createActionRunWorkspaceUrl('octo-org', 'hello-world', 123, 456))
      .toBe('/octo-org/hello-world/actions/runs/123?job=456')
    expect(normalizeWorkspaceUrl('/octo-org/hello-world/actions/runs/123?job=456'))
      .toBe('/octo-org/hello-world/actions/runs/123?job=456')
    expect(createWorkspaceTabFromUrl('/octo-org/hello-world/actions/runs/123?job=456'))
      .toMatchObject({
        type: 'action-run',
        owner: 'octo-org',
        repo: 'hello-world',
        runId: 123,
        jobId: 456,
        url: '/octo-org/hello-world/actions/runs/123?job=456',
      })
  })
})

describe('new repository workspace URLs', () => {
  it('parses /new-repository as an internal tab', () => {
    expect(normalizeWorkspaceUrl('/new-repository')).toBe('/new-repository')
    expect(createWorkspaceTabFromUrl('/new-repository')).toMatchObject({
      type: 'new-repository',
      url: '/new-repository',
      title: 'New Repository',
    })
  })

  it('does not treat new-repository as an account path', () => {
    expect(createWorkspaceTabFromUrl('/new-repository').type).not.toBe('account')
  })
})
