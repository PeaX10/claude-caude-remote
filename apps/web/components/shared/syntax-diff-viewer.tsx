import React from 'react'
import { View, Text, ScrollView } from 'react-native'
import { colors, spacing } from '../../theme/colors'

interface SyntaxDiffViewerProps {
  oldString?: string
  newString?: string
  filePath?: string
  language?: string
}

export function SyntaxDiffViewer({ 
  oldString = '', 
  newString = '',
  filePath,
  language = 'typescript'
}: SyntaxDiffViewerProps) {
  
  // Detect language from file extension
  const detectLanguage = (path?: string): string => {
    if (!path) return language
    
    const ext = path.split('.').pop()?.toLowerCase()
    const languageMap: Record<string, string> = {
      'js': 'javascript',
      'jsx': 'javascript', 
      'ts': 'typescript',
      'tsx': 'typescript',
      'py': 'python',
      'rb': 'ruby',
      'go': 'go',
      'rs': 'rust',
      'java': 'java',
      'json': 'json',
      'xml': 'xml',
      'html': 'html',
      'css': 'css',
      'sql': 'sql',
      'md': 'markdown',
      'yml': 'yaml',
      'yaml': 'yaml',
    }
    
    return languageMap[ext || ''] || 'plaintext'
  }

  const detectedLanguage = detectLanguage(filePath)
  
  
  // Calculate changes
  const oldLines = oldString.split('\n')
  const newLines = newString.split('\n')
  const hasChanges = oldString !== newString
  
  const addedCount = Math.max(0, newLines.length - oldLines.length)
  const removedCount = Math.max(0, oldLines.length - newLines.length)
  const changedCount = Math.min(oldLines.length, newLines.length)
  
  return (
    <View style={styles.container}>
      {filePath && (
        <View style={styles.header}>
          <Text style={styles.fileName}>{filePath.split('/').pop()}</Text>
          <View style={styles.changeIndicator}>
            {addedCount > 0 && <Text style={styles.addedText}>+{addedCount}</Text>}
            {removedCount > 0 && <Text style={styles.removedText}>-{removedCount}</Text>}
            {changedCount > 0 && <Text style={styles.modifiedText}>~{changedCount}</Text>}
          </View>
        </View>
      )}
      
      <ScrollView 
        style={styles.scrollContainer}
        horizontal
        showsHorizontalScrollIndicator={true}
      >
        <View style={styles.diffContent}>
          {oldString && (
            <View style={styles.diffSection}>
              <View style={styles.diffHeader}>
                <Text style={styles.diffLabel}>- Removed</Text>
              </View>
              <View style={styles.removedCode}>
                <Text style={styles.codeText}>{oldString}</Text>
              </View>
            </View>
          )}
          
          {newString && (
            <View style={styles.diffSection}>
              <View style={styles.diffHeader}>
                <Text style={styles.diffLabel}>+ Added</Text>
              </View>
              <View style={styles.addedCode}>
                <Text style={styles.codeText}>{newString}</Text>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  )
}

const styles = {
  container: {
    backgroundColor: colors.background.tertiary,
    borderRadius: 6,
    overflow: 'hidden' as const,
    borderWidth: 1,
    borderColor: colors.border.primary,
  },
  header: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.primary,
    backgroundColor: colors.background.secondary,
  },
  fileName: {
    fontSize: 12,
    color: colors.text.primary,
    fontWeight: '500' as const,
  },
  changeIndicator: {
    flexDirection: 'row' as const,
    gap: spacing.xs,
  },
  addedText: {
    fontSize: 11,
    color: '#89d185',
    fontFamily: 'monospace',
    fontWeight: '600' as const,
  },
  removedText: {
    fontSize: 11,
    color: '#f48771',
    fontFamily: 'monospace',
    fontWeight: '600' as const,
  },
  modifiedText: {
    fontSize: 11,
    color: colors.accent.primary,
    fontFamily: 'monospace',
    fontWeight: '600' as const,
  },
  scrollContainer: {
    maxHeight: 400,
  },
  diffContent: {
    padding: spacing.xs,
  },
  diffSection: {
    marginBottom: spacing.sm,
  },
  diffHeader: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    backgroundColor: colors.background.secondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.primary,
  },
  diffLabel: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: colors.text.secondary,
  },
  removedCode: {
    backgroundColor: 'rgba(244, 135, 113, 0.15)',
    padding: spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: '#f48771',
  },
  addedCode: {
    backgroundColor: 'rgba(137, 209, 133, 0.15)',
    padding: spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: '#89d185',
  },
  codeText: {
    fontSize: 12,
    lineHeight: 18,
    fontFamily: 'monospace',
    color: colors.text.primary,
  },
  lineNumber: {
    color: colors.text.tertiary,
    fontSize: 11,
    paddingRight: spacing.sm,
  },
}