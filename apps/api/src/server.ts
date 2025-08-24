import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import cors from 'cors'
import { spawn, ChildProcess, exec } from 'child_process'
import { EventEmitter } from 'events'
import { promisify } from 'util'
import { readdir, stat, readFile, writeFile, mkdir, unlink } from 'fs/promises'
import path from 'path'

const execAsync = promisify(exec)

interface ClaudeMessage {
  type: 'output' | 'error' | 'command' | 'status'
  content: string
  timestamp: number
}

class ClaudeCodeWrapper extends EventEmitter {
  private tmuxSession: string = 'claude-code-session'
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
      
      // Kill existing session if it exists
      await this.killExistingSession()
      
      // Create new tmux session with Claude Code
      const tmuxCommand = [
        'tmux', 'new-session', '-d', '-s', this.tmuxSession, 
        '-c', projectPath,  // Set working directory
        'claude', '--continue'
      ]
      
      console.log('🔧 Running:', tmuxCommand.join(' '))
      
      const result = await execAsync(tmuxCommand.join(' '))
      console.log('✅ tmux session created:', result.stdout)
      
      this.isRunning = true
      this.startSessionMonitoring()
      
      // Wait for Claude to initialize then get conversation history
      setTimeout(async () => {
        try {
          const currentOutput = await this.getOutput()
          if (currentOutput.trim()) {
            const filtered = this.filterClaudeOutput(currentOutput)
            if (filtered.content) {
              console.log('📋 Emitting conversation history after Claude startup')
              this.emit('history', {
                type: 'output',
                content: filtered.content,
                contextPercent: filtered.contextPercent,
                timestamp: Date.now()
              } as ClaudeMessage & { contextPercent?: number })
            }
          }
        } catch (error) {
          console.log('❌ Error getting initial conversation history:', error)
        }
      }, 3000) // Wait 3 seconds for Claude to fully load
      
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
    } catch (error) {
      // Session doesn't exist, which is fine
    }
  }
  
  private startSessionMonitoring() {
    this.checkInterval = setInterval(async () => {
      try {
        await execAsync(`tmux has-session -t ${this.tmuxSession}`)
        // Session exists, all good
      } catch (error) {
        // Session died
        console.log('💀 tmux session died')
        this.isRunning = false
        this.emit('status', 'Session died')
        if (this.checkInterval) {
          clearInterval(this.checkInterval)
          this.checkInterval = null
        }
      }
    }, 5000) // Check every 5 seconds
  }

  filterClaudeOutput(content: string): { content: string, contextPercent: number | null } {
    const lines = content.split('\n')
    const filteredLines = []
    let contextPercent = null
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const trimmed = line.trim()
      
      // Skip empty lines
      if (!trimmed) continue
      
      // Skip box drawing characters (UI elements)
      if (trimmed.match(/^[╭╮╰╯│─┌┐└┘├┤┬┴┼─━┃┏┓┗┛┣┫┳┻╋]+$/)) continue
      
      // Skip lines that are just borders with content
      if (trimmed.match(/^[╭╮╰╯│─]+.*[╭╮╰╯│─]+$/)) continue
      
      // Extract context percentage
      if (trimmed.includes('Context left until auto-compact:')) {
        const match = trimmed.match(/Context left until auto-compact:\s*(\d+)%/)
        if (match) {
          contextPercent = parseInt(match[1])
        }
        continue
      }
      
      // Transform user input lines (starting with >) into a cleaner format
      if (trimmed.startsWith('>')) {
        const userMessage = trimmed.substring(1).trim()
        if (userMessage) {
          filteredLines.push(`**You:** ${userMessage}`)
        }
        continue
      }
      
      // Skip very short lines that are likely UI elements
      if (trimmed.length < 3) continue
      
      // Keep substantial content lines
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
      
      // Send message to tmux session
      await execAsync(`tmux send-keys -t ${this.tmuxSession} '${message.replace(/'/g, "'")}' Enter`)
      
      // Wait a bit then capture the output
      setTimeout(async () => {
        try {
          const result = await execAsync(`tmux capture-pane -t ${this.tmuxSession} -p`)
          const currentOutput = result.stdout
          
          // Only send new content since last capture
          if (currentOutput !== this.lastOutput) {
            const lines = currentOutput.split('\n')
            const lastLines = this.lastOutput.split('\n')
            
            // Find new lines
            const newLines = lines.slice(lastLines.length)
            const newContent = newLines.join('\n').trim()
            
            if (newContent) {
              // Filter out UI elements and keep only Claude's responses
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
            }
            
            this.lastOutput = currentOutput
          }
        } catch (error) {
          console.log('❌ Error capturing tmux output:', error)
        }
      }, 3000) // Wait 3 seconds for Claude to respond
      
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
      // Send Ctrl+C to tmux session
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
  
  getStatus() {
    return {
      isRunning: this.isRunning,
      pid: this.isRunning ? 1 : null // tmux doesn't have a single PID
    }
  }
}

