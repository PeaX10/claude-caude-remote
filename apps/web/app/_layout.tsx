import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { WebSocketProvider } from "../contexts/websocket-context";

export default function RootLayout() {
  return (
    <WebSocketProvider>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style="auto" />
    </WebSocketProvider>
  );
}
