import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, spacing } from '../../theme/colors';
import { RemoteFileItem } from '../../hooks/use-remote-file-explorer';

interface FileItemProps {
  item: RemoteFileItem;
  isSelected: boolean;
  onPress: () => void;
  onLongPress: () => void;
}

const formatFileSize = (size?: number) => {
  if (!size) return '';
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

export function FileItem({ item, isSelected, onPress, onLongPress }: FileItemProps) {
  const isDirectory = item.type === 'directory';
  
  return (
    <TouchableOpacity
      style={[styles.item, isSelected && isDirectory && styles.selectedItem]}
      onPress={onPress}
      onLongPress={onLongPress}
    >
      <Feather
        name={isDirectory ? 'folder' : 'file'}
        size={20}
        color={isDirectory ? colors.accent.primary : colors.text.tertiary}
        style={styles.icon}
      />
      
      <View style={styles.content}>
        <Text style={[styles.name, isSelected && isDirectory && styles.selectedText]}>
          {item.name}
        </Text>
        {!isDirectory && item.size && (
          <Text style={styles.size}>{formatFileSize(item.size)}</Text>
        )}
      </View>
      
      {isDirectory && (
        <Feather name="chevron-right" size={16} color={colors.text.tertiary} />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border.secondary,
  },
  selectedItem: {
    backgroundColor: colors.accent.primary + '10',
  },
  icon: {
    marginRight: spacing.md,
  },
  content: {
    flex: 1,
  },
  name: {
    fontSize: 15,
    color: colors.text.primary,
  },
  selectedText: {
    color: colors.accent.primary,
    fontWeight: '500',
  },
  size: {
    fontSize: 12,
    color: colors.text.tertiary,
    marginTop: 2,
  },
});