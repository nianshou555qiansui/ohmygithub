export interface WorkItemLabel {
  id?: string | number
  name: string
  color?: string | null
  description?: string | null
}

export type WorkItemLabelInput = string | WorkItemLabel

export type WorkItemKind = 'issue' | 'pull-request'

export type WorkItemState =
  | 'open'
  | 'closed'
  | 'completed'
  | 'not_planned'
  | 'draft'
  | 'merged'
  | (string & {})
