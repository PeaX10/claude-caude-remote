import { View, Text, TouchableOpacity } from 'react-native'
import { useState } from 'react'
import { colors, spacing } from '../../theme/colors'
import { Feather } from '@expo/vector-icons'

interface Todo {
  content: string
  status: 'pending' | 'in_progress' | 'completed'
  activeForm?: string
}

interface TodoMessageProps {
  todos?: Todo[]
  timestamp?: number
}

export function TodoMessage({ todos, timestamp }: TodoMessageProps) {
  const [expanded, setExpanded] = useState(false)
  
  if (!todos || todos.length === 0) return null
  
  const completedCount = todos.filter(t => t.status === 'completed').length
  const inProgressCount = todos.filter(t => t.status === 'in_progress').length
  const pendingCount = todos.filter(t => t.status === 'pending').length
  
  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.header}
        onPress={() => setExpanded(!expanded)}
      >
        <View style={styles.iconContainer}>
          <Feather name="check-square" size={14} color={colors.text.secondary} />
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.label}>Todo List</Text>
          <View style={styles.statsContainer}>
            {completedCount > 0 && (
              <View style={styles.stat}>
                <View style={[styles.statDot, { backgroundColor: colors.semantic.success }]} />
                <Text style={styles.statText}>{completedCount}</Text>
              </View>
            )}
            {inProgressCount > 0 && (
              <View style={styles.stat}>
                <View style={[styles.statDot, { backgroundColor: colors.accent.primary }]} />
                <Text style={styles.statText}>{inProgressCount}</Text>
              </View>
            )}
            {pendingCount > 0 && (
              <View style={styles.stat}>
                <View style={[styles.statDot, { backgroundColor: colors.text.tertiary }]} />
                <Text style={styles.statText}>{pendingCount}</Text>
              </View>
            )}
          </View>
        </View>
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${(completedCount / todos.length) * 100}%` }
              ]} 
            />
          </View>
        </View>
        <Feather 
          name={expanded ? 'chevron-up' : 'chevron-down'} 
          size={14} 
          color={colors.text.secondary} 
        />
      </TouchableOpacity>
      
      {expanded && (
        <View style={styles.todosContainer}>
          {todos.map((todo, index) => (
            <View key={index} style={styles.todoItem}>
              <View style={styles.todoStatus}>
                {todo.status === 'completed' ? (
                  <Feather name="check-circle" size={14} color={colors.text.secondary} />
                ) : todo.status === 'in_progress' ? (
                  <View style={styles.inProgressIcon}>
                    <Feather name="clock" size={12} color={colors.text.secondary} />
                  </View>
                ) : (
                  <Feather name="circle" size={14} color={colors.text.tertiary} />
                )}
              </View>
              <View style={styles.todoContent}>
                <Text style={[
                  styles.todoText,
                  todo.status === 'completed' && styles.completedText
                ]}>
                  {todo.status === 'in_progress' && todo.activeForm 
                    ? todo.activeForm 
                    : todo.content}
                </Text>
                {todo.status === 'in_progress' && (
                  <Text style={styles.activeIndicator}>Active</Text>
                )}
              </View>
            </View>
          ))}
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
    fontSize: 13,
    fontWeight: '600' as const,
    color: colors.text.primary,
  },
  statsContainer: {
    flexDirection: 'row' as const,
    gap: spacing.sm,
    marginTop: 2,
  },
  stat: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
  },
  statDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  statText: {
    fontSize: 11,
    color: colors.text.secondary,
  },
  progressContainer: {
    marginRight: spacing.sm,
  },
  progressBar: {
    width: 50,
    height: 3,
    backgroundColor: colors.border.primary,
    borderRadius: 1.5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.text.secondary,
    borderRadius: 1.5,
  },
  todosContainer: {
    paddingLeft: 32,
    paddingTop: spacing.xs,
  },
  todoItem: {
    flexDirection: 'row' as const,
    paddingVertical: spacing.sm,
    alignItems: 'flex-start' as const,
  },
  todoStatus: {
    marginRight: spacing.sm,
    paddingTop: 2,
  },
  inProgressIcon: {
    width: 14,
    height: 14,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  todoContent: {
    flex: 1,
  },
  todoText: {
    fontSize: 13,
    color: colors.text.primary,
    lineHeight: 18,
  },
  completedText: {
    color: colors.text.secondary,
    textDecorationLine: 'line-through' as const,
  },
  activeIndicator: {
    fontSize: 10,
    color: colors.text.secondary,
    marginTop: 2,
  },
  timestamp: {
    fontSize: 11,
    color: colors.text.tertiary,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
}