<script setup lang="ts">
import { Palette } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@oh-my-github/ui'

type SettingsTabId = 'appearance'

defineProps<{
  activeTab: SettingsTabId
}>()

const emit = defineEmits<{
  close: []
  selectTab: [tab: SettingsTabId]
}>()

const { t } = useI18n()

function handleOpenChange(isOpen: boolean): void {
  if (!isOpen) {
    emit('close')
  }
}
</script>

<template>
  <Dialog
    :open="true"
    @update:open="handleOpenChange"
  >
    <DialogContent
      class="grid-cols-[13rem_minmax(0,1fr)] !h-[calc(100vh-2rem)] !max-h-[680px] !w-[calc(100vw-2rem)] !max-w-[880px] !gap-0 !overflow-hidden !p-0 sm:!max-w-[880px]"
    >
      <DialogTitle class="sr-only">
        {{ t('settings.title') }}
      </DialogTitle>
      <DialogDescription class="sr-only">
        {{ t('settings.description') }}
      </DialogDescription>

      <aside class="flex min-h-0 flex-col border-r border-border bg-muted/30 p-4">
        <nav
          :aria-label="t('settings.navigation')"
          class="min-h-0 flex-1 overflow-auto"
        >
          <div class="space-y-1">
            <p class="px-2 pb-1 text-caption font-medium text-muted-foreground">
              {{ t('settings.sections.interface') }}
            </p>
            <button
              class="flex h-9 w-full items-center gap-2 rounded-md px-2 text-left text-control outline-hidden transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring"
              :class="activeTab === 'appearance' ? 'bg-accent text-accent-foreground' : 'text-muted-foreground'"
              type="button"
              @click="emit('selectTab', 'appearance')"
            >
              <Palette class="size-4 shrink-0" />
              <span class="truncate">
                {{ t('settings.tabs.appearance') }}
              </span>
            </button>
          </div>
        </nav>
      </aside>

      <section class="min-h-0 overflow-auto p-6 pr-12">
        <header class="mb-6">
          <h2 class="truncate text-heading font-semibold text-foreground">
            {{ t('settings.tabs.appearance') }}
          </h2>
        </header>

        <div class="min-h-0" />
      </section>
    </DialogContent>
  </Dialog>
</template>
