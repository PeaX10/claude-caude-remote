import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'
import type { SessionTab, Project, Session, AvailableSession, ClaudeMessage } from '../types/project.types'

interface ProjectStore {
  projects: Project[];
  activeProjectId: string | null;
  recentSessions: Session[];
  availableSessionsByProject: Record<string, AvailableSession[]>; // projectPath -> sessions
  
  addProject: (project: Omit<Project, 'id' | 'tabs' | 'lastAccessedAt'>) => string
  removeProject: (projectId: string) => void
  setActiveProject: (projectId: string | null) => void
  updateProject: (projectId: string, updates: Partial<Project>) => void
  addTab: (projectId: string, tab: Omit<SessionTab, 'id' | 'createdAt' | 'updatedAt'>) => string
  removeTab: (projectId: string, tabId: string) => void
  setActiveTab: (projectId: string, tabId: string) => void
  updateTab: (projectId: string, tabId: string, updates: Partial<SessionTab>) => void
  addMessageToTab: (projectId: string, tabId: string, message: ClaudeMessage) => void
  getTabMessages: (projectId: string, tabId: string) => ClaudeMessage[]
  clearTabMessages: (projectId: string, tabId: string) => void
  markTabAsRead: (projectId: string, tabId: string) => void
  updateUnreadCounts: (projectId: string) => void
  saveScrollPosition: (projectId: string, tabId: string, position: number) => void
  getScrollPosition: (projectId: string, tabId: string) => number | undefined
  addRecentSession: (session: Omit<Session, 'id' | 'createdAt' | 'updatedAt'>) => void
  getProjectSessions: (projectId: string) => Session[]
  setAvailableSessions: (projectPath: string, sessions: AvailableSession[]) => void
  getAvailableSessions: (projectPath: string) => AvailableSession[]
  getActiveProject: () => Project | undefined
  getProjectByPath: (path: string) => Project | undefined
}

