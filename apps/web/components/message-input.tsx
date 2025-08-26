import { View, TextInput, TouchableOpacity, Text } from 'react-native'
import { useState } from 'react'
import { colors, spacing } from '../theme/colors'

interface MessageInputProps {
  inputText: string
  onChangeText: (text: string) => void
  onSend: () => void
  isConnected: boolean
}

const createInputStyles = () => ({
  inputContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border.primary,
    minHeight: 48 + (spacing.lg * 2),
    maxHeight: 192 + (spacing.lg * 2),
  },
  inputWrapper: {
    position: 'relative' as const,
  },
  textInput: {
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    paddingRight: spacing.xxl + spacing.sm,
    color: colors.text.primary,
    fontSize: 15,
    borderWidth: 1,
    borderColor: colors.border.primary,
    lineHeight: 20,
    textAlignVertical: 'top' as const,
  },
  sendButton: {
    position: 'absolute' as const,
    right: spacing.md,
    bottom: spacing.md,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.accent.primary,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  sendIcon: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '600' as const,
  },
})

export function MessageInput({ inputText, onChangeText, onSend, isConnected }: MessageInputProps) {
  const [height, setHeight] = useState(48)

  const handleContentSizeChange = (event: any) => {
    const { height: contentHeight } = event.nativeEvent.contentSize
    setHeight(Math.min(Math.max(contentHeight, 48), 192))
  }

  const handleKeyPress = (event: any) => {
    if (event.nativeEvent.key === 'Enter' && !event.nativeEvent.shiftKey) {
      event.preventDefault()
      onSend()
    }
  }

  const styles = createInputStyles()
  
  return (
    <View style={styles.inputContainer}>
      <View style={styles.inputWrapper}>
        <TextInput
          style={[styles.textInput, { height }]}
          value={inputText}
          onChangeText={onChangeText}
          onContentSizeChange={handleContentSizeChange}
          onKeyPress={handleKeyPress}
          placeholder="Ask Claude Code anything..."
          placeholderTextColor={colors.text.tertiary}
          multiline
          scrollEnabled={height >= 192}
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
    </View>
  )
}