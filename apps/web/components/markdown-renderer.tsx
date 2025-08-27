import React from 'react'
import { View, Text, ScrollView, TouchableOpacity } from 'react-native'
import { colors, spacing } from '../theme/colors'
import { Feather } from '@expo/vector-icons'
import { useState } from 'react'

interface MarkdownRendererProps {
  content: string
  style?: any
}

// Parse markdown to React Native components
export function MarkdownRenderer({ content, style }: MarkdownRendererProps) {
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  // Split content by code blocks
  const renderContent = () => {
    const codeBlockRegex = /```(\w*)\n?([\s\S]*?)```/g
    const parts: React.ReactNode[] = []
    let lastIndex = 0
    let match

    while ((match = codeBlockRegex.exec(content)) !== null) {
      // Add text before code block
      if (match.index > lastIndex) {
        const textContent = content.slice(lastIndex, match.index)
        parts.push(renderMarkdownText(textContent, parts.length))
      }

      // Add code block
      const language = match[1] || 'text'
      const code = match[2].trim()
      parts.push(
        <CodeBlock
          key={`code-${parts.length}`}
          language={language}
          code={code}
          onCopy={() => {
            setCopiedCode(code)
            setTimeout(() => setCopiedCode(null), 2000)
          }}
          isCopied={copiedCode === code}
        />
      )

      lastIndex = match.index + match[0].length
    }

    // Add remaining text
    if (lastIndex < content.length) {
      parts.push(renderMarkdownText(content.slice(lastIndex), parts.length))
    }

    return parts.length > 0 ? parts : renderMarkdownText(content, 0)
  }

  const renderMarkdownText = (text: string, key: number) => {
    // Split into lines first to handle headings and lists
    const lines = text.split('\n')
    const formattedLines: React.ReactNode[] = []
    
    lines.forEach((line, lineIndex) => {
      // Process inline styles for each line
      const processInlineStyles = (text: string): React.ReactNode[] => {
        let processedText = text
        
        // Bold
        processedText = processedText.replace(/\*\*(.*?)\*\*/g, '§BOLD§$1§/BOLD§')
        // Italic - but not if it's part of a list marker
        processedText = processedText.replace(/(?<!\*)\*(?!\*)([^*]+)\*(?!\*)/g, '§ITALIC§$1§/ITALIC§')
        // Code
        processedText = processedText.replace(/`([^`]+)`/g, '§CODE§$1§/CODE§')
        // Links
        processedText = processedText.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '§LINK§$1§/LINK§')
        
        const parts = processedText.split(/§/)
        const elements: React.ReactNode[] = []
        let currentStyle = 'normal'
        
        parts.forEach((part, index) => {
          if (part === 'BOLD') {
            currentStyle = 'bold'
          } else if (part === '/BOLD') {
            currentStyle = 'normal'
          } else if (part === 'ITALIC') {
            currentStyle = 'italic'
          } else if (part === '/ITALIC') {
            currentStyle = 'normal'
          } else if (part === 'CODE') {
            currentStyle = 'code'
          } else if (part === '/CODE') {
            currentStyle = 'normal'
          } else if (part === 'LINK') {
            currentStyle = 'link'
          } else if (part === '/LINK') {
            currentStyle = 'normal'
          } else if (part && !part.startsWith('URL')) {
            const style = getTextStyle(currentStyle)
            elements.push(
              <Text key={`inline-${index}`} style={style}>
                {part}
              </Text>
            )
          }
        })
        
        return elements.length > 0 ? elements : [<Text key="text" style={styles.text}>{text}</Text>]
      }
      
      // Check headings first (fixed to process before other patterns)
      if (line.startsWith('### ')) {
        formattedLines.push(
          <Text key={`line-${key}-${lineIndex}`} style={styles.heading3}>
            {processInlineStyles(line.substring(4))}
          </Text>
        )
      } else if (line.startsWith('## ')) {
        formattedLines.push(
          <Text key={`line-${key}-${lineIndex}`} style={styles.heading2}>
            {processInlineStyles(line.substring(3))}
          </Text>
        )
      } else if (line.startsWith('# ')) {
        formattedLines.push(
          <Text key={`line-${key}-${lineIndex}`} style={styles.heading1}>
            {processInlineStyles(line.substring(2))}
          </Text>
        )
      } else if (line.startsWith('- ') || line.startsWith('* ')) {
        formattedLines.push(
          <View key={`line-${key}-${lineIndex}`} style={styles.listItem}>
            <Text style={styles.listBullet}>•</Text>
            <Text style={styles.text}>{processInlineStyles(line.substring(2))}</Text>
          </View>
        )
      } else if (line.match(/^\d+\. /)) {
        const number = line.match(/^(\d+)\. /)?.[1]
        formattedLines.push(
          <View key={`line-${key}-${lineIndex}`} style={styles.listItem}>
            <Text style={styles.listNumber}>{number}.</Text>
            <Text style={styles.text}>{processInlineStyles(line.replace(/^\d+\. /, ''))}</Text>
          </View>
        )
      } else if (line.startsWith('> ')) {
        formattedLines.push(
          <View key={`line-${key}-${lineIndex}`} style={styles.blockquote}>
            <Text style={styles.blockquoteText}>{processInlineStyles(line.substring(2))}</Text>
          </View>
        )
      } else if (line) {
        const elements = processInlineStyles(line)
        formattedLines.push(
          <Text key={`line-${key}-${lineIndex}`} style={styles.text}>
            {elements}
          </Text>
        )
      }
    })
    
    return <View key={`text-${key}`}>{formattedLines}</View>
  }

  const getTextStyle = (type: string) => {
    switch (type) {
      case 'bold':
        return styles.bold
      case 'italic':
        return styles.italic
      case 'code':
        return styles.inlineCode
      case 'link':
        return styles.link
      default:
        return styles.text
    }
  }

  return (
    <View style={[styles.container, style]}>
      {renderContent()}
    </View>
  )
}

// Code block component with syntax highlighting
function CodeBlock({ 
  language, 
  code, 
  onCopy, 
  isCopied 
}: { 
  language: string
  code: string
  onCopy: () => void
  isCopied: boolean
}) {
  return (
    <View style={styles.codeBlock}>
      <View style={styles.codeHeader}>
        <Text style={styles.codeLanguage}>{language}</Text>
        <TouchableOpacity onPress={onCopy} style={styles.copyButton}>
          <Feather 
            name={isCopied ? 'check' : 'copy'} 
            size={14} 
            color={isCopied ? colors.semantic.success : colors.text.secondary} 
          />
          <Text style={[styles.copyText, isCopied && styles.copiedText]}>
            {isCopied ? 'Copied!' : 'Copy'}
          </Text>
        </TouchableOpacity>
      </View>
      <ScrollView 
        horizontal 
        style={styles.codeContent}
        showsHorizontalScrollIndicator={false}
      >
        <Text style={styles.codeText}>{code}</Text>
      </ScrollView>
    </View>
  )
}

const styles = {
  container: {
    flex: 1,
  },
  text: {
    fontSize: 15,
    lineHeight: 24,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  bold: {
    fontWeight: '700' as const,
    color: colors.text.primary,
  },
  italic: {
    fontStyle: 'italic' as const,
    color: colors.text.primary,
  },
  inlineCode: {
    fontFamily: 'monospace',
    fontSize: 13,
    backgroundColor: colors.background.elevated,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
    color: colors.text.primary,
    borderWidth: 1,
    borderColor: colors.border.primary,
  },
  link: {
    color: colors.accent.primary,
    textDecorationLine: 'underline' as const,
  },
  heading1: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: colors.text.primary,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  heading2: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: colors.text.primary,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  heading3: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: colors.text.primary,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  listItem: {
    flexDirection: 'row' as const,
    marginBottom: spacing.xs,
    paddingLeft: spacing.sm,
  },
  listBullet: {
    fontSize: 15,
    color: colors.text.secondary,
    marginRight: spacing.sm,
  },
  listNumber: {
    fontSize: 15,
    color: colors.text.secondary,
    marginRight: spacing.sm,
    minWidth: 20,
  },
  blockquote: {
    borderLeftWidth: 3,
    borderLeftColor: colors.accent.secondary,
    paddingLeft: spacing.md,
    marginVertical: spacing.sm,
  },
  blockquoteText: {
    fontSize: 15,
    color: colors.text.secondary,
    fontStyle: 'italic' as const,
  },
  codeBlock: {
    backgroundColor: colors.background.elevated,
    borderRadius: 6,
    marginVertical: spacing.sm,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border.primary,
  },
  codeHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.primary,
    backgroundColor: colors.background.tertiary,
  },
  codeLanguage: {
    fontSize: 11,
    color: colors.text.secondary,
    fontWeight: '500' as const,
  },
  copyButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: spacing.xs,
  },
  copyText: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  copiedText: {
    color: colors.semantic.success,
  },
  codeContent: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  codeText: {
    fontFamily: 'monospace',
    fontSize: 12,
    lineHeight: 18,
    color: colors.text.primary,
  },
}