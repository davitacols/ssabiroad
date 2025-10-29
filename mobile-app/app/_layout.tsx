import { Stack } from 'expo-router';
import { useFonts, LeagueSpartan_400Regular, LeagueSpartan_600SemiBold, LeagueSpartan_700Bold } from '@expo-google-fonts/league-spartan';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

SplashScreen.preventAutoHideAsync();

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
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="index" />
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
    </Stack>
  );
}
