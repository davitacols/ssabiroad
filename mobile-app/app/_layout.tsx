import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="scanner" />
      <Stack.Screen name="nearby-poi" />
      <Stack.Screen name="collections" />
      <Stack.Screen name="batch-process" />
      <Stack.Screen name="collection-detail" />
      <Stack.Screen name="activity" />
      <Stack.Screen name="geofence" />
      <Stack.Screen name="ar-view" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}
