<script setup lang="ts">
import type { Component } from 'vue'
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { GitCommitHorizontal, Minus, Plus } from 'lucide-vue-next'
import { Button, Empty, EmptyDescription, EmptyHeader, EmptyTitle, Skeleton } from '@oh-my-github/ui'
import {
  isContributorStatsPendingError,
  useRepositoryContributorStatsQuery,
} from '@/composables/github/use-repositories'
import ContributionsChart from './contributions-chart.vue'
import ContributorCard from './contributor-card.vue'

type ContributorMetric = 'commits' | 'additions' | 'deletions'

interface RankedContributor {
  rank: number
  author: GitHubContributorStatsAuthor
  commits: number
  additions: number
  deletions: number
  sparkline: number[]
}

const WEEK_SECONDS = 7 * 24 * 60 * 60
const PENDING_RETRY_DELAY_MS = 8000
const MAX_PENDING_RETRIES = 5
const RANGE_DEBOUNCE_MS = 200

const props = defineProps<{
  owner: string
  repo: string
  defaultBranch: string | null
}>()

const { t } = useI18n()
const hasRepositoryIdentity = computed(() => Boolean(props.owner && props.repo))
const statsQuery = useRepositoryContributorStatsQuery(
  () => props.owner,
  () => props.repo,
  hasRepositoryIdentity,
)

const selectedMetric = ref<ContributorMetric>('commits')
const selectedRange = ref<{ start: number; end: number } | null>(null)

const result = computed(() => statsQuery.data.value ?? null)
const isLoading = computed(() => statsQuery.isLoading.value)
const isPending = computed(() => isContributorStatsPendingError(statsQuery.error.value))
const hasError = computed(() => Boolean(statsQuery.error.value) && !isPending.value)
const hasLineStats = computed(() => result.value?.hasLineStats ?? false)
const effectiveMetric = computed<ContributorMetric>(() =>
  hasLineStats.value ? selectedMetric.value : 'commits'
)
interface ContributorMetricTab {
  id: ContributorMetric
  icon: Component
  label: string
}

const metricTabs = computed<ContributorMetricTab[]>(() => {
  const metrics: ContributorMetric[] = hasLineStats.value
    ? ['commits', 'additions', 'deletions']
    : ['commits']
  const icons: Record<ContributorMetric, Component> = {
    commits: GitCommitHorizontal,
    additions: Plus,
    deletions: Minus,
  }

  return metrics.map((id) => ({
    id,
    icon: icons[id],
    label: t(`repository.contributors.metric.${id}`),
  }))
})

const chartTitle = computed(() =>
  props.defaultBranch
    ? t('repository.contributors.chartTitle', { branch: props.defaultBranch })
    : t('repository.contributors.chartTitleNoBranch')
)

const weekAxis = computed<number[]>(() => {
  const stats = result.value
  if (!stats || stats.firstWeek === null || stats.lastWeek === null) return []

  const weeks: number[] = []
  for (let week = stats.firstWeek; week <= stats.lastWeek; week += WEEK_SECONDS) {
    weeks.push(week)
  }

  return weeks
})

const weeklyTotals = computed<number[]>(() => {
  const stats = result.value
  const totals = new Array<number>(weekAxis.value.length).fill(0)
  if (!stats || stats.firstWeek === null) return totals

  const metric = effectiveMetric.value
  for (const contributor of stats.contributors) {
    for (const week of contributor.weeks) {
      const index = Math.round((week.w - stats.firstWeek) / WEEK_SECONDS)
      if (index < 0 || index >= totals.length) continue
      totals[index] += metricValue(week, metric)
    }
  }

  return totals
})

const rankedContributors = computed<RankedContributor[]>(() => {
  const stats = result.value
  if (!stats || stats.firstWeek === null || stats.lastWeek === null) return []

  const start = selectedRange.value?.start ?? stats.firstWeek
  const end = selectedRange.value?.end ?? stats.lastWeek
  const metric = effectiveMetric.value
  const bucketCount = Math.max(1, Math.round((end - start) / WEEK_SECONDS) + 1)

  const entries: Array<RankedContributor & { primary: number; total: number }> = []
  for (const contributor of stats.contributors) {
    let commits = 0
    let additions = 0
    let deletions = 0
    const sparkline = new Array<number>(bucketCount).fill(0)

    for (const week of contributor.weeks) {
      if (week.w < start || week.w > end) continue
      commits += week.c
      additions += week.a
      deletions += week.d
      const index = Math.round((week.w - start) / WEEK_SECONDS)
      if (index >= 0 && index < bucketCount) {
        sparkline[index] += metricValue(week, metric)
      }
    }

    const primary = metric === 'commits' ? commits : metric === 'additions' ? additions : deletions
    if (primary <= 0) continue

    entries.push({
      rank: 0,
      author: contributor.author,
      commits,
      additions,
      deletions,
      sparkline,
      primary,
      total: contributor.total,
    })
  }

  entries.sort((left, right) => right.primary - left.primary || right.total - left.total)

  return entries.map(({ primary: _primary, total: _total, ...entry }, index) => ({
    ...entry,
    rank: index + 1,
  }))
})

const showLoading = computed(() => isLoading.value && !result.value)
const showEmpty = computed(
  () => Boolean(result.value) && rankedContributors.value.length === 0 && !selectedRange.value
)

function metricValue(week: GitHubContributorStatsWeek, metric: ContributorMetric): number {
  return metric === 'commits' ? week.c : metric === 'additions' ? week.a : week.d
}

