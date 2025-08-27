import { EventEmitter } from "events";
import { spawn, ChildProcess } from "child_process";
import { promisify } from "util";
import { exec } from "child_process";
import { randomUUID } from "crypto";
import { readdir, readFile, stat } from "fs/promises";
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

export class ClaudeService extends EventEmitter {
  private currentSession: ClaudeSession | null = null;
  private activeProcess: ChildProcess | null = null;
  private sessions: Map<string, ClaudeSession> = new Map();
  private isProcessing = false;
  private messageBuffer = "";

  constructor() {
    super();
  }

  async start(projectPath: string = process.cwd()): Promise<boolean> {
    try {
      const sessionId = await this.startSession({ projectPath });
      return !!sessionId;
    } catch (error) {
      console.error("❌ Failed to start:", error);
      return false;
    }
  }

  async startSession(options: {
    sessionId?: string;
    projectPath?: string;
  } = {}): Promise<string> {
    const { sessionId, projectPath = process.cwd() } = options;

    try {
      let session: ClaudeSession;

      if (sessionId && this.sessions.has(sessionId)) {
        session = this.sessions.get(sessionId)!;
        session.last_used = Date.now();
        console.log(`📂 Resuming session: ${sessionId}`);
      } else {
        session = {
          id: sessionId || randomUUID(),
          created_at: Date.now(),
          last_used: Date.now(),
          cwd: projectPath,
        };
        this.sessions.set(session.id, session);
        console.log(`🚀 Created new session: ${session.id}`);
      }

      this.currentSession = session;
      
      this.emit("session", {
        type: "system",
        subtype: "session_start",
        session_id: session.id,
        timestamp: Date.now(),
      } as ClaudeMessage);

      return session.id;
    } catch (error) {
      console.error("❌ Failed to start session:", error);
      throw error;
    }
  }

  async sendMessage(message: string): Promise<boolean> {
    if (!this.currentSession) {
      await this.startSession();
    }

    if (this.isProcessing) {
      console.warn("⚠️ Already processing a message");
      return false;
    }

    this.isProcessing = true;
    this.messageBuffer = "";

    try {
      const args = [
        "--print",
        "--verbose", 
        "--output-format", "stream-json",
      ];

      // Use --cwd to set the working directory
      if (this.currentSession) {
        args.push("--cwd", this.currentSession.cwd);
      }

      args.push(message);

      console.log(`🚀 Executing: claude ${args.slice(0, -1).join(" ")} "..."`);

      this.activeProcess = spawn("claude", args, {
        cwd: this.currentSession?.cwd || process.cwd(),
        env: { ...process.env },
        shell: false,
      });

      this.activeProcess.stdout?.on("data", (data: Buffer) => {
        const chunk = data.toString();
        this.messageBuffer += chunk;
        
        const lines = this.messageBuffer.split("\n");
        this.messageBuffer = lines.pop() || "";
        
        for (const line of lines) {
          if (line.trim()) {
            this.processJsonLine(line);
          }
        }
      });

      this.activeProcess.stderr?.on("data", (data: Buffer) => {
        const error = data.toString();
        console.error("⚠️ Claude stderr:", error);
        
        this.emit("error", {
          type: "error",
          content: error,
          timestamp: Date.now(),
          session_id: this.currentSession?.id,
        } as ClaudeMessage);
      });

      this.activeProcess.on("exit", (code, signal) => {
        console.log(`✅ Process exited with code ${code}, signal ${signal}`);
        
        if (this.messageBuffer.trim()) {
          this.processJsonLine(this.messageBuffer);
        }
        
        this.isProcessing = false;
        this.activeProcess = null;
        
        this.emit("status", {
          type: "status",
          content: `completed`,
          timestamp: Date.now(),
          session_id: this.currentSession?.id,
        } as ClaudeMessage);
      });

      this.activeProcess.on("error", (error) => {
        console.error("❌ Process error:", error);
        this.isProcessing = false;
        this.activeProcess = null;
        
        this.emit("error", {
          type: "error",
          content: error.message,
          timestamp: Date.now(),
          session_id: this.currentSession?.id,
        } as ClaudeMessage);
      });

      return true;
    } catch (error: any) {
      console.error("❌ Failed to send message:", error);
      this.isProcessing = false;
      return false;
    }
  }

