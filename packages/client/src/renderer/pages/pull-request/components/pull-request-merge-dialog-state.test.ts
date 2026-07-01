import { describe, expect, it } from 'vitest'
import { canApplyMergeDialogOpenChange } from './pull-request-merge-dialog-state'

describe('canApplyMergeDialogOpenChange', () => {
  it('blocks user-driven close while a merge is in progress', () => {
    expect(canApplyMergeDialogOpenChange({
      isMerging: true,
      nextOpen: false,
      reason: 'user',
    })).toBe(false)
  })

  it('allows successful merge flow to close the dialog while the merge is still in progress', () => {
    expect(canApplyMergeDialogOpenChange({
      isMerging: true,
      nextOpen: false,
      reason: 'merge-success',
    })).toBe(true)
  })
})
