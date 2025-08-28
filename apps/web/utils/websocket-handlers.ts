import type { ClaudeMessage } from '../types/project.types'
import type { RealtimeMessage, MessageContent } from '../types/message.types'
import { ensureString } from './message-utils'
import { ToolInput } from '../types/tool.types'
import { ContextMessageData } from '../types/websocket.types'

export function createToolUseMessage(data: { id: string; tool: string; input: ToolInput }): ClaudeMessage {
  return {
    tool_use: {
      name: data.tool,
      input: data.input,
      id: data.id
    },
    isLoading: true,
    timestamp: Date.now()
  }
}

export function createToolResultContent(data: { tool_use_id: string; content: string | Record<string, string | number | boolean | null>; error?: string }) {
  return {
    content: ensureString(data.content),
    tool_use_id: data.tool_use_id,
    error: data.error
  }
}

export function createContextMessage(data: ContextMessageData): ClaudeMessage {
  return {
    context: {
      type: 'context',
      content: data.tools ? `Available tools: ${data.tools.join(', ')}` : '',
      usage: data
    },
    timestamp: Date.now()
  }
}

export function createSessionMessage(data: { session_id: string; timestamp: number; cwd: string }): ClaudeMessage {
  return {
    session: {
      id: data.session_id,
      created: data.timestamp,
      cwd: data.cwd
    },
    timestamp: Date.now()
  }
}

export function processRealtimeMessage(item: RealtimeMessage): ClaudeMessage | null {
  if (item.tool_use || (item.type === 'assistant' && item.message?.content)) {
    let toolUse = item.tool_use
    
    if (!toolUse && item.message?.content && Array.isArray(item.message.content)) {
      toolUse = item.message.content.find(c => c.type === 'tool_use')
    }
    
    if (toolUse) {
      return {
        tool_use: {
          name: toolUse.name || '',
          input: toolUse.input || {},
          id: toolUse.id || ''
        },
        isLoading: true,
        timestamp: item.timestamp ? new Date(item.timestamp).getTime() : Date.now()
      }
    }
  }
  
  if (item.tool_result || (item.type === 'user' && item.message?.content)) {
    let toolResult = item.tool_result
    
    if (!toolResult && item.message?.content && Array.isArray(item.message.content)) {
      toolResult = item.message.content.find(c => c.type === 'tool_result')
    }
    
    if (toolResult) {
      return {
        tool_result: {
          content: ensureString(toolResult.content),
          error: toolResult.error,
          tool_use_id: toolResult.tool_use_id || ''
        },
        timestamp: item.timestamp ? new Date(item.timestamp).getTime() : Date.now()
      }
    }
  }
  
  if (item.assistant || (item.role === 'assistant' && item.content) || 
      (item.type === 'assistant' && item.message)) {
    let content = ''
    
    if (item.assistant) {
      content = item.assistant
    } else if (item.content) {
      content = item.content
    } else if (item.message?.content) {
      if (Array.isArray(item.message.content)) {
        const textContent = item.message.content.find(c => c.type === 'text')
        content = textContent?.text || ''
      } else {
        content = item.message.content
      }
    }
    
    if (content) {
      return {
        assistant: ensureString(content),
        timestamp: item.timestamp ? new Date(item.timestamp).getTime() : Date.now()
      }
    }
  }
  
  if (item.human || (item.role === 'user' && item.content) || 
      (item.type === 'user' && item.message)) {
    let content = ''
    
    if (item.human) {
      content = item.human
    } else if (item.content) {
      content = item.content
    } else if (item.message?.content) {
      if (typeof item.message.content === 'string') {
        content = item.message.content
      } else if (Array.isArray(item.message.content)) {
        const textContent = item.message.content.find(c => c.type === 'text')
        content = textContent?.text || textContent?.content || ''
        if (!content) {
          content = item.message.content.map(c => 
            typeof c === 'string' ? c : (c.text || c.content || '')
          ).join('')
        }
      }
    }
    
    if (content) {
      return {
        human: ensureString(content),
        timestamp: item.timestamp ? new Date(item.timestamp).getTime() : Date.now()
      }
    }
  }
  
  return null
}

export function updateToolResultInMessages(
  messages: ClaudeMessage[], 
  toolResults: ClaudeMessage[]
): ClaudeMessage[] {
  let updatedMessages = [...messages]
  
  toolResults.forEach(resultMsg => {
    if (resultMsg?.tool_result) {
      const toolUseId = resultMsg.tool_result.tool_use_id
      const foundIndex = updatedMessages.findIndex(msg => 
        msg.tool_use?.id === toolUseId
      )
      
      if (foundIndex !== -1) {
        updatedMessages[foundIndex] = {
          ...updatedMessages[foundIndex],
          tool_result: resultMsg.tool_result,
          isLoading: false
        }
      } else {
        updatedMessages.push(resultMsg)
      }
    }
  })
  
  return updatedMessages
}