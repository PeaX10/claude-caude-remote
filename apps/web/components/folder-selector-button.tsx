import React from 'react';
import { StyledButton, StyledButtonProps } from './ui/styled-button';
import { useFolderSelector } from '../hooks/use-folder-selector';
import { RemoteFolderExplorerModal } from './remote-folder-explorer-modal';

interface FolderSelectorButtonProps extends Omit<StyledButtonProps, 'onPress' | 'children' | 'icon'> {
  showIcon?: boolean;
}

export function FolderSelectorButton({
  showIcon = true,
  ...buttonProps
}: FolderSelectorButtonProps) {
  const { isModalVisible, showModal, hideModal } = useFolderSelector();
  
  return (
    <>
      <StyledButton
        {...buttonProps}
        icon={showIcon ? 'folder-plus' : undefined}
        onPress={showModal}
      >
        Add Folder
      </StyledButton>
      
      <RemoteFolderExplorerModal
        visible={isModalVisible}
        onClose={hideModal}
      />
    </>
  );
}