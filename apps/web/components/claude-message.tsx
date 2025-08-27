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
  human?: string
  assistant?: string
  system?: string
  tool_use?: {
    name: string
    input?: any
  }
  tool_result?: {
    content?: string
    error?: string
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
}

interface ClaudeMessageProps {
  message: ClaudeMessage
  fadeAnim: Animated.Value
  slideAnim: Animated.Value
}

export function ClaudeMessage({ message, fadeAnim, slideAnim }: ClaudeMessageProps) {
  const renderMessage = () => {
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
      return <ToolMessage toolUse={message.tool_use} timestamp={message.timestamp} />
    }
    
    // Tool result message
    if (message.tool_result) {
      // Show tool results in terminal style
      return <ToolMessage toolResult={message.tool_result} timestamp={message.timestamp} />
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
  if (!content) return null
  
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