import type { GitHubOctokit } from '../transport'
import type {
  GitHubDeployKey,
  GitHubRepositorySecret,
  GitHubRepositorySecretScope,
  GitHubRepositorySecurityOverview,
  GitHubRepositoryVariable,
  GitHubSecurityFeatureStatus,
  RepositoryOptions,
  UpdateSecurityAndAnalysisInput,
} from '../types'
import { sealSecret } from './seal-secret'

interface SecurityAnalysisResponse {
  security_and_analysis?: {
    advanced_security?: { status?: string | null } | null
    secret_scanning?: { status?: string | null } | null
    secret_scanning_push_protection?: { status?: string | null } | null
  } | null
}

const SECRET_SCOPE_PREFIX: Record<GitHubRepositorySecretScope, string> = {
  actions: 'actions',
  codespaces: 'codespaces',
  dependabot: 'dependabot',
}

export class RepositorySettingsSecurityApi {
  constructor(private readonly octokit: GitHubOctokit) {}

  async getSecurityOverview(options: RepositoryOptions): Promise<GitHubRepositorySecurityOverview> {
    const repository = { owner: options.owner, repo: options.repo }
    const [analysis, vulnerabilityAlerts, automatedSecurityFixes, privateVulnerabilityReporting] = await Promise.all([
      this.octokit.request('GET /repos/{owner}/{repo}', repository)
        .then((response) => (response.data as SecurityAnalysisResponse).security_and_analysis ?? null)
        .catch(() => null),
      this.octokit.request('GET /repos/{owner}/{repo}/vulnerability-alerts', repository)
        .then(() => true)
        .catch((error) => ((error as { status?: number }).status === 404 ? false : null)),
      this.octokit.request('GET /repos/{owner}/{repo}/automated-security-fixes', repository)
        .then((response) => Boolean((response.data as { enabled?: boolean }).enabled))
        .catch(() => null),
      this.octokit.request('GET /repos/{owner}/{repo}/private-vulnerability-reporting', repository)
        .then((response) => Boolean((response.data as { enabled?: boolean }).enabled))
        .catch(() => null),
    ])

    return {
      advancedSecurity: normalizeStatus(analysis?.advanced_security?.status),
      secretScanning: normalizeStatus(analysis?.secret_scanning?.status),
      secretScanningPushProtection: normalizeStatus(analysis?.secret_scanning_push_protection?.status),
      vulnerabilityAlerts,
      automatedSecurityFixes,
      privateVulnerabilityReporting,
    }
  }

  async updateSecurityAndAnalysis(
    options: RepositoryOptions & { input: UpdateSecurityAndAnalysisInput },
  ): Promise<void> {
    const analysis: Record<string, { status: string }> = {}
    if (options.input.advancedSecurity) analysis.advanced_security = { status: options.input.advancedSecurity }
    if (options.input.secretScanning) analysis.secret_scanning = { status: options.input.secretScanning }
    if (options.input.secretScanningPushProtection) {
      analysis.secret_scanning_push_protection = { status: options.input.secretScanningPushProtection }
    }

    await this.octokit.request('PATCH /repos/{owner}/{repo}', {
      owner: options.owner,
      repo: options.repo,
      security_and_analysis: analysis as never,
    })
  }

  async setVulnerabilityAlerts(options: RepositoryOptions & { enabled: boolean }): Promise<void> {
    const route = options.enabled
      ? 'PUT /repos/{owner}/{repo}/vulnerability-alerts'
      : 'DELETE /repos/{owner}/{repo}/vulnerability-alerts'

    await this.octokit.request(route, { owner: options.owner, repo: options.repo })
  }

  async setAutomatedSecurityFixes(options: RepositoryOptions & { enabled: boolean }): Promise<void> {
    const route = options.enabled
      ? 'PUT /repos/{owner}/{repo}/automated-security-fixes'
      : 'DELETE /repos/{owner}/{repo}/automated-security-fixes'

    await this.octokit.request(route, { owner: options.owner, repo: options.repo })
  }

  async setPrivateVulnerabilityReporting(options: RepositoryOptions & { enabled: boolean }): Promise<void> {
    const route = options.enabled
      ? 'PUT /repos/{owner}/{repo}/private-vulnerability-reporting'
      : 'DELETE /repos/{owner}/{repo}/private-vulnerability-reporting'

    await this.octokit.request(route, { owner: options.owner, repo: options.repo })
  }

  async listDeployKeys(options: RepositoryOptions): Promise<GitHubDeployKey[]> {
    const response = await this.octokit.request('GET /repos/{owner}/{repo}/keys', {
      owner: options.owner,
      repo: options.repo,
      per_page: 100,
    })

    return ((response.data ?? []) as Array<{
      id?: number
      title?: string | null
      key?: string | null
      read_only?: boolean | null
      created_at?: string | null
    }>).map((key) => ({
      id: key.id ?? 0,
      title: key.title ?? '',
      key: key.key ?? '',
      readOnly: Boolean(key.read_only),
      createdAt: key.created_at ?? null,
    }))
  }

