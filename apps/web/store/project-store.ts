import React, { useMemo } from "react";
import { Storage } from "./storage-adapter";
import type {
  SessionTab,
  Project,
  Session,
  AvailableSession,
  ClaudeMessage,
} from "../types/project.types";

// Store keys
const STORE_KEYS = {
  PROJECTS: "projects",
  ACTIVE_PROJECT_ID: "activeProjectId",
  RECENT_SESSIONS: "recentSessions",
  AVAILABLE_SESSIONS: "availableSessionsByProject",
};

interface ProjectStoreState {
  projects: Project[];
  activeProjectId: string | null;
  recentSessions: Session[];
  availableSessionsByProject: Record<string, AvailableSession[]>;
  isInitialized: boolean;
}

class ProjectStoreClass {
  private state: ProjectStoreState = {
    projects: [],
    activeProjectId: null,
    recentSessions: [],
    availableSessionsByProject: {},
    isInitialized: false,
  };

  private listeners: Set<(state: ProjectStoreState) => void> = new Set();

  constructor() {
    this.init();
  }

  private async init() {
    try {
      const [projectsData, activeProjectData, sessionsData, availableData] =
        await Promise.all([
          Storage.getItem(STORE_KEYS.PROJECTS),
          Storage.getItem(STORE_KEYS.ACTIVE_PROJECT_ID),
          Storage.getItem(STORE_KEYS.RECENT_SESSIONS),
          Storage.getItem(STORE_KEYS.AVAILABLE_SESSIONS),
        ]);

      this.state = {
        projects: projectsData ? JSON.parse(projectsData) : [],
        activeProjectId: activeProjectData || null,
        recentSessions: sessionsData
          ? JSON.parse(sessionsData).slice(0, 20)
          : [],
        availableSessionsByProject: availableData
          ? JSON.parse(availableData)
          : {},
        isInitialized: true,
      };

      this.notifyListeners();
    } catch (error) {
      console.error("Failed to initialize ProjectStore:", error);
      this.state.isInitialized = true;
      this.notifyListeners();
    }
  }

