<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useCodeTheme } from '@/components/code/code-theme'
import ShikiCode from '@/components/code/shiki-code.vue'
import { useSettingsStore } from '@/stores/settings'

const { themes } = useCodeTheme()
const { colorScheme } = storeToRefs(useSettingsStore())

// Code renders on a transparent background and blends into whatever surface it
// sits on (e.g. the right panel uses `bg-background`). Mirror the real
// `--background` token from packages/ui/src/style.css so each preview shows its
// variant on the exact surface it appears on in the app, for the active scheme.
const isDefaultScheme = computed(() => colorScheme.value === 'default')
const lightSurface = computed(() =>
  isDefaultScheme.value ? 'oklch(0.981 0.0026 63)' : 'oklch(0.984 0.004 var(--scheme-hue))'
)
const darkSurface = computed(() =>
  isDefaultScheme.value ? 'oklch(0.152 0 0)' : 'oklch(0.152 0.006 var(--scheme-hue))'
)

const previewCode = `function greet(name: string): string {
  // say hello
  return \`Hello, \${name}\`
}`
</script>

<template>
  <div class="grid gap-3 sm:grid-cols-2">
    <div
      class="overflow-hidden rounded-md border border-border px-3 py-2"
      :style="{ backgroundColor: lightSurface }"
    >
      <ShikiCode
        :code="previewCode"
        language="typescript"
        :theme="themes.light"
      />
    </div>
    <div
      class="overflow-hidden rounded-md border border-border px-3 py-2"
      :style="{ backgroundColor: darkSurface }"
    >
      <ShikiCode
        :code="previewCode"
        language="typescript"
        :theme="themes.dark"
      />
    </div>
  </div>
</template>
