import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';

export default function ToolsScreen() {
  const router = useRouter();

  const tools = [
    {
      title: 'EXIF Editor',
      subtitle: 'Bulk edit photo metadata',
      icon: '✏️',
      route: '/tools/exif-editor',
    },
    {
      title: 'GPS Geotagging',
      subtitle: 'Add location data to photos',
      icon: '📍',
      route: '/tools/gps-tagger',
    },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Professional Tools</Text>
        <Text style={styles.subtitle}>Advanced photo processing</Text>
      </View>

      <View style={styles.grid}>
        {tools.map((tool, index) => (
          <TouchableOpacity
            key={index}
            style={styles.card}
            onPress={() => router.push(tool.route as any)}
          >
            <View style={styles.iconContainer}>
              <Text style={{ fontSize: 32 }}>{tool.icon}</Text>
            </View>
            <Text style={styles.cardTitle}>{tool.title}</Text>
            <Text style={styles.cardSubtitle}>{tool.subtitle}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { padding: 20, paddingTop: 40 },
  title: { fontSize: 32, fontWeight: 'bold', color: '#fff' },
  subtitle: { fontSize: 16, color: '#888', marginTop: 8 },
  grid: { padding: 16, gap: 16 },
  card: { backgroundColor: '#111', padding: 24, borderRadius: 16, alignItems: 'center' },
  iconContainer: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#1e293b', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  cardTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff', marginBottom: 8 },
  cardSubtitle: { fontSize: 14, color: '#888', textAlign: 'center' },
});
