export type PullRequestMergeDialogOpenChangeReason = 'user' | 'merge-success'

export interface PullRequestMergeDialogOpenChange {
  isMerging: boolean
  nextOpen: boolean
  reason: PullRequestMergeDialogOpenChangeReason
}

export function canApplyMergeDialogOpenChange(change: PullRequestMergeDialogOpenChange): boolean {
  if (change.nextOpen) return true
  if (change.reason === 'merge-success') return true

  return !change.isMerging
}
