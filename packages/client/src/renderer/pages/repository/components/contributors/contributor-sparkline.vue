<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  values: number[]
}>()

const VIEW_WIDTH = 100
const VIEW_HEIGHT = 28

const paths = computed(() => {
  const values = props.values
  if (values.length === 0) return null

  const max = Math.max(1, ...values)
  const step = values.length > 1 ? VIEW_WIDTH / (values.length - 1) : 0
  const points = values.map((value, index) => {
    const x = values.length > 1 ? index * step : VIEW_WIDTH / 2
    const y = VIEW_HEIGHT - 1 - (value / max) * (VIEW_HEIGHT - 2)

    return `${x.toFixed(2)},${y.toFixed(2)}`
  })
  const line = points.map((point, index) => `${index === 0 ? 'M' : 'L'}${point}`).join('')

  return {
    line,
    area: `${line}L${VIEW_WIDTH},${VIEW_HEIGHT}L0,${VIEW_HEIGHT}Z`,
  }
})
</script>

<template>
  <svg
    v-if="paths"
    aria-hidden="true"
    class="h-8 w-full"
    preserveAspectRatio="none"
    :viewBox="`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`"
  >
    <path
      :d="paths.area"
      fill="currentColor"
      opacity="0.15"
    />
    <path
      :d="paths.line"
      fill="none"
      stroke="currentColor"
      stroke-width="1.25"
      vector-effect="non-scaling-stroke"
    />
  </svg>
</template>
