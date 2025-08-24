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
  addMessage: (_message: Omit<Message, 'id'>) => void
  setConnected: (_connected: boolean) => void
  setClaudeRunning: (_running: boolean) => void
  setCurrentModel: (_model: string) => void
  clearMessages: () => void
}

export const useStore = create<AppState>((set) => ({
  messages: [],
  isConnected: false,
  isClaudeRunning: false,
  currentModel: 'sonnet',
  addMessage: (_message) => set((state) => ({
    messages: [...state.messages, {
      ..._message,
      id: Date.now().toString()
    }]
  })),
  setConnected: (_connected) => set({ isConnected: _connected }),
  setClaudeRunning: (_running) => set({ isClaudeRunning: _running }),
  setCurrentModel: (_model) => set({ currentModel: _model }),
  clearMessages: () => set({ messages: [] })
}))