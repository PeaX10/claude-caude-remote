import React, { useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useProjectStore } from '../../store/project-store';
import { Feather } from '@expo/vector-icons';
import { useDemoProjects } from '../../hooks/use-demo-projects';
import { colors, spacing } from '../../theme/colors';

export default function HomePage() {
  const router = useRouter();
  const { projects, recentSessions, setActiveProject, addTab, setActiveTab } = useProjectStore();
  
  // Initialize demo projects if needed
  useDemoProjects();
  
  // Clear active project when on home page
  useEffect(() => {
    setActiveProject(null);
  }, [setActiveProject]);

  const handleProjectClick = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;
    
    setActiveProject(projectId);
    
    // If project has no tabs, create one
    if (project.tabs.length === 0) {
      const newTabId = addTab(projectId, {
        sessionId: `new_${Date.now()}`,
        title: 'New Chat',
      });
      setActiveTab(projectId, newTabId);
    } else if (!project.activeTabId || !project.tabs.find(t => t.id === project.activeTabId)) {
      // If no active tab or active tab doesn't exist, set the first tab as active
      setActiveTab(projectId, project.tabs[0].id);
    }
    // Otherwise keep the existing active tab
    
    router.push('./project');
  };

  const handleSessionClick = (sessionId: string, projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (project) {
      setActiveProject(projectId);
      
      // Check if session is already open in a tab
      const existingTab = project.tabs.find(t => t.sessionId === sessionId);
      if (existingTab) {
        // Switch to existing tab
        useProjectStore.getState().setActiveTab(projectId, existingTab.id);
      } else {
        // Open session in new tab
        const session = recentSessions.find(s => s.id === sessionId);
        if (session) {
          addTab(projectId, {
            sessionId: session.id,
            title: session.title || 'Untitled Session',
            lastMessage: session.lastMessage,
          });
        }
      }
      
      router.push('./project');
    }
  };

  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 1) {
      const minutes = Math.floor(diff / (1000 * 60));
      return `${minutes}m ago`;
    } else if (hours < 24) {
      return `${hours}h ago`;
    } else {
      const days = Math.floor(hours / 24);
      return `${days}d ago`;
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        
        {projects.length === 0 ? (
          <View style={styles.emptyState}>
            <Feather name="folder" size={48} color={colors.text.tertiary} />
            <Text style={styles.emptyText}>No projects yet</Text>
            <Text style={styles.emptySubtext}>
              Open a folder to start working with Claude
            </Text>
          </View>
        ) : (
          <>
            {/* Recent Sessions */}
            {recentSessions.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Recent Sessions</Text>
                {recentSessions.slice(0, 5).map((session) => {
                  const project = projects.find(p => p.id === session.projectId);
                  if (!project) return null;
                  
                  return (
                    <TouchableOpacity
                      key={session.id}
                      style={styles.sessionItem}
                      onPress={() => handleSessionClick(session.id, session.projectId)}
                    >
                      <View style={styles.sessionContent}>
                        <Text style={styles.sessionTitle} numberOfLines={1}>
                          {session.title || 'Untitled Session'}
                        </Text>
                        <Text style={styles.sessionProject}>{project.name}</Text>
                        {session.lastMessage && (
                          <Text style={styles.sessionMessage} numberOfLines={1}>
                            {session.lastMessage}
                          </Text>
                        )}
                      </View>
                      <Text style={styles.sessionTime}>
                        {formatDate(session.updatedAt)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {/* Projects */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Projects</Text>
              {projects.map((project) => (
                <TouchableOpacity
                  key={project.id}
                  style={styles.projectItem}
                  onPress={() => handleProjectClick(project.id)}
                >
                  <View style={styles.projectContent}>
                    <Text style={styles.projectName}>{project.name}</Text>
                    <Text style={styles.projectPath} numberOfLines={1}>{project.path}</Text>
                    
                    <View style={styles.projectStats}>
                      <Text style={styles.statText}>
                        {project.tabs.length} {project.tabs.length === 1 ? 'tab' : 'tabs'}
                      </Text>
                      
                      {project.stats && project.stats.filesChanged > 0 && (
                        <>
                          <Text style={styles.statDivider}>•</Text>
                          <Text style={styles.statText}>
                            {project.stats.filesChanged} files changed
                          </Text>
                        </>
                      )}
                      
                      {project.stats && project.stats.commitsBehind > 0 && (
                        <>
                          <Text style={styles.statDivider}>•</Text>
                          <Text style={[styles.statText, styles.statWarning]}>
                            {project.stats.commitsBehind} behind
                          </Text>
                        </>
                      )}
                    </View>
                  </View>
                  
                  <Feather 
                    name="chevron-right" 
                    size={18} 
                    color={colors.text.tertiary}
                  />
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  scrollView: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 100,
    paddingHorizontal: spacing.xl,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.secondary,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.text.tertiary,
    textAlign: 'center',
  },
  section: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.primary,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: colors.text.tertiary,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  sessionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border.secondary,
  },
  sessionContent: {
    flex: 1,
    marginRight: spacing.md,
  },
  sessionTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.text.primary,
    marginBottom: 2,
  },
  sessionProject: {
    fontSize: 12,
    color: colors.accent.primary,
    marginBottom: 4,
  },
  sessionMessage: {
    fontSize: 13,
    color: colors.text.tertiary,
    marginTop: 2,
  },
  sessionTime: {
    fontSize: 12,
    color: colors.text.tertiary,
  },
  projectItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border.secondary,
  },
  projectContent: {
    flex: 1,
    marginRight: spacing.md,
  },
  projectName: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text.primary,
    marginBottom: 4,
  },
  projectPath: {
    fontSize: 12,
    color: colors.text.tertiary,
    marginBottom: 6,
  },
  projectStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  statDivider: {
    fontSize: 12,
    color: colors.text.tertiary,
    marginHorizontal: 6,
  },
  statWarning: {
    color: colors.semantic.warning,
  },
});