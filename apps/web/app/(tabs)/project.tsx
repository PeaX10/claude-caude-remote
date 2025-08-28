import React, { useState } from 'react';
import { View, Text, StyleSheet, Dimensions, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useProjectStore } from '../../store/project-store';
import { ProjectTabs, ProjectTab } from '../../components/project-tabs';
import { SessionTabs } from '../../components/session-tabs';
import { colors } from '../../theme/colors';

// Import the tab content components
import ChatContent from '../../components/chat-content';
import FilesScreen from './files';
import GitScreen from './git';
export default function ProjectScreen() {
  const router = useRouter();
  const { activeProjectId, getActiveProject } = useProjectStore();
  const [activeProjectTab, setActiveProjectTab] = useState<ProjectTab>('chat');
  
  const activeProject = getActiveProject();
  const { width } = Dimensions.get('window');
  const isMobile = width < 768; // Consider mobile if width < 768px
  
  // Redirect to home if no active project
  React.useEffect(() => {
    if (!activeProjectId) {
      router.push('./home');
    }
  }, [activeProjectId, router]);
  
  if (!activeProject) {
    return (
      <View style={styles.container}>
        <Text style={{ color: colors.text.primary, textAlign: 'center', marginTop: 50 }}>
          Loading project... (activeProjectId: {activeProjectId || 'none'})
        </Text>
      </View>
    );
  }
  
  const renderTabContent = () => {
    switch (activeProjectTab) {
      case 'chat':
        return (
          <View style={styles.chatContainer}>
            <SessionTabs projectId={activeProjectId!} />
            <ChatContent />
          </View>
        );
      case 'files':
        return <FilesScreen />;
      case 'git':
        return <GitScreen />;
      default:
        return null;
    }
  };
  
  return (
    <View style={[styles.container, isMobile && styles.containerMobile]}>
      {!isMobile && (
        <ProjectTabs 
          activeTab={activeProjectTab} 
          onTabChange={setActiveProjectTab}
          isMobile={false}
        />
      )}
      <View style={styles.contentContainer}>
        {renderTabContent()}
      </View>
      {isMobile && (
        <ProjectTabs 
          activeTab={activeProjectTab} 
          onTabChange={setActiveProjectTab}
          isMobile={true}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: colors.background.primary,
  },
  containerMobile: {
    flexDirection: 'column',
  },
  contentContainer: {
    flex: 1,
  },
  chatContainer: {
    flex: 1,
  },
});