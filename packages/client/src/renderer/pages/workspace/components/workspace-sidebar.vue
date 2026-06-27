<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { Ellipsis, Inbox, Search } from 'lucide-vue-next'
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
} from '@oh-my-github/ui'

const props = defineProps<{
  activeUrl: string
  isFullscreen: boolean
  organizations: GitHubOrganization[]
  organizationsError: boolean
  organizationsLoading: boolean
}>()

const emit = defineEmits<{
  select: [url: string]
}>()

const { t } = useI18n()
const organizationsExpanded = ref(false)

const visibleOrganizations = computed(() => {
  if (organizationsExpanded.value) return props.organizations
  return props.organizations.slice(0, 4)
})

const showMoreOrganizations = computed(() => props.organizations.length > 4 && !organizationsExpanded.value)

function organizationUrl(organization: GitHubOrganization): string {
  return `/${organization.login}?type=org`
}

function organizationFallback(organization: GitHubOrganization): string {
  return organization.login.slice(0, 1).toUpperCase()
}
</script>

<template>
  <Sidebar
    data-workspace-sidebar
    collapsible="offcanvas"
    width="12rem"
    class="border-r border-border"
  >
    <SidebarHeader
      :class="isFullscreen
        ? 'gap-0 px-2 pb-1 pt-0'
        : 'gap-2 px-2 pb-2 pt-0'"
    >
      <div
        aria-hidden="true"
        class="workspace-titlebar-spacer"
        :data-fullscreen="isFullscreen ? 'true' : undefined"
      />
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            size="sm"
            :tooltip="t('workspace.sidebar.search')"
            type="button"
          >
            <Search />
            <span>{{ t('workspace.sidebar.search') }}</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
        <SidebarMenuItem>
          <SidebarMenuButton
            size="sm"
            :is-active="activeUrl === '/inbox'"
            :tooltip="t('workspace.sidebar.items.inbox')"
            type="button"
            @click="emit('select', '/inbox')"
          >
            <Inbox />
            <span>{{ t('workspace.sidebar.items.inbox') }}</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarHeader>

    <SidebarContent>
      <SidebarGroup class="px-2 py-1">
        <SidebarGroupLabel class="h-6 px-2 text-caption">
          {{ t('workspace.sidebar.groups.organizations') }}
        </SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu v-if="organizationsLoading">
            <SidebarMenuItem
              v-for="index in 3"
              :key="index"
            >
              <SidebarMenuSkeleton show-icon />
            </SidebarMenuItem>
          </SidebarMenu>

          <p
            v-else-if="organizationsError"
            class="px-2 py-1.5 text-caption text-muted-foreground"
          >
            {{ t('workspace.sidebar.organizations.error') }}
          </p>

          <p
            v-else-if="organizations.length === 0"
            class="px-2 py-1.5 text-caption text-muted-foreground"
          >
            {{ t('workspace.sidebar.organizations.empty') }}
          </p>

          <SidebarMenu v-else>
            <SidebarMenuItem
              v-for="organization in visibleOrganizations"
              :key="organization.id"
            >
              <SidebarMenuButton
                size="sm"
                :is-active="activeUrl === organizationUrl(organization)"
                :tooltip="organization.login"
                type="button"
                @click="emit('select', organizationUrl(organization))"
              >
                <Avatar class="size-4">
                  <AvatarImage
                    :alt="organization.login"
                    :src="organization.avatarUrl"
                  />
                  <AvatarFallback class="text-[10px]">
                    {{ organizationFallback(organization) }}
                  </AvatarFallback>
                </Avatar>
                <span>{{ organization.login }}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem v-if="showMoreOrganizations">
              <SidebarMenuButton
                size="sm"
                :tooltip="t('workspace.sidebar.more')"
                type="button"
                @click="organizationsExpanded = true"
              >
                <Ellipsis />
                <span>{{ t('workspace.sidebar.more') }}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </SidebarContent>
  </Sidebar>
</template>

<style scoped>
.workspace-titlebar-spacer {
  height: 2.25rem;
  -webkit-app-region: drag;
}

.workspace-titlebar-spacer[data-fullscreen="true"] {
  height: 0.25rem;
}

:deep([data-workspace-sidebar] [data-sidebar="menu-button"][data-active="true"]::before) {
  display: none !important;
}

:deep([data-workspace-sidebar] [data-sidebar="menu-button"]:focus-visible) {
  box-shadow: none !important;
}
</style>
