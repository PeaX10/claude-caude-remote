import React from 'react'
import { View } from 'react-native'
import { useState } from 'react'
import { commonToolStyles } from '../styles/tool-styles'
import { formatMCPToolName, isInterrupted, COMPACT_TOOLS } from '../constants/tool-constants'
import { TodoMessage } from './messages/todo-message'
import { EditMessage } from './messages/edit-message'
import { BashToolRenderer } from './tools/bash-tool-renderer'
import { ReadToolRenderer } from './tools/read-tool-renderer'
import { CompactToolRenderer } from './tools/compact-tool-renderer'
import { GenericToolRenderer } from './tools/generic-tool-renderer'
import { MultiEditToolRenderer } from './tools/multi-edit-tool-renderer'
import { ToolInput } from '../types/tool.types'

interface ToolMessageProps {
  toolUse?: {
    name: string
    input?: ToolInput
    id?: string
  }
  toolResult?: {
    content?: string
    error?: string
    tool_use_id?: string
  }
  isLoading?: boolean
  timestamp?: number
}

const ToolMessageComponent = ({ toolUse, toolResult, isLoading = false, timestamp }: ToolMessageProps) => {
  const [expanded, setExpanded] = useState(false)

  if (!toolUse) return null

  const { name, input } = toolUse
  const hasResult = toolResult !== undefined && !isLoading
  const hasError = !!toolResult?.error
  const interrupted = isInterrupted(toolResult?.error)
  const displayName = formatMCPToolName(name)

  if (name === 'TodoWrite' && input?.todos) {
    return <TodoMessage todos={input.todos} timestamp={timestamp} />
  }

  if (name === 'Edit' && hasResult && !hasError) {
    return (
      <EditMessage 
        filePath={input?.file_path}
        oldString={input?.old_string}
        newString={input?.new_string}
        timestamp={timestamp}
      />
    )
  }
  const shouldShowCompact = () => {
    return COMPACT_TOOLS.some(tool => name.includes(tool)) && hasResult && !hasError
  }

  const renderTool = () => {
    const props = {
      name,
      displayName,
      input,
      toolResult,
      hasResult,
      hasError,
      isInterrupted: interrupted,
      isLoading,
      expanded,
      onToggle: () => setExpanded(!expanded),
    }
  
    switch (true) {
      case name === 'Read':
        return <ReadToolRenderer {...props} />
      case name === 'MultiEdit':
        return <MultiEditToolRenderer {...props} />
      case name === 'Bash':
        return <BashToolRenderer {...props} />
      case shouldShowCompact():
        return <CompactToolRenderer {...props} />
      default:
        return <GenericToolRenderer {...props} />
    }
  }

  return (
    <View style={commonToolStyles.container}>
      {renderTool()}
    </View>
  )
}

// Memoized component to prevent unnecessary re-renders
export const ToolMessage = React.memo(ToolMessageComponent, (prevProps, nextProps) => {
  return (
    prevProps.toolUse === nextProps.toolUse &&
    prevProps.toolResult === nextProps.toolResult &&
    prevProps.isLoading === nextProps.isLoading &&
    prevProps.timestamp === nextProps.timestamp
  )
})