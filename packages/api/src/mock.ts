import type { GitHubClient, GitHubOrganization, GitHubRepository, GitHubWorkspaceItem } from './types'

const items: GitHubWorkspaceItem[] = [
  {
    id: 'notif-1',
    kind: 'notification',
    title: 'Review requested on electron shell navigation',
    repository: 'oh-my-github/client',
    number: 18,
    state: 'unread',
    author: { login: 'octo-lina' },
    updatedAt: '2026-06-27T08:42:00.000Z',
    labels: ['review', 'desktop'],
    summary: 'A reviewer asked for tighter keyboard behavior in the workspace sidebar.'
  },
  {
    id: 'pr-1',
    kind: 'pull_request',
    title: 'Add notification grouping model',
    repository: 'oh-my-github/api',
    number: 21,
    state: 'open',
    author: { login: 'maya' },
    updatedAt: '2026-06-27T07:10:00.000Z',
    labels: ['api', 'inbox'],
    summary: 'Introduces an inbox-oriented shape for notifications, issues, and pull requests.'
  },
  {
    id: 'issue-1',
    kind: 'issue',
    title: 'Design empty state for first-run workspace',
    repository: 'oh-my-github/ui',
    number: 7,
    state: 'open',
    author: { login: 'arden' },
    updatedAt: '2026-06-26T22:18:00.000Z',
    labels: ['design', 'good first issue'],
    summary: 'The first-run screen needs a concise state before GitHub OAuth is wired in.'
  },
  {
    id: 'action-1',
    kind: 'action',
    title: 'Renderer build failed on macOS',
    repository: 'oh-my-github/client',
    state: 'failed',
    author: { login: 'github-actions' },
    updatedAt: '2026-06-26T18:03:00.000Z',
    labels: ['ci', 'renderer'],
    summary: 'The app shell build failed during renderer type checking.'
  }
]

const organizations: GitHubOrganization[] = [
  {
    id: 1,
    login: 'oh-my-github',
    avatarUrl: 'https://avatars.githubusercontent.com/u/9919?s=80&v=4',
    description: 'Desktop GitHub workspace'
  },
  {
    id: 2,
    login: 'electron',
    avatarUrl: 'https://avatars.githubusercontent.com/u/13409222?s=80&v=4',
    description: 'Build cross-platform desktop apps'
  },
  {
    id: 3,
    login: 'vuejs',
    avatarUrl: 'https://avatars.githubusercontent.com/u/6128107?s=80&v=4',
    description: 'The progressive JavaScript framework'
  },
  {
    id: 4,
    login: 'github',
    avatarUrl: 'https://avatars.githubusercontent.com/u/9919?s=80&v=4',
    description: 'GitHub'
  },
  {
    id: 5,
    login: 'octokit',
    avatarUrl: 'https://avatars.githubusercontent.com/u/3430433?s=80&v=4',
    description: 'GitHub API clients'
  }
]

const repositoriesByOrganization: Record<string, GitHubRepository[]> = {
  'oh-my-github': createMockRepositories('oh-my-github', [
    'client',
    'api',
    'ui',
    'desktop-shell',
    'workspace',
    'notifications',
    'reviews',
    'actions',
    'settings',
    'design-system',
    'oauth',
    'release',
  ]),
  electron: createMockRepositories('electron', ['electron', 'forge', 'fiddle']),
  vuejs: createMockRepositories('vuejs', ['core', 'router', 'pinia', 'vitepress']),
  github: createMockRepositories('github', ['docs', 'hub', 'training-kit']),
  octokit: createMockRepositories('octokit', ['octokit.js', 'rest.js', 'graphql.js']),
}

export class MockGitHubClient implements GitHubClient {
  async listViewerOrganizations(): Promise<GitHubOrganization[]> {
    return organizations
  }

  async listOrganizationRepositories(owner: string): Promise<GitHubRepository[]> {
    return repositoriesByOrganization[owner] ?? []
  }

  async listNotifications(): Promise<GitHubWorkspaceItem[]> {
    return items
  }

  async listPullRequests(): Promise<GitHubWorkspaceItem[]> {
    return items.filter((item) => item.kind === 'pull_request')
  }

  async listIssues(): Promise<GitHubWorkspaceItem[]> {
    return items.filter((item) => item.kind === 'issue')
  }
}

function createMockRepositories(owner: string, names: string[]): GitHubRepository[] {
  return names.map((name, index) => ({
    id: Number(`${organizations.find((organization) => organization.login === owner)?.id ?? 9}${index + 1}`),
    name,
    nameWithOwner: `${owner}/${name}`,
    owner,
    description: `${name} workspace placeholder`,
    isPrivate: index % 5 === 0,
    updatedAt: new Date(Date.UTC(2026, 5, 27 - index)).toISOString(),
    url: `https://github.com/${owner}/${name}`,
  }))
}
