import React, { useState, useEffect, useRef, useMemo, useCallback, memo } from "react";
import {
  View,
  TouchableOpacity,
  Text,
  Animated,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
} from "react-native";
import { FlashList } from '@shopify/flash-list';
import { colors, spacing } from "../theme/colors";
import { useWebSocket } from "../hooks/use-web-socket";
import { useStore } from "../store";
import { useProjectStore } from "../store/project-store";
import { EmptyState } from "./empty-state";
import { ClaudeMessageView } from "./claude-message";
import { ToolMessage } from "./tool-message";
import { MessageInput } from "./message-input";
import { TypingIndicator } from "./typing-indicator";
import { ToolTrackerDisplay } from "./shared/tool-tracker-display";
import { AgentStatusDisplay } from "./agent-status-display";
import type { ClaudeMessage } from "../types/websocket.types";

// Mémorisation des composants de messages
const MemoizedClaudeMessage = memo(ClaudeMessageView, (prevProps, nextProps) => {
  // Ne re-render que si le message a changé
  return prevProps.message.id === nextProps.message.id &&
         prevProps.message.content === nextProps.message.content;
});

const MemoizedToolMessage = memo(ToolMessage, (prevProps, nextProps) => {
  return prevProps.tool.id === nextProps.tool.id &&
         prevProps.tool.status === nextProps.tool.status;
});

// Styles en dehors du composant pour éviter la recréation
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  messagesContainer: {
    flex: 1,
    paddingTop: spacing.sm,
  },
  messageItem: {
    paddingHorizontal: spacing.sm,
  },
  scrollToBottomButton: {
    position: "absolute",
    right: spacing.md,
    bottom: 32,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.accent.primary,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: colors.shadow.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  scrollIcon: {
    fontSize: 20,
    color: "#ffffff",
    fontWeight: "600",
  },
  toolTrackerContainer: {
    position: "absolute",
    top: spacing.sm,
    left: spacing.sm,
    right: spacing.sm,
    zIndex: 10,
    elevation: 10,
  },
  agentStatusContainer: {
    position: "absolute",
    top: spacing.sm,
    left: spacing.sm,
    right: spacing.sm,
    zIndex: 10,
    elevation: 10,
  },
});

export default function OptimizedChatContent() {
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const listRef = useRef<FlashList<any>>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const {
    activeProjectId,
    getActiveProject,
    addMessageToTab,
  } = useProjectStore();
  
  const activeProject = getActiveProject();
  const activeTab = activeProject?.tabs.find(
    tab => tab.id === activeProject.activeTabId
  );
  const activeSessionId = activeTab?.sessionId;

  const {
    isConnected,
    claudeStatus,
    sendMessage: wsSendMessage,
    startClaude,
    totalToolsUsed = 0,
    activeAgentIds = [],
    completedAgents = [],
    loadSessionHistory,
    isSessionHistoryLoading,
  } = useWebSocket();

  const { isClaudeRunning } = useStore();

  // Messages filtrés avec mémorisation
  const messages = useMemo(() => {
    return activeTab?.messages || [];
  }, [activeTab?.messages]);

  // Rendu optimisé de chaque item
  const renderItem = useCallback(({ item }: { item: ClaudeMessage }) => {
    if (item.type === 'human') {
      return (
        <View style={styles.messageItem}>
          <View style={{ marginVertical: spacing.sm }}>
            <Text style={{ color: colors.text.primary }}>{item.content}</Text>
          </View>
        </View>
      );
    }

    if (item.type === 'assistant') {
      return (
        <View style={styles.messageItem}>
          <MemoizedClaudeMessage message={item} />
        </View>
      );
    }

    if (item.tool_use) {
      return (
        <View style={styles.messageItem}>
          <MemoizedToolMessage tool={item} />
        </View>
      );
    }

    return null;
  }, []);

  // Gestion du scroll optimisée
  const handleScroll = useCallback((event: any) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const isNearBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 50;
    setShowScrollButton(!isNearBottom);
  }, []);

  const scrollToBottom = useCallback(() => {
    if (listRef.current && messages.length > 0) {
      listRef.current.scrollToEnd({ animated: true });
    }
  }, [messages.length]);

  // Auto-scroll uniquement pour les nouveaux messages
  const previousMessageCount = useRef(messages.length);
  useEffect(() => {
    if (messages.length > previousMessageCount.current) {
      scrollToBottom();
    }
    previousMessageCount.current = messages.length;
  }, [messages.length, scrollToBottom]);

  const sendMessage = useCallback((text: string) => {
    if (!text.trim() || !isConnected || !isClaudeRunning) return;

    const newMessage: ClaudeMessage = {
      id: `msg_${Date.now()}`,
      type: 'human',
      content: text,
      timestamp: new Date().toISOString(),
    };

    if (activeProjectId && activeTab?.id) {
      addMessageToTab(activeProjectId, activeTab.id, newMessage);
    }

    wsSendMessage(text, activeSessionId || '', activeProjectId || '');
    setInputText("");
    setIsTyping(true);
    
    setTimeout(() => setIsTyping(false), 2000);
  }, [isConnected, isClaudeRunning, activeProjectId, activeTab?.id, activeSessionId, wsSendMessage, addMessageToTab]);

  if (!activeProject || !activeTab) {
    return (
      <View style={styles.container}>
        <EmptyState />
      </View>
    );
  }

  if (activeSessionId && isSessionHistoryLoading && typeof isSessionHistoryLoading === 'function' && isSessionHistoryLoading(activeSessionId)) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.accent.primary} />
        <Text style={{ color: colors.text.secondary, marginTop: spacing.md }}>
          Loading session history...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {activeAgentIds.length > 0 && (
        <Animated.View style={[styles.agentStatusContainer, { opacity: fadeAnim }]}>
          <AgentStatusDisplay
            agentIds={activeAgentIds}
            completedAgents={completedAgents}
          />
        </Animated.View>
      )}
      
      {totalToolsUsed > 0 && activeAgentIds.length === 0 && (
        <Animated.View style={[styles.toolTrackerContainer, { opacity: fadeAnim }]}>
          <ToolTrackerDisplay toolCount={totalToolsUsed} />
        </Animated.View>
      )}

      <View style={styles.messagesContainer}>
        {messages.length === 0 ? (
          <ScrollView 
            contentContainerStyle={{ flex: 1 }}
            showsVerticalScrollIndicator={false}
          >
            <EmptyState />
          </ScrollView>
        ) : (
          <FlashList
            ref={listRef}
            data={messages}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            estimatedItemSize={200}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            contentContainerStyle={{ paddingBottom: spacing.lg }}
            ListFooterComponent={isTyping ? <TypingIndicator /> : null}
            ListEmptyComponent={<EmptyState />}
          />
        )}
      </View>

      {showScrollButton && (
        <TouchableOpacity
          style={styles.scrollToBottomButton}
          onPress={scrollToBottom}
          activeOpacity={0.8}
        >
          <Text style={styles.scrollIcon}>↓</Text>
        </TouchableOpacity>
      )}

      <View style={{ zIndex: 100, elevation: 100 }}>
        <MessageInput
          value={inputText}
          onChangeText={setInputText}
          onSubmit={sendMessage}
          disabled={!isConnected || !isClaudeRunning}
          placeholder={
            !isConnected 
              ? "Connect to server first" 
              : !isClaudeRunning 
                ? "Start Claude to chat" 
                : "Type a message..."
          }
        />
      </View>
    </View>
  );
}