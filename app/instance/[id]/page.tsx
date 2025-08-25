"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, MessageSquare, GitBranch, Terminal as TerminalIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChatTab } from "@/components/ChatTab";
import { GitTab } from "@/components/GitTab";
import { TerminalTab } from "@/components/TerminalTab";
import { useStore } from "@/lib/store";
import { toast } from "sonner";
import { io, Socket } from "socket.io-client";
import type { Message, GitStatus } from "@/lib/types";

export default function InstanceView() {
  const params = useParams();
  const router = useRouter();
  const instanceId = params.id as string;
  
  const { 
    instances, 
    messages, 
    gitStatus,
    addMessage, 
    updateGitStatus 
  } = useStore();
  
  const [socket, setSocket] = useState<Socket | null>(null);
  const [inputMessage, setInputMessage] = useState("");
  
  const instance = instances.get(instanceId);
  const instanceMessages = messages.get(instanceId) || [];
  const instanceGit = gitStatus.get(instanceId);
  
  useEffect(() => {
    if (!instance) {
      router.push("/");
      return;
    }
    
    document.body.classList.add('fullscreen-mode');
    
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
    console.log('🔌 Instance page connecting to:', backendUrl);
    const newSocket = io(backendUrl, {
      path: '/socket.io/',
      transports: ['websocket', 'polling']
    });
    
    newSocket.on('connect', () => {
      console.log('Connected to instance view');
      newSocket.emit('join:instance', { instanceId });
    });
    
    newSocket.on('message:new', (data: { instanceId: string; type: string; content: string; timestamp: string; toolCall?: { name: string; args: Record<string, unknown>; result?: Record<string, unknown> } }) => {
      if (data.instanceId === instanceId) {
        const message: Message = {
          id: Date.now().toString(),
          instanceId: data.instanceId,
          type: data.type as 'user' | 'assistant' | 'tool' | 'system',
          content: data.content,
          timestamp: new Date(data.timestamp),
          toolCall: data.toolCall
        };
        
        addMessage(instanceId, message);
        
        if (message.type === 'tool' && message.toolCall?.name === 'approve_request') {
          toast.info(`Tool request: ${message.toolCall.name}`, {
            description: message.content,
            duration: 10000,
            action: {
              label: "View Details",
              onClick: () => console.log("Tool call:", message.toolCall),
            },
            cancel: {
              label: "Dismiss",
              onClick: () => console.log("Dismissed"),
            },
          });
        }
      }
    });
    
    newSocket.on('git:status', (data: { instanceId: string; status: GitStatus }) => {
      if (data.instanceId === instanceId) {
        updateGitStatus(instanceId, data.status);
      }
    });
    
    newSocket.on('claude:output', (data: { instanceId: string; type: string; content: string }) => {
      if (data.instanceId === instanceId) {
        const message: Message = {
          id: Date.now().toString(),
          instanceId,
          type: 'assistant',
          content: data.content,
          timestamp: new Date()
        };
        addMessage(instanceId, message);
      }
    });
    
    setSocket(newSocket);
    
    return () => {
      newSocket.close();
      document.body.classList.remove('fullscreen-mode');
    };
  }, [instanceId, instance, router, addMessage, updateGitStatus]);
  
  const sendMessage = () => {
    if (!inputMessage.trim() || !socket) return;
    
    const message: Message = {
      id: Date.now().toString(),
      instanceId,
      type: 'user',
      content: inputMessage,
      timestamp: new Date(),
    };
    
    addMessage(instanceId, message);
    
    socket.emit('claude:message', {
      instanceId,
      message: inputMessage
    });
    
    setInputMessage("");
  };
  
  if (!instance) {
    return null;
  }
  
  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <div className="bg-white/80 backdrop-blur-sm shrink-0">
        <div className="flex items-center justify-between p-3 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" size="sm" className="hover:bg-gray-100">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${socket?.connected ? 'bg-green-500' : 'bg-red-500'}`} />
              <h2 className="font-medium text-gray-900 truncate">{instance.name}</h2>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <Tabs defaultValue="chat" className="flex-1 flex flex-col">
          <TabsList className="bg-gray-50 w-full justify-start rounded-none border-b border-gray-200 shrink-0">
            <TabsTrigger value="chat" className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:border-b-2 data-[state=active]:border-blue-500 rounded-none">
              <MessageSquare className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">Chat</span>
            </TabsTrigger>
            <TabsTrigger value="git" className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:border-b-2 data-[state=active]:border-blue-500 rounded-none">
              <GitBranch className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">Git</span>
            </TabsTrigger>
            <TabsTrigger value="terminal" className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:border-b-2 data-[state=active]:border-blue-500 rounded-none">
              <TerminalIcon className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">Terminal</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="chat" className="flex-1 overflow-hidden p-0 m-0 relative">
            <ChatTab 
              instanceMessages={instanceMessages}
              inputMessage={inputMessage}
              setInputMessage={setInputMessage}
              sendMessage={sendMessage}
              socket={socket}
              instanceId={instanceId}
              addMessage={addMessage}
            />
          </TabsContent>
          
          <TabsContent value="git" className="flex-1 overflow-hidden p-0 m-0">
            <GitTab instanceGit={instanceGit} />
          </TabsContent>
          
          <TabsContent value="terminal" className="flex-1 overflow-hidden p-0 m-0">
            <TerminalTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}