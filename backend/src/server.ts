import express, { Request, Response, NextFunction } from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';
import { setupWebSocketHandlers } from './websocket/handlers.js';

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const server = createServer(app);

const allowedOrigins = process.env.CORS_ORIGINS?.split(',') || [
  'http://localhost:3000',
  'http://localhost:3001'
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

app.use(express.json());

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

setupWebSocketHandlers(io);

app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.get('/api/instances', (req: Request, res: Response) => {
  const instances = Array.from((global as any).instances?.values() || []);
  res.json(instances);
});

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

const PORT = Number(process.env.PORT) || 3001;
const HOST = process.env.HOST || '0.0.0.0';

server.listen(PORT, HOST, () => {
  console.log(`
╔══════════════════════════════════════════════════════╗
║                                                      ║
║   🚀 Claude Code Remote Backend Ready!              ║
║                                                      ║
║   Local:    http://localhost:${PORT}                   ║
║   API:      http://localhost:${PORT}/api              ║
║   Socket:   ws://localhost:${PORT}                    ║
║                                                      ║
╚══════════════════════════════════════════════════════╝
  `);
});

export { io };