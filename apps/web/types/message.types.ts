export interface MessageContent {
  type: 'text' | 'tool_use' | 'tool_result'
  text?: string
  content?: string
  name?: string
  input?: Record<string, unknown>
  id?: string
  tool_use_id?: string
  error?: string
}

export interface HistoryItem {
  type: 'user' | 'assistant' | 'system'
  message: {
    content: string | MessageContent[]
  }
  timestamp?: string | number
  toolUseResult?: {
    totalToolUseCount: number
    totalDurationMs: number
    totalTokens: number
  }
}

export interface RealtimeMessage {
  type?: 'user' | 'assistant' | 'system'
  role?: 'user' | 'assistant' | 'system'
  content?: string
  message?: {
    content: string | MessageContent[]
  }
  tool_use?: MessageContent
  tool_result?: MessageContent
  human?: string
  assistant?: string
  system?: string
  timestamp?: string | number
}

export interface SessionData {
  sessionId: string
  newMessages: RealtimeMessage[]
}

export interface SessionResponse {
  sessions: AvailableSession[]
  projectPath?: string
}

export interface AvailableSession {
  id: string
  title?: string
  created_at: number
  last_used: number
  cwd: string
}