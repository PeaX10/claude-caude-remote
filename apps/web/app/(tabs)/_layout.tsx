import { Tabs } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { colors } from "../../theme/colors";
import { AppLayout } from "../../components/app-layout";

export default function TabsLayout() {
  return (
    <AppLayout>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: colors.background.secondary,
            borderTopWidth: 1,
            borderTopColor: colors.border.primary,
            elevation: 0,
            shadowOpacity: 0,
            height: 60,
            paddingTop: 8,
            paddingBottom: 8,
          },
          tabBarActiveTintColor: colors.accent.primary,
          tabBarInactiveTintColor: colors.text.tertiary,
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: "500",
            marginTop: 4,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Chat",
            tabBarIcon: ({ color }) => (
              <Feather name="message-circle" size={20} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="files"
          options={{
            title: "Files",
            tabBarIcon: ({ color }) => (
              <Feather name="folder" size={20} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="git"
          options={{
            title: "Git",
            tabBarIcon: ({ color }) => (
              <Feather name="git-branch" size={20} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="status"
          options={{
            title: "Settings",
            tabBarIcon: ({ color }) => (
              <Feather name="settings" size={20} color={color} />
            ),
          }}
        />
      </Tabs>
    </AppLayout>
  );
}
