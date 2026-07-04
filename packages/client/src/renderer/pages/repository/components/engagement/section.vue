<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { Eye, GitFork, Search, Star } from 'lucide-vue-next'
import {
  Button,
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  Skeleton,
} from '@oh-my-github/ui'
import AppPagination from '@/components/navigation/app-pagination.vue'
import TabSwitcher, { type TabSwitcherItem } from '@/components/navigation/tab-switcher.vue'
import {
  setAccountFollowed,
  useAccountListInvalidation,
} from '@/composables/github/use-accounts'
import {
  useRepositoryForksQuery,
  useRepositoryStargazersQuery,
  useRepositoryWatchersQuery,
} from '@/composables/github/use-repositories'
import { useToast } from '@/composables/use-toast'
import {
  createAccountWorkspaceUrl,
  createRepositoryWorkspaceUrl,
} from '@/pages/workspace/workspace-url'
import AccountRow from './account-row.vue'
import ForkRow from './fork-row.vue'

const props = defineProps<{
  counts: GitHubRepositoryOverviewCounts | null
  owner: string
  repo: string
}>()

type EngagementTabId = 'stargazers' | 'forks' | 'watchers'

const PER_PAGE = 20
const SEARCH_DEBOUNCE_MS = 300

const { t } = useI18n()
const router = useRouter()
const toast = useToast()
const { invalidateAccountProfile } = useAccountListInvalidation()

const activeTab = ref<EngagementTabId>('stargazers')
const page = ref(1)
const searchInput = ref('')
const search = ref('')
const followOverrides = ref<Record<string, boolean>>({})
const pendingFollowLogin = ref<string | null>(null)
let searchTimer: ReturnType<typeof setTimeout> | null = null

const hasIdentity = computed(() => Boolean(props.owner && props.repo))
const stargazersQuery = useRepositoryStargazersQuery(
  () => props.owner,
  () => props.repo,
  () => hasIdentity.value && activeTab.value === 'stargazers',
)
const watchersQuery = useRepositoryWatchersQuery(
  () => props.owner,
  () => props.repo,
  () => hasIdentity.value && activeTab.value === 'watchers',
)
const forksQuery = useRepositoryForksQuery(
  () => props.owner,
  () => props.repo,
  () => hasIdentity.value && activeTab.value === 'forks',
)

const activeQuery = computed(() => {
  if (activeTab.value === 'forks') return forksQuery
  return activeTab.value === 'watchers' ? watchersQuery : stargazersQuery
})
const isLoading = computed(() => activeQuery.value.isLoading.value)
const hasError = computed(() => Boolean(activeQuery.value.error.value))
const truncated = computed(() => Boolean(activeQuery.value.data.value?.truncated))

const accountItems = computed(() => {
  const query = activeTab.value === 'watchers' ? watchersQuery : stargazersQuery
  return (query.data.value?.items ?? []).map((item) => {
    const override = followOverrides.value[item.login]
    return override === undefined ? item : { ...item, viewerIsFollowing: override }
  })
})
const filteredAccountItems = computed(() => {
  const terms = search.value.toLowerCase()
  if (!terms) return accountItems.value

  return accountItems.value.filter((item) =>
    item.login.toLowerCase().includes(terms)
    || (item.name ?? '').toLowerCase().includes(terms)
    || (item.bio ?? '').toLowerCase().includes(terms)
  )
})

const forkItems = computed(() => forksQuery.data.value?.items ?? [])
const filteredForkItems = computed(() => {
  const terms = search.value.toLowerCase()
  if (!terms) return forkItems.value

  return forkItems.value.filter((item) =>
    item.fullName.toLowerCase().includes(terms)
    || (item.description ?? '').toLowerCase().includes(terms)
  )
})

const filteredCount = computed(() =>
  activeTab.value === 'forks' ? filteredForkItems.value.length : filteredAccountItems.value.length
)
const pagedAccountItems = computed(() => {
  const offset = (page.value - 1) * PER_PAGE
  return filteredAccountItems.value.slice(offset, offset + PER_PAGE)
})
const pagedForkItems = computed(() => {
  const offset = (page.value - 1) * PER_PAGE
  return filteredForkItems.value.slice(offset, offset + PER_PAGE)
})
const paginationSummaryKey = computed(() =>
  activeTab.value === 'forks'
    ? 'repository.engagement.pagination.forks'
    : 'repository.engagement.pagination.accounts'
)

const tabs = computed<TabSwitcherItem[]>(() => [
  {
    id: 'stargazers',
    icon: Star,
    label: t('repository.engagement.tabs.stargazers'),
    count: props.counts?.stars ?? null,
  },
  {
    id: 'forks',
    icon: GitFork,
    label: t('repository.engagement.tabs.forks'),
    count: props.counts?.forks ?? null,
  },
  {
    id: 'watchers',
    icon: Eye,
    label: t('repository.engagement.tabs.watchers'),
    count: props.counts?.watchers ?? null,
  },
])

watch(
  () => [props.owner, props.repo] as const,
  () => {
    activeTab.value = 'stargazers'
    page.value = 1
    searchInput.value = ''
    search.value = ''
    followOverrides.value = {}
  },
)

