import { AccountsApi } from './modules/accounts'
import { AuthApi } from './modules/auth'
import { InboxApi } from './modules/inbox'
import { createOctokit, type GitHubOctokit } from './transport'
import type { GitHubApiOptions, GitHubClient, GitHubOrganization, GitHubRepository, GitHubWorkspaceItem } from './types'

export interface GitHubApi extends GitHubClient {
  readonly octokit: GitHubOctokit
  readonly accounts: AccountsApi
  readonly auth: AuthApi
  readonly inbox: InboxApi
}

export function createGitHubApi(options: GitHubApiOptions): GitHubApi {
  const octokit = createOctokit(options)
  const accounts = new AccountsApi(octokit)
  const auth = new AuthApi({ octokit, proxyUrl: options.proxyUrl })
  const inbox = new InboxApi(octokit)

  return {
    octokit,
    accounts,
    auth,
    inbox,
    listViewerOrganizations: () => accounts.listViewerOrganizations(),
    listOrganizationRepositories: (owner) => accounts.listOrganizationRepositories(owner),
    listNotifications: () => inbox.listNotifications(),
    listPullRequests: () => inbox.listPullRequests(),
    listIssues: () => inbox.listIssues()
  }
}

export type { GitHubOrganization, GitHubRepository, GitHubWorkspaceItem }
