import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, spacing } from '../../theme/colors';

interface PathBreadcrumbProps {
  currentPath: string;
  selectedDirectory: string | null;
  isLoading: boolean;
  onNavigateUp: () => void;
  onSelectCurrentFolder: () => void;
}

const formatPath = (path: string) => {
  if (path.length > 50) {
    return '...' + path.slice(-47);
  }
  return path;
};

export function PathBreadcrumb({
  currentPath,
  selectedDirectory,
  isLoading,
  onNavigateUp,
  onSelectCurrentFolder
}: PathBreadcrumbProps) {
  const isCurrentSelected = selectedDirectory === currentPath;
  const canNavigateUp = currentPath !== '/' && !isLoading;
  
  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={onNavigateUp}
        style={[styles.upButton, !canNavigateUp && styles.disabledButton]}
        disabled={!canNavigateUp}
      >
        <Feather name="arrow-up" size={16} color={colors.text.secondary} />
      </TouchableOpacity>
      
      <Text style={styles.path}>{formatPath(currentPath)}</Text>
      
      <TouchableOpacity
        onPress={onSelectCurrentFolder}
        style={[styles.selectButton, isCurrentSelected && styles.selectedButton]}
      >
        <Text style={[styles.selectText, isCurrentSelected && styles.selectedButtonText]}>
          Select This Folder
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.background.secondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.primary,
  },
  upButton: {
    padding: spacing.xs,
    marginRight: spacing.sm,
  },
  disabledButton: {
    opacity: 0.3,
  },
  path: {
    flex: 1,
    fontSize: 14,
    color: colors.text.secondary,
    fontFamily: 'monospace',
  },
  selectButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border.primary,
  },
  selectedButton: {
    backgroundColor: colors.accent.primary,
    borderColor: colors.accent.primary,
  },
  selectText: {
    fontSize: 12,
    color: colors.text.primary,
  },
  selectedButtonText: {
    color: '#ffffff',
  },
});