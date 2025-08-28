import { View, Text, ScrollView } from 'react-native'
import { ToolHeader } from '../shared/tool-header'
import { ErrorDisplay } from '../shared/error-display'
import { ShimmerText } from '../shared/shimmer-text'
import { colors, spacing } from '../../theme/colors'

import { ToolInput, ToolResult } from '../../types/tool.types'

interface MultiEditToolRendererProps {
  name: string
  displayName: string
  input?: ToolInput
  toolResult?: ToolResult
  hasResult: boolean
  hasError: boolean
  isInterrupted: boolean
  isLoading?: boolean
  expanded: boolean
  onToggle: () => void
}

export function MultiEditToolRenderer({
  name,
  displayName,
  input,
  toolResult,
  hasResult,
  hasError,
  isInterrupted,
  isLoading = false,
  expanded,
  onToggle,
}: MultiEditToolRendererProps) {
  const filePath = input?.file_path || ''
  const fileName = filePath?.split('/').pop()
  const editsCount = input?.edits?.length || 0
  
  // For successful MultiEdit, show compact view
  if (hasResult && !hasError) {
    return (
      <ToolHeader
        name={name}
        displayName={displayName}
        preview={fileName}
        hasResult={hasResult}
        hasError={false}
        isInterrupted={false}
        isLoading={isLoading}
        shimmerDisplayName={isLoading && !hasResult}
        showChevron={false}
      >
        <View style={styles.changeIndicator}>
          <Text style={styles.changeText}>
            {editsCount} {editsCount === 1 ? 'change' : 'changes'}
          </Text>
        </View>
      </ToolHeader>
    )
  }
  
  // For errors or in-progress, show expandable view
  return (
    <>
      <ToolHeader
        name={name}
        displayName={displayName}
        preview={fileName}
        expanded={expanded}
        onToggle={onToggle}
        hasResult={hasResult}
        hasError={hasError}
        isInterrupted={isInterrupted}
        isLoading={isLoading}
        shimmerDisplayName={isLoading && !hasResult}
      >
        <View style={styles.changeIndicator}>
          <Text style={styles.changeText}>
            {editsCount} {editsCount === 1 ? 'change' : 'changes'}
          </Text>
        </View>
      </ToolHeader>
      
      {expanded && (
        <View style={styles.resultContainer}>
          {filePath && (
            <Text style={styles.fullPath}>{filePath}</Text>
          )}
          
          {hasError && toolResult?.error && (
            <ErrorDisplay error={toolResult.error} isInterrupted={isInterrupted} />
          )}
          
          {!hasResult && (
            <View style={styles.runningIndicator}>
              <ShimmerText 
                style={styles.runningText}
                isActive={isLoading}
              >
                {isLoading ? 'Applying changes...' : 'Waiting...'}
              </ShimmerText>
            </View>
          )}
        </View>
      )}
    </>
  )
}

const styles = {
  changeIndicator: {
    flexDirection: 'row' as const,
    gap: spacing.xs,
    marginRight: spacing.sm,
  },
  changeText: {
    fontSize: 11,
    color: colors.accent.primary,
    fontFamily: 'monospace',
    fontWeight: '600' as const,
  },
  resultContainer: {
    marginLeft: 32,
    marginTop: spacing.xs,
  },
  fullPath: {
    fontSize: 11,
    color: colors.text.tertiary,
    fontFamily: 'monospace',
    marginBottom: spacing.sm,
  },
  runningIndicator: {
    paddingVertical: spacing.sm,
  },
  runningText: {
    fontSize: 12,
    color: colors.text.tertiary,
    fontStyle: 'italic' as const,
  },
}