  async addDeployKey(
    options: RepositoryOptions & { title: string; key: string; readOnly: boolean },
  ): Promise<void> {
    await this.octokit.request('POST /repos/{owner}/{repo}/keys', {
      owner: options.owner,
      repo: options.repo,
      title: options.title,
      key: options.key,
      read_only: options.readOnly,
    })
  }

  async deleteDeployKey(options: RepositoryOptions & { keyId: number }): Promise<void> {
    await this.octokit.request('DELETE /repos/{owner}/{repo}/keys/{key_id}', {
      owner: options.owner,
      repo: options.repo,
      key_id: options.keyId,
    })
  }

  async listSecrets(
    options: RepositoryOptions & { scope: GitHubRepositorySecretScope },
  ): Promise<GitHubRepositorySecret[]> {
    const response = await this.requestScoped('GET', options.scope, '/secrets', options, { per_page: 100 })
    const data = response.data as {
      secrets?: Array<{ name?: string | null; updated_at?: string | null } | null> | null
    }

    return (data.secrets ?? [])
      .filter((secret): secret is NonNullable<typeof secret> => secret !== null)
      .map((secret) => ({
        name: secret.name ?? '',
        updatedAt: secret.updated_at ?? null,
      }))
  }

  async upsertSecret(
    options: RepositoryOptions & { scope: GitHubRepositorySecretScope; name: string; value: string },
  ): Promise<void> {
    const publicKeyResponse = await this.requestScoped('GET', options.scope, '/secrets/public-key', options)
    const publicKey = publicKeyResponse.data as { key?: string; key_id?: string }
    if (!publicKey.key || !publicKey.key_id) {
      throw new Error('GitHub repository public key is unavailable')
    }

    await this.requestScoped('PUT', options.scope, '/secrets/{secret_name}', options, {
      secret_name: options.name,
      encrypted_value: await sealSecret(options.value, publicKey.key),
      key_id: publicKey.key_id,
    })
  }

  async deleteSecret(
    options: RepositoryOptions & { scope: GitHubRepositorySecretScope; name: string },
  ): Promise<void> {
    await this.requestScoped('DELETE', options.scope, '/secrets/{secret_name}', options, {
      secret_name: options.name,
    })
  }

  async listVariables(options: RepositoryOptions): Promise<GitHubRepositoryVariable[]> {
    const response = await this.octokit.request('GET /repos/{owner}/{repo}/actions/variables', {
      owner: options.owner,
      repo: options.repo,
      per_page: 100,
    })
    const data = response.data as {
      variables?: Array<{ name?: string | null; value?: string | null } | null> | null
    }

    return (data.variables ?? [])
      .filter((variable): variable is NonNullable<typeof variable> => variable !== null)
      .map((variable) => ({
        name: variable.name ?? '',
        value: variable.value ?? '',
      }))
  }

  async createVariable(options: RepositoryOptions & { name: string; value: string }): Promise<void> {
    await this.octokit.request('POST /repos/{owner}/{repo}/actions/variables', {
      owner: options.owner,
      repo: options.repo,
      name: options.name,
      value: options.value,
    })
  }

  async updateVariable(options: RepositoryOptions & { name: string; value: string }): Promise<void> {
    await this.octokit.request('PATCH /repos/{owner}/{repo}/actions/variables/{name}', {
      owner: options.owner,
      repo: options.repo,
      name: options.name,
      value: options.value,
    })
  }

  async deleteVariable(options: RepositoryOptions & { name: string }): Promise<void> {
    await this.octokit.request('DELETE /repos/{owner}/{repo}/actions/variables/{name}', {
      owner: options.owner,
      repo: options.repo,
      name: options.name,
    })
  }

  private requestScoped(
    method: 'GET' | 'PUT' | 'DELETE',
    scope: GitHubRepositorySecretScope,
    path: string,
    options: RepositoryOptions,
    params: Record<string, unknown> = {},
  ) {
    const route = `${method} /repos/{owner}/{repo}/${SECRET_SCOPE_PREFIX[scope]}${path}`

    return (this.octokit.request as (route: string, params: Record<string, unknown>) => Promise<{ data: unknown }>)(
      route,
      {
        owner: options.owner,
        repo: options.repo,
        ...params,
      },
    )
  }
}

function normalizeStatus(value: string | null | undefined): GitHubSecurityFeatureStatus {
  if (value === 'enabled') return 'enabled'
  if (value === 'disabled') return 'disabled'
  return 'unavailable'
}
