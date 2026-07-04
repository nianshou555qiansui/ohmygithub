<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { OverviewLanguageShare } from './overview-language-shares'

defineProps<{
  shares: OverviewLanguageShare[]
}>()

const { t } = useI18n()
</script>

<template>
  <div class="grid content-start gap-3">
    <h3 class="select-none text-body font-medium text-muted-foreground">
      {{ t('repository.overview.languages.title') }}
    </h3>

    <div class="flex h-2 gap-px overflow-hidden rounded-full">
      <div
        v-for="share in shares"
        :key="share.name ?? '__other__'"
        class="h-full"
        :style="{ width: `${share.percent}%`, backgroundColor: share.color }"
      />
    </div>

    <div class="flex flex-wrap gap-x-4 gap-y-1.5">
      <div
        v-for="share in shares"
        :key="share.name ?? '__other__'"
        class="flex min-w-0 items-center gap-1.5 text-body"
      >
        <span
          class="size-2.5 shrink-0 rounded-full"
          :style="{ backgroundColor: share.color }"
        />
        <span class="truncate font-medium text-foreground">
          {{ share.name ?? t('repository.overview.languages.other') }}
        </span>
        <span class="shrink-0 text-muted-foreground">{{ share.percent }}%</span>
      </div>
    </div>
  </div>
</template>
