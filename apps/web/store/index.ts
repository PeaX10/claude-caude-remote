import { create } from 'zustand'

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

export const useStore = create<AppState>((set, get) => ({
  messages: [],
  isConnected: false,
  isClaudeRunning: false,
  currentModel: 'sonnet',
  activeProjectPath: null,
  activeSessionId: null,
  addMessage: (_message) => set((state) => ({
    messages: [...state.messages, {
      ..._message,
      id: Date.now().toString()
    }]
  })),
  setConnected: (_connected) => set({ isConnected: _connected }),
  setClaudeRunning: (_running) => set({ isClaudeRunning: _running }),
  setCurrentModel: (_model) => set({ currentModel: _model }),
  clearMessages: () => set({ messages: [] }),
  setActiveProject: (_projectPath, _sessionId) => set({ 
    activeProjectPath: _projectPath,
    activeSessionId: _sessionId 
  }),
  getActiveProjectRealPath: () => {
    const state = get()
    if (!state.activeProjectPath) return null
    // The project path is already a full path
    return state.activeProjectPath
  }
}))