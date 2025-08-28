import { useState, useEffect } from 'react';
import { useWebSocket } from '../contexts/websocket-context';
import { GitFile, GitCommit, BranchDiff, GitTabType } from '../types/git.types';
import { mapGitFileStatus } from '../utils/git-utils';

export function useGitData(activeTab: GitTabType, baseBranch: string) {
  const [isLoading, setIsLoading] = useState(true);
  const [stagedFiles, setStagedFiles] = useState<GitFile[]>([]);
  const [changedFiles, setChangedFiles] = useState<GitFile[]>([]);
  const [commits, setCommits] = useState<GitCommit[]>([]);
  const [branchDiff, setBranchDiff] = useState<BranchDiff | null>(null);
  const [currentBranch, setCurrentBranch] = useState('');
  
  const { getGitStatus, getGitLog, getGitDiff } = useWebSocket();

  const loadFiles = async () => {
    try {
      const statusData = await getGitStatus();
      if (statusData?.files) {
        const staged: GitFile[] = [];
        const changed: GitFile[] = [];
        
        statusData.files.forEach((file: any) => {
          const gitFile: GitFile = {
            path: file.path,
            status: mapGitFileStatus(file.status),
            staged: file.staged || false,
          };
          
          if (file.staged) {
            staged.push(gitFile);
          } else {
            changed.push(gitFile);
          }
        });
        
        setStagedFiles(staged);
        setChangedFiles(changed);
      }
    } catch (error) {
      console.error('Error loading files:', error);
      setStagedFiles([]);
      setChangedFiles([]);
    }
  };

  const loadCommits = async () => {
    try {
      const logData = await getGitLog(baseBranch);
      if (logData?.commits) {
        const processedCommits = logData.commits.map((commit: any) => ({
          hash: commit.hash,
          fullHash: commit.fullHash,
          message: commit.message,
          author: commit.author,
          date: commit.date,
          isAhead: commit.isAhead,
          files: commit.files?.map((file: any) => ({
            path: file.path,
            status: mapGitFileStatus(file.status),
            staged: false
          })) || []
        }));
        
        setCommits(processedCommits);
        setCurrentBranch(logData.branch || '');
      }
    } catch (error) {
      console.error('Error loading commits:', error);
      setCommits([]);
    }
  };

  const loadBranchDiff = async () => {
    try {
      const diffData = await getGitDiff(undefined, baseBranch);
      if (diffData?.diff) {
        const diffFiles: GitFile[] = diffData.diff.files.map((file: any) => ({
          path: file.path,
          status: mapGitFileStatus(file.status),
          staged: false,
        }));
        
        setBranchDiff({
          ahead: diffData.diff.ahead || 0,
          behind: diffData.diff.behind || 0,
          files: diffFiles,
        });
        setCurrentBranch(diffData.branch || '');
      }
    } catch (error) {
      console.error('Error loading branch diff:', error);
      setBranchDiff(null);
    }
  };

  const loadGitData = async () => {
    setIsLoading(true);
    try {
      switch (activeTab) {
        case 'files':
          await loadFiles();
          break;
        case 'commits':
          await loadCommits();
          break;
        case 'branches':
          await loadBranchDiff();
          break;
      }
    } catch (error) {
      console.error('Error loading git data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadGitData();
  }, [activeTab, baseBranch]);

  return {
    isLoading,
    stagedFiles,
    changedFiles,
    commits,
    branchDiff,
    currentBranch,
    refetch: loadGitData
  };
}