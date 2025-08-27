import type { ClaudeMessage } from '../types/project.types'
import type { MessageContent, HistoryItem } from '../types/message.types'

export function ensureString(content: unknown): string {
  return typeof content === 'string' ? content : JSON.stringify(content)
}

export function extractTextContent(content: string | MessageContent[]): string {
  if (!content) return ''
  
  if (typeof content === 'string') {
    return content
  }
  
  if (Array.isArray(content)) {
    const textContent = content.find(c => c.type === 'text')
    if (textContent) {
      return textContent.text || textContent.content || ''
    }
    
    return content.map(c => 
      typeof c === 'string' ? c : (c.text || c.content || '')
    ).join('')
  }
  
  return ''
}

export function extractToolUse(content: string | MessageContent[]): MessageContent | null {
  if (!Array.isArray(content)) return null
  return content.find(c => c.type === 'tool_use') || null
}

export function extractToolResult(content: string | MessageContent[]): MessageContent | null {
  if (!Array.isArray(content)) return null
  return content.find(c => c.type === 'tool_result') || null
}

export function createTimestamp(timestamp?: string | number): number {
  if (timestamp) {
    return typeof timestamp === 'number' ? timestamp : new Date(timestamp).getTime()
  }
  return Date.now()
}

export function transformHistoryItem(item: HistoryItem): ClaudeMessage | null {
  const { type, message, timestamp } = item
  
  if (type === 'user' && message) {
    const toolResult = extractToolResult(message.content)
    if (toolResult) {
      return {
        tool_result: {
          content: ensureString(toolResult.content),
          error: toolResult.error,
          tool_use_id: toolResult.tool_use_id || ''
        },
        timestamp: createTimestamp(timestamp)
      }
    }
    
    const content = extractTextContent(message.content)
    if (content) {
      return {
        human: content,
        timestamp: createTimestamp(timestamp)
      }
    }
  }
  
  if (type === 'assistant' && message) {
    const toolUse = extractToolUse(message.content)
    if (toolUse) {
      return {
        tool_use: {
          name: toolUse.name || '',
          input: toolUse.input || {},
          id: toolUse.id || ''
        },
        timestamp: createTimestamp(timestamp)
      }
    }
    
    const content = extractTextContent(message.content)
    if (content) {
      return {
        assistant: content,
        timestamp: createTimestamp(timestamp)
      }
    }
  }
  
  if (type === 'system' && message) {
    return {
      system: typeof message.content === 'string' ? message.content : '',
      timestamp: createTimestamp(timestamp)
    }
  }
  
  return null
}