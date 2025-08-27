import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, spacing } from '../theme/colors';

export type ProjectTab = 'chat' | 'files' | 'git' | 'settings';

interface ProjectTabsProps {
  activeTab: ProjectTab;
  onTabChange: (tab: ProjectTab) => void;
  isMobile?: boolean;
}

export function ProjectTabs({ activeTab, onTabChange, isMobile = false }: ProjectTabsProps) {
  const tabs = [
    { id: 'chat' as ProjectTab, label: 'Chat', icon: 'message-circle' },
    { id: 'files' as ProjectTab, label: 'Files', icon: 'folder' },
    { id: 'git' as ProjectTab, label: 'Git', icon: 'git-branch' },
    { id: 'settings' as ProjectTab, label: 'Settings', icon: 'settings' },
  ];

  return (
    <View style={[
      styles.container,
      isMobile && styles.containerMobile
    ]}>
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.id}
          style={[
            styles.tab,
            isMobile && styles.tabMobile,
            activeTab === tab.id && (isMobile ? styles.activeTabMobile : styles.activeTab),
          ]}
          onPress={() => onTabChange(tab.id)}
          activeOpacity={0.7}
        >
          <Feather 
            name={tab.icon as any} 
            size={22} 
            color={activeTab === tab.id ? colors.accent.primary : colors.text.tertiary}
          />
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 60,
    backgroundColor: colors.background.secondary,
    borderRightWidth: 1,
    borderRightColor: colors.border.primary,
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  containerMobile: {
    width: '100%',
    height: 60,
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderRightWidth: 0,
    borderTopWidth: 1,
    borderTopColor: colors.border.primary,
    paddingVertical: 0,
    paddingHorizontal: spacing.md,
  },
  tab: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    borderRadius: 8,
  },
  tabMobile: {
    marginBottom: 0,
    flex: 1,
    height: '100%',
  },
  activeTab: {
    backgroundColor: colors.background.primary,
    borderWidth: 1,
    borderColor: colors.accent.primary,
  },
  activeTabMobile: {
    borderTopWidth: 2,
    borderTopColor: colors.accent.primary,
    borderWidth: 0,
    borderRadius: 0,
  },
});