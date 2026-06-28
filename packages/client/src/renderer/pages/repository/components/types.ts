import type { Component } from 'vue'
import type { RepositoryTabId } from '../../workspace/types'

export type RepositorySectionId = RepositoryTabId

export interface RepositorySection {
  id: RepositorySectionId
  icon: Component
}

export interface RepositoryOverviewInfoItem {
  id: string
  icon: Component
  label: string
  value: string
  href?: string
}
