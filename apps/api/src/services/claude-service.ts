import { EventEmitter } from "events";
import { spawn, ChildProcess } from "child_process";
import { promisify } from "util";
import { exec } from "child_process";
import { randomUUID } from "crypto";
import { readdir, readFile, stat, watch } from "fs/promises";
import { FSWatcher } from "fs";
import { join } from "path";
import { homedir } from "os";
import { decodeProjectPath } from '../utils/path-decoder';

const execAsync = promisify(exec);

interface ClaudeMessage {
  type: "system" | "assistant" | "user" | "error" | "status";
  subtype?: string;
  message?: any;
  content?: string;
  timestamp: number;
  session_id?: string;
  tools?: string[];
  model?: string;
  uuid?: string;
  parent_tool_use_id?: string | null;
}

interface ClaudeSession {
  id: string;
  created_at: number;
  last_used: number;
  cwd: string;
}

interface ProcessedContent {
  content: string;
  contextPercent: number | null;
}

export class ClaudeService extends EventEmitter {
  private currentSession: ClaudeSession | null = null;
  private activeProcess: ChildProcess | null = null;
  private sessions: Map<string, ClaudeSession> = new Map();
  private isProcessing = false;
  private messageBuffer = "";
  private sessionWatchers: Map<string, FSWatcher> = new Map();
  private lastFileSizes: Map<string, number> = new Map();

  constructor() {
    super();
  }

  async start(projectPath: string = process.cwd()): Promise<boolean> {
    try {
      const sessionId = await this.startSession({ projectPath });
      return !!sessionId;
    } catch (error) {
      this.logError("Failed to start", error);
      return false;
    }
  }

  async startSession(options: {
    sessionId?: string;
    projectPath?: string;
  } = {}): Promise<string> {
    const { sessionId, projectPath = process.cwd() } = options;

    try {
      const session = this.createOrResumeSession(sessionId, projectPath);
      this.currentSession = session;
      
      this.emitSessionEvent(session);
      return session.id;
    } catch (error) {
      this.logError("Failed to start session", error);
      throw error;
    }
  }

  private createOrResumeSession(sessionId?: string, projectPath?: string): ClaudeSession {
    if (sessionId && this.sessions.has(sessionId)) {
      const session = this.sessions.get(sessionId)!;
      session.last_used = Date.now();
      return session;
    }

    const session = {
      id: sessionId || randomUUID(),
      created_at: Date.now(),
      last_used: Date.now(),
      cwd: projectPath || process.cwd(),
    };
    
    this.sessions.set(session.id, session);
    return session;
  }

  private emitSessionEvent(session: ClaudeSession): void {
    this.emit("session", {
      type: "system",
      subtype: "session_start",
      session_id: session.id,
      timestamp: Date.now(),
    } as ClaudeMessage);
  }

  async sendMessage(message: string): Promise<boolean> {
    if (!this.currentSession) {
      await this.startSession();
    }

    if (this.isProcessing) {
      return false;
    }

    this.isProcessing = true;
    this.messageBuffer = "";

    try {
      const process = this.spawnClaudeProcess(message);
      this.setupProcessHandlers(process);
      return true;
    } catch (error: any) {
      this.logError("Failed to send message", error);
      this.isProcessing = false;
      return false;
    }
  }

  private spawnClaudeProcess(message: string): ChildProcess {
    const args = this.buildClaudeArgs(message);
    
    return spawn("claude", args, {
      cwd: this.currentSession?.cwd || process.cwd(),
      env: { ...process.env },
      shell: false,
    });
  }

  private buildClaudeArgs(message: string): string[] {
    const args = [
      "--print",
      "--verbose", 
      "--output-format", "stream-json",
    ];

    if (this.currentSession) {
      args.push("--cwd", this.currentSession.cwd);
    }

    args.push(message);
    return args;
  }

  private setupProcessHandlers(process: ChildProcess): void {
    this.activeProcess = process;

    process.stdout?.on("data", (data: Buffer) => {
      this.handleStdoutData(data.toString());
    });

    process.stderr?.on("data", (data: Buffer) => {
      this.handleStderrData(data.toString());
    });

    process.on("exit", (code, signal) => {
      this.handleProcessExit(code, signal);
    });

    process.on("error", (error) => {
      this.handleProcessError(error);
    });
  }

