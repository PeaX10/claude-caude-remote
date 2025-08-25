export interface ClaudeInstance {
  id: string;
  name: string;
  projectPath: string;
  status: 'connected' | 'disconnected' | 'launching';
  stats: {
    messagesCount: number;
    lastActivity: Date;
    tokens?: number;
    changes?: number;
  };
}

export interface Message {
  id: string;
  instanceId: string;
  type: 'user' | 'assistant' | 'tool' | 'system';
  content: string;
  timestamp: Date;
  toolCall?: {
    name: string;
    args: Record<string, unknown>;
    result?: Record<string, unknown>;
  };
}

export interface GitStatus {
  instanceId: string;
  branch: string;
  modified: string[];
  staged: string[];
  untracked: string[];
  ahead?: number;
  behind?: number;
}

export interface ToolCall {
  id: string;
  instanceId: string;
  name: string;
  args: Record<string, unknown>;
  result?: Record<string, unknown>;
  timestamp: Date;
  duration?: number;
}

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  instanceId?: string;
}