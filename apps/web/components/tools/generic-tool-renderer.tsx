import { View, Text, ScrollView } from 'react-native'
import { ToolHeader } from '../shared/tool-header'
import { ErrorDisplay } from '../shared/error-display'
import { ShimmerText } from '../shared/shimmer-text'
import { colors, spacing } from '../../theme/colors'

interface GenericToolRendererProps {
  name: string
  displayName: string
  input?: any
  toolResult?: any
  hasResult: boolean
  hasError: boolean
  isInterrupted: boolean
  isLoading?: boolean
  expanded: boolean
  onToggle: () => void
}

export function GenericToolRenderer({
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
}: GenericToolRendererProps) {
  const hasContent = hasResult && (toolResult?.content || toolResult?.error)
  const canExpand = hasContent || !hasResult
  
  if (!canExpand) {
    return (
      <ToolHeader
        name={name}
        displayName={displayName}
        hasResult={hasResult}
        hasError={hasError}
        isInterrupted={isInterrupted}
        showChevron={false}
      />
    )
  }
  
  return (
    <>
      <ToolHeader
        name={name}
        displayName={displayName}
        preview={isLoading ? 'Processing...' : hasResult ? (hasError ? 'Error' : 'Complete') : undefined}
        isLoading={isLoading}
        expanded={expanded}
        onToggle={onToggle}
        hasResult={hasResult}
        hasError={hasError}
        isInterrupted={isInterrupted}
        shimmerDisplayName={isLoading && !hasResult}
      />
      
      {expanded && (
        <View style={styles.resultContainer}>
          {hasResult && (toolResult?.content || toolResult?.error) && (
            <ScrollView 
              style={styles.resultScroll}
              showsVerticalScrollIndicator={false}
            >
              {hasError ? (
                <ErrorDisplay 
                  error={toolResult.error} 
                  isInterrupted={isInterrupted} 
                />
              ) : (
                <Text style={styles.resultText}>
                  {toolResult.content}
                </Text>
              )}
            </ScrollView>
          )}
          
          {!hasResult && (
            <View style={styles.runningIndicator}>
              <ShimmerText 
                style={styles.runningText}
                isActive={isLoading}
              >
                {isLoading ? 'Processing...' : 'Waiting for result...'}
              </ShimmerText>
            </View>
          )}
        </View>
      )}
    </>
  )
}

const styles = {
  resultContainer: {
    marginLeft: 32,
    marginTop: spacing.xs,
  },
  resultScroll: {
    maxHeight: 300,
  },
  resultText: {
    fontSize: 12,
    color: colors.text.primary,
    lineHeight: 18,
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