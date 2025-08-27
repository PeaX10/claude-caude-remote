import { View, Text, ScrollView } from 'react-native'
import { ToolHeader } from '../shared/tool-header'
import { ErrorDisplay } from '../shared/error-display'
import { colors, spacing } from '../../theme/colors'

interface MultiEditToolRendererProps {
  name: string
  displayName: string
  input?: any
  toolResult?: any
  hasResult: boolean
  hasError: boolean
  isInterrupted: boolean
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
              <Text style={styles.runningText}>Editing...</Text>
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