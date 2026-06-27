<script setup lang="ts">
import type { WorkspaceTab } from '../workspace/types'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Book, GitBranch, Shield, Star } from 'lucide-vue-next'
import { Badge } from '@oh-my-github/ui'

const props = defineProps<{
  tab: WorkspaceTab
}>()

const { t } = useI18n()

const owner = computed(() => props.tab.owner ?? '')
const repository = computed(() => props.tab.repo ?? props.tab.title)
const nameWithOwner = computed(() => owner.value ? `${owner.value}/${repository.value}` : repository.value)

const summaryItems = computed(() => [
  {
    id: 'visibility',
    icon: Shield,
    label: t('repository.summary.visibility'),
    value: t('repository.values.placeholder'),
  },
  {
    id: 'branches',
    icon: GitBranch,
    label: t('repository.summary.branches'),
    value: t('repository.values.placeholder'),
  },
  {
    id: 'stars',
    icon: Star,
    label: t('repository.summary.stars'),
    value: t('repository.values.placeholder'),
  },
])
</script>

<template>
  <section class="min-h-full bg-background">
    <div class="mx-auto grid w-full max-w-5xl gap-5 px-6 py-6">
      <div class="grid max-w-3xl gap-2">
        <Badge
          class="justify-self-start"
          variant="secondary"
        >
          <Book />
          {{ t('repository.eyebrow') }}
        </Badge>
        <h1 class="truncate text-heading font-semibold text-foreground">
          {{ nameWithOwner }}
        </h1>
        <p class="max-w-2xl text-label text-muted-foreground">
          {{ t('repository.description', { repository: nameWithOwner }) }}
        </p>
      </div>

      <div class="grid gap-2 sm:grid-cols-3">
        <div
          v-for="item in summaryItems"
          :key="item.id"
          class="grid gap-2 rounded-lg border border-border bg-card p-3"
        >
          <div class="flex min-w-0 items-center gap-2 text-body font-medium text-muted-foreground">
            <component
              :is="item.icon"
              class="size-4 shrink-0"
            />
            <span class="truncate">{{ item.label }}</span>
          </div>
          <div class="truncate text-control font-semibold text-foreground">
            {{ item.value }}
          </div>
        </div>
      </div>

      <div class="grid gap-2 lg:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.8fr)]">
        <div class="grid gap-2 rounded-lg border border-border bg-card p-3">
          <div class="text-label font-medium text-foreground">
            {{ t('repository.sections.overview.title') }}
          </div>
          <p class="text-body text-muted-foreground">
            {{ t('repository.sections.overview.description') }}
          </p>
        </div>

        <div class="grid gap-2 rounded-lg border border-border bg-card p-3">
          <div class="text-label font-medium text-foreground">
            {{ t('repository.sections.activity.title') }}
          </div>
          <p class="text-body text-muted-foreground">
            {{ t('repository.sections.activity.description') }}
          </p>
        </div>
      </div>
    </div>
  </section>
</template>
