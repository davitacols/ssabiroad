import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar, Image, Alert, ScrollView } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';

const Tab = createBottomTabNavigator();

// Navigation-style colors
const colors = {
  primary: '#007AFF',
  background: '#000000',
  surface: '#1C1C1E',
  text: '#FFFFFF',
  textSecondary: '#8E8E93',
  accent: '#30D158',
  warning: '#FF9500'
};

// Home Screen - Navigation Style
function HomeScreen() {
  const [currentLocation, setCurrentLocation] = useState(null);
  const [isLocating, setIsLocating] = useState(false);

  const getCurrentLocation = async () => {
    setIsLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Location access required');
        return;
      }
      
      const location = await Location.getCurrentPositionAsync({});
      setCurrentLocation(location.coords);
    } catch (error) {
      Alert.alert('Error', 'Could not get location');
    } finally {
      setIsLocating(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      
      {/* Navigation Header */}
      <View style={styles.navHeader}>
        <View style={styles.locationRow}>
          <Ionicons name="location" size={20} color={colors.accent} />
          <Text style={styles.locationText}>
            {currentLocation ? 
              `${currentLocation.latitude.toFixed(4)}, ${currentLocation.longitude.toFixed(4)}` : 
              'Location not available'
            }
          </Text>
          <TouchableOpacity onPress={getCurrentLocation} disabled={isLocating}>
            <Ionicons name="refresh" size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Map Placeholder */}
      <View style={styles.mapContainer}>
        <View style={styles.mapPlaceholder}>
          <Ionicons name="map" size={80} color={colors.textSecondary} />
          <Text style={styles.mapText}>Map View</Text>
          <Text style={styles.mapSubtext}>Photo location will appear here</Text>
        </View>
        
        {/* Navigation Controls */}
        <View style={styles.navControls}>
          <TouchableOpacity style={styles.navButton}>
            <Ionicons name="add" size={24} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.navButton}>
            <Ionicons name="remove" size={24} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.navButton}>
            <Ionicons name="locate" size={24} color={colors.accent} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity style={styles.primaryAction}>
          <Ionicons name="camera" size={24} color={colors.text} />
          <Text style={styles.actionText}>Scan Photo</Text>
        </TouchableOpacity>
        
        <View style={styles.secondaryActions}>
          <TouchableOpacity style={styles.secondaryAction}>
            <Ionicons name="images" size={20} color={colors.primary} />
            <Text style={styles.secondaryText}>Gallery</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryAction}>
            <Ionicons name="navigate" size={20} color={colors.primary} />
            <Text style={styles.secondaryText}>Navigate</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

