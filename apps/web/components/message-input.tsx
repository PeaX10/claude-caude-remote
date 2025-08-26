import { View, TextInput, TouchableOpacity, Text } from 'react-native'
import { colors, spacing } from '../theme/colors'

interface MessageInputProps {
  inputText: string
  onChangeText: (text: string) => void
  onSend: () => void
  isConnected: boolean
}

const createInputStyles = () => ({
  inputContainer: {
    position: 'relative' as const,
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
    position: 'absolute' as const,
    right: spacing.lg + spacing.xs,
    bottom: spacing.lg + spacing.xs,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.accent.primary,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  sendIcon: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '600' as const,
  },
})

export function MessageInput({ inputText, onChangeText, onSend, isConnected }: MessageInputProps) {
  const styles = createInputStyles()
  
  return (
    <View style={styles.inputContainer}>
      <TextInput
        style={styles.textInput}
        value={inputText}
        onChangeText={onChangeText}
        placeholder="Ask Claude Code anything..."
        placeholderTextColor={colors.text.tertiary}
        multiline
        maxLength={10000}
      />
      {inputText.trim() && (
        <TouchableOpacity 
          style={styles.sendButton}
          onPress={onSend}
          disabled={!isConnected}
          activeOpacity={0.7}
        >
          <Text style={styles.sendIcon}>↑</Text>
        </TouchableOpacity>
      )}
    </View>
  )
}