  private handleStdoutData(chunk: string): void {
    this.messageBuffer += chunk;
    
    const lines = this.messageBuffer.split("\n");
    this.messageBuffer = lines.pop() || "";
    
    for (const line of lines) {
      if (line.trim()) {
        this.processJsonLine(line);
      }
    }
  }

  private handleStderrData(error: string): void {
    this.emit("error", {
      type: "error",
      content: error,
      timestamp: Date.now(),
      session_id: this.currentSession?.id,
    } as ClaudeMessage);
  }

  private handleProcessExit(code: number | null, signal: NodeJS.Signals | null): void {
    if (this.messageBuffer.trim()) {
      this.processJsonLine(this.messageBuffer);
    }
    
    this.resetProcessState();
    
    this.emit("status", {
      type: "status",
      content: `completed`,
      timestamp: Date.now(),
      session_id: this.currentSession?.id,
    } as ClaudeMessage);
  }

  private handleProcessError(error: Error): void {
    this.logError("Process error", error);
    this.resetProcessState();
    
    this.emit("error", {
      type: "error",
      content: error.message,
      timestamp: Date.now(),
      session_id: this.currentSession?.id,
    } as ClaudeMessage);
  }

  private resetProcessState(): void {
    this.isProcessing = false;
    this.activeProcess = null;
  }

  private processJsonLine(line: string): void {
    try {
      const data = JSON.parse(line);
      
      this.updateSessionFromData(data);
      
      const message: ClaudeMessage = {
        ...data,
        timestamp: Date.now(),
      };
      
      this.handleMessageByType(data, message);
      this.emit("raw", data);

    } catch (error) {
      this.handleParseError(line);
    }
  }

  private updateSessionFromData(data: any): void {
    if (data.session_id && this.currentSession) {
      this.currentSession.id = data.session_id;
      this.sessions.set(data.session_id, this.currentSession);
    }
  }

  private handleMessageByType(data: any, message: ClaudeMessage): void {
    switch (data.type) {
      case "system":
        this.handleSystemMessage(data, message);
        break;
      case "assistant":
        this.handleAssistantMessage(data, message);
        break;
      case "user":
        this.handleUserMessage(data, message);
        break;
      default:
        this.emit("message", message);
    }
  }

  private handleSystemMessage(data: any, message: ClaudeMessage): void {
    this.emit("system", message);
    if (data.subtype === "init") {
      this.emit("context", {
        tools: data.tools,
        model: data.model,
        session_id: data.session_id,
      });
    }
  }

  private handleAssistantMessage(data: any, message: ClaudeMessage): void {
    this.emit("assistant", message);
    
    if (data.message?.content?.[0]?.type === "text") {
      this.emit("output", {
        type: "assistant",
        content: data.message.content[0].text,
        timestamp: Date.now(),
        session_id: data.session_id,
      });
    }
    
    if (data.message?.content?.[0]?.type === "tool_use") {
      this.emit("tool_use", {
        tool: data.message.content[0].name,
        input: data.message.content[0].input,
        id: data.message.content[0].id,
        session_id: data.session_id,
      });
    }
  }

  private handleUserMessage(data: any, message: ClaudeMessage): void {
    this.emit("user", message);
    if (data.message?.content?.[0]?.type === "tool_result") {
      this.emit("tool_result", {
        tool_use_id: data.message.content[0].tool_use_id,
        content: data.message.content[0].content,
        session_id: data.session_id,
      });
    }
  }

  private handleParseError(line: string): void {
    this.emit("output", {
      type: "assistant",
      content: line,
      timestamp: Date.now(),
      session_id: this.currentSession?.id,
    } as ClaudeMessage);
  }

  async interrupt(): Promise<boolean> {
    if (!this.activeProcess) {
      return false;
    }

    try {
      this.activeProcess.kill("SIGINT");
      return true;
    } catch (error) {
      this.logError("Failed to interrupt", error);
      return false;
    }
  }

  async stop(): Promise<boolean> {
    if (this.activeProcess) {
      this.activeProcess.kill();
      this.activeProcess = null;
    }
    this.isProcessing = false;
    this.messageBuffer = "";
    return true;
  }

