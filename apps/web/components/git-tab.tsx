import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useProjectStore } from '../store/project-store';
import { colors, spacing } from '../theme/colors';
import { GitTabType, GitStatBadge } from '../types/git.types';
import { useGitData } from '../hooks/use-git-data';
import { useFolderExpansion } from '../hooks/use-folder-expansion';
import { organizeFilesIntoTree } from '../utils/git-utils';
import { FileTree } from './ui/file-tree';
import { GitSectionHeader } from './git/shared/git-section-header';
import { GitEmptyState } from './git/shared/git-empty-state';
import { GitBranchInfo } from './git/shared/git-branch-info';

export function GitTab() {
  const [activeTab, setActiveTab] = useState<GitTabType>('files');
  const [expandedCommits, setExpandedCommits] = useState<Set<string>>(new Set());
  
  const { getActiveProject } = useProjectStore();
  const activeProject = getActiveProject();
  const baseBranch = activeProject?.baseBranch || 'develop';
  
  const { 
    isLoading, 
    stagedFiles, 
    changedFiles, 
    commits, 
    branchDiff, 
    currentBranch 
  } = useGitData(activeTab, baseBranch);
  
  const { expandedFolders: filesExpandedFolders, toggleFolder: toggleFilesFolder } = 
    useFolderExpansion([...stagedFiles, ...changedFiles]);
  
  const { expandedFolders: branchExpandedFolders, toggleFolder: toggleBranchFolder } = 
    useFolderExpansion(branchDiff?.files || []);

  const toggleCommit = (commitHash: string) => {
    setExpandedCommits(prev => {
      const next = new Set(prev);
      if (next.has(commitHash)) {
        next.delete(commitHash);
      } else {
        next.add(commitHash);
      }
      return next;
    });
  };

  const renderFiles = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={colors.accent.primary} />
        </View>
      );
    }

    return (
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {stagedFiles.length > 0 && (
          <View style={styles.section}>
            <GitSectionHeader 
              icon="plus" 
              title="Staged" 
              count={stagedFiles.length}
              backgroundColor="#4CAF50"
            />
            <View style={styles.treeContainer}>
              <FileTree 
                files={stagedFiles}
                expandedFolders={filesExpandedFolders}
                onToggleFolder={toggleFilesFolder}
              />
            </View>
          </View>
        )}

        {changedFiles.length > 0 && (
          <View style={styles.section}>
            <GitSectionHeader 
              icon="edit-3" 
              title="Changes" 
              count={changedFiles.length}
              backgroundColor="#FF9800"
            />
            <View style={styles.treeContainer}>
              <FileTree 
                files={changedFiles}
                expandedFolders={filesExpandedFolders}
                onToggleFolder={toggleFilesFolder}
              />
            </View>
          </View>
        )}

        {stagedFiles.length === 0 && changedFiles.length === 0 && (
          <GitEmptyState 
            icon="check"
            title="All clean"
            subtitle="No changes to commit"
          />
        )}
      </ScrollView>
    );
  };

  const renderCommits = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={colors.accent.primary} />
        </View>
      );
    }

    if (commits.length === 0) {
      return (
        <GitEmptyState 
          icon="git-commit"
          title="No commits"
          subtitle="No commit history available"
        />
      );
    }

    const aheadCommits = commits.filter(c => c.isAhead);
    const commitStats: GitStatBadge[] = aheadCommits.length > 0 ? [
      { icon: 'git-commit', count: aheadCommits.length, label: 'commits' }
    ] : [];

    return (
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <GitBranchInfo 
          currentBranch={currentBranch}
          baseBranch={baseBranch}
          stats={commitStats}
        />

        {aheadCommits.length > 0 ? (
          <View style={styles.section}>
            <GitSectionHeader 
              icon="git-commit"
              title="Commits on this branch"
              count={aheadCommits.length}
            />
            
            {aheadCommits.map((commit) => (
              <View key={commit.hash} style={styles.commitSection}>
                <TouchableOpacity
                  style={styles.commitHeader}
                  onPress={() => toggleCommit(commit.hash)}
                  activeOpacity={0.7}
                >
                  <View style={styles.commitHeaderLeft}>
                    <View style={[styles.commitDot, { backgroundColor: colors.accent.primary }]} />
                    <View style={styles.commitHeaderInfo}>
                      <Text style={styles.commitMessage}>{commit.message}</Text>
                      <View style={styles.commitMeta}>
                        <Text style={styles.commitAuthor}>{commit.author}</Text>
                        <Text style={styles.commitHash}>{commit.hash}</Text>
                        <Text style={styles.commitDate}>{commit.date}</Text>
                      </View>
                    </View>
                  </View>
                  <View style={styles.commitHeaderRight}>
                    {commit.files && commit.files.length > 0 && (
                      <Text style={[styles.fileCount, { color: colors.accent.primary }]}>
                        {commit.files.length} files
                      </Text>
                    )}
                    <Feather 
                      name={expandedCommits.has(commit.hash) ? "chevron-up" : "chevron-down"} 
                      size={16} 
                      color={colors.text.tertiary} 
                    />
                  </View>
                </TouchableOpacity>
                
                {expandedCommits.has(commit.hash) && commit.files && commit.files.length > 0 && (
                  <View style={styles.commitFilesContainer}>
                    <View style={styles.treeContainer}>
                      <FileTree 
                        files={commit.files}
                        expandedFolders={filesExpandedFolders}
                        onToggleFolder={toggleFilesFolder}
                      />
                    </View>
                  </View>
                )}
              </View>
            ))}
          </View>
        ) : (
          <GitEmptyState 
            icon="git-commit"
            title="No commits"
            subtitle={`This branch is up to date with ${baseBranch}`}
          />
        )}
      </ScrollView>
    );
  };

  const renderBranches = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={colors.accent.primary} />
        </View>
      );
    }

    if (!branchDiff) {
      return (
        <GitEmptyState 
          icon="git-branch"
          title="No branch comparison"
          subtitle={`Unable to compare with ${baseBranch}`}
        />
      );
    }

    const branchStats: GitStatBadge[] = [];
    if (branchDiff.ahead > 0) {
      branchStats.push({ icon: 'arrow-up', count: branchDiff.ahead, label: 'ahead', color: '#4CAF50' });
    }
    if (branchDiff.behind > 0) {
      branchStats.push({ icon: 'arrow-down', count: branchDiff.behind, label: 'behind', color: '#F44336' });
    }
    if (branchDiff.files.length > 0) {
      branchStats.push({ icon: 'file-text', count: branchDiff.files.length, label: 'files' });
    }

    return (
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <GitBranchInfo 
          currentBranch={currentBranch}
          baseBranch={baseBranch}
          stats={branchStats}
        />

        {branchDiff.files.length > 0 && (
          <View style={styles.section}>
            <GitSectionHeader 
              icon="git-pull-request"
              title="Changed Files"
              count={branchDiff.files.length}
            />
            <View style={styles.treeContainer}>
              <FileTree 
                files={branchDiff.files}
                expandedFolders={branchExpandedFolders}
                onToggleFolder={toggleBranchFolder}
              />
            </View>
          </View>
        )}

        {branchDiff.files.length === 0 && (
          <GitEmptyState 
            icon="check"
            title="No differences"
            subtitle={`This branch is up to date with ${baseBranch}`}
          />
        )}
      </ScrollView>
    );
  };

  const tabs = [
    { id: 'files' as GitTabType, label: 'Files', icon: 'file-text' },
    { id: 'commits' as GitTabType, label: 'Commits', icon: 'git-commit' },
    { id: 'branches' as GitTabType, label: 'Branches', icon: 'git-branch' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.tabBar}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, activeTab === tab.id && styles.activeTab]}
            onPress={() => setActiveTab(tab.id)}
          >
            <Feather 
              name={tab.icon as any} 
              size={16} 
              color={activeTab === tab.id ? colors.accent.primary : colors.text.tertiary} 
            />
            <Text 
              style={[
                styles.tabText, 
                activeTab === tab.id && styles.activeTabText
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeTab === 'files' && renderFiles()}
      {activeTab === 'commits' && renderCommits()}
      {activeTab === 'branches' && renderBranches()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.background.secondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.primary,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    gap: spacing.xs,
    minHeight: 48,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: colors.accent.primary,
  },
  tabText: {
    fontSize: 14,
    color: colors.text.tertiary,
    fontWeight: '500',
  },
  activeTabText: {
    color: colors.accent.primary,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  section: {
    marginTop: spacing.md,
  },
  treeContainer: {
    backgroundColor: colors.background.primary,
  },
  commitSection: {
    marginBottom: spacing.md,
  },
  commitHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.sm,
    paddingLeft: spacing.md,
    backgroundColor: colors.background.secondary,
    borderTopWidth: 1,
    borderTopColor: colors.border.primary,
  },
  commitHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing.sm,
  },
  commitHeaderInfo: {
    flex: 1,
  },
  commitHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  commitDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.accent.primary,
    zIndex: 1,
  },
  commitMessage: {
    fontSize: 14,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  commitMeta: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  commitAuthor: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  commitDate: {
    fontSize: 12,
    color: colors.text.tertiary,
  },
  commitHash: {
    fontSize: 12,
    color: colors.text.tertiary,
    fontFamily: 'monospace',
  },
  fileCount: {
    fontSize: 12,
    color: colors.text.tertiary,
    backgroundColor: colors.background.primary,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.border.primary,
    textAlign: 'center',
    minWidth: 60,
  },
  commitFilesContainer: {
    backgroundColor: colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.primary,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderLeftColor: colors.border.primary,
    borderRightColor: colors.border.primary,
  },
});