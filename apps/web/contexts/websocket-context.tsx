import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback,
  useRef,
} from "react";
// Alternative import method to avoid engine.parse error
const io = require("socket.io-client");
import type { Socket } from "socket.io-client";
import { useToolTracker } from "../hooks/use-tool-tracker";
import { useProjectStore } from "../store/project-store";
import type {
  ClaudeStatus,
  WebSocketContextType,
  ClaudeStatusEvent,
  ClaudeSystemEvent,
  ClaudeAssistantEvent,
  ClaudeUserEvent,
  ClaudeSessionEvent,
  ClaudeOutputEvent,
  ClaudeSessionHistoryEvent,
  ClaudeSessionUpdatedEvent,
  ClaudeSessionsEvent,
  ClaudeStartResultEvent,
  FileListResultEvent,
  ToolUseData,
  ToolResultData,
  ContextMessageData,
} from "../types/websocket.types";
import type { ClaudeMessage, AvailableSession } from "../types/project.types";
import type { HistoryItem, RealtimeMessage } from "../types/message.types";
import { ensureString, transformHistoryItem } from "../utils/message-utils";

const WebSocketContext = createContext<WebSocketContextType | null>(null);

export function WebSocketProvider({ children }: { children: ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [claudeStatus, setClaudeStatus] = useState<ClaudeStatus>({
    isRunning: false,
    pid: null,
    currentSessionId: null,
  });
  const [messages, setMessages] = useState<ClaudeMessage[]>([]);
  const [availableSessions, setAvailableSessions] = useState<
    AvailableSession[]
  >([]);
  const [loadingSessionHistory, setLoadingSessionHistory] = useState<
    Set<string>
  >(new Set());
  const [justLoadedSessionId, setJustLoadedSessionId] = useState<string | null>(null);
  const activeSubscriptionsRef = useRef<Set<string>>(new Set());
  const loadedSessionsRef = useRef<Set<string>>(new Set());
  const socketRef = useRef<Socket | null>(null);

  const {
    activeProjectId,
    getActiveProject,
    addMessageToTab,
    projects,
    setAvailableSessions: storeSetAvailableSessions,
  } = useProjectStore();
  const storeSetAvailableSessionsRef = useRef(storeSetAvailableSessions);

  // Update ref when function changes
  useEffect(() => {
    storeSetAvailableSessionsRef.current = storeSetAvailableSessions;
  }, [storeSetAvailableSessions]);

  // Tool tracking
  const {
    startTool,
    completeTool,
    getLastThreeTools,
    getRunningCount,
    getNestedTools,
    getAgentToolIds,
    totalToolsUsed,
    nestedToolsByParent,
    activeAgents,
    completedAgents,
    agentToolCounts,
    reset: resetToolTracking,
  } = useToolTracker();

  // Message handlers extracted for better maintainability
  const addMessage = useCallback(
    (message: ClaudeMessage) => {
      // Add to global messages for compatibility
      setMessages((prev) => [...prev, { ...message, timestamp: Date.now() }]);

      // Also add to active session in store
      const activeProject = getActiveProject();
      if (activeProject && activeProject.activeTabId) {
        addMessageToTab(activeProjectId!, activeProject.activeTabId, {
          ...message,
          timestamp: Date.now(),
        });
      }
    },
    [activeProjectId, getActiveProject, addMessageToTab]
  );

  const addSystemMessage = useCallback(
    (content: string) => {
      addMessage({ system: content });
    },
    [addMessage]
  );

  const addAssistantMessage = useCallback(
    (content: string) => {
      addMessage({ assistant: content });
    },
    [addMessage]
  );

  const addUserMessage = useCallback(
    (content: string) => {
      addMessage({ human: content });
    },
    [addMessage]
  );

  const handleToolUse = useCallback(
    (data: ToolUseData) => {
      startTool(data.id, data.tool, data.input);
      addMessage({
        tool_use: {
          name: data.tool,

          input: data.input,
          id: data.id,
        },
        isLoading: true,
      });
    },
    [startTool, addMessage]
  );

  const handleToolResult = useCallback(
    (data: ToolResultData) => {
      completeTool(data.tool_use_id, !!data.error, data);

      setMessages((prev) => {
        const updatedMessages = prev.map((msg) => {
          if (msg.tool_use?.id === data.tool_use_id) {
            return {
              ...msg,
              tool_result: {
                content: ensureString(data.content),
                tool_use_id: data.tool_use_id,
                error: data.error,
              },
              isLoading: false,
              timestamp: msg.timestamp,
            };
          }
          return msg;
        });

        const foundMatch = updatedMessages.some(
          (msg) => msg.tool_use?.id === data.tool_use_id
        );
        if (!foundMatch) {
          return [
            ...updatedMessages,
            {
              tool_result: {
                content:
                  typeof data.content === "string"
                    ? data.content
                    : JSON.stringify(data.content),
                tool_use_id: data.tool_use_id,
                error: data.error,
              },
              timestamp: Date.now(),
            },
          ];
        }

        return updatedMessages;
      });
    },
    [completeTool]
  );

  const addContextMessage = useCallback(
    (data: ContextMessageData) => {
      addMessage({
        context: {
          type: "context",
          content: data.tools
            ? `Available tools: ${data.tools.join(", ")}`
            : "",
          usage: data,
        },
      });
    },
    [addMessage]
  );

  const addSessionMessage = useCallback(
    (data: { session_id: string; timestamp: number; cwd: string }) => {
      addMessage({
        session: {
          id: data.session_id,
          created: data.timestamp,
          cwd: data.cwd,
        },
      });
    },
    [addMessage]
  );

  const processHistoryMessages = useCallback(
    (history: HistoryItem[]) => {
      resetToolTracking();

      let currentAgentId: string | null = null;

      history.forEach((item: HistoryItem) => {
        if (item.type === "assistant" && item.message?.content) {
          const toolUse = Array.isArray(item.message.content)
            ? item.message.content.find((c) => c.type === "tool_use")
            : null;

          if (toolUse?.name === "Task" && toolUse.input?.subagent_type) {
            currentAgentId = toolUse.id;
            startTool(toolUse.id, toolUse.name, toolUse.input);
          }
        }

        if (item.type === "user" && item.message?.content && currentAgentId) {
          const toolResult = Array.isArray(item.message.content)
            ? item.message.content.find((c) => c.type === "tool_result")
            : null;

          if (toolResult && item.toolUseResult) {
            const stats = item.toolUseResult;
            completeTool(currentAgentId, false, {
              content: toolResult.content,
              totalToolUseCount: stats.totalToolUseCount,
              totalDurationMs: stats.totalDurationMs,
              totalTokens: stats.totalTokens,
            });
            currentAgentId = null;
          }
        }
      });

      return transformHistoryToMessages(history);
    },
    [resetToolTracking, startTool, completeTool]
  );

  const transformHistoryToMessages = useCallback(
    (history: HistoryItem[]): ClaudeMessage[] => {
      return history
        .map(transformHistoryItem)
        .filter((msg): msg is ClaudeMessage => msg !== null);
    },
    []
  );

  const processRealtimeMessages = useCallback(
    (newMessages: RealtimeMessage[]) => {
      const validMessages = newMessages
        .map((item: RealtimeMessage) => {
          if (
            item.tool_use ||
            (item.type === "assistant" && item.message?.content)
          ) {
            let toolUse = item.tool_use;

            if (
              !toolUse &&
              item.message?.content &&
              Array.isArray(item.message.content)
            ) {
              toolUse = item.message.content.find((c) => c.type === "tool_use");
            }

            if (toolUse) {
              if (toolUse.name === "Task" && toolUse.input?.subagent_type) {
                startTool(toolUse.id, toolUse.name, toolUse.input);
              } else {
                startTool(toolUse.id, toolUse.name, toolUse.input);
              }

              return {
                tool_use: {
                  name: toolUse.name,
                  input: toolUse.input,
                  id: toolUse.id,
                },
                isLoading: true,
                timestamp: item.timestamp
                  ? new Date(item.timestamp).getTime()
                  : Date.now(),
              };
            }
          }

          if (
            item.tool_result ||
            (item.type === "user" && item.message?.content)
          ) {
            let toolResult = item.tool_result;

            if (
              !toolResult &&
              item.message?.content &&
              Array.isArray(item.message.content)
            ) {
              toolResult = item.message.content.find(
                (c) => c.type === "tool_result"
              );
            }

            if (toolResult) {
              if (toolResult.tool_use_id) {
                completeTool(
                  toolResult.tool_use_id,
                  !!toolResult.error,
                  toolResult
                );
              }

              return {
                tool_result: {
                  content:
                    typeof toolResult.content === "string"
                      ? toolResult.content
                      : JSON.stringify(toolResult.content),
                  error: toolResult.error,
                  tool_use_id: toolResult.tool_use_id,
                },
                timestamp: item.timestamp
                  ? new Date(item.timestamp).getTime()
                  : Date.now(),
              };
            }
          }

          if (
            item.assistant ||
            (item.role === "assistant" && item.content) ||
            (item.type === "assistant" && item.message)
          ) {
            let content = "";

            if (item.assistant) {
              content = item.assistant;
            } else if (item.content) {
              content = item.content;
            } else if (item.message?.content) {
              if (Array.isArray(item.message.content)) {
                const textContent = item.message.content.find(
                  (c) => c.type === "text"
                );
                content = textContent?.text || "";
              } else {
                content = item.message.content;
              }
            }

            if (content) {
              return {
                assistant: ensureString(content),
                timestamp: item.timestamp
                  ? new Date(item.timestamp).getTime()
                  : Date.now(),
              };
            }
          }

          if (
            item.human ||
            (item.role === "user" && item.content) ||
            (item.type === "user" && item.message)
          ) {
            let content = "";

            if (item.human) {
              content = item.human;
            } else if (item.content) {
              content = item.content;
            } else if (item.message?.content) {
              if (typeof item.message.content === "string") {
                content = item.message.content;
              } else if (Array.isArray(item.message.content)) {
                const textContent = item.message.content.find(
                  (c) => c.type === "text"
                );
                content = textContent?.text || textContent?.content || "";
                if (!content) {
                  content = item.message.content
                    .map((c) =>
                      typeof c === "string" ? c : c.text || c.content || ""
                    )
                    .join("");
                }
              }
            }

            if (content) {
              return {
                human: ensureString(content),
                timestamp: item.timestamp
                  ? new Date(item.timestamp).getTime()
                  : Date.now(),
              };
            }
          }

          return null;
        })
        .filter((msg): msg is ClaudeMessage => msg !== null);

      const toolResults = validMessages.filter((msg) => msg && msg.tool_result);
      const otherMessages = validMessages.filter(
        (msg) => msg && !msg.tool_result
      );

      setMessages((prev) => {
        let updatedMessages = [...prev];

        toolResults.forEach((resultMsg) => {
          if (resultMsg && resultMsg.tool_result) {
            const toolUseId = resultMsg.tool_result.tool_use_id;
            const foundIndex = updatedMessages.findIndex(
              (msg) => msg.tool_use?.id === toolUseId
            );

            if (foundIndex !== -1) {
              updatedMessages[foundIndex] = {
                ...updatedMessages[foundIndex],
                tool_result: resultMsg.tool_result,
                isLoading: false,
              };
            } else {
              updatedMessages.push(resultMsg);
            }
          }
        });

        if (otherMessages.length > 0) {
          updatedMessages = [...updatedMessages, ...otherMessages];
        }

        return updatedMessages;
      });
    },
    [startTool, completeTool]
  );

  // Subscribe to sessions only when tabs change (not on every message)
  useEffect(() => {
    if (!isConnected || !socket) return;

    // Build a map of current sessions from all project tabs
    const currentSessions = new Map<string, string>(); // sessionId -> projectPath

    projects.forEach((project) => {
      project.tabs.forEach((tab) => {
        // Only watch real sessions, not "new" placeholder tabs
        if (
          tab.sessionId &&
          tab.sessionId !== "new" &&
          !tab.sessionId.startsWith("new_")
        ) {
          currentSessions.set(tab.sessionId, project.path);
        }
      });
    });

    // Unsubscribe from sessions no longer in any tab
    activeSubscriptionsRef.current.forEach((sessionId) => {
      if (!currentSessions.has(sessionId)) {
        // Find the project path for cleanup
        const projectPath = Array.from(currentSessions.values())[0] || "";
        socket.emit("claude_unwatch_session", { sessionId, projectPath });
        activeSubscriptionsRef.current.delete(sessionId);
      }
    });

    // Subscribe to new sessions only
    currentSessions.forEach((projectPath, sessionId) => {
      if (!activeSubscriptionsRef.current.has(sessionId)) {
        socket.emit("claude_watch_session", { sessionId, projectPath });
        activeSubscriptionsRef.current.add(sessionId);
      }
    });
  }, [
    isConnected,
    socket,
    projects.map((p) => p.tabs.map((t) => t.sessionId).join(",")).join("|"),
  ]);

  useEffect(() => {
    const serverUrl =
      process.env.EXPO_PUBLIC_API_URL || "http://localhost:9876";
    const newSocket = io(serverUrl, {
      transports: ["websocket", "polling"],
      timeout: 20000,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    setSocket(newSocket);
    socketRef.current = newSocket;

    newSocket.on("connect", () => {
      setIsConnected(true);
      activeSubscriptionsRef.current.clear();
    });

    newSocket.on("disconnect", () => {
      setIsConnected(false);
      activeSubscriptionsRef.current.clear();
      loadedSessionsRef.current.clear();
    });

    newSocket.on("claude_status", (status: ClaudeStatusEvent) => {
      setClaudeStatus({
        isRunning: Boolean(status?.isRunning),
        pid: status?.pid || null,
        currentSessionId: status?.currentSessionId || null,
      });
    });

    // Real-time streaming event handlers
    newSocket.on("claude_system", (data: ClaudeSystemEvent) => {
      addSystemMessage(data.message?.content || data.content || "");
    });

    newSocket.on("claude_assistant", (data: ClaudeAssistantEvent) => {
      if (data.message?.content?.[0]?.type === "text") {
        addAssistantMessage(data.message.content[0].text);
      }
    });

    newSocket.on("claude_user", (data: ClaudeUserEvent) => {
      if (data.message?.content?.[0]?.type === "text") {
        addUserMessage(data.message.content[0].text);
      }
    });

    newSocket.on("claude_tool_use", handleToolUse);
    newSocket.on("claude_tool_result", handleToolResult);
    newSocket.on("claude_context", addContextMessage);

    newSocket.on("claude_session", (data: ClaudeSessionEvent) => {
      if (data.subtype !== "session_start") {
        addSessionMessage(data);
      }
    });

    newSocket.on("claude_output", (message: ClaudeOutputEvent) => {
      if (message?.content) {
        addAssistantMessage(String(message.content));
      }
    });

    newSocket.on(
      "claude_session_history",
      (data: ClaudeSessionHistoryEvent) => {
        if (data?.sessionId) {
          // Remove session from loading state
          setLoadingSessionHistory((prev) => {
            const newSet = new Set(prev);
            newSet.delete(data.sessionId);
            return newSet;
          });
          
          if (data?.history) {
            const validMessages = processHistoryMessages(data.history);

            // Find the tab with this sessionId and update its messages
            const activeProject = getActiveProject();
            if (activeProject) {
              const targetTab = activeProject.tabs.find(
                (tab) => tab.sessionId === data.sessionId
              );
              if (targetTab) {
                // Check if tab already has messages
                const existingMessages = targetTab.messages || [];

                if (existingMessages.length === 0) {
                  // Only load history if tab doesn't have messages yet
                  validMessages.forEach((msg) => {
                    addMessageToTab(activeProjectId!, targetTab.id, msg);
                  });
                  // Signal that this session just loaded
                  setJustLoadedSessionId(data.sessionId);
                  // Clear after a short delay
                  setTimeout(() => setJustLoadedSessionId(null), 100);
                }
              }
            }

            // Also set global messages for compatibility
            setMessages(validMessages);
            resetToolTracking();
          }
        }
      }
    );

    newSocket.on(
      "claude_session_updated",
      (data: ClaudeSessionUpdatedEvent) => {
        if (
          data?.sessionId &&
          data?.newMessages &&
          Array.isArray(data.newMessages)
        ) {
          // Find the tab with this session across ALL projects
          const allProjects = projects || [];
          for (const project of allProjects) {
            const targetTab = project.tabs.find(
              (tab) => tab.sessionId === data.sessionId
            );
            if (targetTab) {
              // Add messages to the correct tab, regardless of which project is active
              data.newMessages.forEach((msg) => {
                addMessageToTab(project.id, targetTab.id, {
                  ...msg.message,
                  timestamp: new Date(msg.timestamp).getTime(),
                });
              });
              break;
            }
          }

          // Also process for global messages if it's the current session
          if (data.sessionId === claudeStatus.currentSessionId) {
            processRealtimeMessages(data.newMessages);
          }
        }
      }
    );

    newSocket.on("claude_session_watch_started", () => {});
    newSocket.on("claude_session_watch_error", () => {});

    // Handle available sessions response
    newSocket.on("claude_sessions", (data: ClaudeSessionsEvent) => {
      // Handle both old format (sessions array) and new format (with projectPath)
      let sessions: AvailableSession[] = [];
      let projectPath: string | undefined;

      if (Array.isArray(data)) {
        // Old format: just an array of sessions
        sessions = data;
      } else if (data && typeof data === "object") {
        // New format: { sessions, projectPath }
        sessions = data.sessions || [];
        projectPath = data.projectPath;
      }

      setAvailableSessions(sessions);

      // Also save to store if we have a project path
      if (projectPath && storeSetAvailableSessionsRef.current) {
        storeSetAvailableSessionsRef.current(projectPath, sessions);
      }
    });

    newSocket.on("claude_start_result", (data: ClaudeStartResultEvent) => {
      if (data.status) {
        setClaudeStatus({
          isRunning: Boolean(data.status.isRunning),
          pid: data.status.pid || null,
          currentSessionId:
            data.status.currentSessionId || data.sessionId || null,
        });
      }

      if (data.sessionId && data.status?.isRunning) {
        const projectPath =
          process.env.PWD || "/Users/peax/Projects/claude-code-remote";
        newSocket.emit("claude_watch_session", {
          sessionId: data.sessionId,
          projectPath,
        });
      }
    });

    return () => {
      newSocket.close();
    };
  }, []);

  const sendMessage = useCallback(
    (message: string) => {
      if (socket?.connected) {
        addUserMessage(message);
        socket.emit("claude_message", { message: String(message) });
      }
    },
    [socket, addUserMessage]
  );

  const startClaude = useCallback(() => {
    socket?.emit("claude_start", {});
  }, [socket]);

  const loadFiles = useCallback(
    (path: string) => {
      socket?.emit("file_list", { path });
    },
    [socket]
  );

  const readFile = useCallback(
    (path: string) => {
      socket?.emit("file_read", { path });
    },
    [socket]
  );

  const runGitCommand = useCallback(
    (command: string) => {
      socket?.emit("git_command", { command });
    },
    [socket]
  );

  const watchSession = useCallback(
    (sessionId: string, projectPath: string) => {
      // Don't watch new sessions
      if (sessionId.startsWith('new_')) {
        return;
      }
      
      if (socket && !activeSubscriptionsRef.current.has(sessionId)) {
        socket.emit("claude_watch_session", { sessionId, projectPath });
        activeSubscriptionsRef.current.add(sessionId);
      }
    },
    [socket]
  );

  const unwatchSession = useCallback(
    (sessionId: string, projectPath: string) => {
      if (socket && activeSubscriptionsRef.current.has(sessionId)) {
        socket.emit("claude_unwatch_session", { sessionId, projectPath });
        activeSubscriptionsRef.current.delete(sessionId);
      }
    },
    [socket]
  );

  const loadSessionHistory = useCallback(
    (sessionId: string, projectPath: string) => {
      // Don't load history for new sessions
      if (sessionId.startsWith('new_')) {
        return;
      }
      
      // Always allow loading, but prevent multiple simultaneous loads for the same session
      if (!loadingSessionHistory.has(sessionId)) {
        // Mark session as loading
        setLoadingSessionHistory((prev) => new Set(prev).add(sessionId));
        socket?.emit("claude_get_session_history", { sessionId, projectPath });
        
        // Add a timeout to remove loading state if no response
        setTimeout(() => {
          setLoadingSessionHistory((prev) => {
            const newSet = new Set(prev);
            newSet.delete(sessionId);
            return newSet;
          });
        }, 10000); // 10 second timeout
      }
    },
    [socket, loadingSessionHistory]
  );

  const isSessionHistoryLoading = useCallback(
    (sessionId: string) => {
      return loadingSessionHistory.has(sessionId);
    },
    [loadingSessionHistory]
  );

  const getAvailableSessions = useCallback(
    (projectPath?: string) => {
      const activeProject = getActiveProject();
      const pathToUse = projectPath || activeProject?.path;

      if (socket?.connected && pathToUse) {
        socket.emit("claude_get_sessions", { projectPath: pathToUse });
      }
    },
    [socket, getActiveProject]
  );

  return (
    <WebSocketContext.Provider
      value={{
        socket,
        isConnected,
        claudeStatus,
        messages,
        availableSessions,
        sendMessage,
        startClaude,
        loadFiles,
        readFile,
        runGitCommand,
        watchSession,
        unwatchSession,
        loadSessionHistory,
        isSessionHistoryLoading,
        justLoadedSessionId,
        getAvailableSessions,
        // Tool tracking
        totalToolsUsed,
        runningToolsCount: getRunningCount(),
        lastThreeTools: getLastThreeTools(),
        getNestedTools,
        getAgentToolIds,
        nestedToolsByParent,
        activeAgents,
        completedAgents,
        agentToolCounts,
        resetToolTracking,
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket() {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error("useWebSocket must be used within WebSocketProvider");
  }
  return context;
}
