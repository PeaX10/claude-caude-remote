import { useEffect, useState } from 'react'
import { io, Socket } from 'socket.io-client'

interface ClaudeMessage {
  type: 'output' | 'error' | 'command' | 'status'
  content: string
  timestamp: number
  contextPercent?: number
}

interface ClaudeStatus {
  isRunning: boolean
  pid: number | null
}

export function useWebSocket(serverUrl: string = 'http://127.0.0.1:9876') {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [claudeStatus, setClaudeStatus] = useState<ClaudeStatus>({ isRunning: false, pid: null })
  const [messages, setMessages] = useState<ClaudeMessage[]>([])
  const [contextPercent, setContextPercent] = useState<number | null>(null)

  useEffect(() => {
    console.log('🔗 Attempting to connect to:', serverUrl)
    const newSocket = io(serverUrl, {
      transports: ['websocket', 'polling'],
      timeout: 20000,
    })
    setSocket(newSocket)

    newSocket.on('connect', () => {
      console.log('✅ Connected to server:', serverUrl)
      setIsConnected(true)
    })

    newSocket.on('disconnect', () => {
      console.log('❌ Disconnected from server')
      setIsConnected(false)
    })

    newSocket.on('connect_error', (error) => {
      console.error('🚫 Connection error:', error.message)
    })

    newSocket.on('claude_status', (status: ClaudeStatus) => {
      console.log('📊 Claude status received:', status)
      setClaudeStatus(status)
    })

    newSocket.on('claude_output', (message: ClaudeMessage) => {
      setMessages(prev => [...prev, message])
      if (message.contextPercent !== undefined) {
        setContextPercent(message.contextPercent)
      }
    })

    newSocket.on('claude_error', (message: ClaudeMessage) => {
      setMessages(prev => [...prev, message])
    })

    newSocket.on('claude_status_update', (update: any) => {
      setClaudeStatus(update.status)
      setMessages(prev => [...prev, {
        type: 'status',
        content: update.content,
        timestamp: update.timestamp
      }])
    })

    newSocket.on('claude_start_result', (result: { success: boolean, status: ClaudeStatus }) => {
      console.log('🚀 Claude start result:', result)
      setClaudeStatus(result.status)
      // Don't add a "started successfully" message - we'll get the conversation history instead
    })

    return () => {
      newSocket.close()
    }
  }, [serverUrl])

  const startClaude = (projectPath?: string) => {
    socket?.emit('claude_start', { projectPath })
  }

  const getFullOutput = () => {
    socket?.emit('claude_full_output')
  }

  const sendMessage = (message: string) => {
    if (socket && socket.connected) {
      socket.emit('claude_message', { message })
    }
  }

  const loadFiles = (path: string) => {
    socket?.emit('file_list', { path })
  }

  const readFile = (path: string) => {
    socket?.emit('file_read', { path })
  }

  const runGitCommand = (command: string) => {
    socket?.emit('git_command', { command })
  }

  return {
    isConnected,
    claudeStatus,
    messages,
    contextPercent,
    startClaude,
    sendMessage,
    getFullOutput,
    loadFiles,
    readFile,
    runGitCommand
  }
}