watch(activeTab, () => {
  page.value = 1
})

watch(searchInput, (value) => {
  clearSearchTimer()

  searchTimer = setTimeout(() => {
    search.value = value.trim()
    page.value = 1
    searchTimer = null
  }, SEARCH_DEBOUNCE_MS)
})

watch(
  () => [stargazersQuery.data.value, watchersQuery.data.value] as const,
  () => {
    followOverrides.value = {}
  },
)

onBeforeUnmount(() => {
  clearSearchTimer()
})

function clearSearchTimer(): void {
  if (!searchTimer) return

  clearTimeout(searchTimer)
  searchTimer = null
}

function openAccount(login: string): void {
  void router.push(createAccountWorkspaceUrl(login))
}

function openFork(item: GitHubRepositoryForkItem): void {
  void router.push(createRepositoryWorkspaceUrl(item.owner, item.name))
}

async function toggleFollow(item: GitHubAccountFollowUser): Promise<void> {
  if (pendingFollowLogin.value) return

  const nextFollowing = !(followOverrides.value[item.login] ?? item.viewerIsFollowing)
  pendingFollowLogin.value = item.login
  followOverrides.value = { ...followOverrides.value, [item.login]: nextFollowing }

  try {
    await setAccountFollowed(item.login, nextFollowing)
    invalidateAccountProfile(item.login)
  } catch (error) {
    const { [item.login]: _removed, ...rest } = followOverrides.value
    followOverrides.value = rest
    toast.error(t('account.followers.toasts.errorTitle'), {
      description: resolveErrorMessage(error),
    })
  } finally {
    pendingFollowLogin.value = null
  }
}

function resolveErrorMessage(error: unknown): string | undefined {
  if (!(error instanceof Error)) return undefined

  const message = error.message
    .replace(/^Error invoking remote method '[^']+':\s*/, '')
    .replace(/^Error:\s*/, '')
    .trim()

  return message || undefined
}
</script>

<template>
  <section class="grid gap-3">
    <div class="flex min-w-0 flex-wrap items-center justify-between gap-2">
      <TabSwitcher
        :active-id="activeTab"
        :navigation-label="t('repository.engagement.tabsLabel')"
        :tabs="tabs"
        @update:active-id="activeTab = $event as EngagementTabId"
      />

      <InputGroup
        class="w-full sm:max-w-xs"
        size="sm"
      >
        <InputGroupAddon>
          <Search class="size-3.5 text-muted-foreground" />
        </InputGroupAddon>
        <InputGroupInput
          v-model="searchInput"
          :placeholder="t('repository.engagement.searchPlaceholder')"
          type="search"
        />
      </InputGroup>
    </div>

    <div
      v-if="isLoading && filteredCount === 0"
      class="grid gap-2"
    >
      <Skeleton
        v-for="index in 6"
        :key="index"
        class="h-16 rounded-lg"
      />
    </div>

    <Empty
      v-else-if="hasError"
      class="min-h-[18rem] border border-border bg-card"
    >
      <EmptyHeader>
        <EmptyTitle>
          {{ t('repository.engagement.error.title') }}
        </EmptyTitle>
        <EmptyDescription>
          {{ t('repository.engagement.error.description') }}
        </EmptyDescription>
        <Button
          class="justify-self-center"
          size="sm"
          type="button"
          variant="outline"
          @click="activeQuery.refetch()"
        >
          {{ t('account.error.retry') }}
        </Button>
      </EmptyHeader>
    </Empty>

    <Empty
      v-else-if="filteredCount === 0"
      class="min-h-[18rem] border border-border bg-card"
    >
      <EmptyHeader>
        <EmptyTitle>
          {{ t(search
            ? 'repository.engagement.searchEmpty.title'
            : `repository.engagement.empty.${activeTab}.title`) }}
        </EmptyTitle>
        <EmptyDescription>
          {{ t(search
            ? 'repository.engagement.searchEmpty.description'
            : `repository.engagement.empty.${activeTab}.description`) }}
        </EmptyDescription>
      </EmptyHeader>
    </Empty>

    <template v-else>
      <p
        v-if="truncated"
        class="text-body text-muted-foreground"
      >
        {{ t('repository.engagement.truncated') }}
      </p>

      <ul
        v-if="activeTab === 'forks'"
        class="grid gap-2"
      >
        <li
          v-for="item in pagedForkItems"
          :key="item.id"
        >
          <ForkRow
            :item="item"
            @select="openFork"
          />
        </li>
      </ul>

      <ul
        v-else
        class="grid gap-2"
      >
        <li
          v-for="item in pagedAccountItems"
          :key="item.login"
        >
          <AccountRow
            :follow-disabled="pendingFollowLogin !== null"
            :follow-pending="pendingFollowLogin === item.login"
            :item="item"
            @select="openAccount"
            @toggle-follow="toggleFollow"
          />
        </li>
      </ul>

      <AppPagination
        v-model:page="page"
        :disabled="isLoading"
        hide-when-single-page
        :max-total="Math.max(filteredCount, PER_PAGE)"
        :per-page="PER_PAGE"
        :summary-key="paginationSummaryKey"
        :total-count="filteredCount"
      />
    </template>
  </section>
</template>
