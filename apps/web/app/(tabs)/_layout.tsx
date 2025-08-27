import { Tabs } from "expo-router";
import { AppLayout } from "../../components/app-layout";

export default function TabsLayout() {
  return (
    <AppLayout>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: { display: 'none' }, // Hide bottom tabs since we use session tabs
        }}
      >
        <Tabs.Screen name="home" />
        <Tabs.Screen name="index" />
        <Tabs.Screen name="files" />
        <Tabs.Screen name="status" />
        <Tabs.Screen name="test" />
      </Tabs>
    </AppLayout>
  );
}
