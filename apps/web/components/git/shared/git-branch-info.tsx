import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { GitStatBadge } from '../../../types/git.types';
import { colors, spacing } from '../../../theme/colors';

interface GitBranchInfoProps {
  currentBranch: string;
  baseBranch: string;
  stats?: GitStatBadge[];
}

export function GitBranchInfo({ currentBranch, baseBranch, stats = [] }: GitBranchInfoProps) {
  return (
    <View style={styles.branchInfo}>
      <View style={styles.branchInfoLeft}>
        <View style={styles.branchIcon}>
          <Feather name="git-branch" size={14} color={colors.accent.primary} />
        </View>
        <Text style={styles.branchName}>{currentBranch}</Text>
        <Text style={styles.branchCompare}>vs {baseBranch}</Text>
      </View>
      <View style={styles.branchInfoRight}>
        {stats.map((stat, index) => (
          <View key={index} style={styles.statBadge}>
            <Feather name={stat.icon as any} size={12} color={stat.color || colors.accent.primary} />
            <Text style={styles.statText}>{stat.count} {stat.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  branchInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.background.secondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.primary,
  },
  branchInfoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  branchInfoRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  branchIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.background.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  branchName: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.primary,
  },
  branchCompare: {
    fontSize: 12,
    color: colors.text.tertiary,
    marginLeft: spacing.xs,
  },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.xs,
    paddingVertical: 4,
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border.primary,
  },
  statText: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.text.secondary,
  },
});