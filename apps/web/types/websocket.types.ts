import type { Socket } from 'socket.io-client'
import type { ToolExecution } from '../hooks/use-tool-tracker'
import type { ClaudeMessage, AvailableSession } from './project.types'

export interface ClaudeStatus {
  isRunning: boolean
  pid: number | null
  currentSessionId: string | null
}

export interface WebSocketContextType {
  socket: Socket | null
  isConnected: boolean
  claudeStatus: ClaudeStatus
  messages: ClaudeMessage[]
  availableSessions: AvailableSession[]
  sendMessage: (message: string) => void
  startClaude: () => void
  loadFiles: (path: string) => void
  readFile: (path: string) => void
  runGitCommand: (command: string) => void
  watchSession: (sessionId: string, projectPath: string) => void
  unwatchSession: (sessionId: string, projectPath: string) => void
  loadSessionHistory: (sessionId: string, projectPath: string) => void
  getAvailableSessions: (projectPath?: string) => void
  totalToolsUsed: number
  runningToolsCount: number
  lastThreeTools: ToolExecution[]
  getNestedTools: (parentId: string) => ToolExecution[]
  getAgentToolIds: (agentId: string) => string[]
  nestedToolsByParent: Record<string, ToolExecution[]>
  activeAgents: ToolExecution[]
  completedAgents: ToolExecution[]
  agentToolCounts: Record<string, number>
  resetToolTracking: () => void
}

export interface ClaudeStatusEvent {
  status: 'active' | 'inactive' | 'error'
  message?: string
}

export interface ClaudeSystemEvent {
  message: string
  timestamp: string
}

export interface ClaudeAssistantEvent {
  sessionId: string
  message: ClaudeMessage
}

export interface ClaudeUserEvent {
  sessionId: string
  message: ClaudeMessage
}

export interface ClaudeSessionEvent {
  sessionId: string
  name: string
  projectPath: string
}

export interface ClaudeOutputEvent {
  type: 'text' | 'code' | 'error'
  content: string
  sessionId?: string
}

export interface ClaudeSessionHistoryEvent {
  sessionId: string
  projectPath: string
  history: Array<{
    message: ClaudeMessage
    timestamp: string
  }>
}

export interface ClaudeSessionUpdatedEvent {
  sessionId: string
  projectPath: string
  newMessages: Array<{
    message: ClaudeMessage
    timestamp: string
  }>
}

export interface ClaudeSessionsEvent {
  projectPath: string
  sessions: AvailableSession[]
}

export interface ClaudeStartResultEvent {
  success: boolean
  sessionId?: string
  error?: string
}

export interface FileListResultEvent {
  success: boolean
  path: string
  items?: Array<{
    name: string
    isDirectory: boolean
    path: string
    size?: number
    modified?: string
  }>
  error?: string
}

export interface ToolUseData {
  id: string
  tool: string
  input: Record<string, string | number | boolean | null | undefined | ToolUseData>
}

export interface ToolResultData {
  tool_use_id: string
  content: string | Record<string, string | number | boolean | null>
  error?: string
}

export interface ContextMessageData {
  tools?: string[]
  contextPercent?: number
  sessionStatus?: string
  [key: string]: string | number | boolean | string[] | undefined
}