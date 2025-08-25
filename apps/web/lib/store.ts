import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Socket } from 'socket.io-client';
import type { ClaudeInstance, Message, GitStatus } from './types';

interface Store {
  instances: Map<string, ClaudeInstance>;
  messages: Map<string, Message[]>;
  gitStatus: Map<string, GitStatus>;
  addInstance: (instance: ClaudeInstance) => void;
  updateInstance: (id: string, updates: Partial<ClaudeInstance>) => void;
  removeInstance: (id: string) => void;
  isConnected: boolean;
  setConnected: (connected: boolean) => void;
  createInstance: (data: { id: string; name: string; projectPath: string }) => void;
  deleteInstance: (id: string) => void;
  addMessage: (instanceId: string, message: Message) => void;
  updateGitStatus: (instanceId: string, status: GitStatus) => void;
}

export const useStore = create<Store>()(
  persist(
    (set, get) => ({

      instances: new Map(),
      messages: new Map(),
      gitStatus: new Map(),
      isConnected: false,
      

      addInstance: (instance) => {
        set((state) => {
          const newInstances = new Map(state.instances);
          newInstances.set(instance.id, instance);
          return { instances: newInstances };
        });
      },
      
      updateInstance: (id, updates) => {
        set((state) => {
          const newInstances = new Map(state.instances);
          const existing = newInstances.get(id);
          if (existing) {
            newInstances.set(id, { ...existing, ...updates });
          }
          return { instances: newInstances };
        });
      },
      
      removeInstance: (id) => {
        set((state) => {
          const newInstances = new Map(state.instances);
          newInstances.delete(id);
          return { instances: newInstances };
        });
      },
      
      setConnected: (connected) => {
        set({ isConnected: connected });
      },
      

      createInstance: (data) => {
        const socket = typeof window !== 'undefined' ? (window as unknown as { socket?: Socket }).socket : null;
        if (socket && socket.connected) {
          socket.emit('create_instance', data);
        }
      },
      
      deleteInstance: (id) => {
        const socket = typeof window !== 'undefined' ? (window as unknown as { socket?: Socket }).socket : null;
        if (socket && socket.connected) {
          socket.emit('delete_instance', { id });
        }
      },

      addMessage: (instanceId, message) => {
        set((state) => {
          const newMessages = new Map(state.messages);
          const instanceMessages = newMessages.get(instanceId) || [];
          newMessages.set(instanceId, [...instanceMessages, message]);
          return { messages: newMessages };
        });
      },

      updateGitStatus: (instanceId, status) => {
        set((state) => {
          const newGitStatus = new Map(state.gitStatus);
          newGitStatus.set(instanceId, status);
          return { gitStatus: newGitStatus };
        });
      },
    }),
    {
      name: 'claude-remote-store',

      partialize: (state) => ({
        instances: Array.from(state.instances.entries()),
        isConnected: state.isConnected,
      }),
      onRehydrateStorage: () => (state) => {
        if (state && Array.isArray((state as unknown as { instances: [string, ClaudeInstance][] }).instances)) {
          state.instances = new Map((state as unknown as { instances: [string, ClaudeInstance][] }).instances);
        }
      },
    }
  )
);