let rangeDebounceTimer: ReturnType<typeof setTimeout> | null = null

function handleRangeUpdate(range: { start: number; end: number } | null): void {
  if (rangeDebounceTimer) clearTimeout(rangeDebounceTimer)
  rangeDebounceTimer = setTimeout(() => {
    rangeDebounceTimer = null
    selectedRange.value = range
  }, RANGE_DEBOUNCE_MS)
}

let pendingRetryTimer: ReturnType<typeof setTimeout> | null = null
let pendingRetryCount = 0

watch(
  () => statsQuery.error.value,
  (error) => {
    if (!isContributorStatsPendingError(error)) {
      pendingRetryCount = 0
      clearPendingRetry()
      return
    }
    if (pendingRetryCount >= MAX_PENDING_RETRIES || pendingRetryTimer) return

    pendingRetryTimer = setTimeout(() => {
      pendingRetryTimer = null
      pendingRetryCount += 1
      void statsQuery.refetch()
    }, PENDING_RETRY_DELAY_MS)
  },
  { immediate: true },
)

watch(
  () => [props.owner, props.repo] as const,
  () => {
    selectedMetric.value = 'commits'
    selectedRange.value = null
    pendingRetryCount = 0
  },
)

function clearPendingRetry(): void {
  if (!pendingRetryTimer) return
  clearTimeout(pendingRetryTimer)
  pendingRetryTimer = null
}

onBeforeUnmount(() => {
  clearPendingRetry()
  if (rangeDebounceTimer) clearTimeout(rangeDebounceTimer)
})

function retry(): void {
  pendingRetryCount = 0
  void statsQuery.refetch()
}
</script>

<template>
  <section class="grid gap-3">
    <div
      v-if="showLoading"
      class="grid gap-3"
    >
      <Skeleton class="h-64 rounded-lg" />
      <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <Skeleton
          v-for="index in 6"
          :key="index"
          class="h-24 rounded-lg"
        />
      </div>
    </div>

    <Empty
      v-else-if="!hasRepositoryIdentity"
      class="min-h-[24rem] border border-border bg-card"
    >
      <EmptyHeader>
        <EmptyTitle>{{ t('repository.contributors.empty.missingRepositoryTitle') }}</EmptyTitle>
        <EmptyDescription>
          {{ t('repository.contributors.empty.missingRepositoryDescription') }}
        </EmptyDescription>
      </EmptyHeader>
    </Empty>

    <Empty
      v-else-if="isPending"
      class="min-h-[24rem] border border-border bg-card"
    >
      <EmptyHeader>
        <EmptyTitle>{{ t('repository.contributors.pending.title') }}</EmptyTitle>
        <EmptyDescription>{{ t('repository.contributors.pending.description') }}</EmptyDescription>
      </EmptyHeader>
      <Button
        size="sm"
        variant="outline"
        @click="retry"
      >
        {{ t('repository.contributors.pending.retry') }}
      </Button>
    </Empty>

    <Empty
      v-else-if="hasError"
      class="min-h-[24rem] border border-border bg-card"
    >
      <EmptyHeader>
        <EmptyTitle>{{ t('repository.contributors.error.title') }}</EmptyTitle>
        <EmptyDescription>{{ t('repository.contributors.error.description') }}</EmptyDescription>
      </EmptyHeader>
      <Button
        size="sm"
        variant="outline"
        @click="retry"
      >
        {{ t('repository.contributors.error.retry') }}
      </Button>
    </Empty>

    <Empty
      v-else-if="showEmpty"
      class="min-h-[24rem] border border-border bg-card"
    >
      <EmptyHeader>
        <EmptyTitle>{{ t('repository.contributors.empty.title') }}</EmptyTitle>
        <EmptyDescription>{{ t('repository.contributors.empty.description') }}</EmptyDescription>
      </EmptyHeader>
    </Empty>

    <template v-else-if="result">
      <div class="flex min-w-0 flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <h2 class="min-w-0 select-none truncate text-label font-medium text-foreground">
          {{ chartTitle }}
        </h2>

        <nav
          v-if="metricTabs.length > 1"
          :aria-label="t('repository.contributors.metricsLabel')"
          class="flex min-w-0 flex-wrap items-center gap-1"
        >
          <button
            v-for="tab in metricTabs"
            :key="tab.id"
            class="inline-flex h-8 select-none items-center gap-1.5 border-b px-2 text-body font-medium outline-hidden transition-colors focus-visible:ring-2 focus-visible:ring-ring/30"
            :class="tab.id === effectiveMetric
              ? 'border-foreground text-foreground'
              : 'border-transparent text-muted-foreground hover:text-foreground'"
            :aria-current="tab.id === effectiveMetric ? 'page' : undefined"
            type="button"
            @click="selectedMetric = tab.id"
          >
            <component
              :is="tab.icon"
              class="size-3.5"
            />
            <span>{{ tab.label }}</span>
          </button>
        </nav>
      </div>

      <ContributionsChart
        :metric="effectiveMetric"
        :values="weeklyTotals"
        :weeks="weekAxis"
        @update:range="handleRangeUpdate"
      />

      <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <ContributorCard
          v-for="contributor in rankedContributors"
          :key="contributor.author.id"
          :additions="contributor.additions"
          :author="contributor.author"
          :commits="contributor.commits"
          :deletions="contributor.deletions"
          :metric="effectiveMetric"
          :rank="contributor.rank"
          :show-line-stats="hasLineStats"
          :sparkline="contributor.sparkline"
        />
      </div>
    </template>
  </section>
</template>
