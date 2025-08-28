import { View, Text, ScrollView } from 'react-native'
import { ToolHeader } from '../shared/tool-header'
import { ShimmerText } from '../shared/shimmer-text'
import { terminalStyles, errorStyles } from '../../styles/tool-styles'
import { colors } from '../../theme/colors'

import { ToolInput, ToolResult } from '../../types/tool.types'

interface BashToolRendererProps {
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

export function BashToolRenderer({
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
}: BashToolRendererProps) {
  const command = input?.command
  const description = input?.description || 'Terminal command'
  const output = toolResult?.content || toolResult?.error || ''
  
  return (
    <>
      <ToolHeader
        name={name}
        displayName={isLoading && !hasResult ? description : description}
        preview={command ? `$ ${command}` : undefined}
        expanded={expanded}
        onToggle={onToggle}
        hasResult={hasResult}
        hasError={hasError}
        isInterrupted={isInterrupted}
        isLoading={isLoading}
        shimmerDisplayName={!hasResult}
      />
      
      {expanded && (
        <View style={terminalStyles.terminalContainer}>
          <View style={terminalStyles.terminalContent}>
            {command && (
              <View style={terminalStyles.commandLine}>
                <Text style={terminalStyles.prompt}>$</Text>
                <Text style={terminalStyles.command}>{command}</Text>
              </View>
            )}
            
            {hasResult && (output || hasError) && (
              <ScrollView 
                style={terminalStyles.outputContainer}
                showsVerticalScrollIndicator={false}
              >
                {hasError && toolResult?.error && (
                  <View style={terminalStyles.terminalError}>
                    <Text style={terminalStyles.terminalErrorLabel}>Error:</Text>
                    <Text style={terminalStyles.errorOutput}>
                      {toolResult.error}
                    </Text>
                  </View>
                )}
                {output && !hasError && (
                  <Text style={terminalStyles.output}>
                    {output}
                  </Text>
                )}
              </ScrollView>
            )}
            
            {!hasResult && (
              <View style={runningStyles.container}>
                <ShimmerText 
                  style={runningStyles.text} 
                  isActive={!hasResult}
                >
                  Running command...
                </ShimmerText>
                {command && (
                  <Text style={runningStyles.commandText}>
                    $ {command}
                  </Text>
                )}
              </View>
            )}
          </View>
        </View>
      )}
    </>
  )
}

const runningStyles = {
  container: {
    paddingVertical: 8,
  },
  text: {
    fontSize: 12,
    color: colors.text.tertiary,
    fontStyle: 'italic' as const,
  },
  commandText: {
    fontSize: 11,
    color: colors.text.secondary,
    fontFamily: 'monospace',
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: colors.background.tertiary,
    borderRadius: 4,
  },
}