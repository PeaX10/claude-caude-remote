import { useState, useEffect, useRef } from 'react'
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  KeyboardAvoidingView, 
  Platform,
  StyleSheet,
  SafeAreaView,
  Animated,
  Easing
} from 'react-native'
import { useWebSocket } from '../../hooks/useWebSocket'
import { useStore } from '../../store'
import { colors, spacing } from '../../theme/colors'

export default function ChatScreen() {
  const [inputText, setInputText] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const scrollViewRef = useRef<ScrollView>(null)
  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(50)).current
  const { isConnected, claudeStatus, messages: wsMessages, sendMessage, startClaude, getFullOutput, contextPercent } = useWebSocket()
  const { messages, addMessage, setConnected, setClaudeRunning } = useStore()

  const getContextColor = (percent: number) => {
    if (percent <= 10) return colors.semantic.error // Rouge
    if (percent <= 25) return '#FF8C00' // Orange
    if (percent <= 50) return colors.semantic.warning // Jaune
    return colors.text.tertiary // Gris normal
  }

  const getContextWeight = (percent: number) => {
    if (percent <= 25) return '600' // Plus gras quand critique
    return '500' // Normal
  }

  useEffect(() => {
    setConnected(isConnected)
    setClaudeRunning(claudeStatus.isRunning)
    
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      })
    ]).start()
  }, [isConnected, claudeStatus.isRunning, fadeAnim, slideAnim])

  useEffect(() => {
    wsMessages.forEach(msg => {
      addMessage({
        type: msg.type === 'output' ? 'claude' : 'system',
        content: msg.content,
        timestamp: msg.timestamp
      })
    })
  }, [wsMessages])

  const handleSend = () => {
    if (!inputText.trim()) return
    
    setIsTyping(true)
    addMessage({
      type: 'user',
      content: inputText,
      timestamp: Date.now()
    })

    if (claudeStatus.isRunning && isConnected) {
      sendMessage(inputText)
      setTimeout(() => setIsTyping(false), 1500)
    } else if (!isConnected) {
      addMessage({
        type: 'system',
        content: 'Not connected to server. Please check your connection.',
        timestamp: Date.now()
      })
      setIsTyping(false)
    } else {
      addMessage({
        type: 'system',
        content: 'Claude Code is not running. Start it first.',
        timestamp: Date.now()
      })
      setIsTyping(false)
    }

    setInputText('')
    setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100)
  }



  const TypingIndicator = () => (
    <View style={styles.typingContainer}>
      <Text style={styles.typingText}>CLAUDE</Text>
      <View style={styles.typingDots}>
        <View style={styles.dot} />
        <View style={styles.dot} />
        <View style={styles.dot} />
      </View>
    </View>
  )

  const MessageBubble = ({ message }: { message: any }) => {
    const isUser = message.type === 'user'
    const isSystem = message.type === 'system'
    
    return (
      <Animated.View 
        style={[
          styles.messageWrapper,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
        ]}
      >
        <View style={styles.messageContainer}>
          <Text style={[styles.messageRole, isUser ? styles.userRole : styles.claudeRole]}>
            {isUser ? 'You' : isSystem ? 'System' : 'Claude'}
          </Text>
          <Text style={styles.messageContent}>
            {message.content}
          </Text>
        </View>
      </Animated.View>
    )
  }

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Claude Code</Text>
          <View style={styles.headerActions}>
            {contextPercent !== null && claudeStatus.isRunning && (
              <Text style={[
                styles.contextIndicator, 
                { 
                  color: getContextColor(contextPercent),
                  fontWeight: getContextWeight(contextPercent)
                }
              ]}>
                {contextPercent}%
              </Text>
            )}
            {isConnected && claudeStatus.isRunning && (
              <TouchableOpacity 
                style={styles.refreshButton}
                onPress={() => getFullOutput()}
                activeOpacity={0.7}
              >
                <Text style={styles.refreshIcon}>↻</Text>
              </TouchableOpacity>
            )}
            <View style={styles.statusIndicator}>
              <View style={[styles.statusDot, { 
                backgroundColor: !isConnected 
                  ? colors.text.tertiary 
                  : claudeStatus.isRunning 
                    ? colors.semantic.success 
                    : colors.accent.secondary
              }]} />
              <Text style={styles.statusText}>
                {!isConnected ? 'Offline' : claudeStatus.isRunning ? 'Ready' : 'Connected'}
              </Text>
            </View>
          </View>
        </View>

        <KeyboardAvoidingView 
          style={styles.keyboardView} 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView 
            ref={scrollViewRef}
            style={styles.messagesContainer}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {messages.length === 0 ? (
              <Animated.View 
                style={[
                  styles.emptyState,
                  { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
                ]}
              >
                <Text style={styles.emptyTitle}>How can I help you code today?</Text>
                <Text style={styles.emptySubtitle}>
                  Start a conversation to control Claude Code remotely
                </Text>
                {isConnected && !claudeStatus.isRunning && (
                  <TouchableOpacity 
                    style={styles.startButton}
                    onPress={() => startClaude()}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.startButtonText}>Start Claude Code</Text>
                  </TouchableOpacity>
                )}
              </Animated.View>
            ) : (
              <>
                {messages.map((message) => (
                  <MessageBubble key={message.id} message={message} />
                ))}
                {isTyping && <TypingIndicator />}
              </>
            )}
          </ScrollView>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Ask Claude Code anything..."
              placeholderTextColor={colors.text.tertiary}
              multiline
              maxLength={10000}
            />
            {inputText.trim() && (
              <TouchableOpacity 
                style={styles.sendButton}
                onPress={handleSend}
                disabled={!isConnected}
                activeOpacity={0.7}
              >
                <Text style={styles.sendIcon}>↑</Text>
              </TouchableOpacity>
            )}
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.primary,
  },
  headerTitle: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contextIndicator: {
    color: colors.text.tertiary,
    fontSize: 12,
    fontWeight: '500',
    marginRight: spacing.sm,
  },
  refreshButton: {
    marginRight: spacing.md,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.background.tertiary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  refreshIcon: {
    fontSize: 16,
    color: colors.text.secondary,
    fontWeight: '600',
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: spacing.sm,
  },
  statusText: {
    color: colors.text.secondary,
    fontSize: 13,
    fontWeight: '500',
  },
  keyboardView: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyTitle: {
    color: colors.text.primary,
    fontSize: 24,
    fontWeight: '400',
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    color: colors.text.tertiary,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  messageWrapper: {
    marginBottom: spacing.xl,
  },
  messageContainer: {
    gap: spacing.sm,
  },
  messageRole: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  userRole: {
    color: colors.text.secondary,
  },
  claudeRole: {
    color: colors.text.accent,
  },
  messageContent: {
    fontSize: 15,
    lineHeight: 24,
    color: colors.text.primary,
    fontWeight: '400',
  },
  typingContainer: {
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  typingDots: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: colors.text.tertiary,
  },
  typingText: {
    color: colors.text.tertiary,
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputContainer: {
    position: 'relative',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border.primary,
  },
  textInput: {
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    paddingRight: spacing.xxl,
    color: colors.text.primary,
    fontSize: 15,
    maxHeight: 120,
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.border.primary,
    lineHeight: 20,
  },
  sendButton: {
    position: 'absolute',
    right: spacing.lg + spacing.xs,
    bottom: spacing.lg + spacing.xs,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.accent.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendIcon: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '600',
  },
  startButton: {
    marginTop: spacing.xl,
    backgroundColor: colors.accent.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 8,
    alignSelf: 'center',
  },
  startButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
})