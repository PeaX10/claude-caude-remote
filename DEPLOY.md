# 🚀 Production Deployment

Production deployment guide for Claude Code Remote Control.

## 🌐 VPS / Dedicated Server

### 1. Build & Compile

```bash
# Build TypeScript backend
cd backend
bun run build

# Build Next.js frontend  
cd ..
bun run build
```

### 2. Production Start

```bash
# Start backend (port 3001)
cd backend
NODE_ENV=production bun start

# Start frontend (port 3000)
NODE_ENV=production bun start
```

### 3. Nginx Reverse Proxy (Recommended)

```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    # Frontend proxy
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Backend API proxy
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # WebSocket proxy
    location /socket.io/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 4. SSL with Certbot (HTTPS)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### 5. Process Management with PM2

```bash
# Install PM2 globally
npm install -g pm2

# Create ecosystem file
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [
    {
      name: 'claude-remote-backend',
      script: 'dist/server.js',
      cwd: './backend',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
        HOST: '0.0.0.0'
      },
      instances: 1,
      exec_mode: 'fork'
    },
    {
      name: 'claude-remote-frontend', 
      script: 'bun',
      args: 'start',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      instances: 1,
      exec_mode: 'fork'
    }
  ]
};
EOF

# Start with PM2
pm2 start ecosystem.config.js

# Save PM2 config
pm2 save
pm2 startup
```

## 🔧 Environment Variables

### Backend (`.env`)
```env
NODE_ENV=production
PORT=3001
HOST=0.0.0.0
```

### Frontend (`.env.local`)
```env
NODE_ENV=production
NEXT_PUBLIC_BACKEND_URL=https://your-domain.com
```

## 🐳 Docker Deployment (Alternative)

### Dockerfile (Backend)
```dockerfile
FROM oven/bun:1 AS base
WORKDIR /app

# Install dependencies
COPY backend/package*.json ./
RUN bun install --frozen-lockfile

# Build
COPY backend/ .
RUN bun run build

# Production
FROM oven/bun:1-slim
WORKDIR /app
COPY --from=base /app/dist ./dist
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/package.json ./

EXPOSE 3001
CMD ["bun", "start"]
```

### Dockerfile (Frontend)
```dockerfile
FROM node:20-alpine AS base

# Dependencies
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# Build
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Production
FROM base AS runner
WORKDIR /app
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
```

### Docker Compose
```yaml
version: '3.8'
services:
  backend:
    build: 
      context: .
      dockerfile: backend/Dockerfile
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - PORT=3001
    restart: unless-stopped

  frontend:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_BACKEND_URL=http://backend:3001
    depends_on:
      - backend
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - frontend
      - backend
    restart: unless-stopped
```

## 🌐 Tunnel Services (Development/Testing)

### Ngrok
```bash
# Install ngrok
npm install -g ngrok

# Expose frontend
ngrok http 3000

# Expose backend (separate terminal)
ngrok http 3001
```

### Cloudflare Tunnel
```bash
# Install cloudflared
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64
sudo mv cloudflared-linux-amd64 /usr/local/bin/cloudflared
sudo chmod +x /usr/local/bin/cloudflared

# Create tunnel
cloudflared tunnel create claude-remote

# Configure tunnel
cat > ~/.cloudflared/config.yml << EOF
tunnel: your-tunnel-id
credentials-file: ~/.cloudflared/your-tunnel-id.json

ingress:
  - hostname: your-domain.com
    service: http://localhost:3000
  - hostname: api.your-domain.com  
    service: http://localhost:3001
  - service: http_status:404
EOF

# Run tunnel
cloudflared tunnel run claude-remote
```

## 📊 Monitoring & Logs

### PM2 Monitoring
```bash
# Monitor processes
pm2 monit

# View logs
pm2 logs claude-remote-backend
pm2 logs claude-remote-frontend

# Restart services
pm2 restart all
```

### System Service (Alternative to PM2)
```bash
# Create systemd service
sudo tee /etc/systemd/system/claude-remote.service > /dev/null <<EOF
[Unit]
Description=Claude Code Remote Control
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/path/to/app
ExecStart=/usr/local/bin/bun start
Restart=on-failure

[Install]
WantedBy=multi-user.target
EOF

# Enable and start
sudo systemctl enable claude-remote
sudo systemctl start claude-remote
```

## 🔒 Security Best Practices

- Use HTTPS/SSL certificates
- Configure firewall (UFW/iptables)
- Regular system updates
- Strong passwords/SSH keys
- Fail2ban for SSH protection
- Regular backups

---

*Professional deployment for global accessibility! 🌍*