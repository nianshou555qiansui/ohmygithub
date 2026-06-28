<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  ArrowRight,
  Building2,
  Book,
  Search,
  UserRound,
} from 'lucide-vue-next'
import {
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  Spinner,
  useCommand,
} from '@oh-my-github/ui'

const props = defineProps<{
  isResolving: boolean
  open: boolean
  resolveError: boolean
}>()

const emit = defineEmits<{
  goto: [query: string]
  search: [mode: GitHubWorkspaceSearchMode, query: string]
}>()

const { t } = useI18n()
const { filterState } = useCommand()
const latestQuery = ref('')
const query = computed(() => filterState.search.trim())
const hasQuery = computed(() => query.value.length > 0)

watch(query, (value) => {
  if (value) {
    latestQuery.value = value
  }
})

watch(
  () => props.open,
  (isOpen) => {
    if (!isOpen) {
      filterState.search = ''
      latestQuery.value = ''
    }
  },
)

function emitSearch(mode: GitHubWorkspaceSearchMode): void {
  const value = query.value || latestQuery.value
  if (!value) return

  emit('search', mode, value)
}

function emitGoto(): void {
  const value = query.value || latestQuery.value
  if (!value || props.isResolving) return

  emit('goto', value)
}
</script>

<template>
  <CommandInput
    :placeholder="t('workspace.search.placeholder')"
    size="md"
  />

  <CommandList
    v-if="hasQuery"
    :key="query"
  >
    <CommandGroup force-render>
      <CommandItem
        :disabled="isResolving"
        force-render
        :value="`goto:${query}`"
        @select="emitGoto"
      >
        <Spinner v-if="isResolving" />
        <ArrowRight
          v-else
          class="size-3.5"
        />
        <span class="min-w-0 flex-1 truncate">
          {{ t('workspace.search.actions.goto', { query }) }}
        </span>
      </CommandItem>

      <CommandItem
        force-render
        :value="`users:${query}`"
        @select="emitSearch('users')"
      >
        <UserRound class="size-3.5" />
        <span class="min-w-0 flex-1 truncate">
          {{ t('workspace.search.actions.users', { query }) }}
        </span>
      </CommandItem>

      <CommandItem
        force-render
        :value="`orgs:${query}`"
        @select="emitSearch('orgs')"
      >
        <Building2 class="size-3.5" />
        <span class="min-w-0 flex-1 truncate">
          {{ t('workspace.search.actions.orgs', { query }) }}
        </span>
      </CommandItem>

      <CommandItem
        force-render
        :value="`repos:${query}`"
        @select="emitSearch('repos')"
      >
        <Book class="size-3.5" />
        <span class="min-w-0 flex-1 truncate">
          {{ t('workspace.search.actions.repos', { query }) }}
        </span>
      </CommandItem>

      <CommandItem
        force-render
        :value="`all:${query}`"
        @select="emitSearch('all')"
      >
        <Search class="size-3.5" />
        <span class="min-w-0 flex-1 truncate">
          {{ t('workspace.search.actions.all', { query }) }}
        </span>
      </CommandItem>
    </CommandGroup>

    <p
      v-if="resolveError"
      class="border-t border-border/40 px-3.5 py-2 text-body text-muted-foreground"
    >
      {{ t('workspace.search.resolveError') }}
    </p>
  </CommandList>

</template>
