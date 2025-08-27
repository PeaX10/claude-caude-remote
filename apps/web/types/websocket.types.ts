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