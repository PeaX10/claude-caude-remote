import { useEffect, useState } from 'react'
import { io, Socket } from 'socket.io-client'

interface ClaudeStatus {
  isRunning: boolean
  pid: number | null
  currentSessionId: string | null
}

export function useWebSocket(serverUrl: string = 'http://127.0.0.1:9876') {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [claudeStatus, setClaudeStatus] = useState<ClaudeStatus>({ 
    isRunning: false, 
    pid: null,
    currentSessionId: null 
  })
  const [messages, setMessages] = useState<any[]>([])

  useEffect(() => {
    console.log('🔗 Connecting to:', serverUrl)
    const newSocket = io(serverUrl, {
      transports: ['websocket', 'polling'],
      timeout: 20000,
    })
    
    // Store socket in state WITHOUT returning it from hook
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
      // Create a clean copy of status
      const cleanStatus = {
        isRunning: Boolean(status?.isRunning),
        pid: status?.pid || null,
        currentSessionId: status?.currentSessionId || null
      }
      setClaudeStatus(cleanStatus)
    })

    newSocket.on('claude_commands', (commands: string[]) => {
      console.log('📋 Commands:', commands?.length || 0)
      // Don't store commands if they cause issues
    })

    newSocket.on('claude_output', (message: any) => {
      console.log('📨 Output received')
      // Store only the content, not the full message object
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
  }, [serverUrl])

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

  return {
    isConnected,
    claudeStatus,
    messages,
    sendMessage,
    startClaude,
    contextPercent: null,
    getFullOutput: () => {},
    loadFiles: () => {},
    readFile: () => {},
    runGitCommand: () => {},
    socket // Return socket for sidebar
  }
}