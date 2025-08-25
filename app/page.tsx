"use client";

import { useEffect, useState } from "react";
import { Plus, Sparkles, Terminal, GitBranch, RefreshCw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { InstanceCard } from "@/components/InstanceCard";
import { CreateInstanceDialog } from "@/components/CreateInstanceDialog";
import { useStore } from "@/lib/store";
import type { ClaudeInstance } from "@/lib/types";
import { io, Socket } from "socket.io-client";

export default function Dashboard() {
  const { instances, addInstance, updateInstance, removeInstance } = useStore();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnecting, setIsConnecting] = useState(true);

  useEffect(() => {
    document.body.classList.add('fullscreen-mode');

    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
    console.log('🔌 Main page connecting to:', backendUrl);
    const newSocket = io(backendUrl, {
      path: '/socket.io/',
      transports: ['websocket', 'polling']
    });

    newSocket.on('connect', () => {
      setIsConnecting(false);
    });

    newSocket.on('instances:list', (instancesList: ClaudeInstance[]) => {
      instancesList.forEach(instance => {
        addInstance(instance);
      });
    });

    newSocket.on('instance:connected', (instance: ClaudeInstance) => {
      addInstance(instance);
    });

    newSocket.on('instance:updated', (instance: ClaudeInstance) => {
      updateInstance(instance.id, instance);
    });

    newSocket.on('instance:disconnected', (instance: ClaudeInstance) => {
      updateInstance(instance.id, { status: 'disconnected' });
    });

    newSocket.on('instance:deleted', ({ id }: { id: string }) => {
      removeInstance(id);
    });


    if (typeof window !== 'undefined') {
      (window as any).socket = newSocket;
    }

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [addInstance, updateInstance]);

  const instanceArray = Array.from(instances.values());

  return (
    <div className="h-screen flex flex-col p-4 md:p-8">
      <header className="flex-shrink-0 mb-6 md:mb-8 text-center md:text-left">
        <h1 className="text-2xl md:text-4xl font-bold mb-2 glass-text flex items-center justify-center md:justify-start gap-3">
          <Sparkles className="w-6 h-6 md:w-8 md:h-8 flex-shrink-0" />
          <span className="min-w-0">Claude Code Control Center</span>
        </h1>
        <p className="text-base md:text-lg opacity-70 text-break">
          Manage and control multiple Claude Code instances from one place
        </p>
      </header>

      {isConnecting && (
        <div className="flex-shrink-0 flex items-center justify-center mb-8">
          <Card className="glass-card">
            <CardContent className="flex items-center gap-2 p-4">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Connecting to server...</span>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-12">
          {instanceArray.map((instance) => (
            <InstanceCard key={instance.id} instance={instance} />
          ))}
          <CreateInstanceDialog socket={socket} />
        </div>
      </div>

      <footer className="flex-shrink-0 mt-6 text-center text-sm opacity-60">
        <p>
          Server: {typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'} • 
          WebSocket: {socket?.connected ? 'Connected' : 'Disconnected'}
        </p>
      </footer>
    </div>
  );
}