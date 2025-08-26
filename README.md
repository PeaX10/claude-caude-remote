# Claude Code Remote Control

A comprehensive monorepo solution for remotely controlling Claude Code instances with real-time communication, built with modern technologies and best practices.

## 🏗️ Architecture

This monorepo contains:

- **`apps/api`**: Node.js server with WebSocket and REST API for Claude Code process management
- **`apps/web`**: React Native Expo mobile app for remote control
- **`packages/shared`**: Shared types, utilities, and validation schemas

## 🚀 Features

### API Server (`apps/api`)
- **Process Management**: Start, stop, and monitor Claude Code instances
- **Real-time Communication**: WebSocket server for live updates
- **Security**: JWT authentication, rate limiting, CORS protection
- **System Monitoring**: Resource usage, health checks, and diagnostics
- **Scalability**: Configurable process limits and resource management

### Mobile App (`apps/web`)
- **Cross-platform**: iOS, Android, and Web support via Expo
- **Real-time UI**: Live process status updates
- **State Management**: Redux Toolkit with persistence
- **Material Design**: Modern UI with React Native Paper
- **Offline Support**: Graceful handling of connection issues

### Shared Package (`packages/shared`)
- **Type Safety**: Comprehensive TypeScript definitions
- **Validation**: Zod schemas for runtime type checking
- **Utilities**: Common functions for both client and server

## 🛠️ Technology Stack

- **Backend**: Node.js, Express, WebSocket, TypeScript
- **Frontend**: React Native, Expo, Redux Toolkit, React Native Paper
- **Build System**: Turborepo for efficient monorepo management
- **Validation**: Zod for runtime type checking
- **Authentication**: JWT with bcrypt for security
- **Deployment**: Docker with multi-stage builds

## 📦 Quick Start

### Prerequisites
- Node.js 18+
- npm 9+
- Claude Code CLI installed
- Docker (for deployment)

### Development Setup

1. **Clone and install dependencies**:
```bash
git clone <repository-url>
cd claude-code-remote
npm install
```

2. **Configure environment**:
```bash
# API server
cp apps/api/.env.example apps/api/.env
# Edit apps/api/.env with your configuration
```

3. **Start development servers**:
```bash
# Start all services
npm run dev

# Or start individually
npm run dev --filter=@claude-remote/api     # API server
npm run dev --filter=@claude-remote/web     # Mobile app
```

4. **Build for production**:
```bash
npm run build
```

## 🐳 Docker Deployment

### Quick Deploy with Docker Compose

```bash
# Create environment file
cp apps/api/.env.example .env

# Start services
docker-compose up -d

# With nginx proxy (production)
docker-compose --profile production up -d
```

### Manual Docker Build

```bash
# Build API server
docker build -f Dockerfile.api -t claude-remote-api .

# Run container
docker run -d \\
  --name claude-remote \\
  -p 8080:8080 \\
  -e JWT_SECRET=your-secret-key \\
  claude-remote-api
```

## 🔧 Configuration

### API Server Environment Variables

```bash
# Server Configuration
PORT=8080                    # Server port
HOST=localhost              # Server host
NODE_ENV=development        # Environment

# Authentication
JWT_SECRET=your-secret-key  # JWT signing secret
TOKEN_EXPIRY=24h           # Token expiration
AUTH_ENABLED=true          # Enable authentication

# CORS
CORS_ORIGIN=*              # Allowed origins
CORS_CREDENTIALS=true      # Allow credentials

# Claude Code
CLAUDE_EXECUTABLE_PATH=/usr/local/bin/claude  # Claude CLI path
CLAUDE_DEFAULT_TIMEOUT=30000                  # Process timeout
CLAUDE_MAX_PROCESSES=10                       # Max concurrent processes

# Logging
LOG_LEVEL=info             # Log level
LOG_FILE=logs/app.log      # Log file path
```

### Mobile App Configuration

