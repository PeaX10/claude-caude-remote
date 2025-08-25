# 🚀 Claude Code Remote Control

Modern web interface for controlling Claude Code remotely from any device.

## ✨ Features

- 📱 **Mobile-First Design** - Responsive touch-optimized interface
- 🔍 **Directory Exploration** - Browse your computer remotely  
- 📊 **Automatic Git Detection** - Prioritizes Git repositories
- ⚡ **Full Automation** - Zero manual configuration required
- 🌐 **Network Access** - Control from mobile/tablet devices
- 🎯 **Real-Time Updates** - Bidirectional WebSocket communication
- 🔧 **TypeScript Backend** - Type-safe Express server with Socket.io

## 🚀 Quick Start

### Prerequisites
- [Bun](https://bun.sh/) runtime
- [Claude Code](https://claude.ai/code) installed
- Node.js 20+ (for compatibility)

### 1. Installation
```bash
# Install backend dependencies
cd backend && bun install

# Install frontend dependencies  
cd .. && bun install
```

### 2. Development
```bash
# Terminal 1: Start TypeScript backend (port 3001)
cd backend && bun run dev

# Terminal 2: Start Next.js frontend (port 3000)
bun run dev
```

### 3. Access
- **Local**: http://localhost:3000
- **Network**: http://[YOUR-IP]:3000

## 📱 Usage

1. **Open the web interface**
2. **Click "New Instance"** 
3. **Enter a project name** (e.g., "My Project")
4. **Browse** 🔍 to select a Git repository
5. **Click "Create"**

The system automatically:
- ✅ Copies MCP bridge scripts
- ✅ Generates configuration files  
- ✅ Creates launch scripts
- ✅ Starts Claude Code instance

## 🏗️ Architecture

### Backend (TypeScript)
- **Express** - REST API server
- **Socket.io** - Real-time WebSocket communication
- **TypeScript** - Full type safety
- **Bun** - Fast JavaScript runtime

### Frontend
- **Next.js 15** - React framework with App Router
- **Tailwind CSS v4** - Modern styling system
- **Zustand** - State management
- **Socket.io Client** - Real-time updates

### Communication
- **MCP Bridge** - Model Context Protocol integration
- **WebSocket Events** - Instance management, file exploration
- **REST API** - Health checks and instance listing

## 📁 Project Structure

```
.
├── backend/                 # TypeScript Express server
│   ├── src/
│   │   ├── server.ts       # Main server entry point
│   │   ├── types.ts        # TypeScript interfaces
│   │   └── websocket/      # Socket.io handlers
│   └── dist/               # Compiled JavaScript (ignored)
├── app/                    # Next.js app directory
├── components/             # React components
├── lib/                    # Utilities and types
└── public/                 # Static assets
```

## 🔧 Configuration

### Environment Variables

**Backend** (`.env`):
```env
PORT=3001
HOST=0.0.0.0
NODE_ENV=development
```

**Frontend** (`.env.local`):
```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
```

### MCP Integration
Each created instance generates:
- `config.json` - MCP server configuration
- `launch.sh` - Claude Code startup script
- `mcp-bridge.js` - Communication bridge

## 🚀 Production Deployment

### Build
```bash
# Build backend
cd backend && bun run build

# Build frontend
bun run build
```

### Start
```bash
# Start backend
cd backend && bun start

# Start frontend
bun start
```

## 📊 Features in Detail

### Instance Management
- Create/delete Claude Code instances
- Real-time status monitoring
- Project path validation
- Automatic Git repository detection

### File System Integration
- Remote directory browsing
- Git repository prioritization
- Mobile-optimized navigation
- Touch-friendly interface

### Real-Time Communication
- WebSocket-based updates
- Instance status synchronization
- Message and tool call tracking
- Git status monitoring

## 🛠️ Development

### Scripts
```bash
# Backend
cd backend
bun run dev      # Development with watch mode
bun run build    # Compile TypeScript
bun start        # Production server

# Frontend  
bun run dev      # Next.js development
bun run build    # Production build
bun start        # Production server
```

### Type Safety
- Full TypeScript coverage
- Strict type checking
- Interface definitions for all data structures
- Type-safe WebSocket events

## 📝 Notes

- Instances are isolated and portable
- Configurations stored in `.claude-remote/` per project
- Mobile-optimized responsive design
- Automatic cleanup on disconnection
- Cross-platform compatibility

---

*Fully automated Claude Code remote control - no manual setup required! 🎉*