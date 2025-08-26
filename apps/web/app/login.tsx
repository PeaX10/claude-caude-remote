import { useState } from 'react';
import { View, ScrollView, Alert } from 'react-native';
import { 
  Text, 
  TextInput, 
  Button, 
  Card, 
  Title, 
  Paragraph,
  HelperText 
} from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useDispatch } from 'react-redux';
import type { AppDispatch } from '../store';
import { setServerUrl, loginSuccess } from '../store/slices/authSlice';
import { showMessage } from 'react-native-flash-message';

export default function LoginScreen() {
  const [serverUrl, setServerUrlState] = useState('http://localhost:8080');
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();

  const validateUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleConnect = async () => {
    if (!validateUrl(serverUrl)) {
      showMessage({
        message: 'Please enter a valid server URL',
        type: 'warning',
      });
      return;
    }

    setLoading(true);
    
    try {
      // Test connection to server
      const response = await fetch(`${serverUrl}/health`);
      
      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }

      // For demo purposes, we'll simulate login
      // In a real app, you'd send credentials to /api/auth/login
      dispatch(setServerUrl(serverUrl));
      dispatch(loginSuccess({
        user: {
          id: '1',
          username,
          email: `${username}@example.com`,
          role: 'admin',
          createdAt: new Date(),
        },
        token: 'demo-token', // In real app, get from server response
      }));

      showMessage({
        message: 'Connected successfully!',
        type: 'success',
      });

      router.dismiss();
    } catch (error) {
      console.error('Connection failed:', error);
      showMessage({
        message: `Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        type: 'danger',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={{ flex: 1, padding: 16 }}>
      <Card style={{ marginTop: 20 }}>
        <Card.Content>
          <Title>Connect to Claude Remote Server</Title>
          <Paragraph style={{ marginBottom: 20 }}>
            Enter your server details to establish a connection.
          </Paragraph>

          <TextInput
            label="Server URL"
            value={serverUrl}
            onChangeText={setServerUrlState}
            placeholder="http://your-server.com:8080"
            keyboardType="url"
            autoCapitalize="none"
            autoCorrect={false}
            style={{ marginBottom: 8 }}
            left={<TextInput.Icon icon="server" />}
          />
          <HelperText type="info" visible={true}>
            The Claude Remote API server URL
          </HelperText>

          <TextInput
            label="Username"
            value={username}
            onChangeText={setUsername}
            placeholder="Enter username"
            autoCapitalize="none"
            autoCorrect={false}
            style={{ marginBottom: 8, marginTop: 16 }}
            left={<TextInput.Icon icon="account" />}
          />

          <TextInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="Enter password"
            secureTextEntry
            style={{ marginBottom: 20 }}
            left={<TextInput.Icon icon="lock" />}
          />

          <Button
            mode="contained"
            onPress={handleConnect}
            loading={loading}
            disabled={loading || !serverUrl.trim()}
            style={{ marginTop: 10 }}
          >
            {loading ? 'Connecting...' : 'Connect'}
          </Button>
        </Card.Content>
      </Card>

      <Card style={{ marginTop: 16 }}>
        <Card.Content>
          <Title>Quick Setup</Title>
          <Paragraph style={{ marginBottom: 16 }}>
            For development, you can use these default settings:
          </Paragraph>
          
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            <Button
              mode="outlined"
              compact
              onPress={() => setServerUrlState('http://localhost:8080')}
            >
              Localhost
            </Button>
            <Button
              mode="outlined"
              compact
              onPress={() => setServerUrlState('http://192.168.1.100:8080')}
            >
              Local Network
            </Button>
          </View>
        </Card.Content>
      </Card>

      <Card style={{ marginTop: 16, marginBottom: 20 }}>
        <Card.Content>
          <Title>About</Title>
          <Paragraph>
            Claude Remote allows you to control Claude Code instances remotely 
            from your mobile device. Ensure your server is running and accessible 
            from your device's network.
          </Paragraph>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}