  private processJsonLine(line: string): void {
    try {
      const data = JSON.parse(line);
      
      if (data.session_id && this.currentSession) {
        this.currentSession.id = data.session_id;
        this.sessions.set(data.session_id, this.currentSession);
      }

      const message: ClaudeMessage = {
        ...data,
        timestamp: Date.now(),
      };

      console.log(`📨 Received: ${data.type}${data.subtype ? `:${data.subtype}` : ""}`);
      
      switch (data.type) {
        case "system":
          this.emit("system", message);
          if (data.subtype === "init") {
            this.emit("context", {
              tools: data.tools,
              model: data.model,
              session_id: data.session_id,
            });
          }
          break;
          
        case "assistant":
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
          break;
          
        case "user":
          this.emit("user", message);
          if (data.message?.content?.[0]?.type === "tool_result") {
            this.emit("tool_result", {
              tool_use_id: data.message.content[0].tool_use_id,
              content: data.message.content[0].content,
              session_id: data.session_id,
            });
          }
          break;
          
        default:
          this.emit("message", message);
      }

      this.emit("raw", data);

    } catch (error) {
      console.error("⚠️ Failed to parse JSON:", line.slice(0, 100));
      this.emit("output", {
        type: "assistant",
        content: line,
        timestamp: Date.now(),
        session_id: this.currentSession?.id,
      } as ClaudeMessage);
    }
  }

  async interrupt(): Promise<boolean> {
    if (!this.activeProcess) {
      return false;
    }

    try {
      this.activeProcess.kill("SIGINT");
      return true;
    } catch (error) {
      console.error("❌ Failed to interrupt:", error);
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
          // Count sessions in this project
          const files = await readdir(projectPath);
          const sessionCount = files.filter(f => f.endsWith('.jsonl')).length;
          
          // Use our smart decoder to find the real path
          const realPath = decodeProjectPath(project);
          
          // Only add projects that exist on the filesystem
          if (realPath) {
            // Extract a meaningful project name from the path
            const pathParts = realPath.split('/');
            const name = pathParts[pathParts.length - 1] || project;
            
            // Use encoded path as ID to ensure uniqueness
            projectList.push({
              name: name,
              path: realPath,
              encodedPath: project, // Keep original for uniqueness
              sessions: sessionCount
            });
          }
        }
      }
      
      return projectList;
    } catch (error) {
      console.error('📂 Error reading projects:', error);
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
        
        // Read first line to get session info
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
      console.error('📋 Error reading project sessions:', error);
    }
    
    return sessions.sort((a, b) => b.last_used - a.last_used);
  }

  async getSessions(): Promise<ClaudeSession[]> {
    const sessions: ClaudeSession[] = [];
    
    try {
      // Get project-specific directory path
      const projectPath = this.currentSession?.cwd || process.cwd();
      const projectDirName = projectPath.replace(/\//g, '-');
      const claudeProjectDir = join(homedir(), '.claude', 'projects', projectDirName);
      
      console.log('📂 Looking for sessions in:', claudeProjectDir);
      
      // Check if directory exists
      try {
        await stat(claudeProjectDir);
      } catch {
        console.log('📂 No project directory found');
        return sessions;
      }
      
      // Read all JSONL files in the project directory
      const files = await readdir(claudeProjectDir);
      const jsonlFiles = files.filter(f => f.endsWith('.jsonl'));
      
      console.log(`📋 Found ${jsonlFiles.length} session files`);
      
      // Get metadata for each session
      for (const file of jsonlFiles) {
        const sessionId = file.replace('.jsonl', '');
        const filePath = join(claudeProjectDir, file);
        const stats = await stat(filePath);
        
        sessions.push({
          id: sessionId,
          created_at: stats.birthtime.getTime(),
          last_used: stats.mtime.getTime(),
          cwd: projectPath
        });
        
        // Also store in our map for quick access
        this.sessions.set(sessionId, {
          id: sessionId,
          created_at: stats.birthtime.getTime(),
          last_used: stats.mtime.getTime(),
          cwd: projectPath
        });
      }
    } catch (error) {
      console.error("📋 Error reading sessions:", error);
    }
    
    // Sort by last used
    return sessions.sort((a, b) => b.last_used - a.last_used);
  }

  async getSessionHistory(sessionId: string, projectPath?: string): Promise<any[]> {
    try {
      const path = projectPath || this.currentSession?.cwd || process.cwd();
      const projectDirName = path.replace(/\//g, '-');
      const sessionFile = join(homedir(), '.claude', 'projects', projectDirName, `${sessionId}.jsonl`);
      
      console.log(`📖 Reading session file: ${sessionFile}`);
      const content = await readFile(sessionFile, 'utf-8');
      const lines = content.split('\n').filter(line => line.trim());
      console.log(`📖 Found ${lines.length} lines in session file`);
      
      const messages = lines.map(line => {
        try {
          return JSON.parse(line);
        } catch (e) {
          console.log('❌ Failed to parse line:', line);
          return null;
        }
      }).filter(msg => msg !== null);
      
      console.log(`📖 Parsed ${messages.length} valid messages`);
      return messages;
    } catch (error) {
      console.error('❌ Error reading session history:', error);
      return [];
    }
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

  public processRawOutput(content: string): { content: string; contextPercent: number | null } {
    return { content, contextPercent: null };
  }

  filterClaudeOutput(content: string): { content: string; contextPercent: number | null } {
    return { content, contextPercent: null };
  }
}