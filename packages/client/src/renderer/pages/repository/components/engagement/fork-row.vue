<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Star } from 'lucide-vue-next'
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@oh-my-github/ui'

const props = defineProps<{
  item: GitHubRepositoryForkItem
}>()

const emit = defineEmits<{
  select: [item: GitHubRepositoryForkItem]
}>()

const { t } = useI18n()

const updatedLabel = computed(() => {
  if (!props.item.pushedAt) return null

  const date = new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(props.item.pushedAt))

  return t('repository.engagement.forkUpdated', { date })
})

function fallbackInitials(owner: string): string {
  return owner.slice(0, 2).toUpperCase()
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat().format(value)
}
</script>

<template>
  <div
    class="flex min-w-0 cursor-pointer items-center gap-3 rounded-lg border border-border bg-card p-3 outline-hidden transition-colors hover:bg-[color:var(--ui-hover)] focus-visible:bg-[color:var(--ui-hover)] focus-visible:ring-2 focus-visible:ring-ring/30"
    role="button"
    tabindex="0"
    @click="emit('select', item)"
    @keydown.enter.prevent="emit('select', item)"
  >
    <Avatar class="size-10 shrink-0">
      <AvatarImage
        :alt="item.owner"
        :src="item.ownerAvatarUrl"
      />
      <AvatarFallback class="text-label">
        {{ fallbackInitials(item.owner) }}
      </AvatarFallback>
    </Avatar>

    <div class="grid min-w-0 flex-1 gap-0.5">
      <span class="truncate text-label font-medium text-foreground">
        {{ item.fullName }}
      </span>
      <p
        v-if="item.description"
        class="truncate text-body text-muted-foreground"
      >
        {{ item.description }}
      </p>
      <div class="flex min-w-0 items-center gap-2 text-body text-muted-foreground">
        <span class="inline-flex items-center gap-1">
          <Star class="size-3.5" />
          {{ formatNumber(item.stars) }}
        </span>
        <template v-if="updatedLabel">
          <span aria-hidden="true">·</span>
          <span class="truncate">{{ updatedLabel }}</span>
        </template>
      </div>
    </div>
  </div>
</template>
