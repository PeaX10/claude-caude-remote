import { useState, useEffect } from 'react'
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  StyleSheet, 
  SafeAreaView,
  ActivityIndicator
} from 'react-native'
import { Feather } from '@expo/vector-icons'
import { useWebSocket } from '../../hooks/use-web-socket'
import { useStore } from '../../store'
import { colors, spacing } from '../../theme/colors'

interface FileItem {
  name: string
  type: 'file' | 'directory'
  path: string
  size?: number
  children?: FileItem[]
  isExpanded?: boolean
  isLoading?: boolean
}

export default function FilesScreen() {
  const { activeProjectPath } = useStore()
  const [currentPath, setCurrentPath] = useState('')
  const [files, setFiles] = useState<FileItem[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingPaths, setLoadingPaths] = useState<Set<string>>(new Set())
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null)
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set())
  const [fileContent, setFileContent] = useState<string>('')

  const { isConnected, loadFiles, readFile, socket } = useWebSocket()

  useEffect(() => {
    if (isConnected && activeProjectPath) {
      setCurrentPath(activeProjectPath)
      setFiles([])
      setExpandedDirs(new Set())
      loadFilesData(activeProjectPath)
    } else if (!activeProjectPath) {
      setCurrentPath('')
      setFiles([])
      setExpandedDirs(new Set())
    }
  }, [isConnected, activeProjectPath])

  useEffect(() => {
    if (!socket) return

    const handleFileList = (data: { files: FileItem[], path: string }) => {
      setLoadingPaths(prev => {
        const newSet = new Set(prev)
        newSet.delete(data.path)
        return newSet
      })
      
      if (data.path === activeProjectPath) {
        setFiles(data.files || [])
        setLoading(false)
      } else {
        setFiles(prevFiles => {
          const updateChildren = (items: FileItem[]): FileItem[] => {
            return items.map(item => {
              if (item.path === data.path) {
                return {
                  ...item,
                  children: data.files || [],
                  isLoading: false
                }
              } else if (item.children) {
                return {
                  ...item,
                  children: updateChildren(item.children)
                }
              }
              return item
            })
          }
          
          return updateChildren(prevFiles)
        })
      }
    }

    const handleFileContent = (data: { content: string, path: string }) => {
      setFileContent(data.content || '')
    }

    const handleFileError = (data: { error: string }) => {
      setLoading(false)
      setLoadingPaths(new Set())
      setFiles(prevFiles => {
        const clearLoading = (items: FileItem[]): FileItem[] => {
          return items.map(item => ({
            ...item,
            isLoading: false,
            children: item.children ? clearLoading(item.children) : item.children
          }))
        }
        return clearLoading(prevFiles)
      })
    }

    socket.on('file_list_result', handleFileList)
    socket.on('file_content', handleFileContent)
    socket.on('file_error', handleFileError)

    return () => {
      socket.off('file_list_result', handleFileList)
      socket.off('file_content', handleFileContent)
      socket.off('file_error', handleFileError)
    }
  }, [socket, activeProjectPath])

  const loadFilesData = (path: string) => {
    if (!isConnected) return
    
    if (loadingPaths.has(path)) return
    
    setLoadingPaths(prev => new Set([...prev, path]))
    
    if (path === activeProjectPath) {
      setLoading(true)
    }
    
    loadFiles(path)
  }

  const toggleDirectory = (dir: FileItem) => {
    const newExpanded = new Set(expandedDirs)
    
    if (expandedDirs.has(dir.path)) {
      newExpanded.delete(dir.path)
    } else {
      newExpanded.add(dir.path)
      
      if (!dir.children) {
        setFiles(prevFiles => {
          const setLoadingState = (items: FileItem[]): FileItem[] => {
            return items.map(item => {
              if (item.path === dir.path) {
                return { ...item, isLoading: true }
              } else if (item.children) {
                return { ...item, children: setLoadingState(item.children) }
              }
              return item
            })
          }
          return setLoadingState(prevFiles)
        })
        
        loadFilesData(dir.path)
      }
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


  const FileIcon = ({ type }: { type: 'file' | 'directory' }) => (
    type === 'directory' ? (
      <Feather name="folder" size={16} color={colors.accent.primary} style={styles.fileIcon} />
    ) : (
      <Feather name="file-text" size={16} color={colors.text.secondary} style={styles.fileIcon} />
    )
  )

  const renderFileItem = (file: FileItem, depth = 0) => (
    <View key={file.path}>
      <TouchableOpacity
        style={[styles.fileItem, { paddingLeft: 16 + depth * 24 }]}
        onPress={() => handleFilePress(file)}
      >
        <View style={styles.fileInfo}>
          <FileIcon type={file.type} />
          <View style={styles.fileDetails}>
            <Text style={styles.fileName}>{file.name}</Text>
            {file.size && (
              <Text style={styles.fileSize}>
                {Math.round(file.size / 1024)} KB
              </Text>
            )}
          </View>
        </View>
        {file.type === 'directory' && (
          file.isLoading ? (
            <ActivityIndicator size="small" color={colors.accent.primary} />
          ) : (
            <Feather 
              name={expandedDirs.has(file.path) ? 'chevron-down' : 'chevron-right'} 
              size={14} 
              color={colors.text.secondary}
            />
          )
        )}
      </TouchableOpacity>
      
      {file.type === 'directory' && expandedDirs.has(file.path) && (
        <View style={styles.childrenContainer}>
          {file.isLoading ? (
            <View style={[styles.loadingItem, { paddingLeft: 40 + depth * 24 }]}>
              <ActivityIndicator size="small" color={colors.text.tertiary} />
              <Text style={styles.loadingText}>Loading...</Text>
            </View>
          ) : file.children && file.children.length > 0 ? (
            file.children.map(child => renderFileItem(child, depth + 1))
          ) : file.children && file.children.length === 0 ? (
            <Text style={[styles.emptyDirectory, { paddingLeft: 40 + depth * 24 }]}>
              Empty directory
            </Text>
          ) : null}
        </View>
      )}
    </View>
  )

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.pathContainer}>
          <Feather name="git-branch" size={18} color={colors.accent.primary} style={{ marginRight: 8 }} />
          <Text style={styles.currentPath}>
            {!activeProjectPath ? 'No project selected' : 
             activeProjectPath.split('/').pop() || 'Project Files'}
          </Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent.primary} />
          <Text style={styles.loadingText}>Loading files...</Text>
        </View>
      ) : (
        <ScrollView style={styles.filesList} showsVerticalScrollIndicator={false}>
          {!isConnected ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>Files Explorer</Text>
              <Text style={styles.emptySubtitle}>Connect to server first</Text>
            </View>
          ) : files.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No files</Text>
              <Text style={styles.emptySubtitle}>
                {!activeProjectPath ? 'Select a project from the sidebar' : 'This directory is empty'}
              </Text>
            </View>
          ) : (
            // Tree view: show all files with indentation
            files.map(file => renderFileItem(file, 0))
          )}
        </ScrollView>
      )}
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
  currentPath: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: '500',
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
  loadingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  loadingText: {
    color: colors.text.tertiary,
    fontSize: 13,
    marginLeft: spacing.sm,
    fontStyle: 'italic',
  },
  emptyDirectory: {
    color: colors.text.tertiary,
    fontSize: 13,
    paddingVertical: spacing.sm,
    fontStyle: 'italic',
  },
})