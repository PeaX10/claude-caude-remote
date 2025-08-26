import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import cors from 'cors'
import { exec } from 'child_process'
import { promisify } from 'util'
import { readdir, stat, readFile, writeFile, mkdir, unlink } from 'fs/promises'
import path from 'path'
import { ClaudeService } from './services/claude-service'

const execAsync = promisify(exec)

interface ClaudeMessage {
  type: 'output' | 'error' | 'command' | 'status'
  content: string
  timestamp: number
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
const claude = new ClaudeService()

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
  
  if (status.isRunning) {
    try {
      const result = await execAsync(`tmux capture-pane -t ${claude.tmuxSession} -S -3000 -p`)
      const fullOutput = result.stdout
      
      if (fullOutput.trim()) {
        console.log('📋 Sending full conversation history to new client')
        const filtered = claude.filterClaudeOutput(fullOutput)
        socket.emit('claude_output', {
          type: 'output',
          content: filtered.content,
          contextPercent: filtered.contextPercent,
          timestamp: Date.now()
        })
      }
    } catch (error) {
      console.log('❌ Error getting full history for new client:', error)
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
  const handleContext = (data: { contextPercent: number, timestamp: number }) => {
    socket.emit('claude_context', data)
  }
  
  claude.on('output', handleOutput)
  claude.on('error', handleError)
  claude.on('status', handleStatus)
  claude.on('history', handleHistory)
  claude.on('context', handleContext)
  
  socket.on('disconnect', () => {
    claude.off('output', handleOutput)
    claude.off('error', handleError)
    claude.off('status', handleStatus)
    claude.off('history', handleHistory)
    claude.off('context', handleContext)
  })
  
  socket.on('claude_start', async (data) => {
    console.log('🚀 Starting Claude Code...')
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
    try {
      const result = await execAsync(`tmux capture-pane -t ${claude.tmuxSession} -S -3000 -p`)
      const fullOutput = result.stdout
      
      const filtered = claude.filterClaudeOutput(fullOutput)
      if (filtered.content) {
        console.log('📋 Sending full history via refresh button')
        socket.emit('claude_output', {
          type: 'output',
          content: filtered.content,
          contextPercent: filtered.contextPercent,
          timestamp: Date.now()
        })
      }
    } catch (error) {
      console.log('❌ Error getting full output:', error)
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