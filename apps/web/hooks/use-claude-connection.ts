import { useState, useEffect } from 'react'
import { io, Socket } from 'socket.io-client'

interface ClaudeStatus {
  isRunning: boolean
  pid: number | null
}

interface Message {
  id: string
  type: 'user' | 'claude' | 'system'
  content: string
  timestamp: number
}

export function useClaudeConnection() {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [claudeStatus, setClaudeStatus] = useState<ClaudeStatus>({ isRunning: false, pid: null })
  const [contextPercent, setContextPercent] = useState<number | null>(null)

  useEffect(() => {
    const newSocket = io('http://localhost:9876', {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      timeout: 10000,
    })

    newSocket.on('connect', () => {
      console.log('✅ Connected to server')
      setIsConnected(true)
    })

    newSocket.on('disconnect', () => {
      console.log('❌ Disconnected from server')
      setIsConnected(false)
    })

    newSocket.on('claude_status', (status: ClaudeStatus) => {
      console.log('📊 Claude status update:', status)
      setClaudeStatus(status)
    })

    newSocket.on('claude_start_result', (data: { success: boolean, status: ClaudeStatus }) => {
      console.log('🚀 Claude start result:', data)
      setClaudeStatus(data.status)
    })

    newSocket.on('claude_context', (data: { contextPercent: number }) => {
      console.log('📈 Context update:', data.contextPercent + '%')
      setContextPercent(data.contextPercent)
    })

    setSocket(newSocket)

    return () => {
      newSocket.disconnect()
    }
  }, [])

  const startClaude = () => {
    if (socket && !claudeStatus.isRunning) {
      console.log('🚀 Starting Claude Code...')
      socket.emit('claude_start', {})
    }
  }

  const sendMessage = (message: string) => {
    if (socket && isConnected) {
      socket.emit('claude_message', { message })
      return true
    }
    return false
  }

  const refreshHistory = () => {
    if (socket && isConnected && claudeStatus.isRunning) {
      console.log('🔄 Requesting full conversation history')
      socket.emit('claude_full_output')
    }
  }

  return {
    socket,
    isConnected,
    claudeStatus,
    contextPercent,
    startClaude,
    sendMessage,
    refreshHistory
  }
}