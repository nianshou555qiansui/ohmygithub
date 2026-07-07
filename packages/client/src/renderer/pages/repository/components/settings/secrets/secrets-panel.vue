<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Pencil, Plus, Trash2 } from 'lucide-vue-next'
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Spinner,
} from '@oh-my-github/ui'
import SettingsSection from '@/pages/settings/components/appearance-settings/settings-section.vue'
import {
  createRepositoryVariable,
  deleteRepositorySecret,
  deleteRepositoryVariable,
  updateRepositoryVariable,
  upsertRepositorySecret,
  useRepositorySecretsQuery,
  useRepositorySettingsInvalidation,
  useRepositoryVariablesQuery,
} from '@/composables/github/use-repository-settings'
import { useToast } from '@/composables/use-toast'
import EnvDraftRows from './env-draft-rows.vue'
import { createEnvDraft, type EnvDraft } from './env-drafts'
import type { EnvEntry } from './parse-env-entries'

const props = defineProps<{
  owner: string
  repo: string
  scope: GitHubRepositorySecretScope
}>()

const { t } = useI18n()
const toast = useToast()
const { invalidateSecrets, invalidateSecurity } = useRepositorySettingsInvalidation()

const hasIdentity = computed(() => Boolean(props.owner && props.repo))

const secretsQuery = useRepositorySecretsQuery(() => props.owner, () => props.repo, () => props.scope, hasIdentity)
const secrets = computed(() => secretsQuery.data.value ?? [])
const isLoadingSecrets = computed(() => secretsQuery.isLoading.value)

const showVariables = computed(() => props.scope === 'actions')
const variablesQuery = useRepositoryVariablesQuery(() => props.owner, () => props.repo, showVariables)
const variables = computed(() => variablesQuery.data.value ?? [])

const secretDrafts = ref<EnvDraft[]>([])
const variableDrafts = ref<EnvDraft[]>([])
const isSavingSecretDrafts = ref(false)
const isSavingVariableDrafts = ref(false)

const isSecretDialogOpen = ref(false)
const secretName = ref('')
const secretValue = ref('')
const isSavingSecret = ref(false)
const secretError = ref<string | null>(null)

const isVariableDialogOpen = ref(false)
const variableName = ref('')
const variableValue = ref('')
const isSavingVariable = ref(false)
const variableError = ref<string | null>(null)

const pending = ref(new Set<string>())

watch(() => props.scope, () => {
  secretDrafts.value = []
  variableDrafts.value = []
})

watch(isSecretDialogOpen, (open) => {
  if (!open) {
    secretName.value = ''
    secretValue.value = ''
    secretError.value = null
  }
})

watch(isVariableDialogOpen, (open) => {
  if (!open) {
    variableName.value = ''
    variableValue.value = ''
    variableError.value = null
  }
})

function addSecretDraft(): void {
  secretDrafts.value.push(createEnvDraft())
}

function addVariableDraft(): void {
  variableDrafts.value.push(createEnvDraft())
}

function setDraftName(drafts: EnvDraft[], id: number, name: string): void {
  const draft = drafts.find((item) => item.id === id)
  if (!draft) return
  draft.name = name
  draft.error = null
}

function setDraftValue(drafts: EnvDraft[], id: number, value: string): void {
  const draft = drafts.find((item) => item.id === id)
  if (!draft) return
  draft.value = value
  draft.error = null
}

function removeDraft(drafts: EnvDraft[], id: number): void {
  const index = drafts.findIndex((draft) => draft.id === id)
  if (index !== -1) drafts.splice(index, 1)
}

function insertEntries(drafts: EnvDraft[], id: number, entries: EnvEntry[]): void {
  const index = drafts.findIndex((draft) => draft.id === id)
  if (index === -1 || entries.length === 0) return

  const [first, ...rest] = entries
  const target = drafts[index]
  target.name = first.name
  target.value = first.value
  target.error = null
  drafts.splice(index + 1, 0, ...rest.map((entry) => createEnvDraft(entry)))
}

