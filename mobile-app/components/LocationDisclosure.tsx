import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface LocationDisclosureProps {
  visible: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

export default function LocationDisclosure({ visible, onAccept, onDecline }: LocationDisclosureProps) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.dialog}>
          <View style={styles.header}>
            <Ionicons name="location" size={48} color="#3b82f6" />
            <Text style={styles.title}>Location Permission</Text>
          </View>

          <ScrollView style={styles.content}>
            <Text style={styles.heading}>Why we need your location:</Text>
            
            <View style={styles.item}>
              <Ionicons name="navigate" size={20} color="#3b82f6" />
              <Text style={styles.itemText}>Identify buildings and landmarks near you</Text>
            </View>

            <View style={styles.item}>
              <Ionicons name="map" size={20} color="#3b82f6" />
              <Text style={styles.itemText}>Show nearby places (restaurants, banks, hospitals)</Text>
            </View>

            <View style={styles.item}>
              <Ionicons name="camera" size={20} color="#3b82f6" />
              <Text style={styles.itemText}>Extract GPS data from photos for location recognition</Text>
            </View>

            <View style={styles.item}>
              <Ionicons name="notifications" size={20} color="#3b82f6" />
              <Text style={styles.itemText}>Send geofence notifications when you enter/exit saved areas</Text>
            </View>

            <Text style={styles.privacy}>
              Your location data is used only for these features and is not shared with third parties. 
              You can revoke this permission anytime in your device settings.
            </Text>
          </ScrollView>

          <View style={styles.buttons}>
            <TouchableOpacity style={styles.declineButton} onPress={onDecline}>
              <Text style={styles.declineText}>Decline</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.acceptButton} onPress={onAccept}>
              <Text style={styles.acceptText}>Accept</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dialog: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  header: {
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 12,
    color: '#1f2937',
  },
  content: {
    padding: 24,
  },
  heading: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#1f2937',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  itemText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
  },
  privacy: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 16,
    lineHeight: 18,
    fontStyle: 'italic',
  },
  buttons: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    gap: 12,
  },
  declineButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    alignItems: 'center',
  },
  declineText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  acceptButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
  },
  acceptText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
