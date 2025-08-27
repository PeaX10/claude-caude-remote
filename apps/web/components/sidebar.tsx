import { useState, useEffect } from 'react'
import { View, Text, TouchableOpacity, ScrollView, Animated, Dimensions, TouchableWithoutFeedback } from 'react-native'
import { Feather } from '@expo/vector-icons'
import { colors, spacing } from '../theme/colors'
import { useStore } from '../store'
import { useWebSocket } from '../hooks/use-web-socket'

interface Project {
  name: string
  path: string
  encodedPath?: string
  sessions: number
}

interface Session {
  id: string
  title?: string
  created_at: number
  last_used: number
}

interface SidebarProps {
  isOpen: boolean
  onToggle: () => void
  onSelectSession: (sessionId: string, projectPath: string) => void
}

export function Sidebar({ isOpen, onToggle, onSelectSession }: SidebarProps) {
  const [projects, setProjects] = useState<Project[]>([])
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set())
  const [projectSessions, setProjectSessions] = useState<{ [key: string]: Session[] }>({})
  const [selectedSession, setSelectedSession] = useState<string | null>(null)
  const slideAnim = useState(new Animated.Value(isOpen ? 0 : -280))[0]
  const overlayAnim = useState(new Animated.Value(isOpen ? 1 : 0))[0]
  const { width } = Dimensions.get('window')
  const { activeProjectPath, setActiveProject } = useStore()
  const { socket, watchSession } = useWebSocket()

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: isOpen ? 0 : -280,
        tension: 65,
        friction: 10,
        useNativeDriver: true,
      }),
      Animated.timing(overlayAnim, {
        toValue: isOpen ? 1 : 0,
        duration: 300,
        useNativeDriver: true,
      })
    ]).start()
  }, [isOpen])

  useEffect(() => {
    if (!socket) return

    socket.emit('claude_get_projects')

    socket.on('claude_projects', (data: Project[]) => {
      setProjects(data)
    })

    socket.on('claude_project_sessions', (data: { projectPath: string, sessions: Session[] }) => {
      setProjectSessions(prev => ({
        ...prev,
        [data.projectPath]: data.sessions
      }))
    })

    return () => {
      socket.off('claude_projects')
      socket.off('claude_project_sessions')
    }
  }, [socket])

  const toggleProject = (projectPath: string) => {
    const newExpanded = new Set(expandedProjects)
    if (newExpanded.has(projectPath)) {
      newExpanded.delete(projectPath)
    } else {
      newExpanded.add(projectPath)
      socket?.emit('claude_get_project_sessions', { projectPath })
    }
    setExpandedProjects(newExpanded)
  }

  const handleSelectSession = (sessionId: string, projectPath: string) => {
    setSelectedSession(sessionId)
    setActiveProject(projectPath, sessionId)
    onSelectSession(sessionId, projectPath)
    socket?.emit('claude_get_session_history', { sessionId, projectPath })
    // Start watching session file for real-time updates
    watchSession(sessionId, projectPath)
  }

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    
    if (days === 0) return 'Today'
    if (days === 1) return 'Yesterday'
    if (days < 7) return `${days} days ago`
    return date.toLocaleDateString()
  }

  return (
    <>
      <Animated.View 
        style={[
          styles.overlay, 
          { 
            opacity: overlayAnim,
            display: isOpen ? 'flex' : 'none',
          }
        ]}
        pointerEvents={isOpen ? 'auto' : 'none'}
      >
        <TouchableWithoutFeedback onPress={onToggle}>
          <View style={{ flex: 1 }} />
        </TouchableWithoutFeedback>
      </Animated.View>

      <Animated.View style={[styles.container, { transform: [{ translateX: slideAnim }] }]}>
        <View style={styles.header}>
          <Text style={styles.title}>Projects</Text>
        </View>
      
      <ScrollView style={styles.content}>
        {projects.map((project) => (
          <View key={project.encodedPath || project.path}>
            <TouchableOpacity 
              style={styles.projectItem}
              onPress={() => toggleProject(project.path)}
            >
              <View style={[
                styles.projectIcon, 
                { transform: [{ rotate: expandedProjects.has(project.path) ? '90deg' : '0deg' }] }
              ]}>
                <Text style={styles.chevron}>›</Text>
              </View>
              <View style={styles.projectInfo}>
                <View style={styles.projectHeader}>
                  <Text style={styles.projectName}>{project.name}</Text>
                  {activeProjectPath === project.path && (
                    <View style={styles.activeIndicator} />
                  )}
                </View>
                <Text style={styles.sessionCount}>{`${project.sessions} ${project.sessions === 1 ? 'session' : 'sessions'}`}</Text>
              </View>
            </TouchableOpacity>
            
            {expandedProjects.has(project.path) && projectSessions[project.path] && (
              <View style={styles.sessionsList}>
                {projectSessions[project.path].map((session) => (
                  <TouchableOpacity
                    key={session.id}
                    style={[
                      styles.sessionItem,
                      selectedSession === session.id && styles.selectedSession
                    ]}
                    onPress={() => handleSelectSession(session.id, project.path)}
                  >
                    <Text style={styles.sessionTitle}>
                      {session.title || session.id.slice(0, 8)}
                    </Text>
                    <Text style={styles.sessionDate}>
                      {formatDate(session.last_used)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        ))}
      </ScrollView>
      
      <View style={styles.footer}>
        <View style={{ flex: 1 }} />
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => {}}
          activeOpacity={0.7}
        >
          <Feather name="folder-plus" size={22} color={colors.accent.primary} />
        </TouchableOpacity>
      </View>
      </Animated.View>
    </>
  )
}

const styles = {
  overlay: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    zIndex: 999,
  },
  container: {
    position: 'absolute' as const,
    left: 0,
    top: 0,
    bottom: 0,
    width: 280,
    backgroundColor: colors.background.secondary,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
    zIndex: 1000,
  },
  header: {
    height: 73,
    justifyContent: 'center' as const,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.primary,
    backgroundColor: colors.background.secondary,
  },
  title: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: colors.text.primary,
  },
  content: {
    flex: 1,
  },
  projectItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border.secondary,
  },
  projectIcon: {
    width: 20,
    height: 20,
    marginRight: spacing.sm,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  chevron: {
    fontSize: 20,
    color: colors.text.tertiary,
    fontWeight: '300' as const,
  },
  projectInfo: {
    flex: 1,
  },
  projectHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  projectName: {
    fontSize: 16,
    fontWeight: '500' as const,
    color: colors.text.primary,
  },
  activeIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.accent.primary,
    marginLeft: spacing.sm,
  },
  projectPath: {
    fontSize: 11,
    color: colors.text.tertiary,
    marginTop: 2,
    opacity: 0.8,
  },
  sessionCount: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 4,
  },
  sessionsList: {
    backgroundColor: colors.background.tertiary,
  },
  sessionItem: {
    paddingLeft: spacing.xl + spacing.xl,
    paddingRight: spacing.lg,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border.secondary,
  },
  selectedSession: {
    backgroundColor: colors.accent.primary + '20',
    borderLeftWidth: 3,
    borderLeftColor: colors.accent.primary,
    paddingLeft: spacing.xl + spacing.xl - 3,
  },
  sessionTitle: {
    fontSize: 14,
    color: colors.text.primary,
    marginBottom: 3,
  },
  sessionDate: {
    fontSize: 12,
    color: colors.text.secondary,
    opacity: 0.8,
  },
  footer: {
    height: 56,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: spacing.md,
    borderTopWidth: 0.5,
    borderTopColor: colors.border.secondary,
    backgroundColor: colors.background.secondary,
  },
  addButton: {
    width: 44,
    height: 44,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
}