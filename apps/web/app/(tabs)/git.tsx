import { useState } from 'react'
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  StyleSheet, 
  SafeAreaView,
  Modal,
  TextInput
} from 'react-native'
import { useWebSocket } from '../../hooks/use-web-socket'
import { useStore } from '../../store'
import { colors, spacing } from '../../theme/colors'

export default function GitScreen() {
  const [showCommitModal, setShowCommitModal] = useState(false)
  const [commitMessage, setCommitMessage] = useState('')
  const [showBranchModal, setShowBranchModal] = useState(false)
  const [newBranchName, setNewBranchName] = useState('')
  const [activeTab, setActiveTab] = useState<'status' | 'branches' | 'commits'>('status')

  const { isConnected } = useWebSocket()
  const { isClaudeRunning } = useStore()
  
  // TODO: Implement runGitCommand when WebSocket is ready
  const runGitCommand = (command: string) => {
    console.log('Git command:', command)
  }

  const handleCommit = () => {
    if (!commitMessage.trim()) return
    
    runGitCommand(`git commit -m "${commitMessage}"`)
    setCommitMessage('')
    setShowCommitModal(false)
  }

  const handleCreateBranch = () => {
    if (!newBranchName.trim()) return
    
    runGitCommand(`git checkout -b "${newBranchName}"`)
    setNewBranchName('')
    setShowBranchModal(false)
  }

  const TabButton = ({ title, active, onPress }: { title: string, active: boolean, onPress: () => void }) => (
    <TouchableOpacity
      style={[styles.tabButton, active && styles.activeTab]}
      onPress={onPress}
    >
      <Text style={[styles.tabButtonText, active && styles.activeTabText]}>{title}</Text>
    </TouchableOpacity>
  )

  const renderStatusTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.emptyState}>
        <Text style={styles.emptyTitle}>Git Status</Text>
        <Text style={styles.emptySubtitle}>
          Git functionality coming soon
        </Text>
      </View>
    </ScrollView>
  )

  const renderBranchesTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.emptyState}>
        <Text style={styles.emptyTitle}>Git Branches</Text>
        <Text style={styles.emptySubtitle}>
          Branch management coming soon
        </Text>
      </View>
    </ScrollView>
  )

  const renderCommitsTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.emptyState}>
        <Text style={styles.emptyTitle}>Git History</Text>
        <Text style={styles.emptySubtitle}>
          Commit history coming soon
        </Text>
      </View>
    </ScrollView>
  )

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Git Repository</Text>
      </View>

      <View style={styles.tabs}>
        <TabButton title="Status" active={activeTab === 'status'} onPress={() => setActiveTab('status')} />
        <TabButton title="Branches" active={activeTab === 'branches'} onPress={() => setActiveTab('branches')} />
        <TabButton title="Commits" active={activeTab === 'commits'} onPress={() => setActiveTab('commits')} />
      </View>

      {!isConnected || !isClaudeRunning ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Git Repository</Text>
          <Text style={styles.emptySubtitle}>
            {!isConnected ? 'Connect to server first' : 'Start Claude Code to access Git'}
          </Text>
        </View>
      ) : (
        <>
          {activeTab === 'status' && renderStatusTab()}
          {activeTab === 'branches' && renderBranchesTab()}
          {activeTab === 'commits' && renderCommitsTab()}
        </>
      )}

      <Modal visible={showCommitModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Commit Changes</Text>
            <TextInput
              style={styles.commitInput}
              value={commitMessage}
              onChangeText={setCommitMessage}
              placeholder="Commit message..."
              placeholderTextColor={colors.text.tertiary}
              multiline
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => setShowCommitModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.commitButton]}
                onPress={handleCommit}
                disabled={!commitMessage.trim()}
              >
                <Text style={styles.commitButtonText}>Commit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showBranchModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create New Branch</Text>
            <TextInput
              style={styles.branchInput}
              value={newBranchName}
              onChangeText={setNewBranchName}
              placeholder="Branch name..."
              placeholderTextColor={colors.text.tertiary}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => setShowBranchModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.createButton]}
                onPress={handleCreateBranch}
                disabled={!newBranchName.trim()}
              >
                <Text style={styles.createButtonText}>Create</Text>
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
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.primary,
  },
  headerTitle: {
    color: colors.text.primary,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: colors.background.secondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.primary,
  },
  tabButton: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: colors.accent.primary,
  },
  tabButtonText: {
    color: colors.text.secondary,
    fontSize: 15,
    fontWeight: '500',
  },
  activeTabText: {
    color: colors.accent.primary,
  },
  tabContent: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
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
    width: '85%',
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
  commitInput: {
    backgroundColor: colors.surface.input,
    color: colors.text.primary,
    padding: spacing.md,
    borderRadius: 6,
    marginBottom: spacing.lg,
    fontSize: 15,
    minHeight: 80,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: colors.border.primary,
  },
  branchInput: {
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
  commitButton: {
    backgroundColor: colors.accent.primary,
  },
  commitButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
  createButton: {
    backgroundColor: colors.accent.primary,
  },
  createButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
  cancelButtonText: {
    color: colors.text.secondary,
    fontSize: 15,
  },
})