<script setup lang="ts">
import { X } from 'lucide-vue-next'
import { Button, Input } from '@oh-my-github/ui'
import type { EnvDraft } from './env-drafts'
import type { EnvEntry } from './parse-env-entries'
import { parseEnvEntries } from './parse-env-entries'

defineProps<{
  drafts: EnvDraft[]
  maskValues?: boolean
  namePlaceholder: string
  removeLabel: string
  valuePlaceholder: string
}>()

const emit = defineEmits<{
  'paste-entries': [id: number, entries: EnvEntry[]]
  remove: [id: number]
  'update:name': [id: number, name: string]
  'update:value': [id: number, value: string]
}>()

function onNamePaste(id: number, event: ClipboardEvent): void {
  const text = event.clipboardData?.getData('text/plain') ?? ''
  if (!text.includes('=')) return

  const entries = parseEnvEntries(text)
  if (entries.length === 0) return

  event.preventDefault()
  emit('paste-entries', id, entries)
}
</script>

<template>
  <div
    v-for="draft in drafts"
    :key="draft.id"
    class="grid gap-1.5 px-4 py-3"
  >
    <div class="flex items-center gap-2">
      <Input
        autocomplete="off"
        class="font-mono uppercase"
        :model-value="draft.name"
        :placeholder="namePlaceholder"
        size="sm"
        spellcheck="false"
        @paste="onNamePaste(draft.id, $event)"
        @update:model-value="emit('update:name', draft.id, String($event))"
      />
      <Input
        autocomplete="off"
        :model-value="draft.value"
        :placeholder="valuePlaceholder"
        size="sm"
        spellcheck="false"
        :type="maskValues ? 'password' : 'text'"
        @update:model-value="emit('update:value', draft.id, String($event))"
      />
      <Button
        :aria-label="removeLabel"
        size="icon-sm"
        type="button"
        variant="ghost"
        @click="emit('remove', draft.id)"
      >
        <X class="size-4" />
      </Button>
    </div>
    <p
      v-if="draft.error"
      class="text-caption text-destructive"
    >
      {{ draft.error }}
    </p>
  </div>
</template>