async function saveSecretDrafts(): Promise<void> {
  if (isSavingSecretDrafts.value) return
  isSavingSecretDrafts.value = true
  let savedCount = 0
  let lastSavedName = ''

  try {
    for (const draft of [...secretDrafts.value]) {
      const name = draft.name.trim().toUpperCase()
      if (!name) {
        draft.error = t('repository.settings.secrets.draftNeedsName')
        continue
      }
      if (!draft.value) {
        draft.error = t('repository.settings.secrets.draftNeedsValue')
        continue
      }

      try {
        await upsertRepositorySecret(props.owner, props.repo, props.scope, name, draft.value)
        savedCount += 1
        lastSavedName = name
        removeDraft(secretDrafts.value, draft.id)
      } catch (error) {
        draft.error = error instanceof Error ? error.message : t('repository.settings.secrets.error')
      }
    }
  } finally {
    isSavingSecretDrafts.value = false
    if (savedCount > 0) {
      invalidateSecrets(props.scope, props.owner, props.repo)
      toast.success(savedCount === 1
        ? t('repository.settings.secrets.saved', { name: lastSavedName })
        : t('repository.settings.secrets.savedMany', { count: savedCount }))
    }
  }
}

async function saveVariableDrafts(): Promise<void> {
  if (isSavingVariableDrafts.value) return
  isSavingVariableDrafts.value = true
  const existingNames = new Set(variables.value.map((variable) => variable.name.toUpperCase()))
  let savedCount = 0

  try {
    for (const draft of [...variableDrafts.value]) {
      const name = draft.name.trim().toUpperCase()
      if (!name) {
        draft.error = t('repository.settings.secrets.draftNeedsName')
        continue
      }

      try {
        if (existingNames.has(name)) {
          await updateRepositoryVariable(props.owner, props.repo, name, draft.value)
        } else {
          await createRepositoryVariable(props.owner, props.repo, name, draft.value)
          existingNames.add(name)
        }
        savedCount += 1
        removeDraft(variableDrafts.value, draft.id)
      } catch (error) {
        draft.error = error instanceof Error ? error.message : t('repository.settings.secrets.error')
      }
    }
  } finally {
    isSavingVariableDrafts.value = false
    if (savedCount > 0) {
      invalidateSecurity('variables', props.owner, props.repo)
    }
  }
}

function openEditSecret(name: string): void {
  secretName.value = name
  secretValue.value = ''
  secretError.value = null
  isSecretDialogOpen.value = true
}

async function saveSecret(): Promise<void> {
  const name = secretName.value
  if (!name || !secretValue.value || isSavingSecret.value) return
  isSavingSecret.value = true
  secretError.value = null

  try {
    await upsertRepositorySecret(props.owner, props.repo, props.scope, name, secretValue.value)
    toast.success(t('repository.settings.secrets.saved', { name }))
    isSecretDialogOpen.value = false
    invalidateSecrets(props.scope, props.owner, props.repo)
  } catch (error) {
    secretError.value = error instanceof Error ? error.message : t('repository.settings.secrets.error')
  } finally {
    isSavingSecret.value = false
  }
}

async function removeSecret(name: string): Promise<void> {
  const key = `secret:${name}`
  if (pending.value.has(key)) return
  pending.value = new Set([...pending.value, key])

  try {
    await deleteRepositorySecret(props.owner, props.repo, props.scope, name)
  } catch (error) {
    toast.error(error instanceof Error ? error.message : t('repository.settings.secrets.error'))
  } finally {
    const next = new Set(pending.value)
    next.delete(key)
    pending.value = next
    invalidateSecrets(props.scope, props.owner, props.repo)
  }
}

function openEditVariable(variable: GitHubRepositoryVariable): void {
  variableName.value = variable.name
  variableValue.value = variable.value
  variableError.value = null
  isVariableDialogOpen.value = true
}

async function saveVariable(): Promise<void> {
  if (!variableName.value || isSavingVariable.value) return
  isSavingVariable.value = true
  variableError.value = null

  try {
    await updateRepositoryVariable(props.owner, props.repo, variableName.value, variableValue.value)
    isVariableDialogOpen.value = false
    invalidateSecurity('variables', props.owner, props.repo)
  } catch (error) {
    variableError.value = error instanceof Error ? error.message : t('repository.settings.secrets.error')
  } finally {
    isSavingVariable.value = false
  }
}

async function removeVariable(name: string): Promise<void> {
  const key = `variable:${name}`
  if (pending.value.has(key)) return
  pending.value = new Set([...pending.value, key])

  try {
    await deleteRepositoryVariable(props.owner, props.repo, name)
  } catch (error) {
    toast.error(error instanceof Error ? error.message : t('repository.settings.secrets.error'))
  } finally {
    const next = new Set(pending.value)
    next.delete(key)
    pending.value = next
    invalidateSecurity('variables', props.owner, props.repo)
  }
}
</script>

