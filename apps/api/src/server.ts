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
  const status = claude.getStatus()
  
  try {
    const safeStatus = JSON.parse(JSON.stringify(status))
    socket.emit('claude_status', safeStatus)
  } catch (error) {
    socket.emit('claude_status', { isRunning: false, pid: null, currentSessionId: null })
  }
  
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
      const projectRoot = path.resolve(__dirname, '../../../')
      const sessionId = await claude.startSession({
        sessionId: data?.sessionId,
        projectPath: data?.projectPath || projectRoot
      })
      const status = claude.getStatus()
      
      const result = {
        sessionId: String(sessionId), 
        status: {
          isRunning: Boolean(status.isRunning),
          pid: status.pid ? Number(status.pid) : null,
          currentSessionId: status.currentSessionId ? String(status.currentSessionId) : null
        }
      }
      
      const safeResult = JSON.parse(JSON.stringify(result))
      socket.emit('claude_start_result', safeResult)
    } catch (error: any) {
      socket.emit('claude_error', { 
        type: 'error', 
        content: String(error.message || error),
        timestamp: Date.now() 
      })
    }
  })
  
  socket.on('claude_resume', async (data) => {
    const sessionId = await claude.startSession({
      sessionId: data.sessionId,
      projectPath: data?.projectPath
    })
    const status = claude.getStatus()
    socket.emit('claude_resume_result', { sessionId, status })
  })
  
  socket.on('claude_message', async (data) => {
    if (data?.message) {
      await claude.sendMessage(data.message)
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
      socket.emit('claude_sessions', safeSessions)
    } catch (error) {
      socket.emit('claude_sessions', [])
    }
  })
  
  socket.on('claude_get_commands', async () => {
    try {
      const commands = await claude.getAvailableCommands()
      const safeCommands = commands.map(c => String(c))
      socket.emit('claude_commands', safeCommands)
    } catch (error) {
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
      socket.emit('claude_projects', projects)
    } catch (error) {
      socket.emit('claude_projects', [])
    }
  })
  
  socket.on('claude_get_project_sessions', async (data) => {
    try {
      const sessions = await claude.getProjectSessions(data.projectPath)
      socket.emit('claude_project_sessions', { projectPath: data.projectPath, sessions })
    } catch (error) {
      socket.emit('claude_project_sessions', { projectPath: data.projectPath, sessions: [] })
    }
  })

  socket.on('file_list', async (data) => {
    try {
      const requestPath = data?.path || '/'
      
      // Check if path exists
      try {
        const stats = await stat(requestPath)
        
        if (!stats.isDirectory()) {
          socket.emit('file_error', { error: 'Path is not a directory' })
          return
        }
      } catch (e) {
        socket.emit('file_error', { error: `Path does not exist: ${requestPath}` })
        return
      }
      
      // Read directory contents
      const files = await readdir(requestPath, { withFileTypes: true })
      
      // Filter out hidden files (optional)
      const visibleFiles = files.filter(f => !f.name.startsWith('.'))
      
      const result = await Promise.all(
        visibleFiles.map(async (file) => {
          try {
            const fullFilePath = path.join(requestPath, file.name)
            const fileStats = await stat(fullFilePath)
            return {
              name: file.name,
              type: file.isDirectory() ? 'directory' : 'file',
              path: fullFilePath, // Return full absolute path
              size: file.isFile() ? fileStats.size : undefined
            }
          } catch (e) {
            // Skip files we can't stat
            return null
          }
        })
      )
      
      // Filter out nulls and sort (directories first, then alphabetically)
      const sortedResult = result
        .filter(f => f !== null)
        .sort((a, b) => {
          if (a.type === 'directory' && b.type === 'file') return -1
          if (a.type === 'file' && b.type === 'directory') return 1
          return a.name.localeCompare(b.name)
        })
      
      socket.emit('file_list_result', { files: sortedResult, path: requestPath })
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
  
  socket.on('disconnect', () => {})
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