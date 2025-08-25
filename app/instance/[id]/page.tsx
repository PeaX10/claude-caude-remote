"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, MessageSquare, GitBranch, Terminal as TerminalIcon, Send, Check, X } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusDot } from "@/components/StatusDot";
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
    
    // Initialize WebSocket connection
    const newSocket = io(typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000', {
      path: '/socket.io/',
    });
    
    newSocket.on('connect', () => {
      console.log('Connected to instance view');
      // Join the room for this specific instance
      newSocket.emit('join:instance', { instanceId });
    });
    
    // Handle new messages
    newSocket.on('message:new', (data: any) => {
      if (data.instanceId === instanceId) {
        const message: Message = {
          id: `msg-${Date.now()}`,
          instanceId: data.instanceId,
          type: data.type || 'assistant',
          content: data.content,
          timestamp: new Date(data.timestamp),
          metadata: data.metadata,
        };
        addMessage(instanceId, message);
        
        // Show toast for important messages
        if (data.type === 'action') {
          toast.custom((t) => (
            <div className="glass p-4 rounded-xl">
              <div className="flex items-start gap-3">
                <Badge>{instance.name}</Badge>
                <div className="flex-1">
                  <p className="font-medium">Action Required</p>
                  <p className="text-sm opacity-80 mt-1">{data.content}</p>
                  <div className="flex gap-2 mt-3">
                    <Button 
                      size="sm" 
                      onClick={() => {
                        newSocket.emit('remote:command', {
                          instanceId,
                          command: 'approve',
                          data: { messageId: message.id }
                        });
                        toast.dismiss(t);
                      }}
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Approve
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => {
                        newSocket.emit('remote:command', {
                          instanceId,
                          command: 'reject',
                          data: { messageId: message.id }
                        });
                        toast.dismiss(t);
                      }}
                    >
                      <X className="w-4 h-4 mr-1" />
                      Reject
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ));
        }
      }
    });
    
    // Handle Git updates
    newSocket.on('git:updated', (data: any) => {
      if (data.instanceId === instanceId) {
        updateGitStatus(instanceId, {
          modified: data.modified || [],
          staged: data.staged || [],
          untracked: data.untracked || [],
          commits: data.commits || [],
        });
      }
    });
    
    // Handle notifications
    newSocket.on('notification:new', (data: any) => {
      if (data.instanceId === instanceId) {
        toast(data.title, {
          description: data.message,
        });
      }
    });
    
    setSocket(newSocket);
    
    return () => {
      newSocket.close();
    };
  }, [instanceId, instance, router, addMessage, updateGitStatus]);
  
  const sendMessage = () => {
    if (!inputMessage.trim() || !socket) return;
    
    const message: Message = {
      id: `msg-${Date.now()}`,
      instanceId,
      type: 'user',
      content: inputMessage,
      timestamp: new Date(),
    };
    
    addMessage(instanceId, message);
    socket.emit('remote:command', {
      instanceId,
      command: 'message',
      data: { content: inputMessage }
    });
    
    setInputMessage("");
  };
  
  if (!instance) {
    return null;
  }
  
  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="glass p-4 flex items-center gap-4 sticky top-0 z-50">
        <Link href="/">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h2 className="font-semibold text-lg">{instance.name}</h2>
          <p className="text-sm opacity-70">{instance.projectPath}</p>
        </div>
        <StatusDot status={instance.status} />
        <Badge variant="glass">{instance.status}</Badge>
      </header>
      
      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <Tabs defaultValue="chat" className="h-full">
          <TabsList className="glass m-4">
            <TabsTrigger value="chat">
              <MessageSquare className="w-4 h-4 mr-2" />
              Chat
            </TabsTrigger>
            <TabsTrigger value="git">
              <GitBranch className="w-4 h-4 mr-2" />
              Git
            </TabsTrigger>
            <TabsTrigger value="terminal">
              <TerminalIcon className="w-4 h-4 mr-2" />
              Terminal
            </TabsTrigger>
          </TabsList>
          
          {/* Chat Tab */}
          <TabsContent value="chat" className="h-full px-4 pb-4">
            <Card className="glass-card h-full flex flex-col">
              <CardContent className="flex-1 overflow-y-auto p-4">
                <div className="space-y-4">
                  {instanceMessages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.type === 'user' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <div
                        className={`glass rounded-lg p-3 max-w-[80%] ${
                          message.type === 'user' 
                            ? 'bg-blue-500/20' 
                            : message.type === 'thinking'
                            ? 'bg-purple-500/20'
                            : 'bg-white/10'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="glass" className="text-xs">
                            {message.type}
                          </Badge>
                          <span className="text-xs opacity-60">
                            {new Date(message.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
              
              {/* Input */}
              <div className="p-4 border-t border-white/10">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="Send a message to Claude..."
                    className="flex-1 glass rounded-lg px-4 py-2 text-sm bg-transparent outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                  <Button onClick={sendMessage} size="icon" variant="glass">
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          </TabsContent>
          
          {/* Git Tab */}
          <TabsContent value="git" className="h-full px-4 pb-4">
            <Card className="glass-card h-full">
              <CardHeader>
                <h3 className="font-semibold">Repository Status</h3>
              </CardHeader>
              <CardContent className="space-y-4">
                {instanceGit && (
                  <>
                    <div>
                      <h4 className="text-sm font-medium mb-2">Modified Files</h4>
                      <div className="space-y-1">
                        {instanceGit.modified.map((file) => (
                          <div key={file} className="text-sm glass rounded p-2">
                            <span className="text-yellow-500">M</span> {file}
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium mb-2">Staged Files</h4>
                      <div className="space-y-1">
                        {instanceGit.staged.map((file) => (
                          <div key={file} className="text-sm glass rounded p-2">
                            <span className="text-green-500">A</span> {file}
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium mb-2">Untracked Files</h4>
                      <div className="space-y-1">
                        {instanceGit.untracked.map((file) => (
                          <div key={file} className="text-sm glass rounded p-2">
                            <span className="text-gray-500">?</span> {file}
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Terminal Tab */}
          <TabsContent value="terminal" className="h-full px-4 pb-4">
            <Card className="glass-card h-full">
              <CardContent className="p-4 h-full">
                <div className="glass rounded-lg p-4 h-full font-mono text-sm">
                  <p className="opacity-60">Terminal coming soon...</p>
                  <p className="opacity-40 text-xs mt-2">
                    This will allow you to execute commands directly in the Claude Code environment.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}