import { useState, useEffect } from 'react'
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  StyleSheet, 
  SafeAreaView,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator
} from 'react-native'
import { Feather } from '@expo/vector-icons'
import { useWebSocket } from '../../hooks/useWebSocket'
import { useStore } from '../../store'
import { colors, spacing } from '../../theme/colors'

interface FileItem {
  name: string
  type: 'file' | 'directory'
  path: string
  size?: number
  children?: FileItem[]
  isExpanded?: boolean
}

export default function FilesScreen() {
  const [currentPath, setCurrentPath] = useState('/')
  const [files] = useState<FileItem[]>([])
  const [loading, setLoading] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createType, setCreateType] = useState<'file' | 'folder'>('file')
  const [newItemName, setNewItemName] = useState('')
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null)
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set())

  const { isConnected, sendMessage, loadFiles, readFile } = useWebSocket()
  const { isClaudeRunning } = useStore()

  useEffect(() => {
    if (isConnected && isClaudeRunning) {
      loadFilesData(currentPath)
    }
  }, [isConnected, isClaudeRunning, currentPath])

  const loadFilesData = async (path: string) => {
    setLoading(true)
    loadFiles(path)
  }

  const toggleDirectory = (dir: FileItem) => {
    const newExpanded = new Set(expandedDirs)
    if (expandedDirs.has(dir.path)) {
      newExpanded.delete(dir.path)
    } else {
      newExpanded.add(dir.path)
      loadFilesData(dir.path)
    }
    setExpandedDirs(newExpanded)
  }

  const handleFilePress = (file: FileItem) => {
    if (file.type === 'directory') {
      toggleDirectory(file)
    } else {
      setSelectedFile(file)
      readFile(file.path)
    }
  }

  const handleCreateItem = () => {
    if (!newItemName.trim()) return
    
    const newPath = `${currentPath}/${newItemName}`
    if (createType === 'file') {
      sendMessage(`touch "${newPath}"`)
    } else {
      sendMessage(`mkdir "${newPath}"`)
    }
    
    setNewItemName('')
    setShowCreateModal(false)
    setTimeout(() => loadFilesData(currentPath), 100)
  }

  const handleDeleteFile = (file: FileItem) => {
    Alert.alert(
      'Delete File',
      `Are you sure you want to delete "${file.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            sendMessage(`rm "${file.path}"`)
            setTimeout(() => loadFilesData(currentPath), 100)
          }
        }
      ]
    )
  }

  const navigateUp = () => {
    const parentPath = currentPath.split('/').slice(0, -1).join('/') || '/'
    setCurrentPath(parentPath)
  }

  const FileIcon = ({ type }: { type: 'file' | 'directory' }) => (
    type === 'directory' ? (
      <Feather name="folder" size={16} color={colors.text.accent} style={styles.fileIcon} />
    ) : (
      <Feather name="file-text" size={16} color={colors.text.secondary} style={styles.fileIcon} />
    )
  )

  const renderFileItem = (file: FileItem, depth = 0) => (
    <View key={file.path}>
      <TouchableOpacity
        style={[styles.fileItem, { paddingLeft: 16 + depth * 20 }]}
        onPress={() => handleFilePress(file)}
        onLongPress={() => file.type === 'file' && handleDeleteFile(file)}
      >
        <View style={styles.fileInfo}>
          <FileIcon type={file.type} />
          <View style={styles.fileDetails}>
            <Text style={styles.fileName}>{file.name}</Text>
            {file.size && (
              <Text style={styles.fileSize}>
                {(file.size / 1024).toFixed(1)} KB
              </Text>
            )}
          </View>
        </View>
        {file.type === 'directory' && (
          <Feather 
            name={expandedDirs.has(file.path) ? 'chevron-down' : 'chevron-right'} 
            size={14} 
            color={colors.text.secondary}
          />
        )}
      </TouchableOpacity>
      
      {file.type === 'directory' && expandedDirs.has(file.path) && file.children && (
        <View style={styles.childrenContainer}>
          {file.children.map(child => renderFileItem(child, depth + 1))}
        </View>
      )}
    </View>
  )

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.pathContainer}>
          {currentPath !== '/' && (
            <TouchableOpacity style={styles.backButton} onPress={navigateUp}>
              <Feather name="arrow-left" size={18} color={colors.text.accent} />
            </TouchableOpacity>
          )}
          <Text style={styles.currentPath}>{currentPath}</Text>
        </View>
        
        <TouchableOpacity 
          style={styles.createButton}
          onPress={() => setShowCreateModal(true)}
          disabled={!isConnected || !isClaudeRunning}
        >
          <Feather name="plus" size={16} color={colors.text.accent} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent.primary} />
          <Text style={styles.loadingText}>Loading files...</Text>
        </View>
      ) : (
        <ScrollView style={styles.filesList} showsVerticalScrollIndicator={false}>
          {!isConnected || !isClaudeRunning ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>Files Explorer</Text>
              <Text style={styles.emptySubtitle}>
                {!isConnected ? 'Connect to server first' : 'Start Claude Code to browse files'}
              </Text>
              {selectedFile && (
                <Text style={styles.emptySubtitle}>Selected: {selectedFile.name}</Text>
              )}
            </View>
          ) : (
            files.map(file => renderFileItem(file))
          )}
        </ScrollView>
      )}

      <Modal
        visible={showCreateModal}
        transparent
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create New</Text>
            
            <View style={styles.typeSelector}>
              <TouchableOpacity
                style={[styles.typeButton, createType === 'file' && styles.selectedType]}
                onPress={() => setCreateType('file')}
              >
                <Text style={styles.typeButtonText}>File</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.typeButton, createType === 'folder' && styles.selectedType]}
                onPress={() => setCreateType('folder')}
              >
                <Text style={styles.typeButtonText}>Folder</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.nameInput}
              value={newItemName}
              onChangeText={setNewItemName}
              placeholder={`${createType} name`}
              placeholderTextColor={colors.text.tertiary}
              autoFocus
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => setShowCreateModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.createModalButton]}
                onPress={handleCreateItem}
                disabled={!newItemName.trim()}
              >
                <Text style={styles.createModalButtonText}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.primary,
  },
  pathContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: spacing.md,
    padding: spacing.xs,
  },
  currentPath: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: '500',
  },
  createButton: {
    backgroundColor: colors.background.secondary,
    width: 36,
    height: 36,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: colors.text.secondary,
    marginTop: spacing.md,
    fontSize: 16,
  },
  filesList: {
    flex: 1,
  },
  fileItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.primary,
  },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  fileIcon: {
    marginRight: spacing.md,
  },
  fileDetails: {
    flex: 1,
  },
  fileName: {
    color: colors.text.primary,
    fontSize: 15,
    fontWeight: '500',
  },
  fileSize: {
    color: colors.text.tertiary,
    fontSize: 12,
    marginTop: 2,
  },
  childrenContainer: {
    backgroundColor: colors.background.secondary,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xxl * 2,
    paddingHorizontal: spacing.lg,
  },
  emptyTitle: {
    color: colors.text.primary,
    fontSize: 24,
    fontWeight: '400',
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  emptySubtitle: {
    color: colors.text.tertiary,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.surface.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.background.elevated,
    borderRadius: 12,
    padding: spacing.xl,
    width: '80%',
    borderWidth: 1,
    borderColor: colors.border.primary,
  },
  modalTitle: {
    color: colors.text.primary,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  typeSelector: {
    flexDirection: 'row',
    marginBottom: spacing.lg,
    backgroundColor: colors.background.secondary,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border.primary,
  },
  typeButton: {
    flex: 1,
    padding: spacing.md,
    alignItems: 'center',
    borderRadius: 6,
  },
  selectedType: {
    backgroundColor: colors.accent.primary,
  },
  typeButtonText: {
    color: colors.text.primary,
    fontSize: 15,
    fontWeight: '500',
  },
  nameInput: {
    backgroundColor: colors.surface.input,
    color: colors.text.primary,
    padding: spacing.md,
    borderRadius: 6,
    marginBottom: spacing.lg,
    fontSize: 15,
    borderWidth: 1,
    borderColor: colors.border.primary,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  modalButton: {
    flex: 1,
    padding: spacing.md,
    alignItems: 'center',
    borderRadius: 6,
  },
  createModalButton: {
    backgroundColor: colors.accent.primary,
  },
  createModalButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
  cancelButtonText: {
    color: colors.text.secondary,
    fontSize: 15,
  },
})