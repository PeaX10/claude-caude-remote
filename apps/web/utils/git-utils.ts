import { GitFile, GitFileStatus, TreeNode } from '../types/git.types';
import { colors } from '../theme/colors';

export const mapGitFileStatus = (status: string): GitFileStatus => {
  const statusMap: Record<string, GitFileStatus> = {
    'A': 'added',
    'M': 'modified',
    'D': 'deleted',
    'R': 'renamed'
  };
  return statusMap[status] || 'modified';
};

export const organizeFilesIntoTree = (files: GitFile[]): TreeNode => {
  const tree: TreeNode = {};
  
  files.forEach((file) => {
    const parts = file.path.split('/');
    let current = tree;
    
    parts.forEach((part, index) => {
      if (index === parts.length - 1) {
        if (!current._files) current._files = [];
        current._files.push({ ...file, name: part });
      } else {
        if (!current[part]) current[part] = {} as TreeNode;
        current = current[part] as TreeNode;
      }
    });
  });
  
  return tree;
};

export const getAllFolderPaths = (tree: TreeNode, prefix: string = ''): string[] => {
  const paths: string[] = [];
  
  Object.keys(tree).forEach((key) => {
    if (key !== '_files') {
      const fullPath = prefix ? `${prefix}/${key}` : key;
      paths.push(fullPath);
      paths.push(...getAllFolderPaths(tree[key] as TreeNode, fullPath));
    }
  });
  
  return paths;
};

export const shouldCollapsePath = (subtree: TreeNode): string | null => {
  const keys = Object.keys(subtree).filter(k => k !== '_files');
  if (keys.length === 1 && (!subtree._files || subtree._files.length === 0)) {
    const childKey = keys[0];
    const childCollapsed = shouldCollapsePath(subtree[childKey] as TreeNode);
    return childCollapsed ? `${childKey}/${childCollapsed}` : childKey;
  }
  return null;
};

export const getStatusColor = (status: GitFileStatus): string => {
  const statusColors: Record<GitFileStatus, string> = {
    added: colors.semantic.success,
    modified: colors.accent.primary, 
    deleted: colors.semantic.error,
    renamed: colors.accent.primary
  };
  return statusColors[status];
};

export const getStatusText = (status: GitFileStatus): string => {
  const statusText: Record<GitFileStatus, string> = {
    added: 'A',
    modified: 'M',
    deleted: 'D', 
    renamed: 'R'
  };
  return statusText[status];
};