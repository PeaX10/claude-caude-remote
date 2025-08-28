import { View, Text } from 'react-native'
import { ToolHeader } from '../shared/tool-header'
import { ErrorDisplay } from '../shared/error-display'
import { colors, spacing } from '../../theme/colors'
import { isInterrupted } from '../../constants/tool-constants'

import { ToolInput, ToolResult } from '../../types/tool.types'

interface CompactToolRendererProps {
  name: string
  displayName: string
  input?: ToolInput
  toolResult?: ToolResult
  hasResult: boolean
  hasError: boolean
  isInterrupted: boolean
  isLoading?: boolean
}

export function CompactToolRenderer({
  name,
  displayName,
  input,
  toolResult,
  hasResult,
  hasError,
  isInterrupted,
  isLoading = false,
}: CompactToolRendererProps) {
  const filePath = input?.file_path || input?.path
  const fileName = filePath?.split('/').pop()
  const isEdit = name === 'Edit' || name === 'MultiEdit'
  
  return (
    <>
      <ToolHeader
        name={name}
        displayName={displayName}
        preview={fileName}
        hasResult={hasResult}
        hasError={hasError}
        isInterrupted={isInterrupted}
        isLoading={isLoading}
        shimmerDisplayName={isLoading && !hasResult}
        showChevron={false}
      >
        {isEdit && input?.edits?.length && (
          <View style={styles.changeIndicator}>
            <Text style={styles.changesText}>
              {input.edits.length} changes
            </Text>
          </View>
        )}
      </ToolHeader>
      
      {hasError && toolResult?.error && (
        <ErrorDisplay error={toolResult.error} isInterrupted={isInterrupted} inline />
      )}
    </>
  )
}

const styles = {
  container: {
    marginBottom: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  compactHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginHorizontal: -spacing.sm,
  },
  changeIndicator: {
    flexDirection: 'row' as const,
    gap: spacing.xs,
    marginRight: spacing.sm,
  },
  changesText: {
    fontSize: 11,
    color: colors.text.secondary,
  },
}