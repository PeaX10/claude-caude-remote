import { EventEmitter } from 'events'
import { promisify } from 'util'
import { exec } from 'child_process'

const execAsync = promisify(exec)

interface ClaudeMessage {
  type: 'output' | 'error' | 'command' | 'status'
  content: string
  timestamp: number
}

interface ClaudeStatus {
  isRunning: boolean
  pid: number | null
}

export class ClaudeService extends EventEmitter {
  public tmuxSession: string = 'claude-code-session'
  private isRunning = false
  private checkInterval: NodeJS.Timeout | null = null
  private lastOutput: string = ''
  
  constructor() {
    super()
  }
  
  async start(projectPath: string = process.cwd()): Promise<boolean> {
    if (this.isRunning) return false
    
    try {
      console.log(`🚀 Starting Claude Code in tmux session: ${this.tmuxSession}`)
      console.log(`📁 Project path: ${projectPath}`)
      
      await this.killExistingSession()
      
      const tmuxCommand = [
        'tmux', 'new-session', '-d', '-s', this.tmuxSession, 
        '-c', projectPath,
        'claude', '--continue'
      ]
      
      console.log('🔧 Running:', tmuxCommand.join(' '))
      
      const result = await execAsync(tmuxCommand.join(' '))
      console.log('✅ tmux session created:', result.stdout)
      
      this.isRunning = true
      this.startSessionMonitoring()
      
      setTimeout(async () => {
        try {
          const result = await execAsync(`tmux capture-pane -t ${this.tmuxSession} -S -3000 -p`)
          const fullOutput = result.stdout
          
          if (fullOutput.trim()) {
            const filtered = this.filterClaudeOutput(fullOutput)
            if (filtered.content) {
              console.log('📋 Emitting full conversation history after Claude startup')
              this.emit('history', {
                type: 'output',
                content: filtered.content,
                contextPercent: filtered.contextPercent,
                timestamp: Date.now()
              } as ClaudeMessage & { contextPercent?: number })
            }
          }
          
          this.lastOutput = fullOutput
        } catch (error) {
          console.log('❌ Error getting initial conversation history:', error)
        }
      }, 3000)
      
      return true
      
    } catch (error) {
      console.error('❌ Failed to start Claude Code in tmux:', error)
      return false
    }
  }
  
  private async killExistingSession() {
    try {
      await execAsync(`tmux kill-session -t ${this.tmuxSession}`)
      console.log('🗑️ Killed existing tmux session')
    } catch {
    }
  }
  
  private startSessionMonitoring() {
    this.checkInterval = setInterval(async () => {
      try {
        await execAsync(`tmux has-session -t ${this.tmuxSession}`)
      } catch (error) {
        console.log('💀 tmux session died')
        this.isRunning = false
        this.emit('status', 'Session died')
        if (this.checkInterval) {
          clearInterval(this.checkInterval)
          this.checkInterval = null
        }
      }
    }, 5000)
  }

  filterClaudeOutput(content: string): { content: string, contextPercent: number | null } {
    const lines = content.split('\n')
    const filteredLines = []
    let contextPercent = null
    let foundMessageEnd = false
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const trimmed = line.trim()
      
      if (trimmed.includes('Context left until auto-compact:') || trimmed.includes('auto-compact:')) {
        const match = trimmed.match(/auto-compact:\s*(\d+)%/)
        if (match) {
          contextPercent = parseInt(match[1])
        }
        foundMessageEnd = true
        continue
      }
      
      if (foundMessageEnd) continue
      if (!trimmed) continue
      if (trimmed.match(/^[╭╮╰╯│─┌┐└┘├┤┬┴┼─━┃┏┓┗┛┣┫┳┻╋]+$/)) continue
      if (trimmed.match(/^[╭╮╰╯│─]+.*[╭╮╰╯│─]+$/)) continue
      
      if (trimmed.startsWith('>')) {
        const userMessage = trimmed.substring(1).trim()
        if (userMessage) {
          filteredLines.push(`**You:** ${userMessage}`)
        }
        continue
      }
      
      if (trimmed.length < 3) continue
      
      filteredLines.push(trimmed)
    }
    
    return {
      content: filteredLines.join('\n\n').trim(),
      contextPercent
    }
  }
  
  async sendMessage(message: string): Promise<boolean> {
    if (!this.isRunning) return false
    
    try {
      console.log('📥 Sending to tmux session:', message)
      
      await execAsync(`tmux send-keys -t ${this.tmuxSession} '${message.replace(/'/g, "'")}' Enter`)
      
      setTimeout(async () => {
        try {
          const result = await execAsync(`tmux capture-pane -t ${this.tmuxSession} -p`)
          const currentOutput = result.stdout
          
          if (currentOutput !== this.lastOutput) {
            const lines = currentOutput.split('\n')
            const lastLines = this.lastOutput.split('\n')
            
            const newLines = lines.slice(lastLines.length)
            const newContent = newLines.join('\n').trim()
            
            if (newContent) {
              const filtered = this.filterClaudeOutput(newContent)
              
              if (filtered.content) {
                console.log('📤 Filtered Claude response:', filtered.content.slice(0, 200) + '...')
                this.emit('output', {
                  type: 'output',
                  content: filtered.content,
                  contextPercent: filtered.contextPercent,
                  timestamp: Date.now()
                } as ClaudeMessage & { contextPercent?: number })
              }
              
              if (filtered.contextPercent !== null) {
                this.emit('context', {
                  contextPercent: filtered.contextPercent,
                  timestamp: Date.now()
                })
              }
            }
            
            this.lastOutput = currentOutput
          }
        } catch (error) {
          console.log('❌ Error capturing tmux output:', error)
        }
      }, 3000)
      
      this.emit('command', {
        type: 'command',
        content: message,
        timestamp: Date.now()
      } as ClaudeMessage)
      return true
    } catch (error) {
      console.log('❌ Error sending to tmux:', error)
      return false
    }
  }
  
  async getOutput(): Promise<string> {
    if (!this.isRunning) return ''
    
    try {
      const result = await execAsync(`tmux capture-pane -t ${this.tmuxSession} -p`)
      return result.stdout
    } catch (error) {
      console.log('❌ Error getting tmux output:', error)
      return ''
    }
  }
  
  async interrupt(): Promise<boolean> {
    if (!this.isRunning) return false
    
    try {
      await execAsync(`tmux send-keys -t ${this.tmuxSession} C-c`)
      return true
    } catch {
      return false
    }
  }
  
  async stop(): Promise<boolean> {
    if (!this.isRunning) return false
    
    try {
      if (this.checkInterval) {
        clearInterval(this.checkInterval)
        this.checkInterval = null
      }
      
      await execAsync(`tmux kill-session -t ${this.tmuxSession}`)
      this.isRunning = false
      return true
    } catch {
      return false
    }
  }
  
  getStatus(): ClaudeStatus {
    return {
      isRunning: this.isRunning,
      pid: this.isRunning ? 1 : null
    }
  }
}