"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { StatusDot } from "@/components/StatusDot";
import type { ClaudeInstance } from "@/lib/types";
import { FileCode, MessageSquare, GitBranch, Trash2, MoreVertical } from "lucide-react";
import { useStore } from "@/lib/store";
import { useState } from "react";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

interface InstanceCardProps {
  instance: ClaudeInstance;
}

const cardVariants = cva(
  "glass-hover hover:scale-105 transition-all duration-300 cursor-pointer",
  {
    variants: {
      state: {
        normal: "",
        deleting: "opacity-50",
      },
    },
    defaultVariants: {
      state: "normal",
    },
  }
);

export function InstanceCard({ instance }: InstanceCardProps) {
  const { deleteInstance } = useStore();
  const [showActions, setShowActions] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const getActivityLevel = () => {
    const now = new Date();
    const lastActivity = new Date(instance.stats.lastActivity);
    const minutesAgo = Math.floor((now.getTime() - lastActivity.getTime()) / 60000);
    
    if (minutesAgo < 1) return 100;
    if (minutesAgo < 5) return 80;
    if (minutesAgo < 15) return 60;
    if (minutesAgo < 30) return 40;
    if (minutesAgo < 60) return 20;
    return 10;
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isDeleting) return;
    
    if (confirm(`Êtes-vous sûr de vouloir supprimer l'instance "${instance.name}" ?`)) {
      setIsDeleting(true);
      try {
        await deleteInstance(instance.id);
      } catch (error) {

        setIsDeleting(false);
      }
    }
  };

  const toggleActions = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowActions(!showActions);
  };

  return (
    <div className="relative">
      <Link href={`/instance/${instance.id}`}>
        <Card className={cn(cardVariants({ state: isDeleting ? "deleting" : "normal" }))}>
          <CardHeader className="pb-4">
            <div className="flex justify-between items-start min-w-0">
              <div className="flex-1 min-w-0 overflow-hidden">
                <h3 className="font-semibold text-base md:text-lg flex items-center gap-2 min-w-0">
                  <FileCode className="w-4 h-4 flex-shrink-0" />
                  <span className="text-truncate">{instance.name}</span>
                </h3>
                <p className="text-xs md:text-sm opacity-70 mt-1 text-truncate">
                  {instance.projectPath}
                </p>
                {instance.branch && (
                  <div className="flex items-center gap-1 mt-2 min-w-0">
                    <GitBranch className="w-3 h-3 flex-shrink-0" />
                    <span className="text-xs opacity-60 text-truncate">{instance.branch}</span>
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <StatusDot status={instance.status} />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleActions}
                  disabled={isDeleting}
                  className="p-1 h-6 w-6"
                >
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="flex items-center gap-1">
                <MessageSquare className="w-3 h-3" />
                Messages
              </span>
              <Badge variant="glass" className="text-xs">
                {instance.stats.messagesCount}
              </Badge>
            </div>
            
            {instance.stats.changes > 0 && (
              <div className="flex justify-between items-center text-sm">
                <span>Changes</span>
                <span className="text-yellow-500 font-medium">
                  +{instance.stats.changes}
                </span>
              </div>
            )}
            
            <div className="pt-2">
              <div className="flex justify-between text-xs opacity-60 mb-1">
                <span>Activity</span>
                <span>{getActivityLevel()}%</span>
              </div>
              <Progress value={getActivityLevel()} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
    

    {showActions && (
      <div className="absolute top-12 right-2 z-10 bg-card border border-border rounded-md shadow-lg p-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDelete}
          disabled={isDeleting}
          className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          {isDeleting ? (
            <>
              <div className="animate-spin w-3 h-3 border border-current border-t-transparent rounded-full mr-2" />
              Suppression...
            </>
          ) : (
            <>
              <Trash2 className="w-3 h-3 mr-2" />
              Supprimer
            </>
          )}
        </Button>
      </div>
    )}
    

    {showActions && (
      <div 
        className="fixed inset-0 z-5" 
        onClick={() => setShowActions(false)}
      />
    )}
  </div>
  );
}