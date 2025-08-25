"use client";

import { useState, useEffect } from "react";
import { Folder, FolderGit2, ArrowUp, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { io, Socket } from "socket.io-client";

interface Directory {
  name: string;
  path: string;
  isGitRepo: boolean;
}

interface DirectoryData {
  currentPath: string;
  canGoUp: boolean;
  parentPath: string | null;
  directories: Directory[];
}

interface DirectorySelectorProps {
  selectedPath: string;
  onPathSelect: (path: string) => void;
  onClose: () => void;
  socket?: Socket | null;
}

export function DirectorySelector({ selectedPath, onPathSelect, onClose, socket: parentSocket }: DirectorySelectorProps) {
  const [directoryData, setDirectoryData] = useState<DirectoryData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Use parent socket or global socket
    const socketToUse = parentSocket || (typeof window !== 'undefined' ? (window as any).socket : null);
    
    if (!socketToUse) {
      console.error('[DirectorySelector] No socket available');
      setError("Connexion WebSocket non disponible");
      return;
    }
    
    console.log('[DirectorySelector] Socket available, setting up listeners');

    const handleDirectoriesList = (data: DirectoryData) => {
      console.log('[DirectorySelector] Received directories_list:', data);
      setDirectoryData(data);
      setLoading(false);
      setError(null);
    };

    const handleExploreError = (data: { message: string }) => {
      console.error('[DirectorySelector] Received explore_error:', data);
      setError(data.message);
      setLoading(false);
    };

    socketToUse.on('directories_list', handleDirectoriesList);
    socketToUse.on('explore_error', handleExploreError);

    // Load initial directory (user home)
    setLoading(true);
    console.log('[DirectorySelector] Emitting explore_directories with path:', selectedPath || 'default home');
    socketToUse.emit('explore_directories', { path: selectedPath || undefined });

    return () => {
      socketToUse.off('directories_list', handleDirectoriesList);
      socketToUse.off('explore_error', handleExploreError);
    };
  }, [selectedPath, parentSocket]);

  const navigateToDirectory = (path: string) => {
    const socketToUse = parentSocket || (typeof window !== 'undefined' ? (window as any).socket : null);
    if (!socketToUse) return;
    
    setLoading(true);
    setError(null);
    socketToUse.emit('explore_directories', { path });
  };

  const selectDirectory = (path: string) => {
    onPathSelect(path);
    onClose();
  };

  return (
    <Card className="glass-card w-full max-w-full md:max-w-2xl h-[80vh] md:max-h-96 flex flex-col">
      <CardHeader className="pb-3 px-4 py-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-foreground text-base md:text-lg">Sélectionner un répertoire</h3>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0 touch-manipulation">
            ✕
          </Button>
        </div>
        
        {directoryData && (
          <div className="flex items-center space-x-2 text-xs md:text-sm text-muted-foreground min-w-0">
            <Folder className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
            <span className="text-truncate text-xs min-w-0 flex-1">{directoryData.currentPath}</span>
          </div>
        )}
      </CardHeader>
      
      <CardContent className="p-0 flex-1 overflow-hidden">
        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
            <span className="ml-2 text-muted-foreground">Chargement...</span>
          </div>
        )}
        
        {error && (
          <div className="p-4 text-center">
            <p className="text-destructive text-sm">{error}</p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2"
              onClick={() => navigateToDirectory(process.env.HOME || '/')}
            >
              Retour au dossier principal
            </Button>
          </div>
        )}
        
        {directoryData && !loading && !error && (
          <div className="flex flex-col h-full">
            {/* Current directory selection - Fixed */}
            <div className="px-4 py-3 border-b border-border bg-muted/20 flex-shrink-0">
              <Button 
                variant="outline" 
                size="default" 
                className="w-full justify-start h-12 touch-manipulation text-sm"
                onClick={() => selectDirectory(directoryData.currentPath)}
              >
                <Folder className="w-4 h-4 mr-3" />
                Utiliser ce répertoire
              </Button>
            </div>
            
            {/* Navigation - Scrollable */}
            <div className="flex-1 overflow-y-auto mobile-scroll">
              <div className="divide-y divide-border">
              {/* Parent directory */}
              {directoryData.canGoUp && directoryData.parentPath && (
                <button
                  onClick={() => navigateToDirectory(directoryData.parentPath!)}
                  className="w-full flex items-center space-x-3 px-4 py-4 text-left hover:bg-accent/50 active:bg-accent transition-colors touch-manipulation"
                >
                  <ArrowUp className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  <span className="text-base text-muted-foreground font-medium">Dossier parent</span>
                </button>
              )}
              
              {/* Subdirectories */}
              {directoryData.directories.map((dir) => (
                <button
                  key={dir.path}
                  onClick={() => navigateToDirectory(dir.path)}
                  className="w-full flex items-center space-x-3 px-4 py-4 text-left hover:bg-accent/50 active:bg-accent transition-colors touch-manipulation group"
                >
                  {dir.isGitRepo ? (
                    <FolderGit2 className="w-5 h-5 text-success flex-shrink-0" />
                  ) : (
                    <Folder className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0 overflow-hidden">
                    <span className="text-base text-truncate block">{dir.name}</span>
                  </div>
                  {dir.isGitRepo && (
                    <Badge variant="outline" className="text-xs px-2 py-1">
                      Git
                    </Badge>
                  )}
                  <ChevronRight className="w-5 h-5 text-muted-foreground group-active:text-foreground transition-colors" />
                </button>
              ))}
              
                {directoryData.directories.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    Aucun sous-répertoire trouvé
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}