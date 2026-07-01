import { describe, expect, it } from 'vitest'
import { shouldShowPullRequestMergeActionIcon } from './pull-request-merge-button-state'

describe('shouldShowPullRequestMergeActionIcon', () => {
  it('shows the merge icon while idle', () => {
    expect(shouldShowPullRequestMergeActionIcon({ isMerging: false })).toBe(true)
  })

  it('hides the merge icon while the button renders its leading loading spinner', () => {
    expect(shouldShowPullRequestMergeActionIcon({ isMerging: true })).toBe(false)
  })
})
