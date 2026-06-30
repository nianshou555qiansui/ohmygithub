<script setup lang="ts">
import { computed } from 'vue'
import { Badge } from '@oh-my-github/ui'
import { labelColorVars } from './label-color'

const props = defineProps<{
  label: { name: string, color?: string | null, description?: string | null }
}>()

const colorVars = computed(() => labelColorVars(props.label.color ?? ''))
const title = computed(() => props.label.description ?? undefined)
</script>

<template>
  <span
    v-if="colorVars"
    class="label-badge inline-flex max-w-full items-center rounded-md border px-2 py-0.5 text-xs font-medium"
    :style="colorVars"
    :title="title"
  >
    <span class="truncate">{{ label.name }}</span>
  </span>
  <Badge
    v-else
    class="max-w-full"
    size="sm"
    variant="secondary"
    :title="title"
  >
    <span class="truncate">{{ label.name }}</span>
  </Badge>
</template>

<style scoped>
.label-badge {
  --lightness-threshold: 0.6;
  --border-alpha: 0.3;
  --perceived-lightness: calc(
    (var(--label-r) * 0.2126 + var(--label-g) * 0.7152 + var(--label-b) * 0.0722) / 255
  );
  /* 1 when the background is dark (needs light text), 0 when light */
  --text-switch: max(0, min(calc((var(--lightness-threshold) - var(--perceived-lightness)) * 1000), 1));

  /* light mode: solid color background, black/white text */
  background: rgb(var(--label-r) var(--label-g) var(--label-b));
  color: hsl(0deg 0% calc(var(--text-switch) * 100%));
  border-color: rgba(var(--label-r), var(--label-g), var(--label-b), 0.2);
}

:global(.dark) .label-badge {
  /* how much to lighten the label color so text stays readable on a dark tint */
  --lightness-switch: max(0, min(calc((1 / (var(--lightness-threshold) - var(--perceived-lightness)))), 1));
  --lighten-by: calc(((var(--lightness-threshold) - var(--perceived-lightness)) * 100) * var(--lightness-switch));

  background: rgba(var(--label-r), var(--label-g), var(--label-b), 0.18);
  color: hsl(var(--label-h) calc(var(--label-s) * 1%) calc((var(--label-l) + var(--lighten-by)) * 1%));
  border-color: hsla(
    var(--label-h),
    calc(var(--label-s) * 1%),
    calc((var(--label-l) + var(--lighten-by)) * 1%),
    var(--border-alpha)
  );
}
</style>
