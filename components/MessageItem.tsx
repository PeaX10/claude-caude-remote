"use client";

import type { Message } from "@/lib/types";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

interface MessageItemProps {
  message: Message;
}

const messageContainerVariants = cva(
  "flex",
  {
    variants: {
      type: {
        user: "justify-end",
        assistant: "justify-start",
        thinking: "justify-start",
        system: "justify-start",
        tool: "justify-start",
      },
    },
    defaultVariants: {
      type: "assistant",
    },
  }
);

const messageBubbleVariants = cva(
  "rounded-2xl p-4 max-w-[85%] shadow-sm",
  {
    variants: {
      type: {
        user: "bg-blue-500 text-white ml-12",
        assistant: "bg-white border border-gray-200 mr-12",
        thinking: "bg-purple-50 border border-purple-200 mr-12",
        system: "bg-white border border-gray-200 mr-12",
        tool: "bg-white border border-gray-200 mr-12",
      },
    },
    defaultVariants: {
      type: "assistant",
    },
  }
);

const statusDotVariants = cva(
  "w-2 h-2 rounded-full",
  {
    variants: {
      type: {
        user: "bg-blue-200",
        assistant: "bg-green-500",
        thinking: "bg-purple-500",
        system: "bg-gray-400",
        tool: "bg-gray-400",
      },
    },
    defaultVariants: {
      type: "assistant",
    },
  }
);

const senderLabelVariants = cva(
  "text-xs font-medium",
  {
    variants: {
      type: {
        user: "text-blue-100",
        assistant: "text-gray-600",
        thinking: "text-gray-600",
        system: "text-gray-600",
        tool: "text-gray-600",
      },
    },
    defaultVariants: {
      type: "assistant",
    },
  }
);

const timestampVariants = cva(
  "text-xs ml-auto",
  {
    variants: {
      type: {
        user: "text-blue-200",
        assistant: "text-gray-400",
        thinking: "text-gray-400",
        system: "text-gray-400",
        tool: "text-gray-400",
      },
    },
    defaultVariants: {
      type: "assistant",
    },
  }
);

const toolCallVariants = cva(
  "mt-3 p-2 rounded-lg border text-xs",
  {
    variants: {
      type: {
        user: "bg-blue-400 border-blue-300",
        assistant: "bg-gray-50 border-gray-200",
        thinking: "bg-gray-50 border-gray-200",
        system: "bg-gray-50 border-gray-200",
        tool: "bg-gray-50 border-gray-200",
      },
    },
    defaultVariants: {
      type: "assistant",
    },
  }
);

function getSenderLabel(type: Message['type']): string {
  switch (type) {
    case 'user': return 'You';
    case 'assistant': return 'Claude';
    case 'thinking': return 'Claude (thinking)';
    default: return type;
  }
}

export function MessageItem({ message }: MessageItemProps) {
  return (
    <div className={cn(messageContainerVariants({ type: message.type }))}>
      <div className={cn(messageBubbleVariants({ type: message.type }))}>
        <div className="flex items-center gap-2 mb-2">
          <div className={cn(statusDotVariants({ type: message.type }))} />
          <span className={cn(senderLabelVariants({ type: message.type }))}>
            {getSenderLabel(message.type)}
          </span>
          <span className={cn(timestampVariants({ type: message.type }))}>
            {new Date(message.timestamp).toLocaleTimeString()}
          </span>
        </div>
        <pre className="whitespace-pre-wrap text-sm font-sans">
          {message.content}
        </pre>
        {message.toolCall && (
          <div className={cn(toolCallVariants({ type: message.type }))}>
            <div className="font-mono">
              Tool: {message.toolCall.name}
            </div>
            {message.toolCall.result && (
              <div className="mt-1 opacity-70">
                Result: {JSON.stringify(message.toolCall.result)}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}