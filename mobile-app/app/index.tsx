import { View, Text, StyleSheet, TouchableOpacity, Image, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';

export default function HomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fafaf9" />
      
      {/* Gradient blobs */}
      <View style={styles.blobContainer}>
        <View style={[styles.blob, styles.blob1]} />
        <View style={[styles.blob, styles.blob2]} />
        <View style={[styles.blob, styles.blob3]} />
      </View>

      <View style={styles.content}>
        <Image source={require('../assets/logo.png')} style={styles.logo} resizeMode="contain" />
        
        <Text style={styles.heroTitle}>
          <Text style={styles.heroText}>Turn photos into{"\n"}</Text>
          <Text style={styles.heroGradient}>locations{"\n"}</Text>
          <Text style={styles.heroText}>instantly</Text>
        </Text>
        
        <Text style={styles.subtitle}>Upload any image and discover where it was taken</Text>

        <View style={styles.stats}>
          {[
            { value: "10K+", label: "Scanned" },
            { value: "95%", label: "Accuracy" },
            { value: "<3s", label: "Speed" },
            { value: "Free", label: "Forever" }
          ].map((stat, i) => (
            <View key={i} style={styles.stat}>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity style={styles.button} onPress={() => router.push('/scanner')}>
          <Text style={styles.buttonIcon}>📷</Text>
          <Text style={styles.buttonText}>Start Scanning</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.button, { backgroundColor: '#374151', marginTop: 16 }]} onPress={() => router.push('/nearby-poi')}>
          <Text style={styles.buttonIcon}>🗺️</Text>
          <Text style={styles.buttonText}>Nearby Places</Text>
        </TouchableOpacity>
        

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fafaf9' },
  blobContainer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden' },
  blob: { position: 'absolute', borderRadius: 9999, opacity: 0.15 },
  blob1: { top: -100, right: -100, width: 400, height: 400, backgroundColor: '#60a5fa' },
  blob2: { bottom: -150, left: -100, width: 350, height: 350, backgroundColor: '#a78bfa' },
  blob3: { top: '40%', left: '30%', width: 300, height: 300, backgroundColor: '#f472b6' },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  logo: { width: 140, height: 140, marginBottom: 32 },
  heroTitle: { textAlign: 'center', marginBottom: 20 },
  heroText: { fontSize: 40, fontWeight: '800', color: '#1c1917', letterSpacing: -1 },
  heroGradient: { fontSize: 40, fontWeight: '800', color: '#3b82f6', letterSpacing: -1 },
  subtitle: { fontSize: 18, color: '#78716c', textAlign: 'center', paddingHorizontal: 32, lineHeight: 28, marginBottom: 32 },
  stats: { flexDirection: 'row', gap: 20, marginBottom: 40 },
  stat: { alignItems: 'center' },
  statValue: { fontSize: 24, fontWeight: '800', color: '#1c1917', marginBottom: 4 },
  statLabel: { fontSize: 11, color: '#78716c', textTransform: 'uppercase' },
  button: { backgroundColor: '#1c1917', paddingVertical: 20, paddingHorizontal: 40, borderRadius: 9999, flexDirection: 'row', alignItems: 'center', gap: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 12, elevation: 8 },
  buttonIcon: { fontSize: 24 },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: '700' },
});
