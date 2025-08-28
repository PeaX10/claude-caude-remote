import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, spacing } from '../theme/colors';
import { useFolderSelector } from '../hooks/use-folder-selector';
import { RemoteFolderExplorerModal } from './remote-folder-explorer-modal';
import { ViewStyleProp } from '../types/style.types';

interface OpenProjectButtonProps {
  style?: ViewStyleProp;
}

export function OpenProjectButton({ style }: OpenProjectButtonProps) {
  const { isModalVisible, showModal, hideModal } = useFolderSelector();
  
  return (
    <>
      <TouchableOpacity style={[styles.button, style]} onPress={showModal} activeOpacity={0.6}>
        <View style={styles.content}>
          <Feather name="folder-plus" size={24} color={colors.text.secondary} style={styles.icon} />
          <Text style={styles.title}>Open a new project</Text>
          <Text style={styles.subtitle}>Browse folders on your remote PC</Text>
        </View>
      </TouchableOpacity>
      
      <RemoteFolderExplorerModal visible={isModalVisible} onClose={hideModal} />
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.border.primary,
    borderRadius: 12,
    borderStyle: 'dashed',
    minHeight: 64,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginBottom: spacing.xs,
  },
  title: {
    fontSize: 16,
    fontWeight: '400',
    color: colors.text.secondary,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: 12,
    color: colors.text.tertiary,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
});