import React from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, spacing } from '../../theme/colors';

interface EmptyStateProps {
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
}

export function EmptyState({ isLoading, error, onRetry }: EmptyStateProps) {
  if (error) {
    return (
      <View style={styles.container}>
        <Feather name="alert-circle" size={48} color={colors.semantic.error} />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity onPress={onRetry} style={styles.retryButton}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.accent.primary} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Feather name="folder" size={48} color={colors.text.tertiary} />
      <Text style={styles.emptyText}>Empty folder</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  errorText: {
    marginTop: spacing.md,
    fontSize: 14,
    color: colors.semantic.error,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.accent.primary,
    borderRadius: 8,
  },
  retryText: {
    color: '#ffffff',
    fontWeight: '500',
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: 14,
    color: colors.text.tertiary,
  },
  emptyText: {
    marginTop: spacing.md,
    fontSize: 14,
    color: colors.text.tertiary,
  },
});