# Development Guide

This guide provides detailed information for developers working on the Claude Code Remote project.

## 🏗️ Architecture Overview

```
┌─────────────────┐    WebSocket/REST    ┌─────────────────┐
│                 │◄────────────────────►│                 │
│   Mobile App    │                      │   API Server    │
│  (React Native) │                      │    (Node.js)    │
│                 │                      │                 │
└─────────────────┘                      └─────────────────┘
         │                                         │
         │                                         │
         ▼                                         ▼
┌─────────────────┐                      ┌─────────────────┐
│                 │                      │                 │
│ Redux Store     │                      │ Claude Process  │
│ (State Mgmt)    │                      │ Manager         │
│                 │                      │                 │
└─────────────────┘                      └─────────────────┘
```

### Key Components

#### API Server (`apps/api`)
- **Express Server**: REST API endpoints for process management
- **WebSocket Server**: Real-time communication for live updates
- **Process Manager**: Spawns and manages Claude Code instances
- **Authentication**: JWT-based auth with configurable security
- **Rate Limiting**: Protects against abuse with configurable limits

#### Mobile App (`apps/web`)
- **Expo Router**: File-based routing system
- **Redux Toolkit**: State management with persistence
- **React Native Paper**: Material Design components
- **WebSocket Client**: Real-time server communication
- **Cross-platform**: iOS, Android, and Web support

#### Shared Package (`packages/shared`)
- **Type Definitions**: Comprehensive TypeScript types
- **Validation Schemas**: Zod schemas for runtime validation
- **Utility Functions**: Common helpers for both apps

## 🛠️ Development Workflow

### Initial Setup

```bash
# Run the automated setup script
./scripts/setup.sh

# Or manual setup:
npm install
npm run build
cp apps/api/.env.example apps/api/.env
# Edit .env file as needed
```

### Daily Development

```bash
# Start all services in development mode
npm run dev

# The following will be available:
# - API Server: http://localhost:8080
# - Mobile App: Metro bundler on http://localhost:19006
# - WebSocket: ws://localhost:8080/ws
```

### Individual Service Development

```bash
# API server only
npm run dev --filter=@claude-remote/api

# Mobile app only  
npm run dev --filter=@claude-remote/web

# Build specific package
npm run build --filter=@claude-remote/shared
```

## 📱 Mobile App Development

### Running on Different Platforms

```bash
cd apps/web

# iOS Simulator (macOS only)
npm run ios

# Android Emulator
npm run android

# Web browser
npm run web

# Start Metro bundler
npm run start
```

### Using Physical Device

1. Install Expo Go app on your device
2. Run `npm run start` in `apps/web`
3. Scan QR code with Expo Go (Android) or Camera app (iOS)

### Debugging

- **Flipper**: React Native debugging tools
- **React DevTools**: Component inspection
- **Redux DevTools**: State management debugging
- **Metro Logs**: JavaScript bundler logs

## 🔧 API Server Development

### Environment Configuration

Key environment variables in `apps/api/.env`:

```env
# Server
PORT=8080
HOST=localhost
NODE_ENV=development

# Security
JWT_SECRET=your-generated-secret
AUTH_ENABLED=true

# Claude Code
CLAUDE_EXECUTABLE_PATH=/path/to/claude
CLAUDE_MAX_PROCESSES=10

# Logging
LOG_LEVEL=debug
LOG_FILE=logs/app.log
```

### Testing API Endpoints

```bash
# Health check
curl http://localhost:8080/health

# List processes
curl http://localhost:8080/api/processes

# Start process
curl -X POST http://localhost:8080/api/processes \
  -H "Content-Type: application/json" \
  -d '{"projectPath": "/path/to/project", "title": "Test Process"}'
```

### WebSocket Testing

```javascript
// Connect to WebSocket
const ws = new WebSocket('ws://localhost:8080/ws');

// Send message
ws.send(JSON.stringify({
  id: 'test-1',
  type: 'process_list',
  data: {},
  timestamp: new Date()
}));
```