// Camera Screen - Navigation Style
function CameraScreen() {
  const [photo, setPhoto] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const takePicture = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Camera access required');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 1,
      exif: true
    });

    if (!result.canceled) {
      setPhoto(result.assets[0].uri);
      analyzePhoto(result.assets[0]);
    }
  };

  const analyzePhoto = async (asset) => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setResult({
        address: "Sample Location, City, Country",
        coordinates: { lat: 40.7128, lng: -74.0060 },
        confidence: 85
      });
      setLoading(false);
    }, 2000);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      
      {/* Navigation Header */}
      <View style={styles.header}>
        <TouchableOpacity>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Photo Scanner</Text>
        <TouchableOpacity>
          <Ionicons name="settings" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {!photo ? (
          <View style={styles.scannerArea}>
            <View style={styles.scanFrame}>
              <Ionicons name="camera-outline" size={60} color={colors.primary} />
              <Text style={styles.scanText}>Position photo here</Text>
            </View>
            
            <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
              <Ionicons name="camera" size={32} color={colors.text} />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.resultArea}>
            <Image source={{ uri: photo }} style={styles.photoPreview} />
            
            {loading ? (
              <View style={styles.loadingCard}>
                <Ionicons name="location" size={32} color={colors.primary} />
                <Text style={styles.loadingText}>Analyzing location...</Text>
              </View>
            ) : result ? (
              <View style={styles.resultCard}>
                <View style={styles.resultHeader}>
                  <Ionicons name="checkmark-circle" size={24} color={colors.accent} />
                  <Text style={styles.resultTitle}>Location Found</Text>
                  <Text style={styles.confidence}>{result.confidence}%</Text>
                </View>
                
                <Text style={styles.address}>{result.address}</Text>
                <Text style={styles.coordinates}>
                  {result.coordinates.lat.toFixed(4)}, {result.coordinates.lng.toFixed(4)}
                </Text>
                
                <View style={styles.actionButtons}>
                  <TouchableOpacity style={styles.navigateButton}>
                    <Ionicons name="navigate" size={20} color={colors.text} />
                    <Text style={styles.buttonText}>Navigate</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.shareButton}>
                    <Ionicons name="share" size={20} color={colors.text} />
                    <Text style={styles.buttonText}>Share</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : null}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// Saved Locations Screen
function SavedScreen() {
  const savedLocations = [
    { id: 1, name: "Home", address: "123 Main St, City", time: "2 hours ago" },
    { id: 2, name: "Office", address: "456 Work Ave, City", time: "Yesterday" },
    { id: 3, name: "Restaurant", address: "789 Food St, City", time: "3 days ago" }
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Saved Locations</Text>
        <TouchableOpacity>
          <Ionicons name="add" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {savedLocations.map(location => (
          <TouchableOpacity key={location.id} style={styles.locationItem}>
            <View style={styles.locationIcon}>
              <Ionicons name="location" size={20} color={colors.accent} />
            </View>
            <View style={styles.locationInfo}>
              <Text style={styles.locationName}>{location.name}</Text>
              <Text style={styles.locationAddress}>{location.address}</Text>
              <Text style={styles.locationTime}>{location.time}</Text>
            </View>
            <TouchableOpacity style={styles.navigateIcon}>
              <Ionicons name="navigate" size={20} color={colors.primary} />
            </TouchableOpacity>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

// Settings Screen
function SettingsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>Navigation</Text>
          <TouchableOpacity style={styles.settingItem}>
            <Ionicons name="map" size={20} color={colors.primary} />
            <Text style={styles.settingText}>Map Style</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingItem}>
            <Ionicons name="speedometer" size={20} color={colors.primary} />
            <Text style={styles.settingText}>Units</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>Privacy</Text>
          <TouchableOpacity style={styles.settingItem}>
            <Ionicons name="location" size={20} color={colors.primary} />
            <Text style={styles.settingText}>Location Services</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingItem}>
            <Ionicons name="camera" size={20} color={colors.primary} />
            <Text style={styles.settingText}>Photo Analysis</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// Main App
export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarStyle: styles.tabBar,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textSecondary,
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;
            
            if (route.name === 'Navigate') {
              iconName = focused ? 'navigate' : 'navigate-outline';
            } else if (route.name === 'Camera') {
              iconName = focused ? 'camera' : 'camera-outline';
            } else if (route.name === 'Saved') {
              iconName = focused ? 'bookmark' : 'bookmark-outline';
            } else if (route.name === 'Settings') {
              iconName = focused ? 'settings' : 'settings-outline';
            }
            
            return <Ionicons name={iconName} size={size} color={color} />;
          },
        })}
      >
        <Tab.Screen name="Navigate" component={HomeScreen} />
        <Tab.Screen name="Camera" component={CameraScreen} />
        <Tab.Screen name="Saved" component={SavedScreen} />
        <Tab.Screen name="Settings" component={SettingsScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  
  // Navigation Header
  navHeader: {
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2E',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  locationText: {
    flex: 1,
    color: colors.text,
    fontSize: 14,
    fontFamily: 'monospace',
  },
  
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2E',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  
  // Map Container
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  mapText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
  },
  mapSubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  
  // Navigation Controls
  navControls: {
    position: 'absolute',
    right: 16,
    top: 16,
    gap: 8,
  },
  navButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  
  // Quick Actions
  quickActions: {
    padding: 16,
    gap: 12,
  },
  primaryAction: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  actionText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  secondaryActions: {
    flexDirection: 'row',
    gap: 12,
  },
  secondaryAction: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  secondaryText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.primary,
  },
  
  // Camera Screen
  content: {
    flex: 1,
  },
  scannerArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  scanFrame: {
    width: 200,
    height: 200,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  scanText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 12,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Results
  resultArea: {
    padding: 16,
  },
  photoPreview: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 16,
  },
  loadingCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    color: colors.text,
  },
  resultCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 20,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  resultTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  confidence: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.accent,
  },
  address: {
    fontSize: 16,
    color: colors.text,
    marginBottom: 8,
  },
  coordinates: {
    fontSize: 14,
    color: colors.textSecondary,
    fontFamily: 'monospace',
    marginBottom: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  navigateButton: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  shareButton: {
    flex: 1,
    backgroundColor: colors.accent,
    borderRadius: 8,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  
  // Saved Locations
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 8,
    gap: 12,
  },
  locationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationInfo: {
    flex: 1,
  },
  locationName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  locationAddress: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  locationTime: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  navigateIcon: {
    padding: 8,
  },
  
  // Settings
  settingsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginHorizontal: 16,
    marginBottom: 8,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  settingText: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
  },
  
  // Tab Bar
  tabBar: {
    backgroundColor: colors.surface,
    borderTopColor: '#2C2C2E',
    borderTopWidth: 1,
    paddingBottom: 8,
    paddingTop: 8,
    height: 88,
  },
});