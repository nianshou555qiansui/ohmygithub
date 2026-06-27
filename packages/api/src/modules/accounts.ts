import type { GitHubOctokit } from '../transport'
import type { GitHubOrganization, GitHubRepository } from '../types'

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

  async listOrganizationRepositories(owner: string): Promise<GitHubRepository[]> {
    const repositories = await this.octokit.paginate(
      this.octokit.rest.repos.listForOrg,
      {
        org: owner,
        type: 'all',
        sort: 'updated',
        direction: 'desc',
        per_page: 100
      }
    )

    return repositories.map((repository) => {
      const repositoryOwner = repository.owner?.login ?? owner

      return {
        id: repository.id,
        name: repository.name,
        nameWithOwner: repository.full_name ?? `${repositoryOwner}/${repository.name}`,
        owner: repositoryOwner,
        description: repository.description ?? null,
        isPrivate: repository.private,
        updatedAt: repository.updated_at ?? '',
        url: repository.html_url ?? ''
      }
    })
  }
}