## 🧪 Testing

### Running Tests

```bash
# All tests
npm run test

# Specific package
npm run test --filter=@claude-remote/api
npm run test --filter=@claude-remote/web
```

### Test Structure

```
apps/api/src/
├── __tests__/           # Unit tests
├── routes/__tests__/    # Route tests
└── services/__tests__/  # Service tests

apps/web/
├── __tests__/           # Component tests
├── hooks/__tests__/     # Hook tests
└── services/__tests__/  # Service tests
```

## 🔍 Code Quality

### Linting and Formatting

```bash
# Lint all code
npm run lint

# Type checking
npm run type-check

# Fix linting issues
npm run lint:fix
```

### Pre-commit Hooks

The project uses pre-commit hooks to ensure code quality:
- TypeScript compilation
- ESLint checks
- Prettier formatting

## 📊 Monitoring and Debugging

### Logging

API server uses structured logging with Winston:

```typescript
import { logger } from '../utils/logger';

logger.info('Process started', { processId, projectPath });
logger.error('Failed to start process', { error: error.message });
```

Log levels: `debug`, `info`, `warn`, `error`

### Health Monitoring

- **Health Endpoint**: `GET /health`
- **System Status**: `GET /api/system/status`
- **Process Metrics**: Built-in process monitoring

## 🚀 Building and Deployment

### Development Build

```bash
npm run build
```

### Production Deployment

#### Docker

```bash
# Build and run with Docker Compose
docker-compose up -d

# Build individual image
docker build -f Dockerfile.api -t claude-remote-api .
```

#### Manual Deployment

```bash
# Build for production
NODE_ENV=production npm run build

# Start API server
cd apps/api
NODE_ENV=production node dist/server.js

# Build mobile app for distribution
cd apps/web
expo build:android  # or expo build:ios
```

## 🔧 Troubleshooting

### Common Issues

#### WebSocket Connection Failed
- Check if API server is running
- Verify WebSocket URL in mobile app
- Check network connectivity

#### Mobile App Won't Start
- Clear Metro cache: `npx expo r -c`
- Reinstall dependencies: `rm -rf node_modules && npm install`
- Check Expo CLI version: `expo --version`

#### API Server Crashes
- Check logs in `apps/api/logs/app.log`
- Verify Claude Code CLI installation
- Check environment variables

#### Build Failures
- Clear Turbo cache: `npm run clean`
- Rebuild all packages: `npm run build`
- Check TypeScript errors: `npm run type-check`

### Debug Commands

```bash
# Verbose logging
LOG_LEVEL=debug npm run dev

# Clean everything and rebuild
npm run clean && npm install && npm run build

# Check dependency issues
npm audit
npm ls --depth=0
```

## 🤝 Contributing Guidelines

### Code Style

- Use TypeScript for all new code
- Follow ESLint configuration
- Use meaningful variable and function names
- Add JSDoc comments for public APIs

### Git Workflow

1. Create feature branch: `git checkout -b feature/your-feature`
2. Make changes with descriptive commits
3. Run tests and linting: `npm run test && npm run lint`
4. Push and create pull request

### Pull Request Process

1. Ensure all tests pass
2. Update documentation if needed
3. Add relevant screenshots for UI changes
4. Request review from maintainers

## 📚 Additional Resources

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Paper](https://reactnativepaper.com/)
- [Redux Toolkit](https://redux-toolkit.js.org/)
- [Express.js](https://expressjs.com/)
- [WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
- [Turborepo](https://turbo.build/repo/docs)

## 🎯 Performance Tips

### API Server
- Use clustering for production deployment
- Implement connection pooling for databases
- Monitor memory usage with processes
- Use Redis for session storage in production

### Mobile App
- Implement lazy loading for screens
- Use FlatList for large lists
- Optimize images and assets
- Monitor JavaScript thread performance

### WebSocket
- Implement heartbeat mechanism
- Handle reconnection gracefully
- Buffer messages during disconnection
- Use compression for large payloads