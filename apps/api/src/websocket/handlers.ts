import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { Server, Socket } from 'socket.io';
import type { 
  ClaudeInstance, 
  DirectoryResponse, 
  ExploreDirectoriesData,
  InstanceStatusData,
  ClaudeMessageData,
  GitStatusData,
  CreateInstanceData,
  DeleteInstanceData,
  RemoteCommandData
} from '../types.js';

declare global {
  var instances: Map<string, ClaudeInstance>;
}

global.instances = global.instances || new Map();

function setupExplorationHandlers(socket: Socket) {
  socket.on('explore_directories', async (data: ExploreDirectoriesData) => {
    const requestPath = data.path || process.env.HOME || '/';
    
    try {
      const fullPath = path.resolve(requestPath);
      const items = fs.readdirSync(fullPath, { withFileTypes: true });
      
      const directories = items
        .filter(item => item.isDirectory() && !item.name.startsWith('.'))
        .map(item => ({
          name: item.name,
          path: path.join(fullPath, item.name),
          isGitRepo: fs.existsSync(path.join(fullPath, item.name, '.git'))
        }));
      
      const parentPath = path.dirname(fullPath);
      const response: DirectoryResponse = {
        currentPath: fullPath,
        canGoUp: parentPath !== fullPath,
        parentPath: parentPath !== fullPath ? parentPath : null,
        directories: directories.sort((a, b) => {
          if (a.isGitRepo && !b.isGitRepo) return -1;
          if (!a.isGitRepo && b.isGitRepo) return 1;
          return a.name.localeCompare(b.name);
        })
      };
      
      socket.emit('directories_list', response);
      
    } catch (error) {
      socket.emit('explore_error', {
        message: `Impossible d'accéder à: ${requestPath}`,
        error: (error as Error).message
      });
    }
  });
}

export function setupWebSocketHandlers(io: Server) {
  io.on('connection', (socket: Socket) => {
    setupExplorationHandlers(socket);
    
    const { instanceId, instanceName, projectPath } = socket.handshake.auth;
    
    if (instanceId) {
      const instance: ClaudeInstance = {
        id: instanceId,
        name: instanceName || 'Unknown Instance',
        projectPath: projectPath || '/',
        status: 'connected',
        stats: {
          messagesCount: 0,
          lastActivity: new Date(),
          tokens: 0,
          changes: 0,
        },
      };
      
      global.instances.set(instanceId, instance);
      socket.join(`instance:${instanceId}`);
      io.emit('instance:connected', instance);
    } else {
      socket.join('web-clients');
      socket.emit('instances:list', Array.from(global.instances.values()));
    }
    
    socket.on('instance:status', (data: InstanceStatusData) => {
      const instance = global.instances.get(data.instanceId);
      if (instance) {
        instance.status = data.status as ClaudeInstance['status'];
        io.to('web-clients').emit('instance:updated', instance);
      }
    });
    
    socket.on('claude:message', (data: ClaudeMessageData) => {
      io.to('web-clients').emit('message:new', data);
      
      const instance = global.instances.get(data.instanceId);
      if (instance) {
        instance.stats.messagesCount++;
        instance.stats.lastActivity = new Date();
      }
    });
    
    socket.on('claude:tool', (data: any) => {
      io.to('web-clients').emit('tool:called', data);
    });
    
    socket.on('git:status', (data: GitStatusData) => {
      io.to('web-clients').emit('git:updated', data);
      
      const instance = global.instances.get(data.instanceId);
      if (instance) {
        instance.stats.changes = 
          (data.modified?.length || 0) + 
          (data.staged?.length || 0) + 
          (data.untracked?.length || 0);
      }
    });
    
    socket.on('notification', (data: any) => {
      io.to('web-clients').emit('notification:new', data);
    });
    
    socket.on('remote:command', (data: RemoteCommandData) => {
      io.to(`instance:${data.instanceId}`).emit('remote:command', data);
    });
    
    socket.on('create_instance', async (data: CreateInstanceData) => {
      const { id, name, projectPath } = data;
      
      try {
        if (!fs.existsSync(projectPath)) {
          socket.emit('instance:error', {
            message: `Le répertoire ${projectPath} n'existe pas`
          });
          return;
        }
        
        const sourceBridgePath = path.join(process.cwd(), '..', 'mcp-bridge.js');
        const destBridgePath = path.join(projectPath, '.claude-remote', 'mcp-bridge.js');
        const configDir = path.dirname(destBridgePath);
        
        if (!fs.existsSync(configDir)) {
          fs.mkdirSync(configDir, { recursive: true });
        }
        
        fs.copyFileSync(sourceBridgePath, destBridgePath);
        
        const mcpConfigPath = path.join(projectPath, '.claude-remote', 'config.json');
        const mcpConfig = {
          mcpServers: {
            "remote-control": {
              command: "node",
              args: [destBridgePath],
              env: {
                INSTANCE_NAME: name,
                INSTANCE_ID: id,
                REMOTE_SERVER: "http://localhost:3001",
                PROJECT_PATH: projectPath
              }
            }
          }
        };
        
        fs.writeFileSync(mcpConfigPath, JSON.stringify(mcpConfig, null, 2));
        
        const launchScriptPath = path.join(projectPath, '.claude-remote', 'launch.sh');
        const launchScript = `#!/bin/bash
exec claude --mcp-config "${mcpConfigPath}"
`;
        
        fs.writeFileSync(launchScriptPath, launchScript);
        fs.chmodSync(launchScriptPath, '755');
        
        const child = spawn('bash', [launchScriptPath], {
          detached: true,
          stdio: 'ignore',
          cwd: projectPath
        });
        
        child.unref();
        
        socket.emit('instance:created', {
          id,
          name,
          projectPath,
          status: 'launching',
          configPath: mcpConfigPath,
          launchScript: launchScriptPath
        });
        
      } catch (error) {
        socket.emit('instance:error', {
          id,
          message: `Erreur lors de la création: ${(error as Error).message}`
        });
      }
    });
    
    socket.on('delete_instance', (data: DeleteInstanceData) => {
      const { id } = data;
      const instance = global.instances.get(id);
      
      if (instance) {
        io.to(`instance:${id}`).emit('instance:terminate');
        global.instances.delete(id);
        io.to('web-clients').emit('instance:deleted', { id });
      }
    });
    
    socket.on('disconnect', () => {
      for (const [id, instance] of global.instances.entries()) {
        if (socket.rooms.has(`instance:${id}`)) {
          instance.status = 'disconnected';
          io.to('web-clients').emit('instance:disconnected', instance);
        }
      }
    });
  });
}