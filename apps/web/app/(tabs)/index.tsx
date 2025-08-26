import { useState, useEffect } from 'react';
import { View, FlatList, RefreshControl, Alert } from 'react-native';
import { 
  Card, 
  Title, 
  Paragraph, 
  Chip, 
  FAB, 
  IconButton,
  Text,
  Searchbar
} from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useSelector, useDispatch } from 'react-redux';
import { MaterialIcons } from '@expo/vector-icons';

import type { RootState, AppDispatch } from '../../store';
import { ClaudeProcess } from '@claude-remote/shared';
import { setActiveProcess, removeProcess } from '../../store/slices/processSlice';
import { useWebSocket } from '../../hooks/useWebSocket';
import { useApi } from '../../hooks/useApi';
import { showMessage } from 'react-native-flash-message';

interface ProcessCardProps {
  process: ClaudeProcess;
  onSelect: (process: ClaudeProcess) => void;
  onStop: (process: ClaudeProcess) => void;
}

function ProcessCard({ process, onSelect, onStop }: ProcessCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return '#4CAF50';
      case 'idle':
        return '#FF9800';
      case 'error':
        return '#F44336';
      case 'starting':
        return '#2196F3';
      default:
        return '#9E9E9E';
    }
  };

  const handleStop = () => {
    Alert.alert(
      'Stop Process',
      `Are you sure you want to stop "${process.title || process.id}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Stop', style: 'destructive', onPress: () => onStop(process) },
      ]
    );
  };

  return (
    <Card style={{ margin: 8 }} onPress={() => onSelect(process)}>
      <Card.Content>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View style={{ flex: 1 }}>
            <Title numberOfLines={1}>
              {process.title || `Process ${process.id.slice(0, 8)}`}
            </Title>
            <Paragraph numberOfLines={2} style={{ marginBottom: 8 }}>
              {process.projectPath}
            </Paragraph>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
              <Chip 
                mode="outlined" 
                compact
                textStyle={{ color: getStatusColor(process.status) }}
                style={{ borderColor: getStatusColor(process.status) }}
              >
                {process.status.toUpperCase()}
              </Chip>
              <Text style={{ marginLeft: 8, fontSize: 12, opacity: 0.7 }}>
                PID: {process.pid || 'N/A'}
              </Text>
            </View>
            <Text style={{ fontSize: 12, opacity: 0.5 }}>
              Started: {new Date(process.createdAt).toLocaleString()}
            </Text>
          </View>
          <IconButton
            icon="stop"
            size={24}
            onPress={handleStop}
            disabled={process.status === 'stopped' || process.status === 'error'}
          />
        </View>
      </Card.Content>
    </Card>
  );
}

export default function ProcessesScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { processes, loading } = useSelector((state: RootState) => state.processes);
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  
  const { isConnected } = useWebSocket();
  const { stopProcess, getProcesses } = useApi();

  useEffect(() => {
    if (isAuthenticated && isConnected) {
      loadProcesses();
    }
  }, [isAuthenticated, isConnected]);

  const loadProcesses = async () => {
    try {
      await getProcesses();
    } catch (error) {
      showMessage({
        message: 'Failed to load processes',
        type: 'danger',
      });
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadProcesses();
    setRefreshing(false);
  };

  const handleSelectProcess = (process: ClaudeProcess) => {
    dispatch(setActiveProcess(process.id));
    router.push(`/process/${process.id}`);
  };

  const handleStopProcess = async (process: ClaudeProcess) => {
    try {
      await stopProcess(process.id);
      showMessage({
        message: 'Process stopped successfully',
        type: 'success',
      });
    } catch (error) {
      showMessage({
        message: 'Failed to stop process',
        type: 'danger',
      });
    }
  };

  const handleStartProcess = () => {
    router.push('/start-process');
  };

  const filteredProcesses = processes.filter(process =>
    process.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    process.projectPath.toLowerCase().includes(searchQuery.toLowerCase()) ||
    process.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isAuthenticated) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 }}>
        <MaterialIcons name="cloud-off" size={64} color="#ccc" />
        <Title style={{ marginTop: 16, textAlign: 'center' }}>
          Not Connected
        </Title>
        <Paragraph style={{ textAlign: 'center', marginBottom: 16 }}>
          Please connect to a Claude Remote server to view processes.
        </Paragraph>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <Searchbar
        placeholder="Search processes..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={{ margin: 16 }}
      />
      
      {filteredProcesses.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 }}>
          <MaterialIcons name="terminal" size={64} color="#ccc" />
          <Title style={{ marginTop: 16, textAlign: 'center' }}>
            No Processes
          </Title>
          <Paragraph style={{ textAlign: 'center' }}>
            {searchQuery ? 'No processes match your search.' : 'Start your first Claude Code process.'}
          </Paragraph>
        </View>
      ) : (
        <FlatList
          data={filteredProcesses}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ProcessCard
              process={item}
              onSelect={handleSelectProcess}
              onStop={handleStopProcess}
            />
          )}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          contentContainerStyle={{ paddingBottom: 80 }}
        />
      )}

      <FAB
        icon="plus"
        style={{
          position: 'absolute',
          margin: 16,
          right: 0,
          bottom: 0,
        }}
        onPress={handleStartProcess}
        disabled={!isConnected}
      />
    </View>
  );
}