  private async persist() {
    try {
      await Promise.all([
        Storage.setItem(
          STORE_KEYS.PROJECTS,
          JSON.stringify(this.state.projects)
        ),
        Storage.setItem(
          STORE_KEYS.ACTIVE_PROJECT_ID,
          this.state.activeProjectId || ""
        ),
        Storage.setItem(
          STORE_KEYS.RECENT_SESSIONS,
          JSON.stringify(this.state.recentSessions.slice(0, 20))
        ),
        Storage.setItem(
          STORE_KEYS.AVAILABLE_SESSIONS,
          JSON.stringify(this.state.availableSessionsByProject)
        ),
      ]);
    } catch (error) {
      console.error("Failed to persist ProjectStore:", error);
    }
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => listener(this.state));
  }

  subscribe(listener: (state: ProjectStoreState) => void) {
    this.listeners.add(listener);
    listener(this.state); // Send initial state
    return () => this.listeners.delete(listener);
  }

  getState() {
    return this.state;
  }

  addProject(
    projectData: Omit<Project, "id" | "tabs" | "lastAccessedAt">
  ): string {
    const id = `proj_${Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 11)}`;
    const newProject: Project = {
      ...projectData,
      id,
      tabs: [],
      lastAccessedAt: new Date(),
    };

    this.state = {
      ...this.state,
      projects: [...this.state.projects, newProject],
      activeProjectId: id,
    };

    this.persist();
    this.notifyListeners();
    return id;
  }

  removeProject(projectId: string) {
    this.state = {
      ...this.state,
      projects: this.state.projects.filter((p) => p.id !== projectId),
      activeProjectId:
        this.state.activeProjectId === projectId
          ? null
          : this.state.activeProjectId,
      recentSessions: this.state.recentSessions.filter(
        (s) => s.projectId !== projectId
      ),
    };

    this.persist();
    this.notifyListeners();
  }

  setActiveProject(projectId: string | null) {
    const projects = projectId
      ? this.state.projects.map((p) =>
          p.id === projectId ? { ...p, lastAccessedAt: new Date() } : p
        )
      : this.state.projects;

    this.state = {
      ...this.state,
      activeProjectId: projectId,
      projects,
    };

    this.persist();
    this.notifyListeners();
  }

  updateProject(projectId: string, updates: Partial<Project>) {
    this.state = {
      ...this.state,
      projects: this.state.projects.map((p) =>
        p.id === projectId ? { ...p, ...updates } : p
      ),
    };

    this.persist();
    this.notifyListeners();
  }

  addTab(
    projectId: string,
    tabData: Omit<SessionTab, "id" | "createdAt" | "updatedAt">
  ): string {
    const tabId = `tab_${Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 11)}`;
    const newTab: SessionTab = {
      ...tabData,
      id: tabId,
      messages: tabData.messages || [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.state = {
      ...this.state,
      projects: this.state.projects.map((p) =>
        p.id === projectId
          ? {
              ...p,
              tabs: [...p.tabs, newTab],
              activeTabId: tabId,
            }
          : p
      ),
    };

    this.persist();
    this.notifyListeners();
    return tabId;
  }

  removeTab(projectId: string, tabId: string) {
    this.state = {
      ...this.state,
      projects: this.state.projects.map((p) => {
        if (p.id !== projectId) return p;

        const newTabs = p.tabs.filter((t) => t.id !== tabId);
        const newActiveTabId =
          p.activeTabId === tabId
            ? newTabs[newTabs.length - 1]?.id || undefined
            : p.activeTabId;

        return {
          ...p,
          tabs: newTabs,
          activeTabId: newActiveTabId,
        };
      }),
    };

    this.persist();
    this.notifyListeners();
  }

  setActiveTab(projectId: string, tabId: string) {
    this.state = {
      ...this.state,
      projects: this.state.projects.map((p) =>
        p.id === projectId
          ? {
              ...p,
              activeTabId: tabId,
              tabs: p.tabs.map((t) =>
                t.id === tabId
                  ? {
                      ...t,
                      lastReadTimestamp: Date.now(),
                      unreadCount: 0,
                    }
                  : t
              ),
            }
          : p
      ),
    };

    this.persist();
    this.notifyListeners();
  }

  updateTab(projectId: string, tabId: string, updates: Partial<SessionTab>) {
    this.state = {
      ...this.state,
      projects: this.state.projects.map((p) =>
        p.id === projectId
          ? {
              ...p,
              tabs: p.tabs.map((t) =>
                t.id === tabId ? { ...t, ...updates, updatedAt: new Date() } : t
              ),
            }
          : p
      ),
    };

    this.persist();
    this.notifyListeners();
  }

  addMessageToTab(projectId: string, tabId: string, message: ClaudeMessage) {
    this.state = {
      ...this.state,
      projects: this.state.projects.map((p) =>
        p.id === projectId
          ? {
              ...p,
              tabs: p.tabs.map((t) => {
                if (t.id === tabId) {
                  const isActive = p.activeTabId === tabId;
                  return {
                    ...t,
                    messages: [...(t.messages || []), message],
                    lastMessage:
                      message.content ||
                      message.human ||
                      message.assistant ||
                      "",
                    updatedAt: new Date(),
                    unreadCount: isActive ? 0 : (t.unreadCount || 0) + 1,
                  };
                }
                return t;
              }),
            }
          : p
      ),
    };

    this.persist();
    this.notifyListeners();
  }

  getTabMessages(projectId: string, tabId: string): ClaudeMessage[] {
    const project = this.state.projects.find((p) => p.id === projectId);
    const tab = project?.tabs.find((t) => t.id === tabId);
    return tab?.messages || [];
  }

  clearTabMessages(projectId: string, tabId: string) {
    this.state = {
      ...this.state,
      projects: this.state.projects.map((p) =>
        p.id === projectId
          ? {
              ...p,
              tabs: p.tabs.map((t) =>
                t.id === tabId
                  ? {
                      ...t,
                      messages: [],
                      updatedAt: new Date(),
                      unreadCount: 0,
                    }
                  : t
              ),
            }
          : p
      ),
    };

    this.persist();
    this.notifyListeners();
  }

  markTabAsRead(projectId: string, tabId: string) {
    this.state = {
      ...this.state,
      projects: this.state.projects.map((p) =>
        p.id === projectId
          ? {
              ...p,
              tabs: p.tabs.map((t) =>
                t.id === tabId
                  ? {
                      ...t,
                      lastReadTimestamp: Date.now(),
                      unreadCount: 0,
                    }
                  : t
              ),
            }
          : p
      ),
    };

    this.persist();
    this.notifyListeners();
  }

  updateUnreadCounts(projectId: string) {
    this.state = {
      ...this.state,
      projects: this.state.projects.map((p) => {
        if (p.id === projectId) {
          return {
            ...p,
            tabs: p.tabs.map((t) => {
              if (t.lastReadTimestamp && t.messages) {
                const unreadMessages = t.messages.filter(
                  (msg) => msg.timestamp && msg.timestamp > t.lastReadTimestamp!
                );
                return {
                  ...t,
                  unreadCount: unreadMessages.length,
                };
              }
              return t;
            }),
          };
        }
        return p;
      }),
    };

    this.persist();
    this.notifyListeners();
  }

  saveScrollPosition(projectId: string, tabId: string, position: number) {
    this.state = {
      ...this.state,
      projects: this.state.projects.map((p) =>
        p.id === projectId
          ? {
              ...p,
              tabs: p.tabs.map((t) =>
                t.id === tabId
                  ? {
                      ...t,
                      scrollPosition: position,
                      lastMessageCount: t.messages?.length || 0,
                    }
                  : t
              ),
            }
          : p
      ),
    };

    this.persist();
    this.notifyListeners();
  }

  getScrollPosition(projectId: string, tabId: string): number | undefined {
    const project = this.state.projects.find((p) => p.id === projectId);
    const tab = project?.tabs.find((t) => t.id === tabId);
    return tab?.scrollPosition;
  }

  addRecentSession(
    sessionData: Omit<Session, "id" | "createdAt" | "updatedAt">
  ) {
    const session: Session = {
      ...sessionData,
      id: `session_${Date.now()}_${Math.random()
        .toString(36)
        .substring(2, 11)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.state = {
      ...this.state,
      recentSessions: [
        session,
        ...this.state.recentSessions.slice(0, 49), // Keep max 50 recent sessions
      ],
    };

    this.persist();
    this.notifyListeners();
  }

  getProjectSessions(projectId: string): Session[] {
    return this.state.recentSessions.filter((s) => s.projectId === projectId);
  }

  setAvailableSessions(projectPath: string, sessions: AvailableSession[]) {
    this.state = {
      ...this.state,
      availableSessionsByProject: {
        ...this.state.availableSessionsByProject,
        [projectPath]: sessions,
      },
    };

    this.persist();
    this.notifyListeners();
  }

  getAvailableSessions(projectPath: string): AvailableSession[] {
    return this.state.availableSessionsByProject[projectPath] || [];
  }

  getActiveProject(): Project | undefined {
    return this.state.projects.find((p) => p.id === this.state.activeProjectId);
  }

  getProjectByPath(path: string): Project | undefined {
    return this.state.projects.find((p) => p.path === path);
  }
}

// Create singleton instance
const storeInstance = new ProjectStoreClass();

// React hook for using the store with stable references
export function useProjectStore() {
  const [state, setState] = React.useState<ProjectStoreState>(
    storeInstance.getState()
  );

  React.useEffect(() => {
    const unsubscribe = storeInstance.subscribe(setState);
    return unsubscribe;
  }, []);

  // Use useMemo to create stable function references
  const stableApi = useMemo(
    () => ({
      addProject: storeInstance.addProject.bind(storeInstance),
      removeProject: storeInstance.removeProject.bind(storeInstance),
      setActiveProject: storeInstance.setActiveProject.bind(storeInstance),
      updateProject: storeInstance.updateProject.bind(storeInstance),
      addTab: storeInstance.addTab.bind(storeInstance),
      removeTab: storeInstance.removeTab.bind(storeInstance),
      setActiveTab: storeInstance.setActiveTab.bind(storeInstance),
      updateTab: storeInstance.updateTab.bind(storeInstance),
      addMessageToTab: storeInstance.addMessageToTab.bind(storeInstance),
      getTabMessages: storeInstance.getTabMessages.bind(storeInstance),
      clearTabMessages: storeInstance.clearTabMessages.bind(storeInstance),
      markTabAsRead: storeInstance.markTabAsRead.bind(storeInstance),
      updateUnreadCounts: storeInstance.updateUnreadCounts.bind(storeInstance),
      saveScrollPosition: storeInstance.saveScrollPosition.bind(storeInstance),
      getScrollPosition: storeInstance.getScrollPosition.bind(storeInstance),
      addRecentSession: storeInstance.addRecentSession.bind(storeInstance),
      getProjectSessions: storeInstance.getProjectSessions.bind(storeInstance),
      setAvailableSessions:
        storeInstance.setAvailableSessions.bind(storeInstance),
      getAvailableSessions:
        storeInstance.getAvailableSessions.bind(storeInstance),
      getActiveProject: storeInstance.getActiveProject.bind(storeInstance),
      getProjectByPath: storeInstance.getProjectByPath.bind(storeInstance),
    }),
    []
  );

  return {
    ...state,
    ...stableApi,
  };
}
