import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, spacing } from '../../theme/colors';

interface ModalHeaderProps {
  onClose: () => void;
  onRefresh: () => void;
  isLoading: boolean;
}

export function ModalHeader({ onClose, onRefresh, isLoading }: ModalHeaderProps) {
  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onClose} style={styles.button}>
        <Feather name="x" size={24} color={colors.text.primary} />
      </TouchableOpacity>
      
      <Text style={styles.title}>Select Folder</Text>
      
      <TouchableOpacity
        onPress={onRefresh}
        style={styles.button}
        disabled={isLoading}
      >
        <Feather 
          name="refresh-cw" 
          size={20} 
          color={isLoading ? colors.text.tertiary : colors.text.primary} 
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.primary,
  },
  button: {
    padding: spacing.xs,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
  },
});