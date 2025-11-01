import { Alert, Linking, Platform } from 'react-native';
import * as Camera from 'expo-camera';
import * as Location from 'expo-location';
import * as MediaLibrary from 'expo-media-library';
import * as Notifications from 'expo-notifications';

export async function requestCameraPermission(): Promise<boolean> {
  const { status } = await Camera.requestCameraPermissionsAsync();
  
  if (status !== 'granted') {
    Alert.alert(
      'Camera Permission Required',
      'Pic2Nav needs camera access to scan locations and identify landmarks from photos.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open Settings', onPress: () => Linking.openSettings() }
      ]
    );
    return false;
  }
  return true;
}

export async function requestLocationPermission(): Promise<boolean> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  
  if (status !== 'granted') {
    Alert.alert(
      'Location Permission Required',
      'Pic2Nav needs location access to provide accurate location data and identify nearby places.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open Settings', onPress: () => Linking.openSettings() }
      ]
    );
    return false;
  }
  return true;
}

export async function requestMediaPermission(): Promise<boolean> {
  const { status } = await MediaLibrary.requestPermissionsAsync();
  
  if (status !== 'granted') {
    Alert.alert(
      'Media Library Permission Required',
      'Pic2Nav needs access to your photos to extract GPS data and analyze location information.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open Settings', onPress: () => Linking.openSettings() }
      ]
    );
    return false;
  }
  return true;
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'android' && Platform.Version >= 33) {
    const { status } = await Notifications.requestPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert(
        'Notification Permission',
        'Enable notifications to receive geofencing alerts and location updates.',
        [{ text: 'OK' }]
      );
      return false;
    }
    return true;
  }
  return true;
}

export async function checkCameraPermission(): Promise<boolean> {
  const { status } = await Camera.getCameraPermissionsAsync();
  return status === 'granted';
}

export async function checkLocationPermission(): Promise<boolean> {
  const { status } = await Location.getForegroundPermissionsAsync();
  return status === 'granted';
}

export async function checkMediaPermission(): Promise<boolean> {
  const { status } = await MediaLibrary.getPermissionsAsync();
  return status === 'granted';
}
