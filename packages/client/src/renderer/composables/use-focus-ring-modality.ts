import { onBeforeUnmount, onMounted } from 'vue'

const FOCUS_NAVIGATION_KEYS = new Set([
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'ArrowUp',
  'End',
  'Home',
  'PageDown',
  'PageUp',
  'Tab',
])

export function useFocusRingModality(): void {
  function setModality(value: 'keyboard' | 'pointer'): void {
    document.documentElement.dataset.focusRingModality = value
  }

  function onKeydown(event: KeyboardEvent): void {
    if (event.metaKey || event.ctrlKey || event.altKey) return
    if (!FOCUS_NAVIGATION_KEYS.has(event.key)) return

    setModality('keyboard')
  }

  function onPointerInput(): void {
    setModality('pointer')
  }

  onMounted(() => {
    setModality('pointer')
    window.addEventListener('keydown', onKeydown, true)
    window.addEventListener('mousedown', onPointerInput, true)
    window.addEventListener('pointerdown', onPointerInput, true)
    window.addEventListener('touchstart', onPointerInput, true)
  })

  onBeforeUnmount(() => {
    window.removeEventListener('keydown', onKeydown, true)
    window.removeEventListener('mousedown', onPointerInput, true)
    window.removeEventListener('pointerdown', onPointerInput, true)
    window.removeEventListener('touchstart', onPointerInput, true)
  })
}
