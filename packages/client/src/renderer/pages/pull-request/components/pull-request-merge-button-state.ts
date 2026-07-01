export interface PullRequestMergeActionIconState {
  isMerging: boolean
}

export function shouldShowPullRequestMergeActionIcon(state: PullRequestMergeActionIconState): boolean {
  return !state.isMerging
}
