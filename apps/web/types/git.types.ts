export type GitFileStatus = 'added' | 'modified' | 'deleted' | 'renamed';
export type GitTabType = 'files' | 'commits' | 'branches';

export interface GitFile {
  path: string;
  status: GitFileStatus;
  staged: boolean;
  name?: string;
}

export interface GitCommit {
  hash: string;
  fullHash?: string;
  message: string;
  author: string;
  date: string;
  isAhead: boolean;
  files?: GitFile[];
}

export interface BranchDiff {
  ahead: number;
  behind: number;
  files: GitFile[];
}

export interface TreeNode {
  _files?: GitFile[];
  [key: string]: TreeNode | GitFile[] | undefined;
}

export interface GitStatBadge {
  icon: string;
  count: number;
  label: string;
  color?: string;
}