<template>
  <div class="space-y-8">
    <p class="px-2 text-caption text-muted-foreground">
      {{ t('repository.settings.secrets.envHint') }}
    </p>

    <SettingsSection :title="t('repository.settings.secrets.secretsTitle')">
      <template #actions>
        <div class="flex items-center gap-2">
          <template v-if="secretDrafts.length > 0">
            <Button
              :aria-label="t('repository.settings.secrets.addSecret')"
              size="icon-sm"
              type="button"
              variant="ghost"
              @click="addSecretDraft"
            >
              <Plus class="size-4" />
            </Button>
            <Button
              :disabled="isSavingSecretDrafts"
              size="sm"
              type="button"
              @click="saveSecretDrafts"
            >
              <Spinner
                v-if="isSavingSecretDrafts"
                class="size-3.5"
              />
              {{ t('repository.settings.secrets.saveAll') }}
            </Button>
          </template>
          <Button
            v-else
            size="sm"
            type="button"
            variant="outline"
            @click="addSecretDraft"
          >
            <Plus class="size-4" />
            {{ t('repository.settings.secrets.addSecret') }}
          </Button>
        </div>
      </template>

      <div
        v-if="isLoadingSecrets"
        class="flex min-h-[6rem] items-center justify-center"
      >
        <Spinner class="size-4 text-muted-foreground" />
      </div>

      <div
        v-else
        class="divide-y divide-border"
      >
        <EnvDraftRows
          :drafts="secretDrafts"
          mask-values
          :name-placeholder="t('repository.settings.secrets.namePlaceholder')"
          :remove-label="t('repository.settings.secrets.removeDraft')"
          :value-placeholder="t('repository.settings.secrets.valuePlaceholder')"
          @paste-entries="(id, entries) => insertEntries(secretDrafts, id, entries)"
          @remove="(id) => removeDraft(secretDrafts, id)"
          @update:name="(id, name) => setDraftName(secretDrafts, id, name)"
          @update:value="(id, value) => setDraftValue(secretDrafts, id, value)"
        />

        <p
          v-if="secrets.length === 0 && secretDrafts.length === 0"
          class="px-4 py-6 text-center text-body text-muted-foreground"
        >
          {{ t('repository.settings.secrets.empty') }}
        </p>

        <div
          v-for="secret in secrets"
          :key="secret.name"
          class="flex items-center justify-between gap-4 px-4 py-3"
        >
          <div class="grid min-w-0 gap-0.5">
            <span class="truncate font-mono text-control font-medium text-foreground">{{ secret.name }}</span>
            <span
              v-if="secret.updatedAt"
              class="text-caption text-muted-foreground"
            >
              {{ t('repository.settings.secrets.updated', { date: new Date(secret.updatedAt).toLocaleDateString() }) }}
            </span>
          </div>
          <div class="flex shrink-0 items-center gap-2">
            <Button
              :aria-label="t('repository.settings.secrets.update')"
              size="icon-sm"
              variant="ghost"
              @click="openEditSecret(secret.name)"
            >
              <Pencil class="size-4" />
            </Button>
            <Button
              :aria-label="t('repository.settings.secrets.remove')"
              :disabled="pending.has(`secret:${secret.name}`)"
              size="icon-sm"
              variant="ghost"
              @click="removeSecret(secret.name)"
            >
              <Trash2 class="size-4" />
            </Button>
          </div>
        </div>
      </div>
    </SettingsSection>

    <SettingsSection
      v-if="showVariables"
      :title="t('repository.settings.secrets.variablesTitle')"
    >
      <template #actions>
        <div class="flex items-center gap-2">
          <template v-if="variableDrafts.length > 0">
            <Button
              :aria-label="t('repository.settings.secrets.addVariable')"
              size="icon-sm"
              type="button"
              variant="ghost"
              @click="addVariableDraft"
            >
              <Plus class="size-4" />
            </Button>
            <Button
              :disabled="isSavingVariableDrafts"
              size="sm"
              type="button"
              @click="saveVariableDrafts"
            >
              <Spinner
                v-if="isSavingVariableDrafts"
                class="size-3.5"
              />
              {{ t('repository.settings.secrets.saveAll') }}
            </Button>
          </template>
          <Button
            v-else
            size="sm"
            type="button"
            variant="outline"
            @click="addVariableDraft"
          >
            <Plus class="size-4" />
            {{ t('repository.settings.secrets.addVariable') }}
          </Button>
        </div>
      </template>

      <div class="divide-y divide-border">
        <EnvDraftRows
          :drafts="variableDrafts"
          :name-placeholder="t('repository.settings.secrets.namePlaceholder')"
          :remove-label="t('repository.settings.secrets.removeDraft')"
          :value-placeholder="t('repository.settings.secrets.variableValuePlaceholder')"
          @paste-entries="(id, entries) => insertEntries(variableDrafts, id, entries)"
          @remove="(id) => removeDraft(variableDrafts, id)"
          @update:name="(id, name) => setDraftName(variableDrafts, id, name)"
          @update:value="(id, value) => setDraftValue(variableDrafts, id, value)"
        />

        <p
          v-if="variables.length === 0 && variableDrafts.length === 0"
          class="px-4 py-6 text-center text-body text-muted-foreground"
        >
          {{ t('repository.settings.secrets.variablesEmpty') }}
        </p>

        <div
          v-for="variable in variables"
          :key="variable.name"
          class="flex items-center justify-between gap-4 px-4 py-3"
        >
          <div class="grid min-w-0 gap-0.5">
            <span class="truncate font-mono text-control font-medium text-foreground">{{ variable.name }}</span>
            <span class="truncate font-mono text-caption text-muted-foreground">{{ variable.value }}</span>
          </div>
          <div class="flex shrink-0 items-center gap-2">
            <Button
              :aria-label="t('repository.settings.secrets.updateVariable')"
              size="icon-sm"
              variant="ghost"
              @click="openEditVariable(variable)"
            >
              <Pencil class="size-4" />
            </Button>
            <Button
              :aria-label="t('repository.settings.secrets.removeVariable')"
              :disabled="pending.has(`variable:${variable.name}`)"
              size="icon-sm"
              variant="ghost"
              @click="removeVariable(variable.name)"
            >
              <Trash2 class="size-4" />
            </Button>
          </div>
        </div>
      </div>
    </SettingsSection>

    <Dialog v-model:open="isSecretDialogOpen">
      <DialogContent class="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{{ t('repository.settings.secrets.update') }}</DialogTitle>
        </DialogHeader>

        <div class="grid gap-3">
          <div class="grid gap-1.5">
            <Label for="secret-name">{{ t('repository.settings.secrets.namePlaceholder') }}</Label>
            <Input
              id="secret-name"
              v-model="secretName"
              autocomplete="off"
              class="font-mono uppercase"
              disabled
              spellcheck="false"
            />
          </div>
          <div class="grid gap-1.5">
            <Label for="secret-value">{{ t('repository.settings.secrets.valuePlaceholder') }}</Label>
            <Input
              id="secret-value"
              v-model="secretValue"
              autocomplete="off"
              spellcheck="false"
              type="password"
            />
          </div>

          <p
            v-if="secretError"
            class="text-body text-destructive"
          >
            {{ secretError }}
          </p>
        </div>

        <DialogFooter>
          <Button
            :disabled="isSavingSecret"
            size="sm"
            type="button"
            variant="outline"
            @click="isSecretDialogOpen = false"
          >
            {{ t('repository.settings.general.dangerZone.cancel') }}
          </Button>
          <Button
            :disabled="isSavingSecret || !secretValue"
            size="sm"
            type="button"
            @click="saveSecret"
          >
            <Spinner
              v-if="isSavingSecret"
              class="size-3.5"
            />
            {{ t('repository.settings.secrets.update') }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <Dialog v-model:open="isVariableDialogOpen">
      <DialogContent class="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{{ t('repository.settings.secrets.updateVariable') }}</DialogTitle>
        </DialogHeader>

        <div class="grid gap-3">
          <div class="grid gap-1.5">
            <Label for="variable-name">{{ t('repository.settings.secrets.namePlaceholder') }}</Label>
            <Input
              id="variable-name"
              v-model="variableName"
              autocomplete="off"
              class="font-mono uppercase"
              disabled
              spellcheck="false"
            />
          </div>
          <div class="grid gap-1.5">
            <Label for="variable-value">{{ t('repository.settings.secrets.variableValuePlaceholder') }}</Label>
            <Input
              id="variable-value"
              v-model="variableValue"
              autocomplete="off"
              spellcheck="false"
            />
          </div>

          <p
            v-if="variableError"
            class="text-body text-destructive"
          >
            {{ variableError }}
          </p>
        </div>

        <DialogFooter>
          <Button
            :disabled="isSavingVariable"
            size="sm"
            type="button"
            variant="outline"
            @click="isVariableDialogOpen = false"
          >
            {{ t('repository.settings.general.dangerZone.cancel') }}
          </Button>
          <Button
            :disabled="isSavingVariable"
            size="sm"
            type="button"
            @click="saveVariable"
          >
            <Spinner
              v-if="isSavingVariable"
              class="size-3.5"
            />
            {{ t('repository.settings.secrets.updateVariable') }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
