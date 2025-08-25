import { cn } from "@/lib/utils";

interface StatusDotProps {
  status: 'connected' | 'idle' | 'busy' | 'disconnected';
  className?: string;
}

export function StatusDot({ status, className }: StatusDotProps) {
  return (
    <div
      className={cn(
        "status-dot",
        status === 'connected' && "status-connected",
        status === 'idle' && "status-idle",
        status === 'busy' && "status-busy",
        status === 'disconnected' && "status-disconnected",
        className
      )}
      title={status}
    />
  );
}