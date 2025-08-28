import React from 'react'
import { Storage } from './storage-adapter'

interface Message {
  id: string
  type: 'user' | 'claude' | 'system'
  content: string
  timestamp: number
}

interface AppState {
  messages: Message[]
  isConnected: boolean
  isClaudeRunning: boolean
  currentModel: string
  activeProjectPath: string | null
  activeSessionId: string | null
  addMessage: (_message: Omit<Message, 'id'>) => void
  setConnected: (_connected: boolean) => void
  setClaudeRunning: (_running: boolean) => void
  setCurrentModel: (_model: string) => void
  clearMessages: () => void
  setActiveProject: (_projectPath: string | null, _sessionId: string | null) => void
  getActiveProjectRealPath: () => string | null
}

// Store keys  
const STORE_KEYS = {
  MESSAGES: 'app_messages',
  IS_CONNECTED: 'app_isConnected',
  IS_CLAUDE_RUNNING: 'app_isClaudeRunning',
  CURRENT_MODEL: 'app_currentModel',
  ACTIVE_PROJECT_PATH: 'app_activeProjectPath',
  ACTIVE_SESSION_ID: 'app_activeSessionId'
}

class SecureAppStore {
  private messages: Message[] = []
  private isConnected = false
  private isClaudeRunning = false
  private currentModel = 'sonnet'
  private activeProjectPath: string | null = null
  private activeSessionId: string | null = null
  private listeners: Set<() => void> = new Set()
  private initialized = false

  constructor() {
    this.init()
  }

  private async init() {
    try {
      const messagesData = await Storage.getItem(STORE_KEYS.MESSAGES)
      if (messagesData) {
        this.messages = JSON.parse(messagesData)
      }

      const isConnectedData = await Storage.getItem(STORE_KEYS.IS_CONNECTED)
      if (isConnectedData) {
        this.isConnected = isConnectedData === 'true'
      }

      const isClaudeRunningData = await Storage.getItem(STORE_KEYS.IS_CLAUDE_RUNNING)
      if (isClaudeRunningData) {
        this.isClaudeRunning = isClaudeRunningData === 'true'
      }

      const currentModelData = await Storage.getItem(STORE_KEYS.CURRENT_MODEL)
      if (currentModelData) {
        this.currentModel = currentModelData
      }

      const activeProjectPathData = await Storage.getItem(STORE_KEYS.ACTIVE_PROJECT_PATH)
      if (activeProjectPathData) {
        this.activeProjectPath = activeProjectPathData
      }

      const activeSessionIdData = await Storage.getItem(STORE_KEYS.ACTIVE_SESSION_ID)
      if (activeSessionIdData) {
        this.activeSessionId = activeSessionIdData
      }

      this.initialized = true
      this.notifyListeners()
    } catch (error) {
      console.error('Failed to initialize SecureAppStore:', error)
      this.initialized = true
    }
  }

  private async persist() {
    try {
      await Storage.setItem(STORE_KEYS.MESSAGES, JSON.stringify(this.messages))
      await Storage.setItem(STORE_KEYS.IS_CONNECTED, String(this.isConnected))
      await Storage.setItem(STORE_KEYS.IS_CLAUDE_RUNNING, String(this.isClaudeRunning))
      await Storage.setItem(STORE_KEYS.CURRENT_MODEL, this.currentModel)
      await Storage.setItem(STORE_KEYS.ACTIVE_PROJECT_PATH, this.activeProjectPath || '')
      await Storage.setItem(STORE_KEYS.ACTIVE_SESSION_ID, this.activeSessionId || '')
    } catch (error) {
      console.error('Failed to persist SecureAppStore:', error)
    }
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener())
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  getState(): AppState {
    return {
      messages: this.messages,
      isConnected: this.isConnected,
      isClaudeRunning: this.isClaudeRunning,
      currentModel: this.currentModel,
      activeProjectPath: this.activeProjectPath,
      activeSessionId: this.activeSessionId,
      addMessage: this.addMessage.bind(this),
      setConnected: this.setConnected.bind(this),
      setClaudeRunning: this.setClaudeRunning.bind(this),
      setCurrentModel: this.setCurrentModel.bind(this),
      clearMessages: this.clearMessages.bind(this),
      setActiveProject: this.setActiveProject.bind(this),
      getActiveProjectRealPath: this.getActiveProjectRealPath.bind(this)
    }
  }

  addMessage(_message: Omit<Message, 'id'>) {
    const newMessage: Message = {
      ..._message,
      id: Date.now().toString()
    }
    this.messages = [...this.messages, newMessage]
    this.persist()
    this.notifyListeners()
  }

  setConnected(_connected: boolean) {
    this.isConnected = _connected
    this.persist()
    this.notifyListeners()
  }

  setClaudeRunning(_running: boolean) {
    this.isClaudeRunning = _running
    this.persist()
    this.notifyListeners()
  }

  setCurrentModel(_model: string) {
    this.currentModel = _model
    this.persist()
    this.notifyListeners()
  }

  clearMessages() {
    this.messages = []
    this.persist()
    this.notifyListeners()
  }

  setActiveProject(_projectPath: string | null, _sessionId: string | null) {
    this.activeProjectPath = _projectPath
    this.activeSessionId = _sessionId
    this.persist()
    this.notifyListeners()
  }

  getActiveProjectRealPath(): string | null {
    if (!this.activeProjectPath) return null
    return this.activeProjectPath
  }
}

// Create singleton instance
const storeInstance = new SecureAppStore()

// React hook for using the store
export function useStore() {
  const [state, setState] = React.useState<AppState>(storeInstance.getState())
  
  React.useEffect(() => {
    const unsubscribe = storeInstance.subscribe(() => {
      setState(storeInstance.getState())
    })
    return unsubscribe
  }, [])
  
  return state
}