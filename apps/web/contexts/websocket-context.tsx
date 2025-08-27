import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { io, Socket } from 'socket.io-client'

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
  sendMessage: (message: string) => void
  startClaude: () => void
  loadFiles: (path: string) => void
  readFile: (path: string) => void
  runGitCommand: (command: string) => void
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

  useEffect(() => {
    const serverUrl = 'http://127.0.0.1:9876'
    const newSocket = io(serverUrl, {
      transports: ['websocket', 'polling'],
      timeout: 20000,
    })
    
    setSocket(newSocket)

    newSocket.on('connect', () => {
      setIsConnected(true)
    })

    newSocket.on('disconnect', () => {
      setIsConnected(false)
    })

    newSocket.on('claude_status', (status: any) => {
      const cleanStatus = {
        isRunning: Boolean(status?.isRunning),
        pid: status?.pid || null,
        currentSessionId: status?.currentSessionId || null
      }
      setClaudeStatus(cleanStatus)
    })

    newSocket.on('claude_output', (message: any) => {
      if (message?.content) {
        setMessages(prev => [...prev, {
          assistant: String(message.content),
          timestamp: Date.now()
        }])
      }
    })
    
    newSocket.on('claude_session_history', (data: any) => {
      if (data?.history) {
        // Transform Claude's session format to our message format
        const validMessages = data.history.map((item: any) => {
          // Handle different message formats from Claude sessions
          if (item.type === 'user' && item.message) {
            // User messages can have content as string or array (for tool results)
            let content = '';
            if (typeof item.message.content === 'string') {
              content = item.message.content;
            } else if (Array.isArray(item.message.content)) {
              // Handle tool result messages
              const toolResult = item.message.content.find((c: any) => c.type === 'tool_result');
              if (toolResult) {
                // Return as tool result message
                return {
                  tool_result: {
                    content: typeof toolResult.content === 'string' ? toolResult.content : JSON.stringify(toolResult.content),
                    error: toolResult.error
                  },
                  timestamp: item.timestamp ? new Date(item.timestamp).getTime() : Date.now()
                };
              }
              // Otherwise try to extract any text content
              content = item.message.content.map((c: any) => 
                typeof c === 'string' ? c : (c.content || '')
              ).join(' ');
            }
            
            if (content) {
              return {
                human: content,
                timestamp: item.timestamp ? new Date(item.timestamp).getTime() : Date.now()
              };
            }
            return null;
          } else if (item.type === 'assistant' && item.message) {
            // Extract text content from assistant messages
            let content = '';
            if (item.message.content && Array.isArray(item.message.content)) {
              const textContent = item.message.content.find((c: any) => c.type === 'text');
              content = textContent?.text || '';
              
              // Also check for tool use
              const toolUse = item.message.content.find((c: any) => c.type === 'tool_use');
              if (toolUse) {
                return {
                  tool_use: {
                    name: toolUse.name,
                    input: toolUse.input
                  },
                  timestamp: item.timestamp ? new Date(item.timestamp).getTime() : Date.now()
                };
              }
            } else if (typeof item.message.content === 'string') {
              content = item.message.content;
            }
            
            if (content) {
              return {
                assistant: content,
                timestamp: item.timestamp ? new Date(item.timestamp).getTime() : Date.now()
              };
            }
          } else if (item.type === 'system' && item.message) {
            return {
              system: item.message.content || '',
              timestamp: item.timestamp ? new Date(item.timestamp).getTime() : Date.now()
            };
          }
          
          // Handle old format (direct properties)
          if (item.human || item.assistant || item.system) {
            return item;
          }
          
          return null;
        }).filter((msg: any) => msg !== null);
        
        console.log(`Loading ${validMessages.length} messages from session history`);
        setMessages(validMessages);
      }
    })

    return () => {
      newSocket.close()
    }
  }, [])

  const sendMessage = (message: string) => {
    if (socket && socket.connected) {
      // Add user message to the list
      setMessages(prev => [...prev, {
        human: String(message),
        timestamp: Date.now()
      }])
      socket.emit('claude_message', { message: String(message) })
    }
  }

  const startClaude = () => {
    if (socket && socket.connected) {
      socket.emit('claude_start', {})
    }
  }

  const loadFiles = (path: string) => {
    if (socket && socket.connected) {
      socket.emit('file_list', { path })
    }
  }

  const readFile = (path: string) => {
    if (socket && socket.connected) {
      socket.emit('file_read', { path })
    }
  }

  const runGitCommand = (command: string) => {
    if (socket && socket.connected) {
      socket.emit('git_command', { command })
    }
  }

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
      runGitCommand
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