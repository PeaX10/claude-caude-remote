import { ViewStyleProp } from './style.types'

export type ToolInputValue = string | number | boolean | null | undefined | Record<string, ToolInputValue>
export type ToolInput = Record<string, ToolInputValue>

export interface ToolResult {
  content?: string
  error?: string
  totalToolUseCount?: number
  totalDurationMs?: number
  totalTokens?: number
  [key: string]: string | number | boolean | null | undefined
}

export interface ToolRendererProps {
  name: string
  input?: ToolInput
  toolResult?: ToolResult
  isExpanded?: boolean
  id?: string
}

export interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large'
  color?: string
  style?: ViewStyleProp
}