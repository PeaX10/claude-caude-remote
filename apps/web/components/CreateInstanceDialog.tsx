"use client";

import { useState } from "react";
import { Plus, Folder, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useStore } from "@/lib/store";
import { DirectorySelector } from "./DirectorySelector";

interface CreateInstanceDialogProps {
  onClose?: () => void;
  socket?: any;
}

export function CreateInstanceDialog({ onClose, socket }: CreateInstanceDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [projectPath, setProjectPath] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [showDirectorySelector, setShowDirectorySelector] = useState(false);
  const [creationStep, setCreationStep] = useState<string>("");
  const [creationMessage, setCreationMessage] = useState<string>("");
  const { createInstance } = useStore();

  const handleCreate = async () => {
    if (!name.trim()) return;
    
    setIsCreating(true);
    setCreationStep("preparing");
    setCreationMessage("Préparation de la création...");
    
    const socketToUse = socket || (typeof window !== 'undefined' ? (window as any).socket : null);
    if (!socketToUse) {
      alert("Connexion WebSocket non disponible");
      setIsCreating(false);
      return;
    }
    

    const handleProgress = (data: any) => {
      setCreationStep(data.step);
      setCreationMessage(data.message);
    };
    
    const handleCreated = (data: any) => {
      setCreationMessage("Instance créée avec succès !");
      setTimeout(() => {
        setName("");
        setProjectPath("");
        setCreationStep("");
        setCreationMessage("");
        setIsCreating(false);
        setIsOpen(false);
        onClose?.();
      }, 2000);
    };
    
    const handleError = (data: any) => {
      alert(`Erreur: ${data.message}`);
      setIsCreating(false);
      setCreationStep("");
      setCreationMessage("");
    };
    
    socketToUse.on('instance:progress', handleProgress);
    socketToUse.on('instance:created', handleCreated);
    socketToUse.on('instance:error', handleError);
    

    const instanceId = `instance-${Date.now()}`;
    socketToUse.emit('create_instance', {
      id: instanceId,
      name: name.trim(),
      projectPath: projectPath.trim() || process.env.HOME || '/'
    });
    

    setTimeout(() => {
      socketToUse.off('instance:progress', handleProgress);
      socketToUse.off('instance:created', handleCreated);
      socketToUse.off('instance:error', handleError);
    }, 30000);
  };

  const handleCancel = () => {
    setName("");
    setProjectPath("");
    setIsOpen(false);
    onClose?.();
  };

  if (!isOpen) {
    return (
      <Card className="glass-card glass-hover cursor-pointer touch-manipulation" onClick={() => setIsOpen(true)}>
        <CardContent className="flex items-center justify-center p-6 md:p-8">
          <div className="text-center space-y-3">
            <div className="w-12 h-12 md:w-14 md:h-14 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
              <Plus className="w-6 h-6 md:w-7 md:h-7 text-primary" />
            </div>
            <div>
              <h3 className="font-medium text-foreground text-sm md:text-base">Nouvelle Instance</h3>
              <p className="text-xs md:text-sm text-muted-foreground mt-1">
                Créer une nouvelle instance Claude Code
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card w-full">
      <CardContent className="p-4 md:p-6">
        <div className="space-y-4 md:space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-foreground text-base md:text-lg">Nouvelle Instance</h3>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleCancel}
              disabled={isCreating}
              className="h-8 w-8 p-0 touch-manipulation"
            >
              ✕
            </Button>
          </div>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="instance-name" className="block text-sm md:text-base font-medium text-foreground mb-2">
                Nom de l'instance
              </label>
              <input
                id="instance-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Mon Projet Claude"
                className="w-full px-4 py-3 md:py-2 text-base md:text-sm border border-border bg-background text-foreground rounded-lg md:rounded-md focus:ring-2 focus:ring-ring focus:border-transparent touch-manipulation"
                disabled={isCreating}
                autoFocus
              />
            </div>
            
            <div>
              <label htmlFor="project-path" className="block text-sm md:text-base font-medium text-foreground mb-2">
                Chemin du projet (optionnel)
              </label>
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                <div className="relative flex-1">
                  <Folder className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-muted-foreground" />
                  <input
                    id="project-path"
                    type="text"
                    value={projectPath}
                    onChange={(e) => setProjectPath(e.target.value)}
                    placeholder="/path/to/project"
                    className="w-full pl-10 md:pl-12 pr-3 py-3 md:py-2 text-base md:text-sm border border-border bg-background text-foreground rounded-lg md:rounded-md focus:ring-2 focus:ring-ring focus:border-transparent touch-manipulation"
                    disabled={isCreating}
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="default"
                  onClick={() => setShowDirectorySelector(true)}
                  disabled={isCreating}
                  className="w-full sm:w-auto px-4 py-3 md:py-2 touch-manipulation"
                >
                  <Search className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                  Parcourir
                </Button>
              </div>
              <p className="text-xs md:text-sm text-muted-foreground mt-2 text-break">
                Parcourez les répertoires de votre PC pour sélectionner un projet
              </p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2 pt-4">
            <Button 
              variant="outline" 
              onClick={handleCancel}
              disabled={isCreating}
              className="w-full sm:w-auto py-3 md:py-2 touch-manipulation"
            >
              Annuler
            </Button>
            <Button 
              onClick={handleCreate}
              disabled={!name.trim() || isCreating}
              className="w-full sm:w-auto bg-primary text-primary-foreground py-3 md:py-2 touch-manipulation"
            >
              {isCreating ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full mr-2" />
                  {creationMessage || "Création..."}
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Créer
                </>
              )}
            </Button>
          </div>
        </div>
        

        {showDirectorySelector && (
          <div className="fixed inset-0 bg-black/50 z-50 overflow-y-auto overlay-scroll">
            <div className="min-h-full flex items-start md:items-center justify-center p-4">
              <DirectorySelector
                selectedPath={projectPath}
                onPathSelect={(path) => {
                  setProjectPath(path);
                  setShowDirectorySelector(false);
                }}
                onClose={() => setShowDirectorySelector(false)}
                socket={socket}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}