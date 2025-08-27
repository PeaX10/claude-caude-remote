import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  Modal,
  TextInput,
} from "react-native";
import { useWebSocket } from "../../hooks/use-web-socket";
import { useStore } from "../../store";
import { Button } from '../../components/ui/button';
import { colors, shadows, spacing } from '../../theme/colors';

const MODELS = [
  "claude-3-5-sonnet-20241022",
  "claude-3-5-haiku-20241022",
  "claude-3-opus-20240229",
];

export default function StatusScreen() {
  const [showModelPicker, setShowModelPicker] = useState(false);
  const [serverUrl, setServerUrl] = useState(process.env.EXPO_PUBLIC_API_URL || "http://192.168.1.56:9876");
  const [showServerSettings, setShowServerSettings] = useState(false);

  const { isConnected, claudeStatus, startClaude, sendMessage } =
    useWebSocket();
  const { currentModel, setCurrentModel, isClaudeRunning, clearMessages } =
    useStore();

  const handleModelSwitch = (model: string) => {
    if (isClaudeRunning) {
      sendMessage(`/model ${model}`);
      setCurrentModel(model);
    }
    setShowModelPicker(false);
  };

  const handleInterrupt = () => {
    Alert.alert(
      "Interrupt Claude",
      "Are you sure you want to interrupt the current operation?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Interrupt",
          style: "destructive",
          onPress: () => sendMessage("/interrupt"),
        },
      ]
    );
  };

  const handleClearChat = () => {
    Alert.alert(
      "Clear Chat",
      "This will clear all messages in the current conversation.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: () => clearMessages(),
        },
      ]
    );
  };

  const StatusCard = ({
    title,
    value,
    color = "#007AFF",
  }: {
    title: string;
    value: string;
    color?: string;
  }) => (
    <View style={styles.statusCard}>
      <Text style={styles.statusTitle}>{title}</Text>
      <Text style={[styles.statusValue, { color }]}>{value}</Text>
    </View>
  );


  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Settings</Text>
            <Text style={styles.headerSubtitle}>Claude Code Remote Control</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Connection Status</Text>
            <View style={styles.statusGrid}>
              <StatusCard
                title="Server"
                value={isConnected ? "Connected" : "Disconnected"}
                color={isConnected ? colors.semantic.success : colors.semantic.error}
              />
              <StatusCard
                title="Claude Code"
                value={claudeStatus.isRunning ? "Running" : "Stopped"}
                color={claudeStatus.isRunning ? colors.semantic.success : colors.semantic.warning}
              />
              {claudeStatus.pid && (
                <StatusCard
                  title="Process ID"
                  value={`#${claudeStatus.pid.toString()}`}
                  color={colors.accent.primary}
                />
              )}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Claude Controls</Text>
            
            <Button
              title={`Model: ${currentModel.split('-').pop()?.toUpperCase()}`}
              onPress={() => setShowModelPicker(true)}
              disabled={!isConnected || !isClaudeRunning}
              variant="ghost"
            />
            
            <View style={styles.buttonSpacer} />
            
            <Button
              title="Interrupt"
              onPress={handleInterrupt}
              disabled={!isConnected || !isClaudeRunning}
              variant="danger"
            />
            
            <View style={styles.buttonSpacer} />
            
            <Button
              title="Start Claude"
              onPress={() => startClaude()}
              disabled={!isConnected || isClaudeRunning}
              variant="primary"
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Chat Controls</Text>
            
            <Button
              title="Clear Chat"
              onPress={handleClearChat}
              variant="ghost"
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Connection</Text>
            
            <Button
              title={`Server: ${new URL(serverUrl).host}`}
              onPress={() => setShowServerSettings(true)}
              variant="ghost"
            />
          </View>
        </ScrollView>
      </SafeAreaView>

      <Modal visible={showModelPicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Model</Text>
            {MODELS.map((model) => (
              <TouchableOpacity
                key={model}
                style={[
                  styles.modelOption,
                  currentModel === model && styles.selectedModel,
                ]}
                onPress={() => handleModelSwitch(model)}
              >
                <Text style={[
                  styles.modelText,
                  currentModel === model && { color: '#ffffff' }
                ]}>{model}</Text>
                {currentModel === model && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </TouchableOpacity>
            ))}
            <Button
              title="Cancel"
              onPress={() => setShowModelPicker(false)}
              variant="ghost"
            />
          </View>
        </View>
      </Modal>

      <Modal visible={showServerSettings} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Server Settings</Text>
            <TextInput
              style={styles.serverInput}
              value={serverUrl}
              onChangeText={setServerUrl}
              placeholder="Server URL"
              placeholderTextColor={colors.text.tertiary}
            />
            <Button
              title="Save"
              onPress={() => setShowServerSettings(false)}
              variant="primary"
            />
            <View style={styles.buttonSpacer} />
            <Button
              title="Cancel"
              onPress={() => setShowServerSettings(false)}
              variant="ghost"
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    padding: spacing.md,
  },
  header: {
    marginBottom: spacing.xl,
    paddingTop: spacing.md,
  },
  headerTitle: {
    color: colors.text.primary,
    fontSize: 24,
    fontWeight: "600",
    marginBottom: spacing.xs,
    textAlign: "center",
  },
  headerSubtitle: {
    color: colors.text.secondary,
    fontSize: 14,
    textAlign: "center",
  },
  section: {
    marginBottom: spacing.lg,
    backgroundColor: colors.background.secondary,
    padding: spacing.lg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border.primary,
  },
  sectionTitle: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: "600",
    marginBottom: spacing.md,
  },
  statusGrid: {
    gap: spacing.md,
  },
  buttonSpacer: {
    height: spacing.md,
  },
  statusCard: {
    backgroundColor: colors.background.tertiary,
    padding: spacing.md,
    borderRadius: 6,
    marginBottom: spacing.sm,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border.primary,
  },
  statusTitle: {
    color: colors.text.secondary,
    fontSize: 13,
    fontWeight: "500",
  },
  statusValue: {
    fontSize: 13,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.surface.overlay,
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: colors.background.elevated,
    padding: spacing.xl,
    borderRadius: 12,
    width: "90%",
    maxWidth: 400,
    borderWidth: 1,
    borderColor: colors.border.primary,
    shadowColor: shadows.lg.shadowColor,
    shadowOffset: shadows.lg.shadowOffset,
    shadowOpacity: shadows.lg.shadowOpacity,
    shadowRadius: shadows.lg.shadowRadius,
    elevation: shadows.lg.elevation,
  },
  modalTitle: {
    color: colors.text.primary,
    fontSize: 18,
    fontWeight: "600",
    marginBottom: spacing.lg,
    textAlign: "center",
  },
  modelOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing.md,
    borderRadius: 6,
    marginBottom: spacing.sm,
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.primary,
  },
  selectedModel: {
    backgroundColor: colors.accent.primary,
    borderColor: colors.border.focus,
  },
  modelText: {
    color: colors.text.primary,
    fontSize: 14,
    flex: 1,
    fontWeight: '500',
  },
  checkmark: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: "bold",
  },
  serverInput: {
    backgroundColor: colors.surface.input,
    color: colors.text.primary,
    padding: spacing.md,
    borderRadius: 6,
    marginBottom: spacing.lg,
    fontSize: 15,
    borderWidth: 1,
    borderColor: colors.border.primary,
  },
});
