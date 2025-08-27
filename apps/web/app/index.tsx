import { Redirect } from 'expo-router';

export default function Index() {
  // Redirect to home page by default
  return <Redirect href="/(tabs)/home" />;
}