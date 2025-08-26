import { useState, ReactNode } from 'react'
import { View, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { colors } from '../theme/colors'
import { useWebSocket } from '../hooks/use-web-socket'
import { ChatHeader } from './chat-header'
import { Sidebar } from './sidebar'

interface AppLayoutProps {
  children: ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { isConnected, claudeStatus, contextPercent, getFullOutput, socket } = useWebSocket()

  const handleRefresh = () => {
    getFullOutput()
  }

  const handleSelectSession = (sessionId: string, projectPath: string) => {
  }

  return (
    <View style={styles.container}>
      <Sidebar 
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        socket={socket}
        onSelectSession={handleSelectSession}
      />
      <SafeAreaView style={styles.content}>
        <ChatHeader
          contextPercent={contextPercent}
          isConnected={isConnected}
          claudeIsRunning={claudeStatus.isRunning}
          onRefresh={handleRefresh}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          sidebarOpen={sidebarOpen}
        />
        <View style={styles.children}>
          {children}
        </View>
      </SafeAreaView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  content: {
    flex: 1,
  },
  children: {
    flex: 1,
  }
})