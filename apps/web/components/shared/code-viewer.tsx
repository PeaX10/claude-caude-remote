import { View, Text, ScrollView } from 'react-native'
import { colors, spacing } from '../../theme/colors'

interface CodeViewerProps {
  content: string
  maxHeight?: number
  showLineNumbers?: boolean
}

export function CodeViewer({ content, maxHeight = 400, showLineNumbers = true }: CodeViewerProps) {
  const parseContentWithLineNumbers = (text: string) => {
    const lineNumberRegex = /^\s*(\d+)→(.*)$/gm
    const lines = []
    let match
    
    while ((match = lineNumberRegex.exec(text)) !== null) {
      lines.push({
        number: match[1],
        content: match[2] || ''
      })
    }
    
    if (lines.length === 0) {
      const plainLines = text.split('\n')
      return plainLines.map((line, index) => ({
        number: String(index + 1),
        content: line
      }))
    }
    
    return lines
  }
  
  const lines = parseContentWithLineNumbers(content)
  const maxLineNumber = Math.max(...lines.map(l => parseInt(l.number)))
  const lineNumberWidth = Math.max(String(maxLineNumber).length * 8, 30)
  
  return (
    <ScrollView 
      style={[styles.container, { maxHeight }]}
      horizontal
      showsHorizontalScrollIndicator={true}
      showsVerticalScrollIndicator={true}
    >
      <ScrollView
        showsVerticalScrollIndicator={true}
        nestedScrollEnabled
      >
        <View style={styles.codeContainer}>
          {lines.map((line, index) => (
            <View key={index} style={styles.lineContainer}>
              {showLineNumbers && (
                <View style={[styles.lineNumberContainer, { width: lineNumberWidth }]}>
                  <Text style={styles.lineNumber}>{line.number}</Text>
                </View>
              )}
              <View style={styles.lineContentContainer}>
                <Text style={styles.lineContent}>{line.content}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </ScrollView>
  )
}

const styles = {
  container: {
    backgroundColor: colors.background.tertiary,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.border.primary,
  },
  codeContainer: {
    paddingVertical: spacing.xs,
  },
  lineContainer: {
    flexDirection: 'row' as const,
    minHeight: 18,
  },
  lineNumberContainer: {
    paddingRight: spacing.sm,
    paddingLeft: spacing.xs,
    borderRightWidth: 1,
    borderRightColor: colors.border.primary,
    alignItems: 'flex-end' as const,
    justifyContent: 'center' as const,
  },
  lineNumber: {
    fontSize: 11,
    fontFamily: 'monospace',
    color: colors.text.tertiary,
  },
  lineContentContainer: {
    flex: 1,
    paddingLeft: spacing.sm,
    paddingRight: spacing.sm,
  },
  lineContent: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: colors.text.primary,
    lineHeight: 18,
  },
}