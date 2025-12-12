import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function PermissionRationale() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="shield-checkmark" size={48} color="#10b981" />
        <Text style={styles.title}>Why We Need Permissions</Text>
        <Text style={styles.subtitle}>Pic2Nav is transparent about data usage</Text>
      </View>

      <View style={styles.section}>
        <View style={styles.permissionCard}>
          <Ionicons name="images" size={32} color="#3b82f6" />
          <Text style={styles.permissionTitle}>📸 Photo Access</Text>
          <Text style={styles.permissionRequired}>REQUIRED - Core Functionality</Text>
          <Text style={styles.permissionDesc}>
            We need photo access to:
            {'\n'}• Extract GPS coordinates from EXIF metadata
            {'\n'}• Analyze building features using AI
            {'\n'}• Identify locations from images
            {'\n\n'}Photos are processed temporarily and NOT stored on our servers.
          </Text>
        </View>

        <View style={styles.permissionCard}>
          <Ionicons name="location" size={32} color="#ef4444" />
          <Text style={styles.permissionTitle}>📍 Location Access</Text>
          <Text style={styles.permissionRequired}>REQUIRED - Core Functionality</Text>
          <Text style={styles.permissionDesc}>
            We need location access to:
            {'\n'}• Match photo locations with real coordinates
            {'\n'}• Show nearby places and points of interest
            {'\n'}• Provide accurate location details
            {'\n\n'}Your location is only used for app features, never sold or shared.
          </Text>
        </View>

        <View style={styles.permissionCard}>
          <Ionicons name="notifications" size={32} color="#f59e0b" />
          <Text style={styles.permissionTitle}>🔔 Background Location</Text>
          <Text style={styles.permissionOptional}>OPTIONAL - Enhanced Feature</Text>
          <Text style={styles.permissionDesc}>
            Background location is ONLY used for:
            {'\n'}• Geofence alerts (notify when near saved locations)
            {'\n'}• Journey tracking (optional feature)
            {'\n\n'}You must explicitly enable this feature. A notification shows when active. Disable anytime in settings.
          </Text>
        </View>

        <View style={styles.permissionCard}>
          <Ionicons name="camera" size={32} color="#8b5cf6" />
          <Text style={styles.permissionTitle}>📷 Camera Access</Text>
          <Text style={styles.permissionRequired}>REQUIRED - Core Functionality</Text>
          <Text style={styles.permissionDesc}>
            We need camera access to:
            {'\n'}• Capture photos for location analysis
            {'\n'}• Enable real-time building recognition
            {'\n\n'}Camera is only used when you tap the capture button.
          </Text>
        </View>
      </View>

      <View style={styles.privacySection}>
        <Text style={styles.privacyTitle}>🔒 Your Privacy Matters</Text>
        <Text style={styles.privacyText}>
          • Photos processed temporarily, not stored permanently
          {'\n'}• Location data stays on your device
          {'\n'}• No data sold to third parties
          {'\n'}• No advertising or tracking
          {'\n'}• You control all permissions
          {'\n'}• Delete your data anytime
        </Text>
      </View>

      <View style={styles.linksSection}>
        <TouchableOpacity 
          style={styles.link}
          onPress={() => Linking.openURL('https://pic2nav.com/privacy')}
        >
          <Text style={styles.linkText}>Read Full Privacy Policy</Text>
          <Ionicons name="open-outline" size={16} color="#3b82f6" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.link}
          onPress={() => Linking.openURL('https://pic2nav.com/terms')}
        >
          <Text style={styles.linkText}>Read Terms of Service</Text>
          <Ionicons name="open-outline" size={16} color="#3b82f6" />
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Questions? Contact us at support@pic2nav.com
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#f9fafb',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
    color: '#111827',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
  },
  section: {
    padding: 16,
  },
  permissionCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  permissionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 4,
    color: '#111827',
  },
  permissionRequired: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ef4444',
    marginBottom: 8,
  },
  permissionOptional: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10b981',
    marginBottom: 8,
  },
  permissionDesc: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
  },
  privacySection: {
    backgroundColor: '#ecfdf5',
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#10b981',
  },
  privacyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#065f46',
  },
  privacyText: {
    fontSize: 14,
    color: '#047857',
    lineHeight: 22,
  },
  linksSection: {
    padding: 16,
  },
  link: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#eff6ff',
    borderRadius: 8,
    marginBottom: 12,
  },
  linkText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#3b82f6',
  },
  footer: {
    padding: 24,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
});
