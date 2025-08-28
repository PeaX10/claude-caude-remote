import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useWebSocket } from '../contexts/websocket-context';
import { useProjectStore } from '../store/project-store';
import { colors, spacing } from '../theme/colors';

export function ProjectSettings() {
  const [availableBranches, setAvailableBranches] = useState<string[]>([]);
  const [baseBranch, setBaseBranch] = useState<string>('develop');
  const [customBranch, setCustomBranch] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isCustom, setIsCustom] = useState(false);
  
  const { runGitCommand, isConnected } = useWebSocket();
  const { getActiveProject, setProjectBaseBranch } = useProjectStore();
  
  const activeProject = getActiveProject();

  useEffect(() => {
    if (activeProject && isConnected) {
      loadBranches();
      // Load saved base branch for this project
      const savedBaseBranch = activeProject.baseBranch || 'develop';
      setBaseBranch(savedBaseBranch);
      
      // Check if it's a custom branch not in common branches
      const commonBranches = ['main', 'master', 'develop', 'dev', 'staging'];
      setIsCustom(!commonBranches.includes(savedBaseBranch));
      if (!commonBranches.includes(savedBaseBranch)) {
        setCustomBranch(savedBaseBranch);
      }
    }
  }, [activeProject, isConnected]);

  const loadBranches = async () => {
    if (!activeProject || !isConnected) return;
    
    try {
      setIsLoading(true);
      // This would need to be implemented in the backend to list all branches
      // For now, we'll use common branch names
      setAvailableBranches(['main', 'master', 'develop', 'dev', 'staging']);
    } catch (error) {
      console.error('Error loading branches:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveBaseBranch = () => {
    if (!activeProject) return;
    
    const branchToSave = isCustom ? customBranch : baseBranch;
    
    if (branchToSave.trim()) {
      setProjectBaseBranch(activeProject.id, branchToSave.trim());
      // Show success feedback (could be implemented with a toast)
      console.log(`Base branch set to: ${branchToSave}`);
    }
  };

  const handleBranchSelect = (branch: string) => {
    setBaseBranch(branch);
    setIsCustom(false);
    setCustomBranch('');
    
    if (activeProject) {
      setProjectBaseBranch(activeProject.id, branch);
    }
  };

  const handleCustomToggle = () => {
    setIsCustom(!isCustom);
    if (!isCustom) {
      setCustomBranch(baseBranch);
    } else {
      setBaseBranch('develop');
      setCustomBranch('');
      if (activeProject) {
        setProjectBaseBranch(activeProject.id, 'develop');
      }
    }
  };

  if (!activeProject) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No active project</Text>
      </View>
    );
  }

  if (!isConnected) {
    return (
      <View style={styles.container}>
        <View style={styles.disconnectedState}>
          <Feather name="wifi-off" size={48} color={colors.text.tertiary} />
          <Text style={styles.errorTitle}>Not Connected</Text>
          <Text style={styles.errorSubtitle}>Connect to server to access settings</Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.projectIcon}>
            <Feather name="folder" size={20} color={colors.accent.primary} />
          </View>
          <View>
            <Text style={styles.projectName}>{activeProject.name}</Text>
            <Text style={styles.projectPath}>{activeProject.path}</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionHeaderLeft}>
            <View style={[styles.sectionIcon, { backgroundColor: colors.accent.primary }]}>
              <Feather name="git-branch" size={14} color="#FFFFFF" />
            </View>
            <Text style={styles.sectionTitle}>Git Configuration</Text>
          </View>
        </View>

        <View style={styles.sectionContent}>
          <Text style={styles.settingLabel}>Base Branch for Comparisons</Text>
          <Text style={styles.settingDescription}>
            Choose the branch to compare against in Git views (commits, diffs)
          </Text>

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color={colors.accent.primary} />
              <Text style={styles.loadingText}>Loading branches...</Text>
            </View>
          ) : (
            <View style={styles.branchOptions}>
              {availableBranches.map((branch) => (
                <TouchableOpacity
                  key={branch}
                  style={[
                    styles.branchOption,
                    !isCustom && baseBranch === branch && styles.branchOptionSelected,
                  ]}
                  onPress={() => handleBranchSelect(branch)}
                  activeOpacity={0.7}
                >
                  <View style={styles.branchOptionLeft}>
                    <Feather 
                      name="git-branch" 
                      size={16} 
                      color={!isCustom && baseBranch === branch ? colors.accent.primary : colors.text.secondary}
                    />
                    <Text style={[
                      styles.branchOptionText,
                      !isCustom && baseBranch === branch && styles.branchOptionTextSelected
                    ]}>
                      {branch}
                    </Text>
                  </View>
                  {!isCustom && baseBranch === branch && (
                    <Feather name="check" size={16} color={colors.accent.primary} />
                  )}
                </TouchableOpacity>
              ))}

              <TouchableOpacity
                style={[
                  styles.branchOption,
                  isCustom && styles.branchOptionSelected,
                ]}
                onPress={handleCustomToggle}
                activeOpacity={0.7}
              >
                <View style={styles.branchOptionLeft}>
                  <Feather 
                    name="edit-3" 
                    size={16} 
                    color={isCustom ? colors.accent.primary : colors.text.secondary}
                  />
                  <Text style={[
                    styles.branchOptionText,
                    isCustom && styles.branchOptionTextSelected
                  ]}>
                    Custom branch
                  </Text>
                </View>
                {isCustom && (
                  <Feather name="check" size={16} color={colors.accent.primary} />
                )}
              </TouchableOpacity>

              {isCustom && (
                <View style={styles.customBranchContainer}>
                  <TextInput
                    style={styles.customBranchInput}
                    value={customBranch}
                    onChangeText={(text) => {
                      setCustomBranch(text);
                      if (activeProject && text.trim()) {
                        setProjectBaseBranch(activeProject.id, text.trim());
                      }
                    }}
                    placeholder="Enter branch name..."
                    placeholderTextColor={colors.text.tertiary}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              )}
            </View>
          )}

        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    padding: spacing.md,
    backgroundColor: colors.background.secondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.primary,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  projectIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: colors.background.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  projectName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  projectPath: {
    fontSize: 12,
    color: colors.text.tertiary,
    marginTop: 2,
  },
  section: {
    marginTop: spacing.md,
  },
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
  sectionContent: {
    padding: spacing.md,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  settingDescription: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: spacing.md,
    lineHeight: 20,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    gap: spacing.sm,
  },
  loadingText: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  branchOptions: {
    gap: spacing.xs,
  },
  branchOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border.primary,
    backgroundColor: colors.background.secondary,
  },
  branchOptionSelected: {
    borderColor: colors.accent.primary,
    backgroundColor: colors.accent.primary + '10',
  },
  branchOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  branchOptionText: {
    fontSize: 14,
    color: colors.text.primary,
  },
  branchOptionTextSelected: {
    color: colors.accent.primary,
    fontWeight: '500',
  },
  customBranchContainer: {
    marginTop: spacing.xs,
    marginLeft: spacing.lg,
  },
  customBranchInput: {
    backgroundColor: colors.background.primary,
    borderWidth: 1,
    borderColor: colors.border.primary,
    borderRadius: 6,
    padding: spacing.sm,
    fontSize: 14,
    color: colors.text.primary,
  },
  errorText: {
    fontSize: 16,
    color: colors.text.primary,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
  disconnectedState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text.primary,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  errorSubtitle: {
    fontSize: 14,
    color: colors.text.tertiary,
    textAlign: 'center',
  },
});