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
    console.log('🔗 Connecting to:', serverUrl)
    const newSocket = io(serverUrl, {
      transports: ['websocket', 'polling'],
      timeout: 20000,
    })
    
    setSocket(newSocket)

    newSocket.on('connect', () => {
      console.log('✅ Connected')
      setIsConnected(true)
    })

    newSocket.on('disconnect', () => {
      console.log('❌ Disconnected')
      setIsConnected(false)
    })

    newSocket.on('claude_status', (status: any) => {
      console.log('📊 Status:', status)
      const cleanStatus = {
        isRunning: Boolean(status?.isRunning),
        pid: status?.pid || null,
        currentSessionId: status?.currentSessionId || null
      }
      setClaudeStatus(cleanStatus)
    })

    newSocket.on('claude_output', (message: any) => {
      console.log('📨 Output received')
      if (message?.content) {
        setMessages(prev => [...prev, {
          content: String(message.content),
          timestamp: Date.now()
        }])
      }
    })

    return () => {
      console.log('🧹 Cleaning up socket')
      newSocket.close()
    }
  }, [])

  const sendMessage = (message: string) => {
    if (socket && socket.connected) {
      console.log('📤 Sending:', message)
      socket.emit('claude_message', { message: String(message) })
    }
  }

  const startClaude = () => {
    if (socket && socket.connected) {
      console.log('🚀 Starting Claude')
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