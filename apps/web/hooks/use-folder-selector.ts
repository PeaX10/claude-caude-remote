import { useState, useCallback } from 'react';

interface UseFolderSelectorReturn {
  isModalVisible: boolean;
  showModal: () => void;
  hideModal: () => void;
}

export const useFolderSelector = (): UseFolderSelectorReturn => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  
  const showModal = useCallback(() => setIsModalVisible(true), []);
  const hideModal = useCallback(() => setIsModalVisible(false), []);
  
  return {
    isModalVisible,
    showModal,
    hideModal
  };
};