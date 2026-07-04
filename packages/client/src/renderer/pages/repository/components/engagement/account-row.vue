<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { UserRound } from 'lucide-vue-next'
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  Button,
  Spinner,
} from '@oh-my-github/ui'

defineProps<{
  followDisabled: boolean
  followPending: boolean
  item: GitHubAccountFollowUser
}>()

const emit = defineEmits<{
  select: [login: string]
  toggleFollow: [item: GitHubAccountFollowUser]
}>()

const { t } = useI18n()

function fallbackInitials(login: string): string {
  return login.slice(0, 2).toUpperCase()
}
</script>

<template>
  <div
    class="flex min-w-0 cursor-pointer items-center gap-3 rounded-lg border border-border bg-card p-3 outline-hidden transition-colors hover:bg-[color:var(--ui-hover)] focus-visible:bg-[color:var(--ui-hover)] focus-visible:ring-2 focus-visible:ring-ring/30"
    role="button"
    tabindex="0"
    @click="emit('select', item.login)"
    @keydown.enter.prevent="emit('select', item.login)"
  >
    <Avatar class="size-10 shrink-0">
      <AvatarImage
        :alt="item.login"
        :src="item.avatarUrl"
      />
      <AvatarFallback class="text-label">
        {{ fallbackInitials(item.login) }}
      </AvatarFallback>
    </Avatar>

    <div class="grid min-w-0 flex-1 gap-0.5">
      <div class="flex min-w-0 items-center gap-2">
        <span class="truncate text-label font-medium text-foreground">
          {{ item.name || item.login }}
        </span>
        <span class="truncate text-body text-muted-foreground">
          {{ item.login }}
        </span>
        <Badge
          v-if="item.isFollowingViewer"
          class="shrink-0"
          variant="secondary"
        >
          {{ t('account.followers.followsYou') }}
        </Badge>
      </div>
      <p
        v-if="item.bio"
        class="truncate text-body text-muted-foreground"
      >
        {{ item.bio }}
      </p>
    </div>

    <Button
      v-if="item.viewerCanFollow && !item.isViewer"
      :aria-pressed="item.viewerIsFollowing"
      class="shrink-0"
      :disabled="followDisabled"
      size="sm"
      type="button"
      variant="outline"
      @click.stop="emit('toggleFollow', item)"
    >
      <Spinner
        v-if="followPending"
        class="size-3.5"
      />
      <UserRound
        v-else
        class="size-3.5"
      />
      <span>{{ t(item.viewerIsFollowing ? 'account.actions.unfollow' : 'account.actions.follow') }}</span>
    </Button>
  </div>
</template>
