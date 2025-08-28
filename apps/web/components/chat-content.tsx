import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  View,
  ScrollView,
  TouchableOpacity,
  Text,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from "react-native";
import { colors, spacing } from "../theme/colors";
import { useWebSocket } from "../hooks/use-web-socket";
import { useStore } from "../store";
import { useProjectStore } from "../store/project-store";
import { useScrollHandler } from "../hooks/use-scroll-handler";
import { EmptyState } from "./empty-state";
import { ClaudeMessage } from "./claude-message";
import { ToolMessage } from "./tool-message";
import { MessageInput } from "./message-input";
import { TypingIndicator } from "./typing-indicator";
import { ToolTrackerDisplay } from "./shared/tool-tracker-display";
import { AgentStatusDisplay } from "./agent-status-display";

const createMainStyles = () => ({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  messagesContainer: {
    flex: 1,
    paddingTop: spacing.sm,
  },
  messagesContent: {
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.lg,
  },
  scrollToBottomButton: {
    position: "absolute" as const,
    right: spacing.md,
    bottom: 32,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.accent.primary,
    justifyContent: "center" as const,
    alignItems: "center" as const,
    shadowColor: colors.shadow.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  scrollIcon: {
    fontSize: 20,
    color: "#ffffff",
    fontWeight: "600" as const,
  },
  toolTrackerContainer: {
    position: "absolute" as const,
    top: spacing.sm,
    left: spacing.sm,
    right: spacing.sm,
    zIndex: 1,
  },
  agentStatusContainer: {
    position: "absolute" as const,
    top: spacing.sm,
    left: spacing.sm,
    right: spacing.sm,
    zIndex: 1,
  },
});

export default function ChatContent() {
  const styles = createMainStyles();
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  
  const { 
    activeProjectId, 
    getActiveProject, 
    getTabMessages, 
    addMessageToTab,
    saveScrollPosition,
    getScrollPosition 
  } = useProjectStore();
  const activeProject = getActiveProject();
  
  // Get active tab
  const activeTab = activeProject?.tabs.find(
    tab => tab.id === activeProject.activeTabId
  );
  const activeSessionId = activeTab?.sessionId;

  const {
    isConnected,
    claudeStatus,
    sendMessage: wsSendMessage,
    startClaude,
    totalToolsUsed,
    runningToolsCount,
    lastThreeTools,
    activeAgents,
    completedAgents,
    agentToolCounts,
    getAgentToolIds,
    loadSessionHistory,
  } = useWebSocket();
  
  // Get messages from the active tab - use the messages directly from the tab
  const messages = activeTab?.messages || [];

  const { setConnected, setClaudeRunning } = useStore();

  const {
    scrollViewRef,
    isAtBottom,
    scrollViewHeight,
    contentHeight,
    currentScrollPosition,
    checkIfAtBottom,
    scrollToBottom,
    scrollToPosition,
    getCurrentScrollPosition,
    handleLayout,
    handleContentSizeChange,
  } = useScrollHandler();

  useEffect(() => {
    setConnected(isConnected);
    setClaudeRunning(claudeStatus.isRunning);
  }, [isConnected, claudeStatus.isRunning]);

  const previousTabRef = useRef<string | undefined>();
  const previousProjectRef = useRef<string | undefined>();
  
  useEffect(() => {
    if (previousTabRef.current && 
        previousProjectRef.current && 
        (previousTabRef.current !== activeTab?.id || previousProjectRef.current !== activeProjectId)) {
      const position = currentScrollPosition;
      saveScrollPosition(previousProjectRef.current, previousTabRef.current, position);
    }
    previousTabRef.current = activeTab?.id;
    previousProjectRef.current = activeProjectId || undefined;
  }, [activeTab?.id, activeProjectId, currentScrollPosition, saveScrollPosition]);
  
  useEffect(() => {
    if (activeSessionId && activeProject?.path && isConnected) {
      if (!messages || messages.length === 0) {
        loadSessionHistory(activeSessionId, activeProject.path);
      }
    }
  }, [activeSessionId, activeProject?.path, isConnected, messages.length, loadSessionHistory]);

  const filteredMessages = useMemo(() => {
    const result = messages.filter((message) => {
      if (completedAgents.length === 0) {
        return true;
      }

      if (message.tool_use || message.tool_result) {
        const toolId = message.tool_use?.id || message.tool_result?.tool_use_id;

        if (toolId) {
          const belongsToCompletedAgent = completedAgents.some((agent) => {
            const agentToolIds = getAgentToolIds(agent.id);
            return agentToolIds.includes(toolId);
          });

          return !belongsToCompletedAgent;
        }
      }

      return true;
    });

    return result;
  }, [messages, completedAgents, getAgentToolIds]);

  const displayableMessages = useMemo(() => {
    return filteredMessages.filter((message, index) => {
      if (message.tool_result) {
        const matchingToolUse = filteredMessages
          .slice(0, index)
          .find(
            (msg) =>
              msg.tool_use &&
              msg.tool_use.id === message.tool_result?.tool_use_id
          );

        return !matchingToolUse;
      }
      return true;
    });
  }, [filteredMessages]);

  const hasRestoredRef = useRef<string | undefined>();
  const previousMessageCountRef = useRef<number>(0);
  
  useEffect(() => {
    if (!activeTab || !activeProjectId) return;
    const isNewChatTab = activeTab.title === 'New Chat' && displayableMessages.length === 0;
    if (isNewChatTab) {
      return;
    }
    
    const tabKey = `${activeProjectId}-${activeTab.id}`;
    const currentMessageCount = displayableMessages.length;
    const hasNewMessages = currentMessageCount > previousMessageCountRef.current;
    
    // Only scroll if this is a different tab or we have new messages
    if (hasRestoredRef.current === tabKey && !hasNewMessages) {
      return;
    }
    
    // Update previous message count
    previousMessageCountRef.current = currentMessageCount;
    
    const savedPosition = getScrollPosition(activeProjectId, activeTab.id);
    
    setTimeout(() => {
      if (hasNewMessages && hasRestoredRef.current === tabKey) {
        // Only scroll to bottom for new messages if we've already restored this tab
        scrollToBottom();
      } else if (hasRestoredRef.current !== tabKey) {
        // First time loading this tab
        if (savedPosition !== undefined && savedPosition >= 0) {
          scrollToPosition(savedPosition, false);
        } else if (displayableMessages.length > 0) {
          scrollToBottom(false);
        }
        hasRestoredRef.current = tabKey;
      }
    }, 100);
  }, [activeTab?.id, displayableMessages.length, activeProjectId]);

  const handleSend = useCallback(() => {
    if (!inputText.trim() || !activeTab) return;

    setIsTyping(true);
    
    // Add user message to the session
    const userMessage = {
      human: inputText,
      timestamp: Date.now(),
    };
    addMessageToTab(activeProjectId!, activeTab.id, userMessage);

    if (isConnected) {
      // Send to WebSocket - in real implementation, this would be routed to the session
      wsSendMessage(inputText);
      
      setTimeout(() => {
        const assistantMessage = {
          assistant: `[Session: ${activeTab.title}] I'm helping you with: "${inputText}". Each session maintains its own conversation history.`,
          timestamp: Date.now(),
        };
        addMessageToTab(activeProjectId!, activeTab.id, assistantMessage);
        setIsTyping(false);
      }, 1500);
    } else {
      setTimeout(() => {
        const assistantMessage = {
          assistant: `[Offline - ${activeTab.title}] Your message "${inputText}" has been recorded in this session.`,
          timestamp: Date.now(),
        };
        addMessageToTab(activeProjectId!, activeTab.id, assistantMessage);
        setIsTyping(false);
      }, 500);
    }

    setInputText("");
  }, [inputText, isConnected, wsSendMessage, activeTab, activeProjectId, addMessageToTab]);

  const showScrollButton =
    !isAtBottom && contentHeight > scrollViewHeight + 100;

  const handleScrollToBottom = useCallback(() => {
    scrollToBottom();
  }, [scrollToBottom]);

  if (!activeProject) {
    return (
      <View style={styles.container}>
        <View style={styles.messagesContainer}>
          <Text style={{ color: colors.text.primary, textAlign: 'center', marginTop: 50 }}>
            No active project selected
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.messagesContainer}>
        <ScrollView
          ref={scrollViewRef}
          style={{ flex: 1 }}
          contentContainerStyle={styles.messagesContent}
          onScroll={checkIfAtBottom}
          scrollEventThrottle={16}
          onLayout={handleLayout}
          onContentSizeChange={handleContentSizeChange}
          showsVerticalScrollIndicator={false}
        >
          {messages.length === 0 ? (
            <EmptyState
              isConnected={isConnected}
              claudeIsRunning={claudeStatus.isRunning}
              onStartClaude={startClaude}
              fadeAnim={fadeAnim}
              slideAnim={slideAnim}
              sessionTitle={activeTab?.title}
              projectId={activeProjectId}
              tabId={activeTab?.id}
            />
          ) : (
            <>
              {displayableMessages.map((message, index) => {
                if (message.tool_use) {
                  const matchingResult = displayableMessages
                    .slice(index + 1)
                    .find(
                      (msg) =>
                        msg.tool_result &&
                        msg.tool_result.tool_use_id === message.tool_use?.id
                    );

                  return (
                    <Animated.View
                      key={index}
                      style={{
                        opacity: fadeAnim,
                        transform: [{ translateY: slideAnim }],
                      }}
                    >
                      <ToolMessage
                        toolUse={message.tool_use}
                        toolResult={matchingResult?.tool_result}
                        timestamp={message.timestamp}
                      />
                    </Animated.View>
                  );
                }

                return (
                  <ClaudeMessage
                    key={index}
                    message={message}
                    fadeAnim={fadeAnim}
                    slideAnim={slideAnim}
                  />
                );
              })}
            </>
          )}

          {isTyping && <TypingIndicator />}
        </ScrollView>

        {/* Agent Status Display */}
        {(activeAgents.length > 0 || completedAgents.length > 0) && (
          <View style={styles.agentStatusContainer}>
            <AgentStatusDisplay
              activeAgents={activeAgents}
              completedAgents={completedAgents}
              agentToolCounts={agentToolCounts}
              getAgentToolIds={getAgentToolIds}
            />
          </View>
        )}

        {/* Tool Tracker Display */}
        {totalToolsUsed > 0 &&
          activeAgents.length === 0 &&
          completedAgents.length === 0 && (
            <View style={styles.toolTrackerContainer}>
              <ToolTrackerDisplay
                totalTools={totalToolsUsed}
                runningCount={runningToolsCount}
                lastThreeTools={lastThreeTools}
                showCollapsed={true}
              />
            </View>
          )}

        {showScrollButton && (
          <TouchableOpacity
            style={styles.scrollToBottomButton}
            onPress={handleScrollToBottom}
            activeOpacity={0.8}
          >
            <Text style={styles.scrollIcon}>{"↓"}</Text>
          </TouchableOpacity>
        )}
      </View>

      <MessageInput
        inputText={inputText}
        onChangeText={setInputText}
        onSend={handleSend}
        isConnected={isConnected}
      />
    </View>
  );
}