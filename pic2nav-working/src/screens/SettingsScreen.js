import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SettingsScreen({ navigation }) {
  const [notifications, setNotifications] = useState(true);
  const [locationServices, setLocationServices] = useState(true);
  const [autoAnalysis, setAutoAnalysis] = useState(false);
  const [highQuality, setHighQuality] = useState(true);

  const settingSections = [
    {
      title: 'Analysis Settings',
      items: [
        {
          title: 'High Quality Analysis',
          subtitle: 'Use maximum quality for better results',
          value: highQuality,
          onValueChange: setHighQuality,
          type: 'switch',
        },
        {
          title: 'Auto Analysis',
          subtitle: 'Automatically analyze photos after capture',
          value: autoAnalysis,
          onValueChange: setAutoAnalysis,
          type: 'switch',
        },
      ],
    },
    {
      title: 'Privacy & Location',
      items: [
        {
          title: 'Location Services',
          subtitle: 'Allow app to access your location',
          value: locationServices,
          onValueChange: setLocationServices,
          type: 'switch',
        },
        {
          title: 'Notifications',
          subtitle: 'Receive analysis completion alerts',
          value: notifications,
          onValueChange: setNotifications,
          type: 'switch',
        },
      ],
    },
    {
      title: 'Data Management',
      items: [
        {
          title: 'Cache Size',
          subtitle: 'Manage app cache and temporary files',
          type: 'action',
          action: () => console.log('Manage cache'),
        },
        {
          title: 'Export Data',
          subtitle: 'Export your analysis history',
          type: 'action',
          action: () => console.log('Export data'),
        },
      ],
    },
    {
      title: 'API Configuration',
      items: [
        {
          title: 'API Endpoint',
          subtitle: 'ssabiroad.vercel.app/api/location-recognition-v2',
          type: 'info',
        },
        {
          title: 'Connection Status',
          subtitle: 'Connected',
          type: 'info',
        },
      ],
    },
  ];

  const renderSettingItem = (item, index) => {
    return (
      <View key={index} style={styles.settingItem}>
        <View style={styles.settingContent}>
          <Text style={styles.settingTitle}>{item.title}</Text>
          <Text style={styles.settingSubtitle}>{item.subtitle}</Text>
        </View>
        {item.type === 'switch' && (
          <Switch
            value={item.value}
            onValueChange={item.onValueChange}
            trackColor={{ false: '#767577', true: '#007AFF' }}
            thumbColor={item.value ? '#ffffff' : '#f4f3f4'}
          />
        )}
        {item.type === 'action' && (
          <TouchableOpacity onPress={item.action}>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>
        )}
        {item.type === 'info' && (
          <Ionicons name="information-circle-outline" size={20} color="#007AFF" />
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {settingSections.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.sectionContent}>
              {section.items.map((item, itemIndex) => renderSettingItem(item, itemIndex))}
            </View>
          </View>
        ))}

        <View style={styles.aboutSection}>
          <Text style={styles.aboutTitle}>About SSABIRoad</Text>
          <Text style={styles.aboutText}>
            SSABIRoad combines computer vision, geospatial data, and artificial intelligence 
            to provide comprehensive architectural and location analysis capabilities.
          </Text>
          <Text style={styles.versionText}>Version 1.0.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    flex: 1,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
    marginHorizontal: 20,
  },
  sectionContent: {
    backgroundColor: 'white',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  aboutSection: {
    backgroundColor: 'white',
    padding: 20,
    marginBottom: 20,
  },
  aboutTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  aboutText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 15,
  },
  versionText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
});