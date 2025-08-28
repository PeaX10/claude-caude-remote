import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { v4 as uuidv4 } from 'uuid';
import { useProjectStore } from '../store/project-store';
import { colors, spacing } from '../theme/colors';

interface SessionTabsProps {
  projectId: string;
}

export function SessionTabs({ projectId }: SessionTabsProps) {
  const { projects, setActiveTab, removeTab, addTab } = useProjectStore();
  
  const project = projects.find(p => p.id === projectId);
  if (!project) return null;
  
  const { tabs = [], activeTabId } = project;

  const handleNewTab = () => {
    const newTabId = addTab(projectId, {
      sessionId: uuidv4(),
      title: 'New Chat',
      messages: [], // Start with empty messages
    });
    setActiveTab(projectId, newTabId);
  };

  const handleCloseTab = (tabId: string, e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    removeTab(projectId, tabId);
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.tabsContainer}
        contentContainerStyle={styles.tabsContent}
      >
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[
              styles.tab,
              activeTabId === tab.id && styles.activeTab,
            ]}
            onPress={() => setActiveTab(projectId, tab.id)}
            activeOpacity={0.7}
          >
            <View style={styles.tabContent}>
              <Text 
                style={[
                  styles.tabTitle,
                  activeTabId === tab.id && styles.activeTabTitle,
                ]}
                numberOfLines={1}
              >
                {tab.title}
              </Text>
              {(tab.unreadCount || 0) > 0 && activeTabId !== tab.id && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadText}>
                    {tab.unreadCount > 99 ? '99+' : tab.unreadCount}
                  </Text>
                </View>
              )}
            </View>
            {tabs.length > 1 && (
              <TouchableOpacity
                style={styles.closeButton}
                onPress={(e) => handleCloseTab(tab.id, e)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Feather 
                  name="x" 
                  size={14} 
                  color={activeTabId === tab.id ? colors.text.primary : colors.text.tertiary}
                />
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        ))}
        
        <TouchableOpacity 
          style={styles.newTabButton} 
          onPress={handleNewTab}
          activeOpacity={0.7}
        >
          <Feather name="plus" size={16} color={colors.text.tertiary} />
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background.secondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.primary,
    height: 44,
  },
  tabsContainer: {
    flex: 1,
  },
  tabsContent: {
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginRight: 1,
    backgroundColor: colors.background.secondary,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    minWidth: 120,
    maxWidth: 200,
  },
  activeTab: {
    backgroundColor: colors.background.primary,
    borderBottomColor: colors.accent.primary,
  },
  tabContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tabTitle: {
    fontSize: 14,
    color: colors.text.tertiary,
    marginRight: spacing.xs,
  },
  activeTabTitle: {
    color: colors.text.primary,
    fontWeight: '500',
  },
  unreadBadge: {
    backgroundColor: '#8B5CF6',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginLeft: 'auto' as const,
    marginRight: spacing.sm,
    minWidth: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '500' as const,
  },
  closeButton: {
    padding: 2,
    marginLeft: spacing.xs,
  },
  newTabButton: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
});