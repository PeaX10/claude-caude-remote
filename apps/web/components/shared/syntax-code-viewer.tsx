import React from 'react'
import { View, ScrollView, Text } from 'react-native'
import { colors, spacing } from '../../theme/colors'

interface SyntaxCodeViewerProps {
  content: string
  language?: string
  maxHeight?: number
  showLineNumbers?: boolean
  filePath?: string
}

export function SyntaxCodeViewer({ 
  content, 
  language = 'typescript',
  maxHeight = 400,
  showLineNumbers = true,
  filePath
}: SyntaxCodeViewerProps) {
  
  // Detect language from file extension if not provided
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
      'c': 'c',
      'cpp': 'cpp',
      'cs': 'csharp',
      'php': 'php',
      'swift': 'swift',
      'kt': 'kotlin',
      'dart': 'dart',
      'sh': 'bash',
      'bash': 'bash',
      'zsh': 'bash',
      'json': 'json',
      'xml': 'xml',
      'html': 'html',
      'css': 'css',
      'scss': 'scss',
      'sass': 'sass',
      'less': 'less',
      'sql': 'sql',
      'md': 'markdown',
      'yml': 'yaml',
      'yaml': 'yaml',
    }
    
    return languageMap[ext || ''] || 'plaintext'
  }

  // Parse content to remove line numbers if present
  const parseContent = (text: string): string => {
    const lineNumberRegex = /^\s*\d+→(.*)$/gm
    const lines = []
    let match
    
    while ((match = lineNumberRegex.exec(text)) !== null) {
      lines.push(match[1] || '')
    }
    
    if (lines.length > 0) {
      return lines.join('\n')
    }
    
    return text
  }
  
  const cleanContent = parseContent(content)
  const detectedLanguage = detectLanguage(filePath)
  
  
  return (
    <View style={styles.container}>
      {filePath && (
        <View style={styles.header}>
          <Text style={styles.fileName}>{filePath.split('/').pop()}</Text>
          <Text style={styles.language}>{detectedLanguage}</Text>
        </View>
      )}
      <ScrollView 
        style={[styles.scrollContainer, { maxHeight }]}
        horizontal
        showsHorizontalScrollIndicator={true}
        showsVerticalScrollIndicator={true}
      >
        <ScrollView
          showsVerticalScrollIndicator={true}
          nestedScrollEnabled
        >
          <View style={styles.codeContent}>
            <Text style={styles.code}>{cleanContent}</Text>
          </View>
        </ScrollView>
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
  language: {
    fontSize: 11,
    color: colors.text.secondary,
    fontStyle: 'italic' as const,
  },
  scrollContainer: {
    backgroundColor: colors.background.tertiary,
  },
  codeContent: {
    padding: spacing.sm,
  },
  code: {
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