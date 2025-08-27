import { View, Text } from 'react-native'
import { ToolHeader } from '../shared/tool-header'
import { SyntaxCodeViewer } from '../shared/syntax-code-viewer'
import { ShimmerText } from '../shared/shimmer-text'
import { colors, spacing } from '../../theme/colors'

interface ReadToolRendererProps {
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

export function ReadToolRenderer({
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
}: ReadToolRendererProps) {
  const filePath = input?.file_path || ''
  const fileName = filePath?.split('/').pop()
  const content = toolResult?.content || ''
  const lineCount = content ? content.split('\n').length : 0
  
  return (
    <>
      <ToolHeader
        name={name}
        displayName={`${displayName} ${fileName}`}
        preview={hasResult ? `${lineCount} lines read` : (isLoading ? 'Reading file...' : 'Waiting...')}
        expanded={expanded}
        onToggle={onToggle}
        hasResult={hasResult}
        hasError={hasError}
        isInterrupted={isInterrupted}
        isLoading={isLoading}
        shimmerDisplayName={isLoading && !hasResult}
      />
      
      {expanded && (
        <View style={styles.fileContainer}>
          {filePath && (
            <Text style={styles.fullPath}>{filePath}</Text>
          )}
          
          {hasResult && content && (
            <SyntaxCodeViewer 
              content={content} 
              filePath={filePath}
              maxHeight={400} 
              showLineNumbers={true}
            />
          )}
          
          {hasError && toolResult?.error && (
            <Text style={styles.errorText}>{toolResult.error}</Text>
          )}
          
          {!hasResult && (
            <View style={styles.runningIndicator}>
              <ShimmerText 
                style={styles.runningText}
                isActive={isLoading}
              >
                {isLoading ? 'Reading file contents...' : 'Waiting for file access...'}
              </ShimmerText>
            </View>
          )}
        </View>
      )}
    </>
  )
}

const styles = {
  fileContainer: {
    marginTop: spacing.xs,
  },
  fullPath: {
    fontSize: 11,
    color: colors.text.tertiary,
    fontFamily: 'monospace',
    marginBottom: spacing.sm,
  },
  errorText: {
    fontSize: 12,
    color: colors.semantic.error,
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