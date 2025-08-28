import { View, Text, TouchableOpacity, Animated, ScrollView, DimensionValue } from 'react-native'
import { Feather } from '@expo/vector-icons'
import { colors, spacing } from '../theme/colors'
import { useProjectStore } from '../store/project-store'
import { useWebSocket } from '../contexts/websocket-context'
import { useEffect, useState, useMemo } from 'react'
import { getRelativeTimeString } from '../utils/date-formatter'
import type { AvailableSession } from '../types/project.types'

interface EmptyStateProps {
  isConnected: boolean
  claudeIsRunning: boolean
  onStartClaude: () => void
  fadeAnim: Animated.Value
  slideAnim: Animated.Value
  sessionTitle?: string
  projectId?: string | null
  tabId?: string
}

const createEmptyStyles = () => ({
  emptyState: {
    paddingVertical: spacing.xl * 3,
    alignItems: 'center' as const,
    paddingHorizontal: spacing.xl,
    minHeight: 400,
  },
  emptyTitle: {
    color: colors.text.primary,
    fontSize: 24,
    fontWeight: '400' as const,
    textAlign: 'center' as const,
    marginTop: spacing.xl * 2,
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    color: colors.text.tertiary,
    fontSize: 15,
    textAlign: 'center' as const,
    lineHeight: 22,
    marginBottom: spacing.xl,
  },
  sessionsContainer: {
    width: '100%' as DimensionValue,
    marginTop: spacing.lg,
  },
  sectionTitle: {
    color: colors.text.secondary,
    fontSize: 13,
    fontWeight: '600' as const,
    marginBottom: spacing.md,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  sessionItem: {
    backgroundColor: colors.background.secondary,
    borderRadius: 8,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border.primary,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
  },
  sessionItemHover: {
    borderColor: colors.accent.primary,
  },
  sessionInfo: {
    flex: 1,
  },
  sessionTitle: {
    color: colors.text.primary,
    fontSize: 14,
    fontWeight: '500' as const,
    marginBottom: 2,
  },
  sessionDate: {
    color: colors.text.tertiary,
    fontSize: 12,
  },
  sessionIcon: {
    marginLeft: spacing.sm,
  },
  createButton: {
    marginTop: spacing.lg,
    backgroundColor: colors.accent.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 8,
    alignSelf: 'center' as const,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  createButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600' as const,
    marginLeft: spacing.sm,
  },
})

export function EmptyState({ 
  isConnected, 
  claudeIsRunning, 
  onStartClaude, 
  fadeAnim, 
  slideAnim, 
  sessionTitle,
  projectId,
  tabId 
}: EmptyStateProps) {
  const styles = createEmptyStyles()
  const { getAvailableSessions, availableSessions } = useWebSocket()
  const { getActiveProject, updateTab, getAvailableSessions: getStoredSessions } = useProjectStore()
  const [isLoadingSessions, setIsLoadingSessions] = useState(false)
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false)
  
  const activeProject = getActiveProject()
  
  const storedSessions = activeProject?.path ? getStoredSessions(activeProject.path) : []
  const sessionsToUse = availableSessions.length > 0 ? availableSessions : storedSessions
  
  const filteredSessions = useMemo(() => {
    if (!activeProject || !sessionsToUse.length) return []
    const openSessionIds = activeProject.tabs.map(tab => tab.sessionId)
    return sessionsToUse.filter(session => !openSessionIds.includes(session.id))
  }, [sessionsToUse, activeProject?.tabs])
  
  useEffect(() => {
    if (isConnected && activeProject?.path && !hasLoadedOnce) {
      setIsLoadingSessions(true)
      setHasLoadedOnce(true)
      getAvailableSessions(activeProject.path)
      const timeout = setTimeout(() => {
        setIsLoadingSessions(false)
      }, 2000)
      
      return () => clearTimeout(timeout)
    }
  }, [isConnected, activeProject?.path, getAvailableSessions, hasLoadedOnce])
  
  useEffect(() => {
    if (availableSessions.length > 0 && isLoadingSessions) {
      setIsLoadingSessions(false)
    }
  }, [availableSessions, isLoadingSessions])
  
  const handleLoadSession = (session: AvailableSession) => {
    if (projectId && tabId) {
      // Update the current tab with the selected session
      updateTab(projectId, tabId, {
        sessionId: session.id,
        title: session.title || `Session ${session.id.slice(0, 8)}`,
        lastMessage: '',
      })
    }
  }
  
  const handleCreateNew = () => {
  }
  
  return (
    <Animated.View 
      style={[
        styles.emptyState,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
      ]}
    >
      <Text style={styles.emptyTitle}>
        {sessionTitle === 'New Chat' ? 'Start or Resume a Conversation' : sessionTitle}
      </Text>
      <Text style={styles.emptySubtitle}>
        Send a message to start a new conversation or choose an existing session below
      </Text>
      
      {isLoadingSessions ? (
        <View style={styles.sessionsContainer}>
          <Text style={styles.sectionTitle}>Loading sessions...</Text>
        </View>
      ) : filteredSessions.length > 0 ? (
        <View style={styles.sessionsContainer}>
          <Text style={styles.sectionTitle}>Available Sessions</Text>
          <ScrollView showsVerticalScrollIndicator={false}>
            {filteredSessions.map((session) => (
              <TouchableOpacity
                key={session.id}
                style={styles.sessionItem}
                onPress={() => handleLoadSession(session)}
                activeOpacity={0.7}
              >
                <View style={styles.sessionInfo}>
                  <Text style={styles.sessionTitle}>
                    {session.title || `Session ${session.id.slice(0, 8)}`}
                  </Text>
                  <Text style={styles.sessionDate}>
                    {session.last_used ? 
                      `Last active ${getRelativeTimeString(session.last_used)}` :
                      `Created ${getRelativeTimeString(session.created_at)}`
                    }
                  </Text>
                  {!session.title && (
                    <Text style={[styles.sessionDate, { fontSize: 11, opacity: 0.7 }]}>
                      ID: {session.id.slice(0, 12)}...
                    </Text>
                  )}
                </View>
                <Feather 
                  name="arrow-right" 
                  size={18} 
                  color={colors.text.tertiary}
                  style={styles.sessionIcon}
                />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      ) : (
        <View style={styles.sessionsContainer}>
          <Text style={[styles.sectionTitle, { opacity: 0.5 }]}>
            No existing sessions found. Send a message to start a new conversation.
          </Text>
        </View>
      )}
    </Animated.View>
  )
}