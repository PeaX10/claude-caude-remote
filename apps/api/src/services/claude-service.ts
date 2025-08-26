import { EventEmitter } from "events";
import { promisify } from "util";
import { exec } from "child_process";
import { watchFile, unwatchFile } from "fs";
import { writeFile, unlink } from "fs/promises";

const execAsync = promisify(exec);

interface ClaudeMessage {
  type: "output" | "error" | "command" | "status";
  content: string;
  timestamp: number;
}

interface ClaudeStatus {
  isRunning: boolean;
  pid: number | null;
}

export class ClaudeService extends EventEmitter {
  public tmuxSession: string = "claude-code-session";
  private isRunning = false;
  private checkInterval: NodeJS.Timeout | null = null;
  private outputFile: string = "/tmp/claude-output.log";

  constructor() {
    super();
  }

  async start(projectPath: string = process.cwd()): Promise<boolean> {
    if (this.isRunning) return false;

    try {
      console.log(
        `🚀 Starting Claude Code in tmux session: ${this.tmuxSession}`
      );
      console.log(`📁 Project path: ${projectPath}`);

      await this.killExistingSession();

      const tmuxCommand = [
        "tmux",
        "new-session",
        "-d",
        "-s",
        this.tmuxSession,
        "-c",
        projectPath,
        "claude",
        "--continue",
      ];

      console.log("🔧 Running:", tmuxCommand.join(" "));

      const result = await execAsync(tmuxCommand.join(" "));
      console.log("✅ tmux session created:", result.stdout);

      this.isRunning = true;
      this.startSessionMonitoring();
      await this.setupPipePane();

      setTimeout(async () => {
        try {
          const result = await execAsync(
            `tmux capture-pane -t ${this.tmuxSession} -S -3000 -p`
          );
          const fullOutput = result.stdout;

          if (fullOutput.trim()) {
            const filtered = this.filterClaudeOutput(fullOutput);
            if (filtered.content) {
              console.log(
                "📋 Emitting full conversation history after Claude startup"
              );
              this.emit("history", {
                type: "output",
                content: filtered.content,
                contextPercent: filtered.contextPercent,
                timestamp: Date.now(),
              } as ClaudeMessage & { contextPercent?: number });
            }
          }

          this.lastOutput = fullOutput;
        } catch (error) {
          console.log("❌ Error getting initial conversation history:", error);
        }
      }, 3000);

      return true;
    } catch (error) {
      console.error("❌ Failed to start Claude Code in tmux:", error);
      return false;
    }
  }

  private async killExistingSession() {
    try {
      await execAsync(`tmux kill-session -t ${this.tmuxSession}`);
      console.log("🗑️ Killed existing tmux session");
    } catch {}
  }

  private startSessionMonitoring() {
    this.checkInterval = setInterval(async () => {
      try {
        await execAsync(`tmux has-session -t ${this.tmuxSession}`);
      } catch (error) {
        console.log("💀 tmux session died");
        this.isRunning = false;
        this.emit("status", "Session died");
        if (this.checkInterval) {
          clearInterval(this.checkInterval);
          this.checkInterval = null;
        }
        this.stopPipePane();
      }
    }, 5000);
  }

  private async setupPipePane(): Promise<void> {
    try {
      console.log("🔧 Setting up tmux pipe-pane for real-time output...");

      await writeFile(this.outputFile, "");

      await execAsync(
        `tmux pipe-pane -t ${this.tmuxSession} 'cat >> ${this.outputFile}'`
      );

      watchFile(this.outputFile, { interval: 500 }, async (curr, prev) => {
        if (curr.mtime > prev.mtime && curr.size > prev.size) {
          try {
            const result = await execAsync(
              `tail -c +${prev.size + 1} ${this.outputFile}`
            );
            const newContent = result.stdout.trim();

            if (newContent) {
              const filtered = this.filterClaudeOutput(newContent);

              if (filtered.content) {
                console.log(
                  "⚡ Live update via pipe-pane:",
                  filtered.content.slice(0, 100) + "..."
                );
                this.emit("output", {
                  type: "output",
                  content: filtered.content,
                  contextPercent: filtered.contextPercent,
                  timestamp: Date.now(),
                } as ClaudeMessage & { contextPercent?: number });
              }

              if (filtered.contextPercent !== null) {
                this.emit("context", {
                  contextPercent: filtered.contextPercent,
                  timestamp: Date.now(),
                });
              }
            }
          } catch (error) {
            console.log("❌ Error reading pipe output:", error);
          }
        }
      });

      console.log("✅ Real-time output monitoring active");
    } catch (error) {
      console.log("❌ Error setting up pipe-pane:", error);
    }
  }

