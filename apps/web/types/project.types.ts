export interface ProjectStats {
  filesChanged: number
  linesAdded: number
  linesDeleted: number
  commitsBehind: number
}

export interface SessionTab {
  id: string
  sessionId: string
  title: string
  lastMessage?: string
  messages?: ClaudeMessage[]
  lastReadTimestamp?: number
  unreadCount?: number
  scrollPosition?: number
  lastMessageCount?: number
  createdAt: Date
  updatedAt: Date
}

export interface Project {
  id: string
  name: string
  path: string
  tabs: SessionTab[]
  activeTabId?: string
  stats?: ProjectStats
  baseBranch?: string
  lastAccessedAt: Date
}

export interface Session {
  id: string
  projectId: string
  title: string
  lastMessage?: string
  createdAt: Date
  updatedAt: Date
}

export interface AvailableSession {
  id: string
  title?: string
  created_at: number
  last_used: number
  cwd: string
}

export interface ClaudeMessage {
  human?: string
  assistant?: string
  system?: string
  tool_use?: {
    name: string
    input: Record<string, unknown>
    id: string
  }
  tool_result?: {
    content: string
    tool_use_id: string
    error?: string
  }
  context?: {
    type: string
    content: string
    usage: Record<string, unknown>
  }
  session?: {
    id: string
    created: number
    cwd: string
  }
  timestamp: number
  isLoading?: boolean
}