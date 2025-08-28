import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { GitFile, TreeNode } from '../../types/git.types';
import { organizeFilesIntoTree, shouldCollapsePath, getStatusColor, getStatusText } from '../../utils/git-utils';
import { colors, spacing } from '../../theme/colors';

interface FileTreeProps {
  files: GitFile[];
  expandedFolders: Set<string>;
  onToggleFolder: (folder: string) => void;
  showStatusBadges?: boolean;
  readonly?: boolean;
}

export function FileTree({ 
  files, 
  expandedFolders, 
  onToggleFolder, 
  showStatusBadges = true, 
  readonly = false 
}: FileTreeProps) {
  if (files.length === 0) {
    return null;
  }

  const tree = organizeFilesIntoTree(files);

  const renderTree = (subtree: TreeNode, path: string = ''): React.ReactElement[] => {
    const items: React.ReactElement[] = [];
    
    Object.keys(subtree).forEach((key) => {
      if (key === '_files') return;
      
      const fullPath = path ? `${path}/${key}` : key;
      const collapsedPath = shouldCollapsePath(subtree[key] as TreeNode);
      
      if (collapsedPath) {
        const displayPath = `${key}/${collapsedPath}`;
        const finalFullPath = `${fullPath}/${collapsedPath}`;
        const isExpanded = expandedFolders.has(finalFullPath);
        
        let deepTree = subtree[key] as TreeNode;
        const pathParts = collapsedPath.split('/');
        pathParts.forEach(part => {
          deepTree = deepTree[part] as TreeNode;
        });
        
        items.push(
          <View key={fullPath}>
            <TouchableOpacity 
              style={styles.treeItem}
              onPress={() => !readonly && onToggleFolder(finalFullPath)}
              disabled={readonly}
            >
              <View style={styles.treeItemContent}>
                <Feather 
                  name={isExpanded ? 'chevron-down' : 'chevron-right'} 
                  size={16} 
                  color={colors.text.secondary}
                  style={{ marginRight: 4 }}
                />
                <Feather name="folder" size={16} color={colors.accent.primary} />
                <Text style={styles.treeItemText}>{displayPath}</Text>
              </View>
            </TouchableOpacity>
            {isExpanded && (
              <View style={styles.treeChildren}>
                {renderTree(deepTree, finalFullPath)}
              </View>
            )}
          </View>
        );
      } else {
        const isExpanded = expandedFolders.has(fullPath);
        
        items.push(
          <View key={fullPath}>
            <TouchableOpacity 
              style={styles.treeItem}
              onPress={() => !readonly && onToggleFolder(fullPath)}
              disabled={readonly}
            >
              <View style={styles.treeItemContent}>
                <Feather 
                  name={isExpanded ? 'chevron-down' : 'chevron-right'} 
                  size={16} 
                  color={colors.text.secondary}
                  style={{ marginRight: 4 }}
                />
                <Feather name="folder" size={16} color={colors.accent.primary} />
                <Text style={styles.treeItemText}>{key}</Text>
              </View>
            </TouchableOpacity>
            {isExpanded && (
              <View style={styles.treeChildren}>
                {renderTree(subtree[key] as TreeNode, fullPath)}
              </View>
            )}
          </View>
        );
      }
    });
    
    if (subtree._files) {
      subtree._files.forEach((file: GitFile) => {
        items.push(
          <TouchableOpacity key={`${path}/${file.name}`} style={styles.treeItem}>
            <View style={styles.treeItemContent}>
              <View style={{ width: 20 }} />
              <Feather name="file" size={16} color={colors.text.secondary} />
              <Text style={styles.treeItemText}>{file.name}</Text>
              {showStatusBadges && (
                <Text style={[styles.statusText, { color: getStatusColor(file.status) }]}>
                  {getStatusText(file.status)}
                </Text>
              )}
            </View>
          </TouchableOpacity>
        );
      });
    }
    
    return items;
  };

  return (
    <View style={styles.container}>
      {renderTree(tree)}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  treeItem: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  treeItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  treeItemText: {
    flex: 1,
    fontSize: 13,
    color: colors.text.primary,
  },
  treeChildren: {
    marginLeft: spacing.md,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: spacing.xs,
  },
});