const app = express()
const server = createServer(app)
const io = new Server(server, {
  cors: { 
    origin: "*", 
    methods: ["GET", "POST"],
    allowedHeaders: ["*"],
    credentials: false
  },
  allowEIO3: true,
  transports: ['websocket', 'polling']
})

const PORT = process.env.PORT || 9876
const claude = new ClaudeCodeWrapper()

app.use(cors())
app.use(express.json())

app.get('/health', (_, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: Date.now(),
    claude: claude.getStatus()
  })
})

app.post('/claude/start', (req, res) => {
  const { projectPath } = req.body
  const success = claude.start(projectPath)
  res.json({ success, status: claude.getStatus() })
})

app.post('/claude/message', (req, res) => {
  const { message } = req.body
  const success = claude.sendMessage(message)
  res.json({ success })
})

app.get('/claude/status', (_, res) => {
  res.json(claude.getStatus())
})

app.get('/files/*', async (req, res) => {
  try {
    const filePath = req.params[0] || '.'
    const fullPath = path.resolve(filePath)
    const stats = await stat(fullPath)
    
    if (stats.isDirectory()) {
      const files = await readdir(fullPath, { withFileTypes: true })
      const result = await Promise.all(
        files.map(async (file) => {
          const fileStats = await stat(path.join(fullPath, file.name))
          return {
            name: file.name,
            type: file.isDirectory() ? 'directory' : 'file',
            path: path.join(filePath, file.name),
            size: file.isFile() ? fileStats.size : undefined
          }
        })
      )
      res.json(result)
    } else {
      const content = await readFile(fullPath, 'utf-8')
      res.json({ content, path: filePath })
    }
  } catch (error: any) {
    res.status(404).json({ error: error.message })
  }
})

