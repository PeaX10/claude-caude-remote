import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { colors, spacing } from '../../theme/colors';

interface ModalFooterProps {
  selectedDirectory: string | null;
  onCancel: () => void;
  onSelect: () => void;
}

export function ModalFooter({ selectedDirectory, onCancel, onSelect }: ModalFooterProps) {
  const hasSelection = !!selectedDirectory;
  
  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onCancel} style={styles.cancelButton}>
        <Text style={styles.cancelText}>Cancel</Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        onPress={onSelect}
        style={[styles.selectButton, !hasSelection && styles.disabledButton]}
        disabled={!hasSelection}
      >
        <Text style={[styles.selectText, !hasSelection && styles.disabledText]}>
          Select Folder
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border.primary,
    gap: spacing.md,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border.primary,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 16,
    color: colors.text.primary,
  },
  selectButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: 8,
    backgroundColor: colors.accent.primary,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: colors.background.tertiary,
  },
  selectText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#ffffff',
  },
  disabledText: {
    color: colors.text.tertiary,
  },
});