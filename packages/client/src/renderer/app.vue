<script setup lang="ts">
import { useGlobalKeyboardShortcuts } from './keyboard/global-shortcuts'
import { useKeyboardShortcutListener } from './keyboard/shortcut-runtime'
import { useFocusRingModality } from './composables/use-focus-ring-modality'
import { useSettingsStore } from './stores/settings'

const settingsStore = useSettingsStore()

void settingsStore.initialize()
useFocusRingModality()
useKeyboardShortcutListener()
useGlobalKeyboardShortcuts()
</script>

<template>
  <RouterView />
</template>
