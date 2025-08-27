import { View, Text, ScrollView, TouchableOpacity } from 'react-native'
import { useState } from 'react'
import { colors, spacing } from '../../theme/colors'
import { Feather } from '@expo/vector-icons'
import { SyntaxDiffViewer } from '../shared/syntax-diff-viewer'

interface EditMessageProps {
  filePath?: string
  oldString?: string
  newString?: string
  editsCount?: number
  timestamp?: number
}

export function EditMessage({ 
  filePath, 
  oldString, 
  newString,
  editsCount,
  timestamp
}: EditMessageProps) {
  const [expanded, setExpanded] = useState(false)
  
  // Handle MultiEdit case - just show summary
  if (editsCount !== undefined) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Feather name="edit-3" size={14} color={colors.text.secondary} />
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.label}>MultiEdit</Text>
            {filePath && (
              <Text style={styles.filePath} numberOfLines={1}>
                {filePath.split('/').pop()}
              </Text>
            )}
          </View>
          <View style={styles.changeIndicator}>
            <Text style={styles.changeText}>
              {editsCount} {editsCount === 1 ? 'change' : 'changes'}
            </Text>
          </View>
        </View>
      </View>
    )
  }
  
  // Split strings into lines for diff display
  const oldLines = (oldString || '').split('\n')
  const newLines = (newString || '').split('\n')
  
  // Create unified diff view
  const createUnifiedDiff = () => {
    const maxLines = Math.max(oldLines.length, newLines.length)
    const diffLines = []
    
    for (let i = 0; i < maxLines; i++) {
      const oldLine = oldLines[i]
      const newLine = newLines[i]
      
      if (oldLine !== newLine) {
        if (oldLine !== undefined && newLine !== undefined) {
          // Changed line - show both
          diffLines.push({ type: 'removed', line: oldLine, number: i + 1 })
          diffLines.push({ type: 'added', line: newLine, number: i + 1 })
        } else if (oldLine !== undefined) {
          // Removed line
          diffLines.push({ type: 'removed', line: oldLine, number: i + 1 })
        } else {
          // Added line
          diffLines.push({ type: 'added', line: newLine, number: i + 1 })
        }
      } else if (oldLine !== undefined) {
        // Unchanged line - show context
        diffLines.push({ type: 'unchanged', line: oldLine, number: i + 1 })
      }
    }
    
    return diffLines
  }
  
  const diffLines = createUnifiedDiff()
  const hasChanges = oldString !== newString
  
  // Calculate actual changes
  const addedCount = diffLines.filter(d => d.type === 'added').length
  const removedCount = diffLines.filter(d => d.type === 'removed').length
  
  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.header}
        onPress={() => setExpanded(!expanded)}
      >
        <View style={styles.iconContainer}>
          <Feather name="edit-3" size={14} color={colors.text.secondary} />
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.label}>Edit</Text>
          {filePath && (
            <Text style={styles.filePath} numberOfLines={1}>
              {filePath.split('/').pop()}
            </Text>
          )}
        </View>
        {hasChanges && (
          <View style={styles.changeIndicator}>
            {addedCount > 0 && <Text style={styles.addedText}>+{addedCount}</Text>}
            {removedCount > 0 && <Text style={styles.removedText}>-{removedCount}</Text>}
          </View>
        )}
        <Feather 
          name={expanded ? 'chevron-up' : 'chevron-down'} 
          size={14} 
          color={colors.text.secondary} 
        />
      </TouchableOpacity>
      
      {expanded && (
        <View style={styles.diffContainer}>
          <SyntaxDiffViewer
            oldString={oldString}
            newString={newString}
            filePath={filePath}
          />
        </View>
      )}
    </View>
  )
}

const styles = {
  container: {
    marginBottom: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingVertical: spacing.xs,
    marginHorizontal: -spacing.sm,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.background.primary,
  },
  iconContainer: {
    width: 24,
    height: 24,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginRight: spacing.sm,
  },
  headerInfo: {
    flex: 1,
    marginRight: spacing.sm,
  },
  label: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: colors.text.secondary,
    textTransform: 'uppercase' as const,
  },
  filePath: {
    fontSize: 13,
    color: colors.text.primary,
    marginTop: 2,
  },
  diffContainer: {
    marginTop: spacing.xs,
    backgroundColor: '#1e1e1e',
    borderRadius: 4,
    overflow: 'hidden',
  },
  fullPath: {
    fontSize: 11,
    color: '#999',
    fontFamily: 'monospace',
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.sm,
  },
  changeIndicator: {
    flexDirection: 'row' as const,
    gap: spacing.xs,
    marginRight: spacing.sm,
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
  diffContent: {
    paddingVertical: spacing.xs,
  },
  codeScroll: {
    maxHeight: 400,
  },
  lineContainer: {
    flexDirection: 'row' as const,
    paddingHorizontal: spacing.xs,
  },
  removedContainer: {
    backgroundColor: 'rgba(244, 135, 113, 0.1)',
  },
  addedContainer: {
    backgroundColor: 'rgba(137, 209, 133, 0.1)',
  },
  linePrefix: {
    width: 16,
    fontSize: 12,
    fontFamily: 'monospace',
    textAlign: 'center' as const,
    color: '#666',
  },
  removedPrefix: {
    color: '#f48771',
    fontWeight: '600' as const,
  },
  addedPrefix: {
    color: '#89d185',
    fontWeight: '600' as const,
  },
  lineNumber: {
    width: 30,
    fontSize: 11,
    color: '#666',
    fontFamily: 'monospace',
    paddingRight: spacing.sm,
    textAlign: 'right' as const,
  },
  codeLine: {
    fontSize: 12,
    fontFamily: 'monospace',
    lineHeight: 18,
    flexShrink: 0,
    flexWrap: 'nowrap' as const,
  },
  removedLine: {
    color: '#f48771',
  },
  addedLine: {
    color: '#89d185',
  },
  unchangedLine: {
    color: '#d4d4d4',
  },
}