  async getProjects(): Promise<{name: string, path: string, sessions: number}[]> {
    try {
      const claudeDir = join(homedir(), '.claude', 'projects');
      const projects = await readdir(claudeDir);
      
      const projectList = [];
      for (const project of projects) {
        const projectPath = join(claudeDir, project);
        const stats = await stat(projectPath);
        
        if (stats.isDirectory()) {
          const files = await readdir(projectPath);
          const sessionCount = files.filter(f => f.endsWith('.jsonl')).length;
          const realPath = decodeProjectPath(project);
          
          if (realPath) {
            const pathParts = realPath.split('/');
            const name = pathParts[pathParts.length - 1] || project;
            
            projectList.push({
              name: name,
              path: realPath,
              encodedPath: project,
              sessions: sessionCount
            });
          }
        }
      }
      
      return projectList;
    } catch (error) {
      this.logError('Error reading projects', error);
      return [];
    }
  }

  async getProjectSessions(projectPath: string): Promise<ClaudeSession[]> {
    const sessions: ClaudeSession[] = [];
    
    try {
      const projectDirName = projectPath.replace(/\//g, '-');
      const claudeProjectDir = join(homedir(), '.claude', 'projects', projectDirName);
      
      const files = await readdir(claudeProjectDir);
      const jsonlFiles = files.filter(f => f.endsWith('.jsonl'));
      
      for (const file of jsonlFiles) {
        const sessionId = file.replace('.jsonl', '');
        const filePath = join(claudeProjectDir, file);
        const stats = await stat(filePath);
        
        const content = await readFile(filePath, 'utf-8');
        const firstLine = content.split('\n')[0];
        let title = sessionId.slice(0, 8);
        
        try {
          const firstMessage = JSON.parse(firstLine);
          if (firstMessage.human) {
            title = firstMessage.human.slice(0, 50);
          }
        } catch {}
        
        sessions.push({
          id: sessionId,
          created_at: stats.birthtime.getTime(),
          last_used: stats.mtime.getTime(),
          cwd: projectPath,
          title
        } as any);
      }
    } catch (error) {
      this.logError('Error reading project sessions', error);
    }
    
    return sessions.sort((a, b) => b.last_used - a.last_used);
  }

  async getSessions(): Promise<ClaudeSession[]> {
    const sessions: ClaudeSession[] = [];
    
    try {
      const projectPath = this.currentSession?.cwd || process.cwd();
      const projectDirName = projectPath.replace(/\//g, '-');
      const claudeProjectDir = join(homedir(), '.claude', 'projects', projectDirName);
      
      try {
        await stat(claudeProjectDir);
      } catch {
        return sessions;
      }
      
      const files = await readdir(claudeProjectDir);
      const jsonlFiles = files.filter(f => f.endsWith('.jsonl'));
      
      for (const file of jsonlFiles) {
        const sessionId = file.replace('.jsonl', '');
        const filePath = join(claudeProjectDir, file);
        const stats = await stat(filePath);
        
        const session = {
          id: sessionId,
          created_at: stats.birthtime.getTime(),
          last_used: stats.mtime.getTime(),
          cwd: projectPath
        };
        
        sessions.push(session);
        this.sessions.set(sessionId, session);
      }
    } catch (error) {
      this.logError("Error reading sessions", error);
    }
    
    return sessions.sort((a, b) => b.last_used - a.last_used);
  }

  async getSessionHistory(sessionId: string, projectPath?: string): Promise<any[]> {
    try {
      const path = projectPath || this.currentSession?.cwd || process.cwd();
      const projectDirName = path.replace(/\//g, '-');
      const sessionFile = join(homedir(), '.claude', 'projects', projectDirName, `${sessionId}.jsonl`);
      
      const content = await readFile(sessionFile, 'utf-8');
      const lines = content.split('\n').filter(line => line.trim());
      
      const messages = lines.map(line => {
        try {
          return JSON.parse(line);
        } catch (e) {
          return null;
        }
      }).filter(msg => msg !== null);
      
      return messages;
    } catch (error) {
      this.logError('Error reading session history', error);
      return [];
    }
  }

  async watchSessionFile(sessionId: string, projectPath: string): Promise<void> {
    try {
      const projectDirName = projectPath.replace(/\//g, '-');
      const sessionFile = join(homedir(), '.claude', 'projects', projectDirName, `${sessionId}.jsonl`);
      const watchKey = `${sessionId}-${projectPath}`;
      
      this.stopWatchingSession(sessionId, projectPath);
      
      try {
        const initialStats = await stat(sessionFile);
        this.lastFileSizes.set(watchKey, initialStats.size);
      } catch (e) {
        this.lastFileSizes.set(watchKey, 0);
      }
      
      const fs = require('fs');
      const watcher = fs.watch(sessionFile, { persistent: false }, async (eventType: string) => {
        if (eventType === 'change') {
          await this.handleFileChange(sessionFile, watchKey, sessionId, projectPath);
        }
      });
      
      this.sessionWatchers.set(watchKey, watcher);
      
    } catch (error) {
      this.logError('Error setting up session file watcher', error);
    }
  }

  private async handleFileChange(sessionFile: string, watchKey: string, sessionId: string, projectPath: string): Promise<void> {
    try {
      const stats = await stat(sessionFile);
      const lastSize = this.lastFileSizes.get(watchKey) || 0;
      
      if (stats.size > lastSize) {
        this.lastFileSizes.set(watchKey, stats.size);
        
        const newMessages = await this.getNewMessages(sessionFile, lastSize);
        if (newMessages.length > 0) {
          this.emit('session_updated', { sessionId, projectPath, newMessages });
        }
      }
    } catch (error) {
      this.logError('Error processing session file change', error);
    }
  }

  private async getNewMessages(sessionFile: string, fromByte: number): Promise<any[]> {
    try {
      const fs = require('fs');
      const buffer = Buffer.alloc(1024 * 1024);
      const fileHandle = await fs.promises.open(sessionFile, 'r');
      
      const { bytesRead } = await fileHandle.read(buffer, 0, buffer.length, fromByte);
      await fileHandle.close();
      
      if (bytesRead === 0) return [];
      
      const newContent = buffer.subarray(0, bytesRead).toString('utf-8');
      const lines = newContent.split('\n').filter(line => line.trim());
      
      return lines.map(line => {
        try {
          return JSON.parse(line);
        } catch (e) {
          return null;
        }
      }).filter(msg => msg !== null);
      
    } catch (error) {
      this.logError('Error reading new messages', error);
      return [];
    }
  }

  stopWatchingSession(sessionId: string, projectPath: string): void {
    const watchKey = `${sessionId}-${projectPath}`;
    const watcher = this.sessionWatchers.get(watchKey);
    
    if (watcher) {
      watcher.close();
      this.sessionWatchers.delete(watchKey);
      this.lastFileSizes.delete(watchKey);
    }
  }

  stopAllWatchers(): void {
    this.sessionWatchers.forEach((watcher) => {
      watcher.close();
    });
    this.sessionWatchers.clear();
    this.lastFileSizes.clear();
  }

  async getAvailableCommands(): Promise<string[]> {
    try {
      const result = await execAsync("claude --help | grep -E '^  /' | awk '{print $1}'");
      const commands = result.stdout.split("\n").filter(cmd => cmd.startsWith("/"));
      
      if (commands.length > 0) {
        return commands;
      }
    } catch {}
    
    return [
      "/help", "/exit", "/clear", "/save", "/load",
      "/undo", "/redo", "/context", "/tools", "/model",
      "/ui", "/21", "/ide", "/resume", "/compact",
      "/status", "/permissions", "/hooks"
    ];
  }

  getStatus() {
    return {
      isRunning: this.isProcessing,
      pid: this.activeProcess?.pid || null,
      currentSessionId: this.currentSession?.id || null,
    };
  }

  async getOutput(): Promise<string> {
    return "";
  }

  public processRawOutput(content: string): ProcessedContent {
    return { content, contextPercent: null };
  }

  filterClaudeOutput(content: string): ProcessedContent {
    return { content, contextPercent: null };
  }

  private logError(message: string, error: any): void {
    // Only log errors in development, or provide a way to configure this
    if (process.env.NODE_ENV === 'development') {
      console.error(`❌ ${message}:`, error);
    }
  }
}