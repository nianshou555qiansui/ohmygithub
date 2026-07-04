<script setup lang="ts">
import { ArrowRight } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'
import { Skeleton } from '@oh-my-github/ui'
import GithubActorLink from '@/components/github/github-actor-link.vue'

defineProps<{
  contributors: GitHubRepositoryContributorSummary[]
  isLoading: boolean
}>()

const emit = defineEmits<{
  viewAll: []
}>()

const { t } = useI18n()
</script>

<template>
  <div class="grid content-start gap-3">
    <div class="flex items-center justify-between gap-3">
      <h3 class="select-none text-body font-medium text-muted-foreground">
        {{ t('repository.overview.contributors.title') }}
      </h3>
      <button
        class="inline-flex shrink-0 items-center gap-1 text-body text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        type="button"
        @click="emit('viewAll')"
      >
        {{ t('repository.overview.contributors.viewAll') }}
        <ArrowRight class="size-3.5" />
      </button>
    </div>

    <div
      v-if="isLoading && contributors.length === 0"
      class="flex max-h-16 flex-wrap gap-2 overflow-hidden"
    >
      <Skeleton
        v-for="index in 12"
        :key="index"
        class="size-7 rounded-full"
      />
    </div>

    <div
      v-else
      class="flex max-h-16 flex-wrap content-start gap-2 overflow-hidden"
    >
      <GithubActorLink
        v-for="contributor in contributors"
        :key="contributor.id"
        avatar-size="md"
        :avatar-url="contributor.avatarUrl"
        :is-bot="contributor.type === 'Bot'"
        :login="contributor.login"
        :show-username="false"
        :title="t('repository.overview.contributors.tooltip', { login: contributor.login, count: contributor.contributions })"
      />
    </div>
  </div>
</template>
