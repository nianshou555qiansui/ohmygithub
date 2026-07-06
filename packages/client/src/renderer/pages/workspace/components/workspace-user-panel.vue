<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { LogOut, Palette, Settings, UserCircle, UserPlus } from 'lucide-vue-next'
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@oh-my-github/ui'
import { useAuthActions } from '@/composables/use-auth-actions'
import { useAuthStore } from '@/stores/auth'

const props = defineProps<{
  viewer: AuthViewer | null
}>()

const router = useRouter()
const { t } = useI18n()
const authStore = useAuthStore()
const { logout: performLogout, switchAccount } = useAuthActions()
const isLoggingOut = ref(false)

const otherAccounts = computed(() => authStore.otherAccounts)

const displayName = computed(() => props.viewer?.name?.trim() ?? '')
const username = computed(() => props.viewer?.login ?? '')
const primaryLabel = computed(() => displayName.value || username.value)
const secondaryLabel = computed(() => displayName.value ? username.value : '')
const avatarFallback = computed(() => {
  const source = primaryLabel.value || username.value
  return source.slice(0, 2).toUpperCase()
})

async function logout(): Promise<void> {
  if (isLoggingOut.value) return

  isLoggingOut.value = true
  try {
    await performLogout()
  } finally {
    isLoggingOut.value = false
  }
}

function onSwitchAccount(accountId: number): void {
  void switchAccount(accountId)
}

function addAccount(): void {
  void router.push({ name: 'auth', query: { add: '1' } })
}

function accountPrimaryLabel(account: AuthAccountSummary): string {
  return account.name?.trim() || account.login
}

function accountFallback(account: AuthAccountSummary): string {
  return accountPrimaryLabel(account).slice(0, 2).toUpperCase()
}

function openSettings(tab: 'github-profile' | 'appearance' = 'github-profile'): void {
  void router.push({
    path: '/settings',
    query: {
      tab,
    },
  })
}

function openProfile(): void {
  if (!username.value) return

  void router.push(`/${encodeURIComponent(username.value)}`)
}
</script>

<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <button
        class="flex w-full min-w-0 select-none items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-sidebar-foreground outline-hidden transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring"
        type="button"
      >
        <Avatar class="size-7">
          <AvatarImage
            v-if="viewer?.avatarUrl"
            :alt="primaryLabel"
            :src="viewer.avatarUrl"
          />
          <AvatarFallback class="text-caption">
            {{ avatarFallback }}
          </AvatarFallback>
        </Avatar>

        <span class="flex min-w-0 flex-1 flex-col">
          <span class="truncate text-body font-medium">
            {{ primaryLabel }}
          </span>
          <span
            v-if="secondaryLabel"
            class="truncate text-caption text-muted-foreground"
          >
            {{ secondaryLabel }}
          </span>
        </span>
      </button>
    </DropdownMenuTrigger>

    <DropdownMenuContent
      align="start"
      class="w-64"
      side="top"
      :side-offset="8"
    >
      <DropdownMenuItem
        :disabled="!username"
        @select="openProfile"
      >
        <UserCircle />
        <span>{{ t('workspace.userMenu.profile') }}</span>
      </DropdownMenuItem>
      <DropdownMenuItem @select="openSettings('github-profile')">
        <Settings />
        <span>{{ t('workspace.userMenu.settings') }}</span>
      </DropdownMenuItem>
      <DropdownMenuItem @select="openSettings('appearance')">
        <Palette />
        <span>{{ t('workspace.userMenu.appearance') }}</span>
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem
        v-for="account in otherAccounts"
        :key="account.id"
        @select="onSwitchAccount(account.id)"
      >
        <Avatar class="size-6">
          <AvatarImage
            v-if="account.avatarUrl"
            :alt="accountPrimaryLabel(account)"
            :src="account.avatarUrl"
          />
          <AvatarFallback class="text-[10px]">
            {{ accountFallback(account) }}
          </AvatarFallback>
        </Avatar>
        <span class="flex min-w-0 flex-1 flex-col">
          <span class="truncate">{{ accountPrimaryLabel(account) }}</span>
          <span
            v-if="account.name?.trim()"
            class="truncate text-caption text-muted-foreground"
          >
            {{ account.login }}
          </span>
        </span>
      </DropdownMenuItem>
      <DropdownMenuItem @select="addAccount">
        <UserPlus />
        <span>{{ t('workspace.userMenu.addAccount') }}</span>
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem
        :disabled="isLoggingOut"
        variant="destructive"
        @select.prevent="logout"
      >
        <LogOut />
        <span>{{ t('workspace.userMenu.logout') }}</span>
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
