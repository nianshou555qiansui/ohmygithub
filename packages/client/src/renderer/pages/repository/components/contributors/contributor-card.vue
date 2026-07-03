<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import GithubActorLink from '@/components/github/github-actor-link.vue'
import ContributorSparkline from './contributor-sparkline.vue'

const props = defineProps<{
  rank: number
  author: GitHubContributorStatsAuthor
  commits: number
  additions: number
  deletions: number
  showLineStats: boolean
  metric: 'commits' | 'additions' | 'deletions'
  sparkline: number[]
}>()

const { t } = useI18n()

const sparklineColorClass = computed(() =>
  props.metric === 'deletions' ? 'text-destructive' : 'text-success'
)

function formatNumber(value: number): string {
  return new Intl.NumberFormat().format(value)
}
</script>

<template>
  <article class="grid gap-2 rounded-lg border border-border bg-card p-3">
    <div class="flex min-w-0 items-center justify-between gap-2">
      <GithubActorLink
        avatar-size="md"
        :avatar-url="author.avatarUrl"
        :is-bot="author.type === 'Bot'"
        :login="author.login"
      />
      <span class="shrink-0 select-none text-body font-medium text-muted-foreground">
        #{{ rank }}
      </span>
    </div>

    <div class="flex min-w-0 select-none flex-wrap items-center gap-x-2 gap-y-0.5 font-mono text-caption tabular-nums text-muted-foreground">
      <span>{{ t('repository.contributors.card.commits', { count: formatNumber(commits) }) }}</span>
      <template v-if="showLineStats">
        <span class="text-success">{{ `++${formatNumber(additions)}` }}</span>
        <span class="text-destructive">{{ `--${formatNumber(deletions)}` }}</span>
      </template>
    </div>

    <ContributorSparkline
      :class="sparklineColorClass"
      :values="sparkline"
    />
  </article>
</template>
