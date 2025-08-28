import { View, Text, TouchableOpacity, ScrollView } from 'react-native'
import { useState } from 'react'
import { colors, spacing } from '../../theme/colors'
import { Feather } from '@expo/vector-icons'
import { ToolUseIndicator } from '../agentic-indicators'
import { ToolInput } from '../../types/tool.types'

interface ToolMessageProps {
  toolUse?: {
    name: string
    input?: ToolInput
  }
  toolResult?: {
    content?: string
    error?: string
  }
  timestamp?: number
}

export function ToolMessage({ toolUse, toolResult, timestamp }: ToolMessageProps) {
  const [inputExpanded, setInputExpanded] = useState(false)
  const [expanded, setExpanded] = useState(false)
  
  if (toolUse) {
    return (
      <View style={styles.toolUseContainer}>
        <ToolUseIndicator 
          toolName={toolUse.name} 
          status={timestamp ? 'success' : 'running'} 
        />
        
        {toolUse.input && (
          <TouchableOpacity 
            style={styles.expandButton}
            onPress={() => setInputExpanded(!inputExpanded)}
          >
            <Text style={styles.expandText}>
              {inputExpanded ? 'Hide Input' : 'Show Input'}
            </Text>
            <Feather 
              name={inputExpanded ? 'chevron-up' : 'chevron-down'} 
              size={12} 
              color={colors.text.secondary} 
            />
          </TouchableOpacity>
        )}
        
        {inputExpanded && toolUse.input && (
          <View style={styles.inputContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <Text style={styles.inputContent}>
                {typeof toolUse.input === 'string' 
                  ? toolUse.input 
                  : JSON.stringify(toolUse.input, null, 2)}
              </Text>
            </ScrollView>
          </View>
        )}
        
      </View>
    )
  }
  
  if (toolResult) {
    const hasError = !!toolResult.error
    
    return (
      <View style={styles.terminalContainer}>
        <View style={styles.terminalHeader}>
          <Text style={styles.terminalTitle}>
            {hasError ? 'Error' : 'Output'}
          </Text>
        </View>
        
        <View style={styles.terminalBody}>
          <ScrollView 
            style={[styles.terminalScroll, expanded && { maxHeight: undefined }]}
            horizontal
            showsHorizontalScrollIndicator={false}
          >
            <Text style={[
              styles.terminalText,
              hasError && styles.terminalError
            ]}>
              {toolResult.content || toolResult.error}
            </Text>
          </ScrollView>
          
          {((toolResult.content && toolResult.content.length > 200) || 
            (toolResult.error && toolResult.error.length > 200)) && (
            <TouchableOpacity 
              style={styles.expandTerminalButton}
              onPress={() => setExpanded(!expanded)}
            >
              <Feather 
                name={expanded ? 'minimize-2' : 'maximize-2'} 
                size={12} 
                color={colors.text.tertiary} 
              />
            </TouchableOpacity>
          )}
        </View>
      </View>
    )
  }
  
  return null
}

const styles = {
  container: {
    marginBottom: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  toolUseContainer: {
    marginBottom: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  errorContainer: {
    borderLeftWidth: 2,
    borderLeftColor: colors.semantic.error,
    paddingLeft: spacing.sm,
  },
  expandButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    marginTop: spacing.xs,
    marginLeft: 32,
  },
  expandText: {
    fontSize: 12,
    color: colors.text.secondary,
    fontWeight: '600' as const,
  },
  inputContainer: {
    marginTop: spacing.xs,
    marginLeft: 32,
    padding: spacing.sm,
    backgroundColor: colors.background.tertiary,
    borderRadius: 4,
    maxHeight: 150,
  },
  inputContent: {
    fontSize: 12,
    color: colors.text.primary,
    fontFamily: 'monospace',
    lineHeight: 18,
  },
  resultHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.primary,
  },
  statusIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginRight: spacing.sm,
  },
  resultInfo: {
    flex: 1,
  },
  resultLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.text.primary,
  },
  resultStatus: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 2,
  },
  resultContent: {
    padding: spacing.md,
  },
  resultScroll: {
    maxHeight: 100,
  },
  resultText: {
    fontSize: 13,
    color: colors.text.primary,
    lineHeight: 20,
  },
  errorText: {
    color: colors.semantic.error,
  },
  expandResultButton: {
    marginTop: spacing.sm,
    alignSelf: 'center' as const,
  },
  expandResultText: {
    fontSize: 12,
    color: colors.accent.primary,
    fontWeight: '600' as const,
  },
  timestamp: {
    fontSize: 11,
    color: colors.text.tertiary,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  terminalContainer: {
    backgroundColor: '#1e1e1e',
    borderRadius: 6,
    marginBottom: spacing.md,
    marginHorizontal: spacing.sm,
    overflow: 'hidden',
  },
  terminalHeader: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    backgroundColor: '#2d2d2d',
  },
  terminalTitle: {
    fontSize: 12,
    color: '#999',
    fontFamily: 'monospace',
  },
  terminalBody: {
    padding: spacing.md,
  },
  terminalScroll: {
    maxHeight: 150,
  },
  terminalText: {
    fontSize: 13,
    color: '#d4d4d4',
    fontFamily: 'monospace',
    lineHeight: 20,
  },
  terminalError: {
    color: '#f48771',
  },
  expandTerminalButton: {
    position: 'absolute' as const,
    top: spacing.sm,
    right: spacing.sm,
    padding: 4,
  },
}