app.post('/files/*', async (req, res) => {
  try {
    const filePath = req.params[0]
    const { content, type } = req.body
    
    if (type === 'directory') {
      await mkdir(filePath, { recursive: true })
      res.json({ success: true })
    } else {
      await writeFile(filePath, content || '')
      res.json({ success: true })
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

app.delete('/files/*', async (req, res) => {
  try {
    const filePath = req.params[0]
    await unlink(filePath)
    res.json({ success: true })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

app.post('/git/status', async (req, res) => {
  try {
    const { stdout } = await execAsync('git status --porcelain -b')
    res.json({ output: stdout })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

app.post('/git/branches', async (req, res) => {
  try {
    const { stdout } = await execAsync('git branch -a')
    res.json({ output: stdout })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

app.post('/git/log', async (req, res) => {
  try {
    const { stdout } = await execAsync('git log --oneline -10')
    res.json({ output: stdout })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

app.post('/git/command', async (req, res) => {
  try {
    const { command } = req.body
    if (!command || !command.startsWith('git ')) {
      return res.status(400).json({ error: 'Invalid git command' })
    }
    const { stdout, stderr } = await execAsync(command)
    res.json({ output: stdout, error: stderr })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

io.on('connection', async (socket) => {
  console.log('🔌 Client connected:', socket.id, 'from', socket.handshake.address)
  const status = claude.getStatus()
  console.log('📊 Sending initial status:', status)
  socket.emit('claude_status', status)
  
  // If Claude is already running, send current output
  if (status.isRunning) {
    try {
      const currentOutput = await claude.getOutput()
      if (currentOutput.trim()) {
        console.log('📋 Sending current Claude state to new client')
        const filtered = claude.filterClaudeOutput(currentOutput)
        socket.emit('claude_output', {
          type: 'output',
          content: filtered.content,
          contextPercent: filtered.contextPercent,
          timestamp: Date.now()
        })
      }
    } catch (error) {
      console.log('❌ Error getting current output for new client:', error)
    }
  }
  
  const handleOutput = (message: ClaudeMessage) => socket.emit('claude_output', message)
  const handleError = (error: any) => socket.emit('claude_error', { 
    type: 'error', 
    content: typeof error === 'string' ? error : error.message,
    timestamp: Date.now() 
  })
  const handleStatus = (status: string) => socket.emit('claude_status_update', { 
    type: 'status', 
    content: status, 
    timestamp: Date.now(),
    status: claude.getStatus()
  })
  const handleHistory = (message: ClaudeMessage) => socket.emit('claude_output', message)
  
  claude.on('output', handleOutput)
  claude.on('error', handleError)
  claude.on('status', handleStatus)
  claude.on('history', handleHistory)
  
  socket.on('disconnect', () => {
    claude.off('output', handleOutput)
    claude.off('error', handleError)
    claude.off('status', handleStatus)
    claude.off('history', handleHistory)
  })
  
  socket.on('claude_start', async (data) => {
    console.log('🚀 Starting Claude Code...')
    // Start Claude in the project root, not in the API directory
    const projectRoot = path.resolve(__dirname, '../../../')
    const success = await claude.start(data?.projectPath || projectRoot)
    const status = claude.getStatus()
    console.log('📊 Start result:', { success, status })
    socket.emit('claude_start_result', { success, status })
  })
  
  socket.on('claude_message', async (data) => {
    if (data?.message) await claude.sendMessage(data.message)
  })

  socket.on('claude_full_output', async () => {
    const output = await claude.getOutput()
    const filtered = claude.filterClaudeOutput(output)
    if (filtered.content) {
      socket.emit('claude_output', {
        type: 'output',
        content: filtered.content,
        contextPercent: filtered.contextPercent,
        timestamp: Date.now()
      })
    }
  })

  socket.on('file_list', async (data) => {
    try {
      const filePath = data?.path || '.'
      const fullPath = path.resolve(filePath)
      const stats = await stat(fullPath)
      
      if (stats.isDirectory()) {
        const files = await readdir(fullPath, { withFileTypes: true })
        const result = await Promise.all(
          files.map(async (file) => {
            const fileStats = await stat(path.join(fullPath, file.name))
            return {
              name: file.name,
              type: file.isDirectory() ? 'directory' : 'file',
              path: path.join(filePath, file.name),
              size: file.isFile() ? fileStats.size : undefined
            }
          })
        )
        socket.emit('file_list_result', { files: result, path: filePath })
      }
    } catch (error: any) {
      socket.emit('file_error', { error: error.message })
    }
  })

  socket.on('file_read', async (data) => {
    try {
      const content = await readFile(data.path, 'utf-8')
      socket.emit('file_content', { content, path: data.path })
    } catch (error: any) {
      socket.emit('file_error', { error: error.message })
    }
  })

  socket.on('git_command', async (data) => {
    try {
      const { command } = data
      if (!command || !command.startsWith('git ')) {
        socket.emit('git_error', { error: 'Invalid git command' })
        return
      }
      const { stdout, stderr } = await execAsync(command)
      socket.emit('git_result', { output: stdout, error: stderr, command })
    } catch (error: any) {
      socket.emit('git_error', { error: error.message, command: data.command })
    }
  })
  
  socket.on('disconnect', () => {
    console.log('🔌 Client disconnected:', socket.id)
    claude.removeListener('output', handleOutput)
    claude.removeListener('error', handleError)  
    claude.removeListener('status', handleStatus)
  })
})

server.listen(PORT, () => {
  console.log(`🚀 Server on port ${PORT}`)
}).on('error', (err: any) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use!`)
    console.log('Try killing existing processes:')
    console.log(`lsof -ti:${PORT} | xargs kill -9`)
    process.exit(1)
  } else {
    console.error('Server error:', err)
    process.exit(1)
  }
})

process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...')
  claude.stop()
  server.close(() => {
    console.log('✅ Server closed')
    process.exit(0)
  })
})