  private stopPipePane(): void {
    try {
      unwatchFile(this.outputFile);
      execAsync(`tmux pipe-pane -t ${this.tmuxSession}`);
      unlink(this.outputFile).catch(() => {});
      console.log("🛑 Stopped pipe-pane monitoring");
    } catch (error) {
      console.log("❌ Error stopping pipe-pane:", error);
    }
  }

  filterClaudeOutput(content: string): {
    content: string;
    contextPercent: number | null;
  } {
    const lines = content.split("\n");
    const filteredLines = [];
    let contextPercent = null;
    let foundMessageEnd = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      if (
        trimmed.includes("Context left until auto-compact:") ||
        trimmed.includes("auto-compact:")
      ) {
        const match = trimmed.match(/auto-compact:\s*(\d+)%/);
        if (match) {
          contextPercent = parseInt(match[1]);
        }
        foundMessageEnd = true;
        continue;
      }

      if (foundMessageEnd) continue;
      if (!trimmed) continue;
      if (trimmed.match(/^[╭╮╰╯│─┌┐└┘├┤┬┴┼─━┃┏┓┗┛┣┫┳┻╋]+$/)) continue;
      if (trimmed.match(/^[╭╮╰╯│─]+.*[╭╮╰╯│─]+$/)) continue;

      if (trimmed.startsWith(">")) {
        const userMessage = trimmed.substring(1).trim();
        if (userMessage) {
          filteredLines.push(`**You:** ${userMessage}`);
        }
        continue;
      }

      if (trimmed.length < 3) continue;

      filteredLines.push(trimmed);
    }

    return {
      content: filteredLines.join("\n\n").trim(),
      contextPercent,
    };
  }

  async sendMessage(message: string): Promise<boolean> {
    if (!this.isRunning) {
      console.log("🚀 Claude not running, starting automatically...");
      await this.start();
    }

    try {
      console.log("📥 Sending to tmux session:", message);

      await execAsync(`tmux send-keys -t ${this.tmuxSession} C-u`);
      await new Promise((resolve) => setTimeout(resolve, 100));

      const escapedMessage = message.replace(/'/g, "'\"'\"'");
      await execAsync(
        `tmux send-keys -t ${this.tmuxSession} '${escapedMessage}'`
      );
      await new Promise((resolve) => setTimeout(resolve, 500));

      await execAsync(`tmux send-keys -t ${this.tmuxSession} Enter`);

      this.emit("command", {
        type: "command",
        content: message,
        timestamp: Date.now(),
      } as ClaudeMessage);
      return true;
    } catch (error) {
      console.log("❌ Error sending to tmux:", error);
      return false;
    }
  }

  async getOutput(): Promise<string> {
    if (!this.isRunning) return "";

    try {
      const result = await execAsync(
        `tmux capture-pane -t ${this.tmuxSession} -p`
      );
      return result.stdout;
    } catch (error) {
      console.log("❌ Error getting tmux output:", error);
      return "";
    }
  }

  async interrupt(): Promise<boolean> {
    if (!this.isRunning) return false;

    try {
      await execAsync(`tmux send-keys -t ${this.tmuxSession} C-c`);
      return true;
    } catch {
      return false;
    }
  }

  async stop(): Promise<boolean> {
    if (!this.isRunning) return false;

    try {
      if (this.checkInterval) {
        clearInterval(this.checkInterval);
        this.checkInterval = null;
      }

      this.stopPipePane();

      await execAsync(`tmux kill-session -t ${this.tmuxSession}`);
      this.isRunning = false;
      return true;
    } catch {
      return false;
    }
  }

  getStatus(): ClaudeStatus {
    return {
      isRunning: this.isRunning,
      pid: this.isRunning ? 1 : null,
    };
  }
}
