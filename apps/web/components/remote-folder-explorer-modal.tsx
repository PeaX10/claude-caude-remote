import React from 'react';
import { Modal, View, FlatList, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { useRemoteFileExplorer, RemoteFileItem } from '../hooks/use-remote-file-explorer';
import { useProjectStore } from '../store/project-store';
import { ModalHeader } from './remote-file-explorer/modal-header';
import { PathBreadcrumb } from './remote-file-explorer/path-breadcrumb';
import { FileItem } from './remote-file-explorer/file-item';
import { EmptyState } from './remote-file-explorer/empty-state';
import { ModalFooter } from './remote-file-explorer/modal-footer';

interface RemoteFolderExplorerModalProps {
  visible: boolean;
  onClose: () => void;
  onFolderSelected?: (folderPath: string, folderName: string) => void;
}

const getSortedItems = (items: RemoteFileItem[]) => {
  const directories = items.filter(item => item.type === 'directory');
  const files = items.filter(item => item.type === 'file');
  return [...directories, ...files];
};

export function RemoteFolderExplorerModal({
  visible,
  onClose,
  onFolderSelected
}: RemoteFolderExplorerModalProps) {
  const {
    currentPath,
    items,
    isLoading,
    error,
    navigateTo,
    navigateUp,
    refresh,
    selectDirectory,
    selectedDirectory
  } = useRemoteFileExplorer();
  
  const { addProject } = useProjectStore();
  
  const handleItemPress = async (item: RemoteFileItem) => {
    if (item.type === 'directory') {
      await navigateTo(item.path);
    }
  };
  
  const handleSelectFolder = () => {
    if (!selectedDirectory) return;
    
    const folderName = selectedDirectory.split('/').pop() || selectedDirectory;
    
    addProject({
      name: folderName,
      path: selectedDirectory,
      stats: {
        filesChanged: 0,
        linesAdded: 0,
        linesDeleted: 0,
        commitsBehind: 0
      }
    });
    
    onFolderSelected?.(selectedDirectory, folderName);
    onClose();
  };
  
  const handleCurrentFolderSelect = () => {
    selectDirectory(currentPath);
  };
  
  const renderItem = ({ item }: { item: RemoteFileItem }) => (
    <FileItem
      item={item}
      isSelected={selectedDirectory === item.path}
      onPress={() => {
        if (item.type === 'directory') {
          selectDirectory(item.path);
          setTimeout(() => handleItemPress(item), 200);
        }
      }}
      onLongPress={() => {
        if (item.type === 'directory') {
          selectDirectory(item.path);
        }
      }}
    />
  );
  
  const sortedItems = getSortedItems(items);
  
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="formSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <ModalHeader onClose={onClose} onRefresh={refresh} isLoading={isLoading} />
        
        <PathBreadcrumb
          currentPath={currentPath}
          selectedDirectory={selectedDirectory}
          isLoading={isLoading}
          onNavigateUp={navigateUp}
          onSelectCurrentFolder={handleCurrentFolderSelect}
        />
        
        <View style={styles.listContainer}>
          {error ? (
            <EmptyState isLoading={false} error={error} onRetry={refresh} />
          ) : (
            <FlatList
              data={sortedItems}
              renderItem={renderItem}
              keyExtractor={(item) => item.path}
              style={styles.list}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <EmptyState isLoading={isLoading} error={null} onRetry={refresh} />
              }
            />
          )}
        </View>
        
        <ModalFooter
          selectedDirectory={selectedDirectory}
          onCancel={onClose}
          onSelect={handleSelectFolder}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  listContainer: {
    flex: 1,
  },
  list: {
    flex: 1,
  },
});