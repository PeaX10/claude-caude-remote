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
  console.log('📊 Sending initial status:', JSON.stringify(status))
  
  // Make absolutely sure we're sending plain objects
  try {
    const safeStatus = JSON.parse(JSON.stringify(status))
    socket.emit('claude_status', safeStatus)
  } catch (error) {
    console.error('❌ Failed to serialize status:', error)
    socket.emit('claude_status', { isRunning: false, pid: null, currentSessionId: null })
  }
  
  // Temporarily disable automatic session sending to debug
  // setTimeout(async () => {
  //   try {
  //     const sessions = await claude.getSessions()
  //     // Ensure we send serializable data
  //     if (sessions && sessions.length > 0) {
  //       const safeSessions = JSON.parse(JSON.stringify(sessions))
  //       socket.emit('claude_sessions', safeSessions)
  //     } else {
  //       socket.emit('claude_sessions', [])
  //     }
  //   } catch (error) {
  //     console.log('⚠️ Could not send sessions:', error)
  //     socket.emit('claude_sessions', [])
  //   }
  // }, 500)
  
  const handleOutput = (message: ClaudeMessage) => socket.emit('claude_output', message)
  const handleError = (error: any) => socket.emit('claude_error', { 
    type: 'error', 
    content: typeof error === 'string' ? error : error.message,
    timestamp: Date.now() 
  })
  const handleStatus = (status: string) => {
    const currentStatus = claude.getStatus()
    safeEmit('claude_status_update', { 
      type: 'status', 
      content: status, 
      timestamp: Date.now(),
      status: {
        isRunning: currentStatus.isRunning,
        pid: currentStatus.pid,
        currentSessionId: currentStatus.currentSessionId
      }
    })
  }
  // Ensure all data sent through socket is serializable
  const safeEmit = (event: string, data: any) => {
    try {
      // Handle different types of data
      if (data === null || data === undefined) {
        socket.emit(event, data)
        return
      }
      
      // For primitives, send as-is
      if (typeof data !== 'object') {
        socket.emit(event, data)
        return
      }
      
      // For objects, ensure they're serializable
      const safe = JSON.parse(JSON.stringify(data))
      socket.emit(event, safe)
    } catch (error) {
      console.error(`⚠️ Failed to emit ${event}:`, error, 'Data:', data)
      socket.emit(event, { error: 'Serialization error' })
    }
  }
  
  const handleSession = (data: any) => safeEmit('claude_session', data)
  const handleSystem = (data: any) => safeEmit('claude_system', data)
  const handleAssistant = (data: any) => safeEmit('claude_assistant', data)
  const handleUser = (data: any) => safeEmit('claude_user', data)
  const handleToolUse = (data: any) => safeEmit('claude_tool_use', data)
  const handleToolResult = (data: any) => safeEmit('claude_tool_result', data)
  const handleRaw = (data: any) => safeEmit('claude_raw', data)
  const handleContext = (data: any) => safeEmit('claude_context', data)
  
  claude.on('output', handleOutput)
  claude.on('error', handleError)
  claude.on('status', handleStatus)
  claude.on('session', handleSession)
  claude.on('system', handleSystem)
  claude.on('assistant', handleAssistant)
  claude.on('user', handleUser)
  claude.on('tool_use', handleToolUse)
  claude.on('tool_result', handleToolResult)
  claude.on('raw', handleRaw)
  claude.on('context', handleContext)
  
  socket.on('disconnect', () => {
    claude.off('output', handleOutput)
    claude.off('error', handleError)
    claude.off('status', handleStatus)
    claude.off('session', handleSession)
    claude.off('system', handleSystem)
    claude.off('assistant', handleAssistant)
    claude.off('user', handleUser)
    claude.off('tool_use', handleToolUse)
    claude.off('tool_result', handleToolResult)
    claude.off('raw', handleRaw)
    claude.off('context', handleContext)
  })
  
  socket.on('claude_start', async (data) => {
    try {
      console.log('🚀 Starting Claude Code session with data:', JSON.stringify(data))
      const projectRoot = path.resolve(__dirname, '../../../')
      const sessionId = await claude.startSession({
        sessionId: data?.sessionId,
        projectPath: data?.projectPath || projectRoot
      })
      const status = claude.getStatus()
      console.log('📊 Start result:', JSON.stringify({ sessionId, status }))
      
      // Create a completely clean object
      const result = {
        sessionId: String(sessionId), 
        status: {
          isRunning: Boolean(status.isRunning),
          pid: status.pid ? Number(status.pid) : null,
          currentSessionId: status.currentSessionId ? String(status.currentSessionId) : null
        }
      }
      
      // Double-check it's serializable
      const safeResult = JSON.parse(JSON.stringify(result))
      socket.emit('claude_start_result', safeResult)
    } catch (error: any) {
      console.error('❌ Error starting Claude:', error)
      socket.emit('claude_error', { 
        type: 'error', 
        content: String(error.message || error),
        timestamp: Date.now() 
      })
    }
  })
  
  socket.on('claude_resume', async (data) => {
    console.log('📂 Resuming Claude Code session...')
    const sessionId = await claude.startSession({
      sessionId: data.sessionId,
      projectPath: data?.projectPath
    })
    const status = claude.getStatus()
    socket.emit('claude_resume_result', { sessionId, status })
  })
  
  socket.on('claude_message', async (data) => {
    console.log('💬 Received message request:', data)
    if (data?.message) {
      const success = await claude.sendMessage(data.message)
      console.log('📤 Message sent to Claude:', success ? 'SUCCESS' : 'FAILED')
    }
  })

  socket.on('claude_get_sessions', async () => {
    try {
      const sessions = await claude.getSessions()
      // Force simple array of plain objects
      const safeSessions = sessions.map(s => ({
        id: String(s.id || ''),
        created_at: Number(s.created_at || 0),
        last_used: Number(s.last_used || 0),
        cwd: String(s.cwd || '')
      }))
      console.log('📋 Sending sessions:', JSON.stringify(safeSessions))
      socket.emit('claude_sessions', safeSessions)
    } catch (error) {
      console.error('Error getting sessions:', error)
      socket.emit('claude_sessions', [])
    }
  })
  
  socket.on('claude_get_commands', async () => {
    try {
      const commands = await claude.getAvailableCommands()
      // Force simple array of strings
      const safeCommands = commands.map(c => String(c))
      console.log('📋 Sending commands:', JSON.stringify(safeCommands))
      socket.emit('claude_commands', safeCommands)
    } catch (error) {
      console.error('Error getting commands:', error)
      socket.emit('claude_commands', [])
    }
  })
  
  socket.on('claude_interrupt', async () => {
    const success = await claude.interrupt()
    socket.emit('claude_interrupt_result', { success })
  })
  
  socket.on('claude_get_projects', async () => {
    try {
      const projects = await claude.getProjects()
      console.log('📂 Sending projects:', projects.length)
      socket.emit('claude_projects', projects)
    } catch (error) {
      console.error('Error getting projects:', error)
      socket.emit('claude_projects', [])
    }
  })
  
  socket.on('claude_get_project_sessions', async (data) => {
    try {
      const sessions = await claude.getProjectSessions(data.projectPath)
      console.log('📋 Sending sessions for project:', sessions.length)
      socket.emit('claude_project_sessions', { projectPath: data.projectPath, sessions })
    } catch (error) {
      console.error('Error getting project sessions:', error)
      socket.emit('claude_project_sessions', { projectPath: data.projectPath, sessions: [] })
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
  
  // Additional cleanup on disconnect
  socket.on('disconnect', () => {
    console.log('🔌 Client disconnected:', socket.id)
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