export const useProjectStore = create<ProjectStore>()(
  persist(
    (set, get) => ({
      projects: [],
      activeProjectId: null,
      recentSessions: [],
      availableSessionsByProject: {},
      
      addProject: (projectData) => {
        const id = `proj_${Date.now()}`;
        const newProject: Project = {
          ...projectData,
          id,
          tabs: [],
          lastAccessedAt: new Date(),
        };
        
        set((state) => ({
          projects: [...state.projects, newProject],
          activeProjectId: id,
        }));
        
        return id;
      },
      
      removeProject: (projectId) => {
        set((state) => ({
          projects: state.projects.filter((p) => p.id !== projectId),
          activeProjectId: state.activeProjectId === projectId ? null : state.activeProjectId,
          recentSessions: state.recentSessions.filter((s) => s.projectId !== projectId),
        }));
      },
      
      setActiveProject: (projectId) => {
        set({ activeProjectId: projectId });
        
        if (projectId) {
          set((state) => ({
            projects: state.projects.map((p) =>
              p.id === projectId
                ? { ...p, lastAccessedAt: new Date() }
                : p
            ),
          }));
        }
      },
      
      updateProject: (projectId, updates) => {
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId ? { ...p, ...updates } : p
          ),
        }));
      },
      
      addTab: (projectId, tabData) => {
        const tabId = `tab_${Date.now()}`;
        const newTab: SessionTab = {
          ...tabData,
          id: tabId,
          messages: tabData.messages || [],
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  tabs: [...p.tabs, newTab],
                  activeTabId: tabId,
                }
              : p
          ),
        }));
        
        return tabId;
      },
      
      removeTab: (projectId, tabId) => {
        set((state) => ({
          projects: state.projects.map((p) => {
            if (p.id !== projectId) return p;
            
            const newTabs = p.tabs.filter((t) => t.id !== tabId);
            const newActiveTabId = p.activeTabId === tabId
              ? newTabs[newTabs.length - 1]?.id || undefined
              : p.activeTabId;
            
            return {
              ...p,
              tabs: newTabs,
              activeTabId: newActiveTabId,
            };
          }),
        }));
      },
      
      setActiveTab: (projectId, tabId) => {
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  activeTabId: tabId,
                  tabs: p.tabs.map((t) =>
                    t.id === tabId
                      ? { 
                          ...t, 
                          lastReadTimestamp: Date.now(),
                          unreadCount: 0 
                        }
                      : t
                  ),
                }
              : p
          ),
        }));
      },
      
      updateTab: (projectId, tabId, updates) => {
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  tabs: p.tabs.map((t) =>
                    t.id === tabId
                      ? { ...t, ...updates, updatedAt: new Date() }
                      : t
                  ),
                }
              : p
          ),
        }));
      },
      
      addMessageToTab: (projectId, tabId, message) => {
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  tabs: p.tabs.map((t) => {
                    if (t.id === tabId) {
                      // If this is not the active tab, increment unread count
                      const isActive = p.activeTabId === tabId;
                      return { 
                        ...t, 
                        messages: [...(t.messages || []), message],
                        lastMessage: message.content || message.human || message.assistant || '',
                        updatedAt: new Date(),
                        unreadCount: isActive ? 0 : (t.unreadCount || 0) + 1
                      };
                    }
                    return t;
                  }),
                }
              : p
          ),
        }));
      },
      
      getTabMessages: (projectId, tabId) => {
        const state = get();
        const project = state.projects.find((p) => p.id === projectId);
        const tab = project?.tabs.find((t) => t.id === tabId);
        return tab?.messages || [];
      },
      
      clearTabMessages: (projectId, tabId) => {
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  tabs: p.tabs.map((t) =>
                    t.id === tabId
                      ? { ...t, messages: [], updatedAt: new Date(), unreadCount: 0 }
                      : t
                  ),
                }
              : p
          ),
        }));
      },
      
      markTabAsRead: (projectId, tabId) => {
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  tabs: p.tabs.map((t) =>
                    t.id === tabId
                      ? { 
                          ...t, 
                          lastReadTimestamp: Date.now(),
                          unreadCount: 0 
                        }
                      : t
                  ),
                }
              : p
          ),
        }));
      },
      
      updateUnreadCounts: (projectId) => {
        set((state) => ({
          projects: state.projects.map((p) => {
            if (p.id === projectId) {
              return {
                ...p,
                tabs: p.tabs.map((t) => {
                  if (t.lastReadTimestamp && t.messages) {
                    const unreadMessages = t.messages.filter(
                      msg => msg.timestamp && msg.timestamp > t.lastReadTimestamp
                    );
                    return {
                      ...t,
                      unreadCount: unreadMessages.length
                    };
                  }
                  return t;
                }),
              };
            }
            return p;
          }),
        }));
      },
      
      addRecentSession: (sessionData) => {
        const session: Session = {
          ...sessionData,
          id: `session_${Date.now()}`,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        
        set((state) => ({
          recentSessions: [
            session,
            ...state.recentSessions.slice(0, 49), // Keep max 50 recent sessions
          ],
        }));
      },
      
      getProjectSessions: (projectId) => {
        return get().recentSessions.filter((s) => s.projectId === projectId);
      },
      
      saveScrollPosition: (projectId, tabId, position) => {
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  tabs: p.tabs.map((t) =>
                    t.id === tabId
                      ? { 
                          ...t, 
                          scrollPosition: position,
                          lastMessageCount: t.messages?.length || 0
                        }
                      : t
                  ),
                }
              : p
          ),
        }));
      },
      
      getScrollPosition: (projectId, tabId) => {
        const state = get();
        const project = state.projects.find(p => p.id === projectId);
        const tab = project?.tabs.find(t => t.id === tabId);
        return tab?.scrollPosition;
      },
      
      setAvailableSessions: (projectPath, sessions) => {
        set((state) => ({
          availableSessionsByProject: {
            ...state.availableSessionsByProject,
            [projectPath]: sessions,
          },
        }));
      },
      
      getAvailableSessions: (projectPath) => {
        return get().availableSessionsByProject[projectPath] || [];
      },
      
      getActiveProject: () => {
        const state = get();
        return state.projects.find((p) => p.id === state.activeProjectId);
      },
      
      getProjectByPath: (path) => {
        return get().projects.find((p) => p.path === path);
      },
    }),
    {
      name: 'project-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        projects: state.projects,
        activeProjectId: state.activeProjectId,
        recentSessions: state.recentSessions.slice(0, 20), // Persist only last 20 sessions
        availableSessionsByProject: state.availableSessionsByProject, // Persist available sessions
      }),
    }
  )
);