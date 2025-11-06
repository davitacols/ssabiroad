import { Stack } from 'expo-router';
import { useFonts, LeagueSpartan_400Regular, LeagueSpartan_600SemiBold, LeagueSpartan_700Bold } from '@expo-google-fonts/league-spartan';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ErrorBoundary } from 'react-error-boundary';

SplashScreen.preventAutoHideAsync();

function ErrorFallback({ error }: { error: Error }) {
  return (
    <View style={styles.errorContainer}>
      <Text style={styles.errorTitle}>Something went wrong</Text>
      <Text style={styles.errorText}>{error.message}</Text>
    </View>
  );
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    LeagueSpartan_400Regular,
    LeagueSpartan_600SemiBold,
    LeagueSpartan_700Bold,
  });

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  if (!loaded && !error) {
    return null;
  }

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="scanner" />
      <Stack.Screen name="nearby-poi" />
      <Stack.Screen name="collections" />
      <Stack.Screen name="batch-process" />
      <Stack.Screen name="collection-detail" />
      <Stack.Screen name="ai-search" />
      <Stack.Screen name="activity" />
      <Stack.Screen name="geofence" />
      <Stack.Screen name="journey" />
      <Stack.Screen name="compare-locations" />
      <Stack.Screen name="discover" />
      <Stack.Screen name="ar-view" />
      <Stack.Screen name="ar-building-explorer" />
      <Stack.Screen name="photo-tagging" />
      <Stack.Screen name="location-card" />
      <Stack.Screen name="share-location" />
      <Stack.Screen name="share-journey" />
      <Stack.Screen name="invite-collaborators" />
      <Stack.Screen name="settings" />
      <Stack.Screen name="tools/exif-editor" />
      <Stack.Screen name="tools/gps-tagger" />
      <Stack.Screen name="memory-game" />
      <Stack.Screen name="saved-locations" />
      <Stack.Screen name="street-view" />
      </Stack>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#fff' },
  errorTitle: { fontSize: 20, fontFamily: 'LeagueSpartan_700Bold', color: '#000', marginBottom: 8 },
  errorText: { fontSize: 14, fontFamily: 'LeagueSpartan_400Regular', color: '#666', textAlign: 'center' },
});
