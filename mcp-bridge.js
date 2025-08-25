#!/usr/bin/env node

/**
 * MCP Bridge v3 for Claude Code Remote Control
 * Using proper schemas from MCP SDK
 */

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { 
  ListToolsRequestSchema, 
  CallToolRequestSchema 
} = require('@modelcontextprotocol/sdk/types.js');
const io = require('socket.io-client');
const simpleGit = require('simple-git');
const chokidar = require('chokidar');

class ClaudeRemoteBridge {
  constructor() {
    // Get configuration from environment
    this.instanceId = process.env.INSTANCE_ID || `instance-${Date.now()}`;
    this.instanceName = process.env.INSTANCE_NAME || 'Claude Code Instance';
    this.projectPath = process.env.PROJECT_PATH || process.cwd();
    this.serverUrl = process.env.REMOTE_SERVER || 'http://localhost:3000';
    
    console.error(`[MCP Bridge v3] Starting for ${this.instanceName}`);
    console.error(`[MCP Bridge v3] Instance ID: ${this.instanceId}`);
    console.error(`[MCP Bridge v3] Project: ${this.projectPath}`);
    console.error(`[MCP Bridge v3] Server: ${this.serverUrl}`);
    
    // Initialize git
    this.git = simpleGit(this.projectPath);
    
    // Initialize MCP server
    this.initializeMCPServer();
    
    // Connect to remote server
    this.connectToServer();
    
    // Setup file watcher
    this.setupFileWatcher();
  }
  
  initializeMCPServer() {
    // Create server with proper configuration
    this.server = new Server(
      {
        name: 'claude-remote-control',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );
    
    // Handle ListToolsRequest
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      console.error('[MCP Bridge v3] Tools list requested');
      return {
        tools: [
          {
            name: 'remote_notify',
            description: 'Send a notification to the remote control interface',
            inputSchema: {
              type: 'object',
              properties: {
                title: { 
                  type: 'string',
                  description: 'Notification title'
                },
                message: { 
                  type: 'string',
                  description: 'Notification message'
                },
                type: { 
                  type: 'string', 
                  enum: ['info', 'warning', 'error', 'action'],
                  default: 'info',
                  description: 'Notification type'
                },
              },
              required: ['title', 'message'],
            },
          },
          {
            name: 'remote_status',
            description: 'Update status in remote control interface',
            inputSchema: {
              type: 'object',
              properties: {
                status: { 
                  type: 'string', 
                  enum: ['idle', 'busy', 'thinking'],
                  description: 'New status'
                },
              },
              required: ['status'],
            },
          },
          {
            name: 'remote_log',
            description: 'Log activity to remote control interface',
            inputSchema: {
              type: 'object',
              properties: {
                type: { 
                  type: 'string',
                  description: 'Log type (user, assistant, system, thinking)'
                },
                content: { 
                  type: 'string',
                  description: 'Log content'
                },
              },
              required: ['type', 'content'],
            },
          },
        ],
      };
    });
    
    // Handle CallToolRequest
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const tool = request.params.name;
      const args = request.params.arguments || {};
      
      console.error(`[MCP Bridge v3] Tool called: ${tool}`, JSON.stringify(args));
      
      // Send to remote if connected
      if (this.socket && this.socket.connected) {
        this.socket.emit('claude:tool', {
          tool,
          args,
          timestamp: Date.now(),
        });
      }
      
      switch (tool) {
        case 'remote_notify':
          if (this.socket && this.socket.connected) {
            this.socket.emit('notification', {
              instanceId: this.instanceId,
              ...args,
              timestamp: Date.now(),
            });
          }
          return {
            content: [
              { 
                type: 'text', 
                text: `✅ Notification sent: ${args.title}` 
              }
            ],
          };
          
        case 'remote_status':
          this.updateStatus(args.status);
          return {
            content: [
              { 
                type: 'text', 
                text: `✅ Status updated to: ${args.status}` 
              }
            ],
          };
          
        case 'remote_log':
          if (this.socket && this.socket.connected) {
            this.socket.emit('claude:message', {
              instanceId: this.instanceId,
              type: args.type,
              content: args.content,
              timestamp: Date.now(),
            });
          }
          return {
            content: [
              { 
                type: 'text', 
                text: `✅ Logged to remote: ${args.type}` 
              }
            ],
          };
          
        default:
          return {
            content: [
              { 
                type: 'text', 
                text: `❌ Unknown tool: ${tool}` 
              }
            ],
            isError: true,
          };
      }
    });
    
    console.error('[MCP Bridge v3] MCP Server initialized with tools');
  }
  
  connectToServer() {
    console.error(`[MCP Bridge v3] Connecting to ${this.serverUrl}...`);
    
    this.socket = io(this.serverUrl, {
      auth: {
        instanceId: this.instanceId,
        instanceName: this.instanceName,
        projectPath: this.projectPath,
      },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
    });
    
    this.socket.on('connect', () => {
      console.error('[MCP Bridge v3] ✅ Connected to remote server');
      this.updateStatus('connected');
    });
    
    this.socket.on('disconnect', () => {
      console.error('[MCP Bridge v3] ❌ Disconnected from remote server');
      this.updateStatus('disconnected');
    });
    
    this.socket.on('connect_error', (error) => {
      console.error('[MCP Bridge v3] Connection error:', error.message);
    });
    
    this.socket.on('remote:command', (data) => {
      console.error('[MCP Bridge v3] Received remote command:', data);
      // Handle remote commands here
    });
  }
  
  setupFileWatcher() {
    console.error('[MCP Bridge v3] Setting up file watcher...');
    
    const watcher = chokidar.watch(this.projectPath, {
      ignored: [
        /(^|[\/\\])\../,
        /node_modules/,
        /.git/,
        /dist/,
        /build/,
        /bun.lockb/,
        /package-lock.json/,
      ],
      persistent: true,
      ignoreInitial: true,
    });
    
    let debounceTimer;
    const debouncedUpdate = () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => this.updateGitStatus(), 1000);
    };
    
    watcher.on('change', debouncedUpdate);
    watcher.on('add', debouncedUpdate);
    watcher.on('unlink', debouncedUpdate);
    
    // Initial git status
    this.updateGitStatus();
  }
  
  async updateGitStatus() {
    try {
      const status = await this.git.status();
      const log = await this.git.log(['--oneline', '-10']);
      
      if (this.socket && this.socket.connected) {
        this.socket.emit('git:status', {
          instanceId: this.instanceId,
          modified: status.modified || [],
          staged: status.staged || [],
          untracked: status.not_added || [],
          commits: log.all.map(commit => ({
            hash: commit.hash,
            message: commit.message,
            author: commit.author_name,
            date: commit.date,
          })),
        });
        console.error(`[MCP Bridge v3] Git status updated: ${status.modified.length} modified, ${status.staged.length} staged`);
      }
    } catch (error) {
      console.error('[MCP Bridge v3] Error updating git status:', error.message);
    }
  }
  
  updateStatus(status) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('instance:status', {
        instanceId: this.instanceId,
        status,
      });
    }
  }
  
  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('[MCP Bridge v3] 🚀 Server running on stdio transport');
    console.error('[MCP Bridge v3] Ready to receive commands from Claude Code');
  }
}

// Start the bridge
const bridge = new ClaudeRemoteBridge();
bridge.run().catch((error) => {
  console.error('[MCP Bridge v3] Fatal error:', error);
  process.exit(1);
});