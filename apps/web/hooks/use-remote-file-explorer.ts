import { useState, useCallback, useEffect } from 'react';
import { useWebSocket } from './use-web-socket';

export interface RemoteFileItem {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
}

interface UseRemoteFileExplorerReturn {
  currentPath: string;
  items: RemoteFileItem[];
  isLoading: boolean;
  error: string | null;
  navigateTo: (path: string) => Promise<void>;
  navigateUp: () => Promise<void>;
  refresh: () => Promise<void>;
  selectDirectory: (path: string) => void;
  selectedDirectory: string | null;
}

const getInitialPath = () => process.env.NODE_ENV === 'development' ? '/Users' : '/';

const getParentPath = (currentPath: string) => 
  currentPath === '/' ? '/' : currentPath.split('/').slice(0, -1).join('/') || '/';

export const useRemoteFileExplorer = (): UseRemoteFileExplorerReturn => {
  const [currentPath, setCurrentPath] = useState('/');
  const [items, setItems] = useState<RemoteFileItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDirectory, setSelectedDirectory] = useState<string | null>(null);
  
  const { socket, isConnected } = useWebSocket();
  
  const navigateTo = useCallback(async (path: string) => {
    if (!isConnected || !socket) {
      setError('Not connected to server');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setCurrentPath(path);
    
    try {
      socket.emit('file_list', { path });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to navigate');
      setIsLoading(false);
    }
  }, [isConnected, socket]);
  
  const navigateUp = useCallback(async () => {
    await navigateTo(getParentPath(currentPath));
  }, [currentPath, navigateTo]);
  
  const refresh = useCallback(async () => {
    await navigateTo(currentPath);
  }, [currentPath, navigateTo]);
  
  const selectDirectory = useCallback((path: string) => {
    setSelectedDirectory(path);
  }, []);
  
  useEffect(() => {
    if (isConnected && items.length === 0 && !isLoading) {
      navigateTo(getInitialPath());
    }
  }, [isConnected, items.length, isLoading, navigateTo]);
  
  useEffect(() => {
    if (!socket) return;
    
    const handleFileListResult = (data: { files: RemoteFileItem[]; path: string }) => {
      setItems(data.files || []);
      setCurrentPath(data.path || currentPath);
      setIsLoading(false);
      setError(null);
    };
    
    const handleFileError = (data: { error: string }) => {
      setError(data.error || 'Failed to list directory');
      setIsLoading(false);
    };
    
    socket.on('file_list_result', handleFileListResult);
    socket.on('file_error', handleFileError);
    
    return () => {
      socket.off('file_list_result', handleFileListResult);
      socket.off('file_error', handleFileError);
    };
  }, [socket, currentPath]);
  
  return {
    currentPath,
    items,
    isLoading,
    error,
    navigateTo,
    navigateUp,
    refresh,
    selectDirectory,
    selectedDirectory
  };
};