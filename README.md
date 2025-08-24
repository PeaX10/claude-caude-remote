# Claude Code Remote Control

Remote control Claude Code from mobile devices with real-time communication.

## Structure

- **`apps/api`**: Node.js server with WebSocket/REST API
- **`apps/web`**: React Native Expo mobile app

## Quick Start

```bash
bun install
bun run dev
```

## API Endpoints

- `GET /health` - Health check
- `POST /claude/start` - Start Claude Code
- `POST /claude/message` - Send message
- `GET /claude/status` - Get status

## WebSocket Events

- `claude_output` - Output from Claude
- `claude_error` - Error messages  
- `claude_status` - Status updates