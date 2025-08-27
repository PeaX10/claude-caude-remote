import { useEffect } from 'react';
import { useProjectStore } from '../store/project-store';

export function useDemoProjects() {
  const { projects, addProject, addTab, addRecentSession } = useProjectStore();
  
  useEffect(() => {
    // Only initialize demo data if no projects exist
    if (projects.length === 0) {
      // Add first project
      const project1Id = addProject({
        name: 'claude-code-remote',
        path: '/Users/peax/Projects/claude-code-remote',
        stats: {
          filesChanged: 15,
          linesAdded: 450,
          linesDeleted: 120,
          commitsBehind: 3,
        }
      });
      
      // Add tabs to first project with demo messages
      const tab1Id = addTab(project1Id, {
        sessionId: 'session_001',
        title: 'Implement Auth System',
        lastMessage: 'Added JWT authentication with refresh tokens',
        messages: [
          { human: 'I need to implement JWT authentication for the API', timestamp: Date.now() - 3600000 },
          { assistant: 'I\'ll help you implement JWT authentication. Let me start by setting up the necessary dependencies and middleware.', timestamp: Date.now() - 3500000 },
          { tool_use: { name: 'Read', id: 'tool_1', input: { file_path: '/api/auth.js' } }, timestamp: Date.now() - 3400000 },
          { tool_result: { tool_use_id: 'tool_1', output: 'File contents...', is_error: false }, timestamp: Date.now() - 3300000 },
          { assistant: 'I\'ve reviewed your auth file. Now let me implement the JWT token generation and verification.', timestamp: Date.now() - 3200000 },
          { human: 'Make sure to include refresh tokens as well', timestamp: Date.now() - 3000000 },
          { assistant: 'Absolutely! I\'ll add refresh token functionality with proper expiration handling.', timestamp: Date.now() - 2900000 },
          { tool_use: { name: 'Edit', id: 'tool_2', input: { file_path: '/api/auth.js', old_string: '...', new_string: '...' } }, timestamp: Date.now() - 2800000 },
          { assistant: 'Added JWT authentication with refresh tokens. The system now supports secure token generation and validation.', timestamp: Date.now() - 2700000 }
        ]
      } as any);
      
      const tab2Id = addTab(project1Id, {
        sessionId: 'session_002',
        title: 'Fix WebSocket Issues',
        lastMessage: 'Resolved connection timeout problems',
        messages: [
          { human: 'The WebSocket connection keeps timing out after a few minutes', timestamp: Date.now() - 7200000 },
          { assistant: 'Let me investigate the WebSocket timeout issue. I\'ll check the server configuration and client settings.', timestamp: Date.now() - 7100000 },
          { tool_use: { name: 'Grep', id: 'tool_3', input: { pattern: 'WebSocket|ws|socket', path: './' } }, timestamp: Date.now() - 7000000 },
          { assistant: 'I found the issue - the heartbeat interval isn\'t properly configured. Let me fix that.', timestamp: Date.now() - 6900000 },
          { tool_use: { name: 'Edit', id: 'tool_4', input: { file_path: '/server/websocket.js', old_string: '...', new_string: '...' } }, timestamp: Date.now() - 6800000 },
          { assistant: 'Resolved connection timeout problems by implementing proper heartbeat mechanism.', timestamp: Date.now() - 6700000 }
        ]
      } as any);
      
      // Add second project
      const project2Id = addProject({
        name: 'sharkblock-nestjs',
        path: '/Users/peax/Projects/Sharkblock/sharkblock-nestjs',
        stats: {
          filesChanged: 8,
          linesAdded: 230,
          linesDeleted: 45,
          commitsBehind: 0,
        }
      });
      
      // Add tab to second project with demo messages
      addTab(project2Id, {
        sessionId: 'session_003',
        title: 'Database Migration',
        lastMessage: 'Migrated from MongoDB to PostgreSQL',
        messages: [
          { human: 'We need to migrate our database from MongoDB to PostgreSQL for better relational data handling', timestamp: Date.now() - 14400000 },
          { assistant: 'I\'ll help you migrate from MongoDB to PostgreSQL. This will involve schema design, data transformation, and updating the application layer.', timestamp: Date.now() - 14300000 },
          { tool_use: { name: 'Read', id: 'tool_5', input: { file_path: '/models/user.js' } }, timestamp: Date.now() - 14200000 },
          { assistant: 'I\'ve analyzed your MongoDB schemas. Let me create the PostgreSQL migration scripts.', timestamp: Date.now() - 14100000 },
          { tool_use: { name: 'Write', id: 'tool_6', input: { file_path: '/migrations/001_create_users.sql', content: '...' } }, timestamp: Date.now() - 14000000 },
          { assistant: 'Successfully migrated from MongoDB to PostgreSQL with all data preserved and relationships established.', timestamp: Date.now() - 13900000 }
        ]
      } as any);
      
      // Add recent sessions
      addRecentSession({
        projectId: project1Id,
        title: 'Implement Auth System',
        lastMessage: 'Added JWT authentication with refresh tokens',
      });
      
      addRecentSession({
        projectId: project1Id,
        title: 'Fix WebSocket Issues',
        lastMessage: 'Resolved connection timeout problems',
      });
      
      addRecentSession({
        projectId: project2Id,
        title: 'Database Migration',
        lastMessage: 'Migrated from MongoDB to PostgreSQL',
      });
      
      addRecentSession({
        projectId: project1Id,
        title: 'Add Dark Mode',
        lastMessage: 'Implemented theme switching with context API',
      });
      
      addRecentSession({
        projectId: project2Id,
        title: 'API Optimization',
        lastMessage: 'Reduced response time by 40% with caching',
      });
    }
  }, []); // Only run once on mount
}