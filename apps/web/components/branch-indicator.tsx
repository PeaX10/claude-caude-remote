import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useWebSocket } from '../contexts/websocket-context';
import { useProjectStore } from '../store/project-store';
import { colors, spacing } from '../theme/colors';

interface BranchIndicatorProps {
  onPress?: () => void;
}

export function BranchIndicator({ onPress }: BranchIndicatorProps) {
  const [currentBranch, setCurrentBranch] = useState<string>('main');
  const [isLoading, setIsLoading] = useState(true);
  const { getCurrentBranch, isConnected } = useWebSocket();
  const { getActiveProject } = useProjectStore();

  useEffect(() => {
    loadCurrentBranch();
  }, [isConnected]);

  const loadCurrentBranch = async () => {
    const activeProject = getActiveProject();
    if (!activeProject || !isConnected) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const branchData = await getCurrentBranch(activeProject.path);
      
      if (branchData && branchData.branch) {
        setCurrentBranch(branchData.branch);
      }
    } catch (error) {
      console.error('Error loading branch:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      // Default behavior: refresh branch info
      loadCurrentBranch();
    }
  };

  if (!isConnected) {
    return null;
  }

  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <Feather 
        name="git-branch" 
        size={14} 
        color={colors.accent.primary}
        style={styles.icon}
      />
      <Text style={styles.branchName} numberOfLines={1}>
        {isLoading ? 'Loading...' : currentBranch}
      </Text>
      {!isLoading && (
        <Feather 
          name="refresh-cw" 
          size={12} 
          color={colors.text.tertiary}
          style={styles.refreshIcon}
        />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: colors.background.secondary,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border.primary,
    maxWidth: 150,
  },
  icon: {
    marginRight: spacing.xs,
  },
  branchName: {
    fontSize: 12,
    color: colors.text.primary,
    fontWeight: '500',
    flex: 1,
  },
  refreshIcon: {
    marginLeft: spacing.xs,
    opacity: 0.6,
  },
});