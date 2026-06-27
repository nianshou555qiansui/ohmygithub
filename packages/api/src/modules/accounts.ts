import type { GitHubOctokit } from '../transport'
import type { GitHubOrganization } from '../types'

export class AccountsApi {
  constructor(private readonly octokit: GitHubOctokit) {}

  async listViewerOrganizations(): Promise<GitHubOrganization[]> {
    const organizations = await this.octokit.paginate(
      this.octokit.rest.orgs.listForAuthenticatedUser,
      {
        per_page: 100
      }
    )

    return organizations.map((organization) => ({
      id: organization.id,
      login: organization.login,
      avatarUrl: organization.avatar_url ?? '',
      description: organization.description ?? null
    }))
  }
}
