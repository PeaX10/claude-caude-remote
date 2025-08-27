import { View, Text, ScrollView, TouchableOpacity } from 'react-native'
import { useState } from 'react'
import { colors, spacing } from '../../theme/colors'
import { Feather } from '@expo/vector-icons'

interface BashMessageProps {
  command?: string
  output?: string
  error?: boolean
  timestamp?: number
  workingDirectory?: string
  description?: string
}

export function BashMessage({ 
  command, 
  output, 
  error,
  timestamp,
  workingDirectory,
  description
}: BashMessageProps) {
  const [expanded, setExpanded] = useState(false)
  
  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.header}
        onPress={() => setExpanded(!expanded)}
      >
        <View style={styles.terminalIcon}>
          <Feather name="terminal" size={14} color={colors.text.secondary} />
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.label}>
            {description || 'Terminal'}
          </Text>
          {command && !expanded && (
            <Text style={styles.commandPreview} numberOfLines={1}>
              $ {command}
            </Text>
          )}
        </View>
        <Feather 
          name={expanded ? 'chevron-up' : 'chevron-down'} 
          size={14} 
          color={colors.text.secondary} 
        />
      </TouchableOpacity>
      
      {expanded && (
        <View style={styles.terminalContainer}>
          <View style={styles.terminalContent}>
            {/* Command line */}
            {command && (
              <View style={styles.commandLine}>
                <Text style={styles.prompt}>$</Text>
                <Text style={styles.command}>{command}</Text>
              </View>
            )}
            
            {/* Output */}
            {output && (
              <ScrollView 
                style={styles.outputContainer}
                showsVerticalScrollIndicator={false}
              >
                <Text style={[styles.output, error && styles.errorOutput]}>
                  {output}
                </Text>
              </ScrollView>
            )}
          </View>
        </View>
      )}
      
    </View>
  )
}

const styles = {
  container: {
    marginBottom: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingVertical: spacing.xs,
  },
  terminalIcon: {
    width: 24,
    height: 24,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginRight: spacing.sm,
  },
  headerInfo: {
    flex: 1,
    marginRight: spacing.sm,
  },
  label: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: colors.text.primary,
  },
  commandPreview: {
    fontSize: 11,
    color: colors.accent.primary,
    fontFamily: 'monospace',
    marginTop: 2,
  },
  terminalContainer: {
    backgroundColor: colors.background.secondary,
    borderRadius: 8,
    marginLeft: 32,
    marginTop: spacing.xs,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border.primary,
  },
  terminalContent: {
    padding: spacing.sm,
  },
  commandLine: {
    flexDirection: 'row' as const,
    backgroundColor: colors.background.tertiary,
    padding: spacing.sm,
    borderRadius: 4,
    marginBottom: spacing.sm,
  },
  prompt: {
    fontSize: 12,
    color: colors.text.secondary,
    fontFamily: 'monospace',
    marginRight: spacing.xs,
  },
  command: {
    fontSize: 12,
    color: colors.text.primary,
    fontFamily: 'monospace',
    flex: 1,
    fontWeight: '500' as const,
  },
  outputContainer: {
    maxHeight: 400,
    paddingHorizontal: spacing.xs,
  },
  output: {
    fontSize: 12,
    color: colors.text.secondary,
    fontFamily: 'monospace',
    lineHeight: 18,
  },
  errorOutput: {
    color: colors.semantic.error,
  },
  timestamp: {
    fontSize: 11,
    color: colors.text.tertiary,
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.xs,
  },
}