The mobile app automatically discovers and connects to the API server. Configure the server URL in the app settings or by setting the `EXPO_PUBLIC_API_URL` environment variable.

## 📋 API Documentation

### REST Endpoints

#### Process Management
- `GET /api/processes` - List all processes
- `GET /api/processes/:id` - Get specific process
- `POST /api/processes` - Start new process
- `DELETE /api/processes/:id` - Stop process
- `POST /api/processes/:id/input` - Send input to process

#### System Information
- `GET /api/system/status` - Get system status
- `GET /api/system/health` - Health check

### WebSocket Events

#### Client to Server
- `process_start` - Start new process
- `process_stop` - Stop process
- `process_list` - Request process list
- `claude_input` - Send input to Claude
- `heartbeat` - Keep connection alive

#### Server to Client
- `process_status` - Process status update
- `claude_output` - Output from Claude
- `system_status` - System status update
- `error` - Error notification

## 🧪 Development

### Project Structure
```
claude-code-remote/
├── apps/
│   ├── api/                 # Node.js API server
│   │   ├── src/
│   │   │   ├── config/      # Configuration
│   │   │   ├── routes/      # API routes
│   │   │   ├── services/    # Business logic
│   │   │   ├── utils/       # Utilities
│   │   │   └── websocket/   # WebSocket handling
│   │   └── package.json
│   └── web/                 # React Native app
│       ├── app/             # Expo Router pages
│       ├── components/      # Reusable components
│       ├── hooks/           # Custom hooks
│       ├── services/        # API clients
│       ├── store/           # Redux store
│       └── package.json
├── packages/
│   └── shared/              # Shared code
│       ├── src/
│       │   ├── types/       # TypeScript definitions
│       │   └── utils/       # Utility functions
│       └── package.json
├── docker-compose.yml       # Docker deployment
├── Dockerfile.api          # API server Docker image
└── turbo.json             # Turborepo configuration
```

### Development Commands

```bash
# Install dependencies
npm install

# Development
npm run dev                 # Start all services
npm run dev:api            # Start API server only
npm run dev:web            # Start mobile app only

# Building
npm run build              # Build all packages
npm run build:api          # Build API server
npm run build:web          # Build mobile app

# Testing & Quality
npm run lint               # Lint all packages
npm run type-check         # TypeScript checking
npm run test               # Run tests

# Cleanup
npm run clean              # Clean build artifacts
```

### Mobile App Development

The mobile app uses Expo for development and can run on:
- **iOS Simulator** (macOS only)
- **Android Emulator**
- **Physical devices** via Expo Go
- **Web browser** for testing

```bash
cd apps/web

# Start development server
npm run dev

# Run on specific platform
npm run ios        # iOS simulator
npm run android    # Android emulator
npm run web        # Web browser
```

## 🔒 Security

- **Authentication**: JWT tokens with configurable expiration
- **Rate Limiting**: Configurable request throttling
- **CORS**: Configurable cross-origin policies
- **Input Validation**: Runtime validation with Zod schemas
- **Security Headers**: Helmet.js for HTTP security
- **Process Isolation**: Secure process spawning and management

## 📈 Monitoring & Logging

- **Structured Logging**: Winston with configurable levels
- **Health Checks**: Built-in health endpoints
- **System Metrics**: Resource usage monitoring
- **Process Tracking**: Real-time process status
- **Error Handling**: Comprehensive error reporting

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Run linting and type checking
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

- **Issues**: Report bugs and feature requests on GitHub
- **Documentation**: Check the `/docs` folder for detailed guides
- **Community**: Join our discussions in GitHub Discussions

## 🚀 Roadmap

- [ ] Authentication integration
- [ ] Process templates and presets
- [ ] File upload/download support
- [ ] Plugin system for extensions
- [ ] Performance optimization
- [ ] Advanced monitoring dashboard
- [ ] Multi-server support
- [ ] Cloud deployment guides