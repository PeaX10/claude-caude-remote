import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'
import { useToolTracker, ToolExecution } from '../hooks/use-tool-tracker'

interface ClaudeStatus {
  isRunning: boolean
  pid: number | null
  currentSessionId: string | null
}

interface WebSocketContextType {
  socket: Socket | null
  isConnected: boolean
  claudeStatus: ClaudeStatus
  messages: any[]
  sendMessage: (_message: string) => void
  startClaude: () => void
  loadFiles: (_path: string) => void
  readFile: (_path: string) => void
  runGitCommand: (_command: string) => void
  watchSession: (_sessionId: string, _projectPath: string) => void
  unwatchSession: (_sessionId: string, _projectPath: string) => void
  // Tool tracking
  totalToolsUsed: number
  runningToolsCount: number
  lastThreeTools: ToolExecution[]
  getNestedTools: (parentId: string) => ToolExecution[]
  getAgentToolIds: (agentId: string) => string[]
  nestedToolsByParent: Record<string, ToolExecution[]>
  activeAgents: ToolExecution[]
  completedAgents: ToolExecution[]
  agentToolCounts: Record<string, number>
  resetToolTracking: () => void
}

const WebSocketContext = createContext<WebSocketContextType | null>(null)

export function WebSocketProvider({ children }: { children: ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [claudeStatus, setClaudeStatus] = useState<ClaudeStatus>({ 
    isRunning: false, 
    pid: null,
    currentSessionId: null 
  })
  const [messages, setMessages] = useState<any[]>([])
  
  // Tool tracking
  const {
    startTool,
    completeTool,
    getLastThreeTools,
    getRunningCount,
    getNestedTools,
    getAgentToolIds,
    totalToolsUsed,
    nestedToolsByParent,
    activeAgents,
    completedAgents,
    agentToolCounts,
    reset: resetToolTracking
  } = useToolTracker()

  // Message handlers extracted for better maintainability
  const addMessage = useCallback((message: any) => {
    setMessages(prev => [...prev, { ...message, timestamp: Date.now() }])
  }, [])

  const addSystemMessage = useCallback((content: string) => {
    addMessage({ system: content })
  }, [addMessage])

  const addAssistantMessage = useCallback((content: string) => {
    addMessage({ assistant: content })
  }, [addMessage])

  const addUserMessage = useCallback((content: string) => {
    addMessage({ human: content })
  }, [addMessage])

  const handleToolUse = useCallback((data: any) => {
    startTool(data.id, data.tool, data.input)
    addMessage({
      tool_use: {
        name: data.tool,
        input: data.input,
        id: data.id
      },
      isLoading: true
    })
  }, [startTool, addMessage])

  const handleToolResult = useCallback((data: any) => {
    completeTool(data.tool_use_id, !!data.error, data)
    
    setMessages(prev => {
      const updatedMessages = prev.map((msg) => {
        if (msg.tool_use?.id === data.tool_use_id) {
          return {
            ...msg,
            tool_result: {
              content: typeof data.content === 'string' ? data.content : JSON.stringify(data.content),
              tool_use_id: data.tool_use_id,
              error: data.error
            },
            isLoading: false,
            timestamp: msg.timestamp
          }
        }
        return msg
      })
      
      const foundMatch = updatedMessages.some(msg => msg.tool_use?.id === data.tool_use_id)
      if (!foundMatch) {
        return [...updatedMessages, {
          tool_result: {
            content: typeof data.content === 'string' ? data.content : JSON.stringify(data.content),
            tool_use_id: data.tool_use_id,
            error: data.error
          },
          timestamp: Date.now()
        }]
      }
      
      return updatedMessages
    })
  }, [completeTool])

  const addContextMessage = useCallback((data: any) => {
    addMessage({
      context: {
        type: 'context',
        content: data.tools ? `Available tools: ${data.tools.join(', ')}` : '',
        usage: data
      }
    })
  }, [addMessage])

  const addSessionMessage = useCallback((data: any) => {
    addMessage({
      session: {
        id: data.session_id,
        created: data.timestamp,
        cwd: data.cwd
      }
    })
  }, [addMessage])

  const processHistoryMessages = useCallback((history: any[]) => {
    resetToolTracking()
    
    let currentAgentId: string | null = null
    
    history.forEach((item: any) => {
      if (item.type === 'assistant' && item.message?.content) {
        const toolUse = Array.isArray(item.message.content) ? 
          item.message.content.find((c: any) => c.type === 'tool_use') : null
        
        if (toolUse?.name === 'Task' && toolUse.input?.subagent_type) {
          currentAgentId = toolUse.id
          startTool(toolUse.id, toolUse.name, toolUse.input)
        }
      }
      
      if (item.type === 'user' && item.message?.content && currentAgentId) {
        const toolResult = Array.isArray(item.message.content) ? 
          item.message.content.find((c: any) => c.type === 'tool_result') : null
        
        if (toolResult && item.toolUseResult) {
          const stats = item.toolUseResult
          completeTool(currentAgentId, false, {
            content: toolResult.content,
            totalToolUseCount: stats.totalToolUseCount,
            totalDurationMs: stats.totalDurationMs,
            totalTokens: stats.totalTokens
          })
          currentAgentId = null
        }
      }
    })
    
    return transformHistoryToMessages(history)
  }, [resetToolTracking, startTool, completeTool])

  const transformHistoryToMessages = useCallback((history: any[]) => {
    return history.map((item: any) => {
      if (item.type === 'user' && item.message) {
        let content = ''
        if (typeof item.message.content === 'string') {
          content = item.message.content
        } else if (Array.isArray(item.message.content)) {
          const toolResult = item.message.content.find((c: any) => c.type === 'tool_result')
          if (toolResult) {
            return {
              tool_result: {
                content: typeof toolResult.content === 'string' ? toolResult.content : JSON.stringify(toolResult.content),
                error: toolResult.error,
                tool_use_id: toolResult.tool_use_id
              },
              timestamp: item.timestamp ? new Date(item.timestamp).getTime() : Date.now()
            }
          }
          content = item.message.content.map((c: any) => 
            typeof c === 'string' ? c : (c.content || '')
          ).join(' ')
        }
        
        if (content) {
          return {
            human: content,
            timestamp: item.timestamp ? new Date(item.timestamp).getTime() : Date.now()
          }
        }
        return null
      } else if (item.type === 'assistant' && item.message) {
        let content = ''
        if (item.message.content && Array.isArray(item.message.content)) {
          const textContent = item.message.content.find((c: any) => c.type === 'text')
          content = textContent?.text || ''
          
          const toolUse = item.message.content.find((c: any) => c.type === 'tool_use')
          if (toolUse) {
            return {
              tool_use: {
                name: toolUse.name,
                input: toolUse.input,
                id: toolUse.id
              },
              timestamp: item.timestamp ? new Date(item.timestamp).getTime() : Date.now()
            }
          }
        } else if (typeof item.message.content === 'string') {
          content = item.message.content
        }
        
        if (content) {
          return {
            assistant: content,
            timestamp: item.timestamp ? new Date(item.timestamp).getTime() : Date.now()
          }
        }
      } else if (item.type === 'system' && item.message) {
        return {
          system: item.message.content || '',
          timestamp: item.timestamp ? new Date(item.timestamp).getTime() : Date.now()
        }
      }
      
      if (item.human || item.assistant || item.system) {
        return item
      }
      
      return null
    }).filter((msg: any) => msg !== null)
  }, [])

  const processRealtimeMessages = useCallback((newMessages: any[]) => {
    const validMessages = newMessages.map((item: any) => {
      if (item.tool_use || (item.type === 'assistant' && item.message?.content)) {
        let toolUse = item.tool_use
        
        if (!toolUse && item.message?.content && Array.isArray(item.message.content)) {
          toolUse = item.message.content.find((c: any) => c.type === 'tool_use')
        }
        
        if (toolUse) {
          if (toolUse.name === 'Task' && toolUse.input?.subagent_type) {
            startTool(toolUse.id, toolUse.name, toolUse.input)
          } else {
            startTool(toolUse.id, toolUse.name, toolUse.input)
          }
          
          return {
            tool_use: {
              name: toolUse.name,
              input: toolUse.input,
              id: toolUse.id
            },
            isLoading: true,
            timestamp: item.timestamp ? new Date(item.timestamp).getTime() : Date.now()
          }
        }
      }
      
      if (item.tool_result || (item.type === 'user' && item.message?.content)) {
        let toolResult = item.tool_result
        
        if (!toolResult && item.message?.content && Array.isArray(item.message.content)) {
          toolResult = item.message.content.find((c: any) => c.type === 'tool_result')
        }
        
        if (toolResult) {
          if (toolResult.tool_use_id) {
            completeTool(toolResult.tool_use_id, !!toolResult.error, toolResult)
          }
          
          return {
            tool_result: {
              content: typeof toolResult.content === 'string' ? toolResult.content : JSON.stringify(toolResult.content),
              error: toolResult.error,
              tool_use_id: toolResult.tool_use_id
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
            const textContent = item.message.content.find((c: any) => c.type === 'text')
            content = textContent?.text || ''
          } else {
            content = item.message.content
          }
        }
        
        if (content) {
          return {
            assistant: typeof content === 'string' ? content : JSON.stringify(content),
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
            const textContent = item.message.content.find((c: any) => c.type === 'text')
            content = textContent?.text || textContent?.content || ''
            if (!content) {
              content = item.message.content.map((c: any) => 
                typeof c === 'string' ? c : (c.text || c.content || '')
              ).join('')
            }
          }
        }
        
        if (content) {
          return {
            human: typeof content === 'string' ? content : JSON.stringify(content),
            timestamp: item.timestamp ? new Date(item.timestamp).getTime() : Date.now()
          }
        }
      }
      
      return null
    }).filter((msg: any) => msg !== null)
    
    const toolResults = validMessages.filter(msg => msg && msg.tool_result)
    const otherMessages = validMessages.filter(msg => msg && !msg.tool_result)
    
    setMessages(prev => {
      let updatedMessages = [...prev]
      
      toolResults.forEach(resultMsg => {
        if (resultMsg && resultMsg.tool_result) {
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
      
      if (otherMessages.length > 0) {
        updatedMessages = [...updatedMessages, ...otherMessages]
      }
      
      return updatedMessages
    })
  }, [startTool, completeTool])

  useEffect(() => {
    const serverUrl = 'http://127.0.0.1:9876'
    const newSocket = io(serverUrl, {
      transports: ['websocket', 'polling'],
      timeout: 20000,
    })
    
    setSocket(newSocket)

    newSocket.on('connect', () => setIsConnected(true))
    newSocket.on('disconnect', () => setIsConnected(false))

    newSocket.on('claude_status', (status: any) => {
      setClaudeStatus({
        isRunning: Boolean(status?.isRunning),
        pid: status?.pid || null,
        currentSessionId: status?.currentSessionId || null
      })
    })

    // Real-time streaming event handlers
    newSocket.on('claude_system', (data: any) => {
      addSystemMessage(data.message?.content || data.content || '')
    })
    
    newSocket.on('claude_assistant', (data: any) => {
      if (data.message?.content?.[0]?.type === 'text') {
        addAssistantMessage(data.message.content[0].text)
      }
    })
    
    newSocket.on('claude_user', (data: any) => {
      if (data.message?.content?.[0]?.type === 'text') {
        addUserMessage(data.message.content[0].text)
      }
    })
    
    newSocket.on('claude_tool_use', handleToolUse)
    newSocket.on('claude_tool_result', handleToolResult)
    newSocket.on('claude_context', addContextMessage)
    
    newSocket.on('claude_session', (data: any) => {
      if (data.subtype !== 'session_start') {
        addSessionMessage(data)
      }
    })
    
    newSocket.on('claude_output', (message: any) => {
      if (message?.content) {
        addAssistantMessage(String(message.content))
      }
    })
    
    newSocket.on('claude_session_history', (data: any) => {
      if (data?.history) {
        const validMessages = processHistoryMessages(data.history)
        setMessages(validMessages)
        resetToolTracking()
      }
    })

    newSocket.on('claude_session_updated', (data: any) => {
      if (data?.newMessages && Array.isArray(data.newMessages)) {
        processRealtimeMessages(data.newMessages)
      }
    })

    newSocket.on('claude_session_watch_started', () => {})
    newSocket.on('claude_session_watch_error', () => {})

    newSocket.on('claude_start_result', (data: any) => {
      if (data.status) {
        setClaudeStatus({
          isRunning: Boolean(data.status.isRunning),
          pid: data.status.pid || null,
          currentSessionId: data.status.currentSessionId || data.sessionId || null
        })
      }
      
      if (data.sessionId && data.status?.isRunning) {
        const projectPath = process.env.PWD || '/Users/peax/Projects/claude-code-remote'
        newSocket.emit('claude_watch_session', { 
          sessionId: data.sessionId, 
          projectPath 
        })
      }
    })

    return () => {
      newSocket.close()
    }
  }, [addSystemMessage, addAssistantMessage, addUserMessage, handleToolUse, handleToolResult, 
      addContextMessage, addSessionMessage, processHistoryMessages, processRealtimeMessages, 
      resetToolTracking])

  const sendMessage = useCallback((message: string) => {
    if (socket?.connected) {
      addUserMessage(message)
      socket.emit('claude_message', { message: String(message) })
    }
  }, [socket, addUserMessage])

  const startClaude = useCallback(() => {
    socket?.emit('claude_start', {})
  }, [socket])

  const loadFiles = useCallback((path: string) => {
    socket?.emit('file_list', { path })
  }, [socket])

  const readFile = useCallback((path: string) => {
    socket?.emit('file_read', { path })
  }, [socket])

  const runGitCommand = useCallback((command: string) => {
    socket?.emit('git_command', { command })
  }, [socket])

  const watchSession = useCallback((sessionId: string, projectPath: string) => {
    socket?.emit('claude_watch_session', { sessionId, projectPath })
  }, [socket])

  const unwatchSession = useCallback((sessionId: string, projectPath: string) => {
    socket?.emit('claude_unwatch_session', { sessionId, projectPath })
  }, [socket])

  return (
    <WebSocketContext.Provider value={{
      socket,
      isConnected,
      claudeStatus,
      messages,
      sendMessage,
      startClaude,
      loadFiles,
      readFile,
      runGitCommand,
      watchSession,
      unwatchSession,
      // Tool tracking
      totalToolsUsed,
      runningToolsCount: getRunningCount(),
      lastThreeTools: getLastThreeTools(),
      getNestedTools,
      getAgentToolIds,
      nestedToolsByParent,
      activeAgents,
      completedAgents,
      agentToolCounts,
      resetToolTracking
    }}>
      {children}
    </WebSocketContext.Provider>
  )
}

export function useWebSocket() {
  const context = useContext(WebSocketContext)
  if (!context) {
    throw new Error('useWebSocket must be used within WebSocketProvider')
  }
  return context
}