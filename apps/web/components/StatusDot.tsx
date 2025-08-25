import { cn } from "@/lib/utils";
import { cva } from "class-variance-authority";

interface StatusDotProps {
  status: 'connected' | 'idle' | 'busy' | 'disconnected' | 'launching';
  className?: string;
}

const statusDotVariants = cva(
  "w-1.5 h-1.5 rounded-full flex-shrink-0",
  {
    variants: {
      status: {
        connected: "bg-green-500",
        idle: "bg-yellow-500 animate-pulse",
        busy: "bg-blue-500 animate-pulse",
        disconnected: "bg-red-500",
        launching: "bg-orange-500 animate-spin",
      },
    },
    defaultVariants: {
      status: "disconnected",
    },
  }
);

export function StatusDot({ status, className }: StatusDotProps) {
  return (
    <div
      className={cn(statusDotVariants({ status }), className)}
      title={status}
    />
  );
}