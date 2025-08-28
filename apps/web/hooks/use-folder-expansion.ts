import { useState, useEffect, useCallback } from 'react';
import { GitFile } from '../types/git.types';
import { organizeFilesIntoTree, getAllFolderPaths } from '../utils/git-utils';

export function useFolderExpansion(files: GitFile[], autoExpand: boolean = true) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  const toggleFolder = useCallback((folder: string) => {
    setExpandedFolders(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(folder)) {
        newExpanded.delete(folder);
      } else {
        newExpanded.add(folder);
      }
      return newExpanded;
    });
  }, []);

  const expandAllFolders = useCallback((fileList: GitFile[]) => {
    if (fileList.length === 0) {
      setExpandedFolders(new Set());
      return;
    }

    const tree = organizeFilesIntoTree(fileList);
    const allPaths = getAllFolderPaths(tree);
    setExpandedFolders(new Set(allPaths));
  }, []);

  const collapseAllFolders = useCallback(() => {
    setExpandedFolders(new Set());
  }, []);

  useEffect(() => {
    if (autoExpand && files.length > 0) {
      expandAllFolders(files);
    }
  }, [files, autoExpand, expandAllFolders]);

  return {
    expandedFolders,
    toggleFolder,
    expandAllFolders,
    collapseAllFolders
  };
}