<script setup lang="ts">
import type { WorkItemLabelInput } from './types'
import { computed } from 'vue'
import LabelBadge from './label-badge.vue'

const props = defineProps<{
  labels: WorkItemLabelInput[]
  emptyLabel?: string
}>()

const visibleLabels = computed(() =>
  props.labels
    .map((label, index) => normalizeLabel(label, index))
    .filter((label) => label.name.length > 0)
)

function normalizeLabel(label: WorkItemLabelInput, index: number) {
  if (typeof label === 'string') {
    return { key: `${label}-${index}`, name: label.trim(), color: '', description: null }
  }

  return {
    key: String(label.id ?? `${label.name}-${index}`),
    name: label.name.trim(),
    color: label.color ?? '',
    description: label.description ?? null
  }
}
</script>

<template>
  <div
    v-if="visibleLabels.length > 0"
    class="flex min-w-0 flex-wrap items-center gap-1.5"
  >
    <LabelBadge
      v-for="label in visibleLabels"
      :key="label.key"
      :label="label"
    />
  </div>
  <p
    v-else-if="emptyLabel"
    class="text-body text-muted-foreground"
  >
    {{ emptyLabel }}
  </p>
</template>
