<script setup lang="ts">
import { computed, watch } from 'vue'
import type { ThemeRegistrationRaw } from 'shiki'
import { useCodeTheme } from './code-theme'
import { parseDiff } from './parse-diff'
import { useShikiHighlighter } from './use-shiki-highlighter'

const props = withDefaults(defineProps<{
  code: string
  diff?: boolean
  language?: string
  filename?: string
  padded?: boolean
  showLineNumbers?: boolean
  themedBackground?: boolean
  /** Force a single theme instead of the scheme-bound light/dark pair. */
  theme?: ThemeRegistrationRaw
}>(), {
  diff: false,
  filename: undefined,
  language: undefined,
  padded: false,
  showLineNumbers: true,
  themedBackground: false,
  theme: undefined
})

const shiki = useShikiHighlighter()
const { themes } = useCodeTheme()

// Shiki dual-theme output plus the `.dark .shiki span { color: var(--shiki-dark) }`
// rule in the UI stylesheet means single-theme rendering loses its colors in dark
// mode. To force one theme regardless of app mode, render it on both sides.
const effectiveThemes = computed(() =>
  props.theme ? { light: props.theme, dark: props.theme } : themes.value
)
const lineNumbersEnabled = computed(() => props.showLineNumbers && !props.diff)
const fallbackHtml = computed(() => props.code.split('\n').map((line) => {
  return `<span class="line">${escapeHtml(line)}</span>`
}).join('\n'))

watch(
  () => [
    props.code,
    props.diff,
    props.language,
    props.filename,
    effectiveThemes.value.light.name,
    effectiveThemes.value.dark.name
  ] as const,
  ([code, diff, language, filename]) => {
    if (!code) {
      shiki.html.value = ''
      return
    }

    if (diff) {
      const lines = parseDiff(code)

      void shiki.highlight(lines.map((line) => line.content).join('\n'), {
        filename,
        language,
        themes: effectiveThemes.value,
        diffLines: lines
      })

      return
    }

    void shiki.highlight(code, {
      filename,
      language,
      themes: effectiveThemes.value
    })
  },
  { immediate: true }
)

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
</script>

<template>
  <!-- eslint-disable vue/no-v-html -->
  <div
    v-if="shiki.html.value"
    class="rich-content-code min-w-0 font-mono text-body leading-relaxed [&_pre]:overflow-x-auto"
    :class="props.padded ? '[&_pre]:p-3' : '[&_pre]:p-0'"
    :data-diff="props.diff ? 'true' : undefined"
    :data-line-numbers="lineNumbersEnabled ? 'true' : 'false'"
    :data-themed-background="props.themedBackground ? 'true' : 'false'"
    v-html="shiki.html.value"
  />
  <!-- eslint-enable vue/no-v-html -->
  <pre
    v-else
    class="rich-content-code min-w-0 overflow-x-auto whitespace-pre font-mono text-body leading-relaxed text-foreground"
    :class="props.padded ? 'p-3' : ''"
    :data-diff="props.diff ? 'true' : undefined"
    :data-line-numbers="lineNumbersEnabled ? 'true' : 'false'"
    :data-themed-background="props.themedBackground ? 'true' : 'false'"
  ><code v-html="fallbackHtml" /></pre>
</template>
