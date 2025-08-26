import { useState, useEffect, useRef } from 'react'
import { View, ScrollView, TouchableOpacity, Text, KeyboardAvoidingView, Platform, Animated } from 'react-native'
import { colors, spacing } from '../../theme/colors'
import { useWebSocket } from '../../hooks/use-web-socket'
import { useStore } from '../../store'
import { useScrollHandler } from '../../hooks/use-scroll-handler'
import { EmptyState } from '../../components/empty-state'
import { MessageBubble } from '../../components/message-bubble'
import { MessageInput } from '../../components/message-input'
import { TypingIndicator } from '../../components/typing-indicator'

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
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  scrollToBottomButton: {
    position: 'absolute' as const,
    right: spacing.lg,
    bottom: 32,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.accent.primary,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    shadowColor: colors.shadow.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  scrollIcon: {
    fontSize: 20,
    color: '#ffffff',
    fontWeight: '600' as const,
  },
})

export default function ChatScreen() {
  const styles = createMainStyles()
  const [inputText, setInputText] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const fadeAnim = useRef(new Animated.Value(1)).current
  const slideAnim = useRef(new Animated.Value(0)).current
  
  const { 
    isConnected, 
    claudeStatus, 
    messages, 
    sendMessage, 
    startClaude
  } = useWebSocket()
  
  const { 
    setConnected, 
    setClaudeRunning 
  } = useStore()
  
  const {
    scrollViewRef,
    isAtBottom,
    scrollViewHeight,
    contentHeight,
    checkIfAtBottom,
    scrollToBottom,
    handleLayout,
    handleContentSizeChange
  } = useScrollHandler()

  useEffect(() => {
    setConnected(isConnected)
    setClaudeRunning(claudeStatus.isRunning)
  }, [isConnected, claudeStatus.isRunning])

  useEffect(() => {
    if (messages.length > 0 && isAtBottom) {
      setTimeout(() => scrollToBottom(), 100)
    }
  }, [messages.length, isAtBottom])

  const handleSend = () => {
    if (!inputText.trim()) return
    
    setIsTyping(true)

    if (isConnected) {
      sendMessage(inputText)
      setTimeout(() => setIsTyping(false), 1500)
    } else {
      setIsTyping(false)
    }

    setInputText('')
  }

  const showScrollButton = !isAtBottom && contentHeight > scrollViewHeight + 100

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
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
            messages.map((message, index) => (
              <MessageBubble
                key={index}
                message={message}
                fadeAnim={fadeAnim}
                slideAnim={slideAnim}
              />
            ))
          )}
          
          {isTyping && <TypingIndicator />}
        </ScrollView>

        {showScrollButton && (
          <TouchableOpacity
            style={styles.scrollToBottomButton}
            onPress={() => scrollToBottom()}
            activeOpacity={0.8}
          >
            <Text style={styles.scrollIcon}>↓</Text>
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
  )
}