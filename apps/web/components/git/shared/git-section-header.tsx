import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, spacing } from '../../../theme/colors';

interface GitSectionHeaderProps {
  icon: string;
  title: string;
  count: number;
  backgroundColor?: string;
}

export function GitSectionHeader({ 
  icon, 
  title, 
  count, 
  backgroundColor = colors.accent.primary 
}: GitSectionHeaderProps) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionHeaderLeft}>
        <View style={[styles.sectionIcon, { backgroundColor }]}>
          <Feather name={icon as any} size={14} color="#FFFFFF" />
        </View>
        <Text style={styles.sectionTitle}>{title}</Text>
        <Text style={styles.sectionCount}>{count}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionHeader: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.background.secondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.primary,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  sectionIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.primary,
  },
  sectionCount: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.text.tertiary,
    backgroundColor: colors.background.primary,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: 8,
    minWidth: 20,
    textAlign: 'center',
  },
});