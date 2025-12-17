import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  visible: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

export default function LocationPermissionDisclosure({ visible, onAccept, onDecline }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Ionicons name="location" size={48} color="#000" />
            <Text style={styles.title}>Location Permission</Text>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <Text style={styles.subtitle}>Why we need your location:</Text>
            
            <View style={styles.item}>
              <Ionicons name="camera" size={20} color="#6b7280" />
              <Text style={styles.itemText}>Extract GPS data from your photos to identify locations</Text>
            </View>

            <View style={styles.item}>
              <Ionicons name="image" size={20} color="#6b7280" />
              <Text style={styles.itemText}>Analyze building features and landmarks in images</Text>
            </View>

            <View style={styles.item}>
              <Ionicons name="map" size={20} color="#6b7280" />
              <Text style={styles.itemText}>Show your current location on maps while using the app</Text>
            </View>

            <View style={styles.notice}>
              <Text style={styles.noticeTitle}>Privacy Notice:</Text>
              <Text style={styles.noticeText}>• Location is only accessed while the app is in use</Text>
              <Text style={styles.noticeText}>• We do not track your location in the background</Text>
              <Text style={styles.noticeText}>• Location data is used solely for photo analysis</Text>
              <Text style={styles.noticeText}>• You can revoke permission anytime in Settings</Text>
            </View>
          </ScrollView>

          <View style={styles.actions}>
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
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modal: { backgroundColor: '#1a1a1a', borderRadius: 24, width: '100%', maxWidth: 400, maxHeight: '80%', borderWidth: 1, borderColor: '#333' },
  header: { alignItems: 'center', padding: 32, borderBottomWidth: 1, borderBottomColor: '#333' },
  title: { fontSize: 24, fontFamily: 'LeagueSpartan_700Bold', color: '#fff', marginTop: 16 },
  content: { padding: 24 },
  subtitle: { fontSize: 17, fontFamily: 'LeagueSpartan_700Bold', color: '#fff', marginBottom: 20 },
  item: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 20 },
  itemText: { flex: 1, fontSize: 15, fontFamily: 'LeagueSpartan_400Regular', color: '#d1d5db', lineHeight: 22 },
  notice: { backgroundColor: '#000', borderRadius: 16, padding: 20, marginTop: 12, borderWidth: 1, borderColor: '#333' },
  noticeTitle: { fontSize: 15, fontFamily: 'LeagueSpartan_700Bold', color: '#fff', marginBottom: 16 },
  noticeText: { fontSize: 14, fontFamily: 'LeagueSpartan_400Regular', color: '#9ca3af', marginBottom: 8, lineHeight: 20 },
  actions: { flexDirection: 'row', gap: 12, padding: 20, borderTopWidth: 1, borderTopColor: '#333' },
  declineButton: { flex: 1, backgroundColor: '#000', borderRadius: 12, padding: 18, alignItems: 'center', borderWidth: 1, borderColor: '#333' },
  declineText: { fontSize: 16, fontFamily: 'LeagueSpartan_600SemiBold', color: '#9ca3af' },
  acceptButton: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 18, alignItems: 'center' },
  acceptText: { fontSize: 16, fontFamily: 'LeagueSpartan_700Bold', color: '#000' },
});
