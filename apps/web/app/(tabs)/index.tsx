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
import { colors, spacing } from "../../theme/colors";
import { useWebSocket } from "../../hooks/use-web-socket";
import { useStore } from "../../store";
import { useProjectStore } from "../../store/project-store";
import { useScrollHandler } from "../../hooks/use-scroll-handler";
import { EmptyState } from "../../components/empty-state";
import { ClaudeMessage } from "../../components/claude-message";
import { ToolMessage } from "../../components/tool-message";
import { MessageInput } from "../../components/message-input";
import { TypingIndicator } from "../../components/typing-indicator";
import { ToolTrackerDisplay } from "../../components/shared/tool-tracker-display";
import { AgentStatusDisplay } from "../../components/agent-status-display";
import { SessionTabs } from "../../components/session-tabs";
import { useRouter } from "expo-router";

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

export default function ChatScreen() {
  const styles = createMainStyles();
  const router = useRouter();
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  const { activeProjectId, getActiveProject, addTab, recentSessions } =
    useProjectStore();
  const activeProject = getActiveProject();

  // Redirect to home if no active project
  useEffect(() => {
    // Add a small delay to ensure router is mounted
    const timer = setTimeout(() => {
      if (!activeProjectId && router.canGoBack !== undefined) {
        router.push("/(tabs)/home");
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [activeProjectId, router]);

  const activeSessionId = activeProject?.tabs.find(
    (tab) => tab.id === activeProject.activeTabId
  )?.sessionId;

  const {
    isConnected,
    claudeStatus,
    messages,
    sendMessage,
    startClaude,
    totalToolsUsed,
    runningToolsCount,
    lastThreeTools,
    activeAgents,
    completedAgents,
    agentToolCounts,
    getAgentToolIds,
  } = useWebSocket();

  const { setConnected, setClaudeRunning } = useStore();

  const {
    scrollViewRef,
    isAtBottom,
    scrollViewHeight,
    contentHeight,
    checkIfAtBottom,
    scrollToBottom,
    handleLayout,
    handleContentSizeChange,
  } = useScrollHandler();

  useEffect(() => {
    setConnected(isConnected);
    setClaudeRunning(claudeStatus.isRunning);
  }, [isConnected, claudeStatus.isRunning]);

  // Filter messages to hide individual tool executions that belong to completed agents
  const filteredMessages = useMemo(() => {
    const result = messages.filter((message) => {
      // Don't filter if agent tracking is disabled
      if (completedAgents.length === 0) {
        return true;
      }

      // Check if this is a tool message that belongs to a completed agent
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

  // Further filter messages to exclude tool_result messages that have matching tool_use
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

  useEffect(() => {
    if (displayableMessages.length > 0 && isAtBottom) {
      setTimeout(() => scrollToBottom(), 100);
    }
  }, [displayableMessages.length, isAtBottom]);

  const handleSend = useCallback(() => {
    if (!inputText.trim()) return;

    setIsTyping(true);

    if (isConnected) {
      sendMessage(inputText);
      setTimeout(() => setIsTyping(false), 1500);
    } else {
      setIsTyping(false);
    }

    setInputText("");
  }, [inputText, isConnected, sendMessage]);

  const showScrollButton =
    !isAtBottom && contentHeight > scrollViewHeight + 100;

  const handleScrollToBottom = useCallback(() => {
    scrollToBottom();
  }, [scrollToBottom]);

  if (!activeProject) {
    return null;
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      <SessionTabs projectId={activeProjectId!} />
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
            />
          ) : (
            <>
              {displayableMessages.map((message, index) => {
                // Check if this is a tool_use message
                if (message.tool_use) {
                  // Look for matching tool_result by ID (can be anywhere after this message)
                  const matchingResult = displayableMessages
                    .slice(index + 1)
                    .find(
                      (msg) =>
                        msg.tool_result &&
                        msg.tool_result.tool_use_id === message.tool_use?.id
                    );

                  // Render unified tool message
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

                // Render regular message (tool_result messages already filtered out)
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
    </KeyboardAvoidingView>
  );
}
