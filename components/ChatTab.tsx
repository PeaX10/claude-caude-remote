"use client";

import { MessageSquare, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MessageItem } from "@/components/MessageItem";
import type { Message } from "@/lib/types";
import { Socket } from "socket.io-client";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

interface ChatTabProps {
  instanceMessages: Message[];
  inputMessage: string;
  setInputMessage: (message: string) => void;
  sendMessage: () => void;
  socket: Socket | null;
  instanceId: string;
}

const sendButtonVariants = cva(
  "rounded-xl px-4 py-3 transition-all duration-200",
  {
    variants: {
      state: {
        enabled: "bg-blue-600 hover:bg-blue-700 text-white shadow-lg",
        disabled: "bg-gray-200 text-gray-400 cursor-not-allowed",
      },
    },
    defaultVariants: {
      state: "disabled",
    },
  }
);

export function ChatTab({ 
  instanceMessages, 
  inputMessage, 
  setInputMessage, 
  sendMessage,
  socket,
  instanceId
}: ChatTabProps) {
  return (
    <>
      <div 
        className="h-full overflow-y-auto bg-gray-50" 
        style={{
          paddingBottom: 'calc(120px + env(safe-area-inset-bottom))',
          WebkitOverflowScrolling: 'touch',
          overscrollBehavior: 'contain'
        }}
      >
        {instanceMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6">
            <MessageSquare className="w-12 h-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-700 mb-2">Start a conversation with Claude</h3>
            <p className="text-sm text-gray-500">Ask questions about your code, request changes, or get help with your project.</p>
          </div>
        ) : (
          <div className="p-6">
            <div className="max-w-4xl mx-auto space-y-6">
              {instanceMessages.map((message) => (
                <MessageItem 
                  key={message.id} 
                  message={message}
                />
              ))}
            </div>
          </div>
        )}
      </div>
      
      <div 
        className="fixed bottom-0 left-0 right-0 border-t border-gray-200 bg-white/95 backdrop-blur-sm p-4 z-50" 
        style={{ 
          paddingBottom: 'calc(16px + env(safe-area-inset-bottom))',
          minHeight: 'calc(80px + env(safe-area-inset-bottom))'
        }}
      >
        <div className="max-w-4xl mx-auto">
          <div className="relative flex items-end gap-3">
            <div className="flex-1 relative">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                placeholder="Message Claude..."
                className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                autoComplete="off"
              />
            </div>
            <Button 
              onClick={sendMessage} 
              size="sm"
              disabled={!inputMessage.trim()}
              className={cn(sendButtonVariants({ 
                state: inputMessage.trim() ? "enabled" : "disabled" 
              }))}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}