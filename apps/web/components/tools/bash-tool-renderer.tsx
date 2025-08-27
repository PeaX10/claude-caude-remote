import { View, Text, ScrollView } from 'react-native'
import { ToolHeader } from '../shared/tool-header'
import { terminalStyles, errorStyles } from '../../styles/tool-styles'
import { colors } from '../../theme/colors'

interface BashToolRendererProps {
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

export function BashToolRenderer({
  name,
  displayName,
  input,
  toolResult,
  hasResult,
  hasError,
  isInterrupted,
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
        displayName={description}
        preview={command ? `$ ${command}` : undefined}
        expanded={expanded}
        onToggle={onToggle}
        hasResult={hasResult}
        hasError={hasError}
        isInterrupted={isInterrupted}
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
                <Text style={runningStyles.text}>Running...</Text>
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
}