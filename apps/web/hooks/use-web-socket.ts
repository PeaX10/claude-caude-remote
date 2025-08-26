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
  const [lastFullContent, setLastFullContent] = useState<string>('')

  const getDiffContent = (newContent: string): string => {
    if (!lastFullContent) {
      return newContent
    }
    
    if (newContent.startsWith(lastFullContent)) {
      const diff = newContent.substring(lastFullContent.length).trim()
      return diff
    }
    
    if (!newContent.includes(lastFullContent.substring(0, 100))) {
      return newContent
    }
    
    const oldParagraphs = lastFullContent.split('\n\n')
    const newParagraphs = newContent.split('\n\n')
    
    let diffIndex = oldParagraphs.length
    for (let i = 0; i < Math.min(oldParagraphs.length, newParagraphs.length); i++) {
      if (oldParagraphs[i] !== newParagraphs[i]) {
        diffIndex = i
        break
      }
    }
    
    return newParagraphs.slice(diffIndex).join('\n\n').trim()
  }

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
      
      setTimeout(() => {
        newSocket.emit('claude_full_output')
      }, 1000)
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
      
      if (!status.isRunning) {
        console.log('🚀 Auto-starting Claude Code...')
        setTimeout(() => {
          newSocket.emit('claude_start', {})
        }, 1000)
      }
    })

    newSocket.on('claude_output', (message: ClaudeMessage) => {
      console.log('📨 Received full content, calculating diff...')
      
      const diffContent = getDiffContent(message.content)
      
      if (diffContent) {
        console.log('📨 Adding new content:', diffContent.slice(0, 100) + '...')
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          type: message.type === 'output' ? 'claude' : 'system',
          content: diffContent,
          timestamp: message.timestamp
        }])
      } else {
        console.log('📨 No new content to display')
      }
      
      setLastFullContent(message.content)
      
      if (message.contextPercent !== undefined) {
        setContextPercent(message.contextPercent)
      }
    })

    newSocket.on('claude_error', (message: ClaudeMessage) => {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        type: 'system',
        content: message.content,
        timestamp: message.timestamp
      }])
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
    })

    newSocket.on('claude_context', (data: { contextPercent: number, timestamp: number }) => {
      console.log('📊 Context update:', data.contextPercent + '%')
      setContextPercent(data.contextPercent)
    })

    return () => {
      newSocket.close()
    }
  }, [serverUrl])

  const startClaude = (projectPath?: string) => {
    setLastFullContent('')
    setMessages([])
    socket?.emit('claude_start', { projectPath })
  }

  const getFullOutput = () => {
    setLastFullContent('')
    setMessages([])
    socket?.emit('claude_full_output')
  }

  const sendMessage = (message: string) => {
    if (socket && socket.connected) {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        type: 'user',
        content: message,
        timestamp: Date.now()
      }])
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