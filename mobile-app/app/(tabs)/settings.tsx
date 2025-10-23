import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';

export default function SettingsScreen() {
  const settings = [
    { title: 'Account', subtitle: 'Manage your account' },
    { title: 'Notifications', subtitle: 'Configure notifications' },
    { title: 'Privacy', subtitle: 'Privacy settings' },
    { title: 'About', subtitle: 'App information' },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        {settings.map((item, index) => (
          <TouchableOpacity key={index} style={styles.item}>
            <View style={styles.itemContent}>
              <Text style={styles.itemTitle}>{item.title}</Text>
              <Text style={styles.itemSubtitle}>{item.subtitle}</Text>
            </View>
            <Text style={{ color: '#888', fontSize: 20 }}>›</Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text style={styles.version}>Version 1.0.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  section: { padding: 16 },
  item: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111', padding: 16, borderRadius: 12, marginBottom: 12 },
  itemContent: { flex: 1 },
  itemTitle: { fontSize: 16, fontWeight: '600', color: '#fff' },
  itemSubtitle: { fontSize: 12, color: '#888', marginTop: 4 },
  version: { textAlign: 'center', color: '#666', padding: 20 },
});
