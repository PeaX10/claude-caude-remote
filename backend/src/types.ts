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

export interface DirectoryItem {
  name: string;
  path: string;
  isGitRepo: boolean;
}

export interface DirectoryResponse {
  currentPath: string;
  canGoUp: boolean;
  parentPath: string | null;
  directories: DirectoryItem[];
}

export interface ExploreDirectoriesData {
  path?: string;
}

export interface InstanceStatusData {
  instanceId: string;
  status: string;
}

export interface ClaudeMessageData {
  instanceId: string;
  content: string;
  type: string;
}

export interface GitStatusData {
  instanceId: string;
  modified?: string[];
  staged?: string[];
  untracked?: string[];
}

export interface CreateInstanceData {
  id: string;
  name: string;
  projectPath: string;
}

export interface DeleteInstanceData {
  id: string;
}

export interface RemoteCommandData {
  instanceId: string;
  command: string;
}