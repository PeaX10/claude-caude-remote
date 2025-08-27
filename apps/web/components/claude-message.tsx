import React from 'react'
import { View, Animated } from 'react-native'
import { 
  UserMessage, 
  AssistantMessage, 
  SystemMessage,
  ContextMessage,
  SessionMessage,
  BashMessage,
  TodoMessage,
  EditMessage
} from './messages'
import { ToolMessage } from './tool-message'

interface ClaudeMessage {
  type?: string
  role?: string
  content?: string | any[]
  human?: string
  assistant?: string
  system?: string
  tool_use?: {
    name: string
    input?: any
    id?: string
  }
  tool_result?: {
    content?: string
    error?: string
    tool_use_id?: string
  }
  context?: {
    type?: string
    content?: string
    usage?: any
  }
  session?: {
    id?: string
    created?: string
    updated?: string
    cwd?: string
  }
  timestamp?: number
  isLoading?: boolean
}

interface ClaudeMessageProps {
  message: ClaudeMessage
  fadeAnim: Animated.Value
  slideAnim: Animated.Value
}

const ClaudeMessageComponent = ({ message, fadeAnim, slideAnim }: ClaudeMessageProps) => {
  
  const renderMessage = () => {
    
    // Handle new message format with role and content
    if (message.role === 'user' && message.content) {
      const contentText = typeof message.content === 'string' ? message.content : 
                         Array.isArray(message.content) ? message.content.filter(c => c && typeof c === 'string').join('') : ''
      return <UserMessage content={contentText} timestamp={message.timestamp} />
    }
    
    if (message.role === 'assistant' && message.content) {
      const contentText = typeof message.content === 'string' ? message.content : 
                         Array.isArray(message.content) ? message.content.filter(c => c && typeof c === 'string').join('') : ''
      return <AssistantMessage content={contentText} timestamp={message.timestamp} />
    }

    // Legacy message format support
    // User message
    if (message.human) {
      return <UserMessage content={message.human} timestamp={message.timestamp} />
    }
    
    // Assistant message
    if (message.assistant) {
      return <AssistantMessage content={message.assistant} timestamp={message.timestamp} />
    }
    
    // System message
    if (message.system) {
      return <SystemMessage content={message.system} timestamp={message.timestamp} />
    }
    
    // Tool use message
    if (message.tool_use) {
      // Check if it's a Bash tool
      if (message.tool_use.name === 'Bash') {
        return (
          <BashMessage 
            command={message.tool_use.input?.command}
            description={message.tool_use.input?.description}
            timestamp={message.timestamp}
          />
        )
      }
      // Check if it's a TodoWrite tool
      if (message.tool_use.name === 'TodoWrite') {
        return (
          <TodoMessage 
            todos={message.tool_use.input?.todos}
            timestamp={message.timestamp}
          />
        )
      }
      // Check if it's an Edit tool
      if (message.tool_use.name === 'Edit') {
        return (
          <EditMessage 
            filePath={message.tool_use.input?.file_path}
            oldString={message.tool_use.input?.old_string}
            newString={message.tool_use.input?.new_string}
            timestamp={message.timestamp}
          />
        )
      }
      // Check if it's a MultiEdit tool
      if (message.tool_use.name === 'MultiEdit') {
        const edits = message.tool_use.input?.edits || []
        // For MultiEdit, show only the file path and number of changes
        return (
          <EditMessage 
            filePath={message.tool_use.input?.file_path}
            editsCount={edits.length}
            timestamp={message.timestamp}
          />
        )
      }
      return (
        <ToolMessage 
          toolUse={message.tool_use} 
          toolResult={message.tool_result}
          isLoading={message.isLoading}
          timestamp={message.timestamp} 
        />
      )
    }
    
    // Tool result message (standalone - should be rare now with combined messages)
    if (message.tool_result && !message.tool_use) {
      return (
        <ToolMessage 
          toolResult={message.tool_result} 
          timestamp={message.timestamp} 
        />
      )
    }
    
    // Context message
    if (message.context) {
      return <ContextMessage context={message.context} timestamp={message.timestamp} />
    }
    
    // Session message
    if (message.session) {
      return <SessionMessage session={message.session} timestamp={message.timestamp} />
    }
    
    return null
  }
  
  const content = renderMessage()
  if (!content) {
    return null
  }
  
  return (
    <Animated.View 
      style={{
        opacity: fadeAnim, 
        transform: [{ translateY: slideAnim }]
      }}
    >
      {content}
    </Animated.View>
  )
}

// Memoized component to prevent unnecessary re-renders
export const ClaudeMessage = React.memo(ClaudeMessageComponent, (prevProps, nextProps) => {
  return (
    prevProps.message === nextProps.message &&
    prevProps.fadeAnim === nextProps.fadeAnim &&
    prevProps.slideAnim === nextProps.slideAnim
  )
})