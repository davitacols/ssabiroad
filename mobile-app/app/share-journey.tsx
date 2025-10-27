import { View, Text, StyleSheet, TouchableOpacity, StatusBar, ScrollView, Share, Alert, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Clipboard from 'expo-clipboard';

export default function ShareJourneyScreen() {
  const router = useRouter();
  const [locations, setLocations] = useState<any[]>([]);
  const [message, setMessage] = useState('');
  const [stats, setStats] = useState({ locations: 0, distance: 0, countries: 0 });

  useEffect(() => {
    loadJourney();
  }, []);

  const loadJourney = async () => {
    try {
      const saved = await AsyncStorage.getItem('savedLocations');
      if (saved) {
        const locs = JSON.parse(saved);
        setLocations(locs);
        calculateStats(locs);
      }
    } catch (error) {
      console.error('Load error:', error);
    }
  };

  const calculateStats = (locs: any[]) => {
    const countries = new Set(locs.map(l => l.address?.split(',').pop()?.trim()).filter(Boolean));
    const distance = locs.length > 1 ? calculateTotalDistance(locs) : 0;
    setStats({
      locations: locs.length,
      distance: Math.round(distance),
      countries: countries.size,
    });
  };

  const calculateTotalDistance = (locs: any[]) => {
    let total = 0;
    for (let i = 0; i < locs.length - 1; i++) {
      const lat1 = locs[i].latitude;
      const lon1 = locs[i].longitude;
      const lat2 = locs[i + 1].latitude;
      const lon2 = locs[i + 1].longitude;
      total += calculateDistance(lat1, lon1, lat2, lon2);
    }
    return total;
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const generateJourneyLink = () => {
    const journeyId = Date.now().toString();
    return `https://pic2nav.com/journey/${journeyId}`;
  };

  const handleCopyLink = async () => {
    const link = generateJourneyLink();
    await Clipboard.setStringAsync(link);
    Alert.alert('Copied!', 'Journey link copied to clipboard');
  };

  const handleShare = async () => {
    const link = generateJourneyLink();
    const defaultMessage = `Check out my journey! I've visited ${stats.locations} locations across ${stats.countries} countries, covering ${stats.distance} km.`;
    const shareMessage = message || defaultMessage;

    try {
      await Share.share({
        message: `${shareMessage}\n\n${link}`,
        title: 'Share Journey',
      });
    } catch (error) {
      console.log('Share error:', error);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Share Journey</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Journey Stats */}
        <View style={styles.statsCard}>
          <View style={styles.statsHeader}>
            <Ionicons name="map" size={32} color="#6366f1" />
            <Text style={styles.statsTitle}>Your Journey</Text>
          </View>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.locations}</Text>
              <Text style={styles.statLabel}>Locations</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.distance}</Text>
              <Text style={styles.statLabel}>Kilometers</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.countries}</Text>
              <Text style={styles.statLabel}>Countries</Text>
            </View>
          </View>
        </View>

        {/* Custom Message */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>CUSTOM MESSAGE (OPTIONAL)</Text>
          <TextInput
            style={styles.messageInput}
            placeholder="Add a personal message about your journey..."
            placeholderTextColor="#9ca3af"
            value={message}
            onChangeText={setMessage}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Share Options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SHARE OPTIONS</Text>
          
          <TouchableOpacity style={styles.actionCard} onPress={handleShare}>
            <View style={styles.actionIcon}>
              <Ionicons name="share-social" size={24} color="#ffffff" />
            </View>
            <View style={styles.actionText}>
              <Text style={styles.actionTitle}>Share Journey</Text>
              <Text style={styles.actionDesc}>Share via any app</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#d1d5db" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} onPress={handleCopyLink}>
            <View style={styles.actionIcon}>
              <Ionicons name="link" size={24} color="#ffffff" />
            </View>
            <View style={styles.actionText}>
              <Text style={styles.actionTitle}>Copy Link</Text>
              <Text style={styles.actionDesc}>Copy to clipboard</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#d1d5db" />
          </TouchableOpacity>
        </View>

        {/* Quick Share */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>QUICK SHARE</Text>
          <View style={styles.platformsGrid}>
            <TouchableOpacity 
              style={styles.platformCard}
              onPress={handleShare}
            >
              <View style={[styles.platformIcon, { backgroundColor: '#25D366' }]}>
                <Ionicons name="logo-whatsapp" size={28} color="#ffffff" />
              </View>
              <Text style={styles.platformName}>WhatsApp</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.platformCard}
              onPress={handleShare}
            >
              <View style={[styles.platformIcon, { backgroundColor: '#0084FF' }]}>
                <Ionicons name="chatbubbles" size={28} color="#ffffff" />
              </View>
              <Text style={styles.platformName}>Messenger</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.platformCard}
              onPress={handleShare}
            >
              <View style={[styles.platformIcon, { backgroundColor: '#1DA1F2' }]}>
                <Ionicons name="logo-twitter" size={28} color="#ffffff" />
              </View>
              <Text style={styles.platformName}>Twitter</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.platformCard}
              onPress={handleShare}
            >
              <View style={[styles.platformIcon, { backgroundColor: '#000000' }]}>
                <Ionicons name="mail" size={28} color="#ffffff" />
              </View>
              <Text style={styles.platformName}>Email</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Locations Preview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>RECENT LOCATIONS</Text>
          {locations.slice(0, 5).map((location, index) => (
            <View key={index} style={styles.locationCard}>
              <View style={styles.locationIcon}>
                <Ionicons name="location" size={20} color="#6366f1" />
              </View>
              <View style={styles.locationInfo}>
                <Text style={styles.locationName}>{location.name || 'Location'}</Text>
                <Text style={styles.locationAddress} numberOfLines={1}>
                  {location.address || 'Address not available'}
                </Text>
              </View>
            </View>
          ))}
          {locations.length > 5 && (
            <Text style={styles.moreText}>+ {locations.length - 5} more locations</Text>
          )}
        </View>

        {/* Preview */}
        <View style={styles.previewSection}>
          <Text style={styles.sectionTitle}>PREVIEW</Text>
          <View style={styles.previewCard}>
            <Text style={styles.previewTitle}>
              {message || `Check out my journey! I've visited ${stats.locations} locations across ${stats.countries} countries, covering ${stats.distance} km.`}
            </Text>
            <Text style={styles.previewLink}>{generateJourneyLink()}</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    backgroundColor: '#000000',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    fontFamily: 'LeagueSpartan_700Bold',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  statsCard: {
    backgroundColor: '#ffffff',
    margin: 20,
    padding: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  statsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
    marginLeft: 12,
    fontFamily: 'LeagueSpartan_700Bold',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 4,
    fontFamily: 'LeagueSpartan_700Bold',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontFamily: 'LeagueSpartan_400Regular',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#e5e7eb',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6b7280',
    marginBottom: 12,
    letterSpacing: 1.5,
    fontFamily: 'LeagueSpartan_700Bold',
  },
  messageInput: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: '#000000',
    minHeight: 80,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    fontFamily: 'LeagueSpartan_400Regular',
  },
  actionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  actionText: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 2,
    fontFamily: 'LeagueSpartan_700Bold',
  },
  actionDesc: {
    fontSize: 13,
    color: '#6b7280',
    fontFamily: 'LeagueSpartan_400Regular',
  },
  platformsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  platformCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  platformIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  platformName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#000000',
    textAlign: 'center',
    fontFamily: 'LeagueSpartan_600SemiBold',
  },
  locationCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  locationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#eef2ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  locationInfo: {
    flex: 1,
  },
  locationName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 2,
    fontFamily: 'LeagueSpartan_600SemiBold',
  },
  locationAddress: {
    fontSize: 12,
    color: '#6b7280',
    fontFamily: 'LeagueSpartan_400Regular',
  },
  moreText: {
    fontSize: 13,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 8,
    fontFamily: 'LeagueSpartan_400Regular',
  },
  previewSection: {
    paddingHorizontal: 20,
    marginBottom: 40,
  },
  previewCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  previewTitle: {
    fontSize: 15,
    color: '#000000',
    marginBottom: 12,
    lineHeight: 22,
    fontFamily: 'LeagueSpartan_400Regular',
  },
  previewLink: {
    fontSize: 13,
    color: '#6366f1',
    fontFamily: 'LeagueSpartan_600SemiBold',
  },
});
