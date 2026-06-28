<script setup lang="ts">
import type { ListboxGroupProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { ListboxGroup, ListboxGroupLabel, useId } from 'reka-ui'
import { computed, onMounted, onUnmounted } from 'vue'
import { menuLabelClass } from '#/lib/menu'
import { cn } from '#/lib/utils'
import { provideCommandGroupContext, useCommand } from '.'

const props = defineProps<ListboxGroupProps & {
  class?: HTMLAttributes['class']
  forceRender?: boolean
  heading?: string
}>()

const delegatedProps = reactiveOmit(props, 'class', 'forceRender')

const { allGroups, filterState } = useCommand()
const id = useId()

const isRender = computed(() => {
  if (props.forceRender || !filterState.search)
    return true

  return filterState.filtered.groups.has(id)
})

provideCommandGroupContext({ id })
onMounted(() => {
  if (!allGroups.value.has(id))
    allGroups.value.set(id, new Set())
})
onUnmounted(() => {
  allGroups.value.delete(id)
})
</script>

<template>
  <ListboxGroup
    v-bind="delegatedProps"
    :id="id"
    data-slot="command-group"
    :class="cn('text-foreground flex flex-col gap-0.5 overflow-hidden p-1.5', props.class)"
    :hidden="isRender ? undefined : true"
  >
    <ListboxGroupLabel
      v-if="heading"
      data-slot="command-group-heading"
      :class="menuLabelClass"
    >
      {{ heading }}
    </ListboxGroupLabel>
    <slot />
  </ListboxGroup>
</template>
