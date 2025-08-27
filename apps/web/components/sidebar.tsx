import { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  Animated, 
  TouchableWithoutFeedback,
  StyleSheet
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, spacing } from '../theme/colors';
import { useProjectStore } from '../store/project-store';
import { useRouter, usePathname } from 'expo-router';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { 
    projects, 
    activeProjectId, 
    setActiveProject, 
    addTab,
    setActiveTab 
  } = useProjectStore();
  
  // Check if we're on home page
  const isOnHome = pathname?.includes('/home') || false;
  
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const slideAnim = useState(new Animated.Value(isOpen ? 0 : -280))[0];
  const overlayAnim = useState(new Animated.Value(isOpen ? 1 : 0))[0];

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
    ]).start();
  }, [isOpen]);

  const toggleProject = (projectId: string) => {
    const newExpanded = new Set(expandedProjects);
    if (newExpanded.has(projectId)) {
      newExpanded.delete(projectId);
    } else {
      newExpanded.add(projectId);
    }
    setExpandedProjects(newExpanded);
  };

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
    onToggle();
  };

  const handleTabClick = (projectId: string, tabId: string) => {
    setActiveProject(projectId);
    setActiveTab(projectId, tabId);
    router.push('./project');
    onToggle();
  };

  const handleHomeClick = () => {
    setActiveProject(null);  // Clear active project when going home
    router.push('./home');
    onToggle();
  };

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
          <TouchableOpacity onPress={handleHomeClick} activeOpacity={0.7}>
            <Text style={styles.title}>Claude Remote</Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Home Link */}
          <TouchableOpacity 
            style={[styles.homeLink, isOnHome && styles.activeLinkItem]}
            onPress={handleHomeClick}
            activeOpacity={0.7}
          >
            <Feather name="home" size={16} color={isOnHome ? colors.accent.primary : colors.text.secondary} />
            <Text style={[styles.homeLinkText, isOnHome && styles.activeText]}>Home</Text>
          </TouchableOpacity>
          
          {/* Projects Section */}
          <Text style={styles.sectionTitle}>Projects</Text>
          
          {projects.map((project) => {
            const isActive = activeProjectId === project.id;
            const isExpanded = expandedProjects.has(project.id);
            
            return (
              <View key={project.id}>
                <TouchableOpacity 
                  style={[styles.projectItem, isActive && styles.activeProjectItem]}
                  onPress={() => handleProjectClick(project.id)}
                  activeOpacity={0.7}
                >
                  <TouchableOpacity
                    style={styles.expandButton}
                    onPress={() => toggleProject(project.id)}
                    activeOpacity={0.7}
                  >
                    <Feather 
                      name={isExpanded ? 'chevron-down' : 'chevron-right'} 
                      size={14} 
                      color={colors.text.tertiary}
                    />
                  </TouchableOpacity>
                  
                  <Text style={[styles.projectName, isActive && styles.activeText]}>
                    {project.name}
                  </Text>
                  
                  {project.tabs.length > 0 && (
                    <View style={styles.tabCount}>
                      <Text style={styles.tabCountText}>{project.tabs.length}</Text>
                    </View>
                  )}
                </TouchableOpacity>
                
                {/* Tabs */}
                {isExpanded && project.tabs.length > 0 && (
                  <View style={styles.tabsList}>
                    {project.tabs.map((tab) => {
                      const isActiveTab = isActive && project.activeTabId === tab.id;
                      
                      return (
                        <TouchableOpacity
                          key={tab.id}
                          style={[styles.tabItem, isActiveTab && styles.activeTabItem]}
                          onPress={() => handleTabClick(project.id, tab.id)}
                          activeOpacity={0.7}
                        >
                          <Text style={[styles.tabTitle, isActiveTab && styles.activeTabTitle]}>
                            {tab.title}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>
            );
          })}
          
          {projects.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No projects yet</Text>
            </View>
          )}
        </ScrollView>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  activeLinkItem: {
    backgroundColor: colors.accent.primary + '10',
    borderLeftWidth: 3,
    borderLeftColor: colors.accent.primary,
    paddingLeft: spacing.lg - 3,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    zIndex: 999,
  },
  container: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 280,
    backgroundColor: colors.background.secondary,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 10,
    zIndex: 1000,
  },
  header: {
    height: 60,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.primary,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
  },
  content: {
    flex: 1,
  },
  homeLink: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.primary,
  },
  homeLinkText: {
    fontSize: 15,
    color: colors.text.secondary,
    marginLeft: spacing.sm,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: colors.text.tertiary,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  projectItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingLeft: spacing.md,
    minHeight: 40,
  },
  activeProjectItem: {
    backgroundColor: colors.background.primary,
  },
  expandButton: {
    padding: spacing.xs,
    marginRight: spacing.xs,
  },
  projectName: {
    flex: 1,
    fontSize: 15,
    color: colors.text.primary,
  },
  activeText: {
    color: colors.accent.primary,
    fontWeight: '500',
  },
  tabCount: {
    backgroundColor: colors.background.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    alignItems: 'center',
  },
  tabCountText: {
    fontSize: 11,
    color: colors.text.tertiary,
  },
  tabsList: {
    backgroundColor: colors.background.primary,
    paddingVertical: spacing.sm,
    paddingBottom: spacing.md,
  },
  tabItem: {
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.lg,
    paddingLeft: spacing.xl + spacing.xl,
    minHeight: 32,
  },
  activeTabItem: {
    backgroundColor: colors.accent.primary + '10',
    borderLeftWidth: 2,
    borderLeftColor: colors.accent.primary,
    paddingLeft: spacing.xl + spacing.xl - 2,
  },
  tabTitle: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  activeTabTitle: {
    color: colors.accent.primary,
  },
  emptyState: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: colors.text.tertiary,
  },
});