import { describe, expect, it, vi } from 'vitest'
import type { GitHubOctokit } from '../transport'
import { RepositorySettingsSecurityApi } from './repository-settings.security'

vi.mock('./seal-secret', () => ({
  sealSecret: vi.fn(async (value: string) => `sealed:${value}`),
}))

describe('RepositorySettingsSecurityApi', () => {
  it('collects the security overview from analysis fields and status probes', async () => {
    const { api } = createApi()

    const overview = await api.getSecurityOverview({ owner: 'o', repo: 'r' })

    expect(overview).toMatchObject({
      advancedSecurity: 'enabled',
      secretScanning: 'enabled',
      secretScanningPushProtection: 'disabled',
      vulnerabilityAlerts: true,
      automatedSecurityFixes: false,
      privateVulnerabilityReporting: true,
    })
  })

  it('updates security and analysis toggles through PATCH /repos', async () => {
    const { api, request } = createApi()

    await api.updateSecurityAndAnalysis({
      owner: 'o',
      repo: 'r',
      input: { secretScanning: 'enabled', secretScanningPushProtection: 'disabled' },
    })

    expect(request).toHaveBeenCalledWith('PATCH /repos/{owner}/{repo}', {
      owner: 'o',
      repo: 'r',
      security_and_analysis: {
        secret_scanning: { status: 'enabled' },
        secret_scanning_push_protection: { status: 'disabled' },
      },
    })
  })

  it('toggles vulnerability alerts, security fixes, and private reporting', async () => {
    const { api, request } = createApi()

    await api.setVulnerabilityAlerts({ owner: 'o', repo: 'r', enabled: true })
    expect(request).toHaveBeenCalledWith('PUT /repos/{owner}/{repo}/vulnerability-alerts', {
      owner: 'o',
      repo: 'r',
    })

    await api.setAutomatedSecurityFixes({ owner: 'o', repo: 'r', enabled: false })
    expect(request).toHaveBeenCalledWith('DELETE /repos/{owner}/{repo}/automated-security-fixes', {
      owner: 'o',
      repo: 'r',
    })

    await api.setPrivateVulnerabilityReporting({ owner: 'o', repo: 'r', enabled: true })
    expect(request).toHaveBeenCalledWith('PUT /repos/{owner}/{repo}/private-vulnerability-reporting', {
      owner: 'o',
      repo: 'r',
    })
  })

  it('manages deploy keys', async () => {
    const { api, request } = createApi()

    const keys = await api.listDeployKeys({ owner: 'o', repo: 'r' })
    expect(keys).toEqual([
      { id: 1, title: 'deploy', key: 'ssh-ed25519 AAA', readOnly: true, createdAt: '2026-07-01T00:00:00Z' },
    ])

    await api.addDeployKey({ owner: 'o', repo: 'r', title: 't', key: 'ssh-rsa BBB', readOnly: false })
    expect(request).toHaveBeenCalledWith('POST /repos/{owner}/{repo}/keys', {
      owner: 'o',
      repo: 'r',
      title: 't',
      key: 'ssh-rsa BBB',
      read_only: false,
    })

    await api.deleteDeployKey({ owner: 'o', repo: 'r', keyId: 1 })
    expect(request).toHaveBeenCalledWith('DELETE /repos/{owner}/{repo}/keys/{key_id}', {
      owner: 'o',
      repo: 'r',
      key_id: 1,
    })
  })

  it('seals secrets against the scope public key before upserting', async () => {
    const { api, request } = createApi()

    await api.upsertSecret({ owner: 'o', repo: 'r', scope: 'actions', name: 'TOKEN', value: 'hunter2' })

    expect(request).toHaveBeenCalledWith('PUT /repos/{owner}/{repo}/actions/secrets/{secret_name}', {
      owner: 'o',
      repo: 'r',
      secret_name: 'TOKEN',
      encrypted_value: 'sealed:hunter2',
      key_id: 'key-1',
    })

    await api.upsertSecret({ owner: 'o', repo: 'r', scope: 'dependabot', name: 'NPM', value: 'x' })
    expect(request).toHaveBeenCalledWith('PUT /repos/{owner}/{repo}/dependabot/secrets/{secret_name}', {
      owner: 'o',
      repo: 'r',
      secret_name: 'NPM',
      encrypted_value: 'sealed:x',
      key_id: 'key-1',
    })
  })

  it('lists secrets and manages actions variables', async () => {
    const { api, request } = createApi()

    const secrets = await api.listSecrets({ owner: 'o', repo: 'r', scope: 'actions' })
    expect(secrets).toEqual([{ name: 'TOKEN', updatedAt: '2026-07-02T00:00:00Z' }])

    const variables = await api.listVariables({ owner: 'o', repo: 'r' })
    expect(variables).toEqual([{ name: 'ENV', value: 'prod' }])

    await api.createVariable({ owner: 'o', repo: 'r', name: 'NEW', value: 'v' })
    expect(request).toHaveBeenCalledWith('POST /repos/{owner}/{repo}/actions/variables', {
      owner: 'o',
      repo: 'r',
      name: 'NEW',
      value: 'v',
    })

    await api.updateVariable({ owner: 'o', repo: 'r', name: 'ENV', value: 'staging' })
    expect(request).toHaveBeenCalledWith('PATCH /repos/{owner}/{repo}/actions/variables/{name}', {
      owner: 'o',
      repo: 'r',
      name: 'ENV',
      value: 'staging',
    })

    await api.deleteVariable({ owner: 'o', repo: 'r', name: 'ENV' })
    await api.deleteSecret({ owner: 'o', repo: 'r', scope: 'codespaces', name: 'TOKEN' })
    expect(request).toHaveBeenCalledWith('DELETE /repos/{owner}/{repo}/codespaces/secrets/{secret_name}', {
      owner: 'o',
      repo: 'r',
      secret_name: 'TOKEN',
    })
  })
})

function createApi() {
  const request = vi.fn(async (route: string) => {
    if (route === 'GET /repos/{owner}/{repo}') {
      return {
        data: {
          security_and_analysis: {
            advanced_security: { status: 'enabled' },
            secret_scanning: { status: 'enabled' },
            secret_scanning_push_protection: { status: 'disabled' },
          },
        },
      }
    }
    if (route === 'GET /repos/{owner}/{repo}/vulnerability-alerts') {
      return { status: 204 }
    }
    if (route === 'GET /repos/{owner}/{repo}/automated-security-fixes') {
      return { data: { enabled: false, paused: false } }
    }
    if (route === 'GET /repos/{owner}/{repo}/private-vulnerability-reporting') {
      return { data: { enabled: true } }
    }
    if (route === 'GET /repos/{owner}/{repo}/keys') {
      return {
        data: [
          { id: 1, title: 'deploy', key: 'ssh-ed25519 AAA', read_only: true, created_at: '2026-07-01T00:00:00Z' },
        ],
      }
    }
    if (route.endsWith('/secrets/public-key')) {
      return { data: { key: 'pub', key_id: 'key-1' } }
    }
    if (route === 'GET /repos/{owner}/{repo}/actions/secrets') {
      return { data: { secrets: [{ name: 'TOKEN', updated_at: '2026-07-02T00:00:00Z' }] } }
    }
    if (route === 'GET /repos/{owner}/{repo}/actions/variables') {
      return { data: { variables: [{ name: 'ENV', value: 'prod' }] } }
    }
    return { data: {}, status: 204 }
  })
  const octokit = { request } as unknown as GitHubOctokit

  return { api: new RepositorySettingsSecurityApi(octokit), request }
}
