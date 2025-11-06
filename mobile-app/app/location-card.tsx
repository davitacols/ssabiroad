import { View, Text, StyleSheet, TouchableOpacity, StatusBar, Alert, Image, ImageBackground, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Sharing from 'expo-sharing';
import { Share } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import { useRef } from 'react';

export default function LocationCardScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const cardRef = useRef(null);
  
  const locationData = params.location ? JSON.parse(params.location as string) : null;

  const handleShare = async () => {
    try {
      const uri = await captureRef(cardRef, {
        format: 'jpg',
        quality: 0.8,
      });

      const locationId = Date.now().toString();
      const shareUrl = `https://pic2nav.com/location/${locationId}`;
      const message = `📍 ${locationData?.name || 'Location'}\n${locationData?.address || ''}\n\n${shareUrl}`;
      
      await Share.share({
        message: message,
        url: uri,
        title: locationData?.name || 'Location',
      });
    } catch (error) {
      console.log('Error sharing:', error);
      Alert.alert('Error', 'Could not share location');
    }
  };

  const handleDownload = async () => {
    try {
      const uri = await captureRef(cardRef, {
        format: 'png',
        quality: 1,
      });
      Alert.alert('Success', 'Card captured! Check your share options.');
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri);
      }
    } catch (error) {
      console.log('Error saving card:', error);
      Alert.alert('Error', 'Could not save card');
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
        <Text style={styles.headerTitle}>Location Card</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        {/* Card Preview */}
        <View style={styles.cardContainer} ref={cardRef} collapsable={false}>
          <View style={styles.card}>
            <LinearGradient
              colors={['#000000', '#1a1a1a']}
              style={styles.cardGradient}
            >
              {/* Top Section */}
              <View style={styles.cardTop}>
                <View style={styles.logoContainer}>
                  <Text style={styles.logoText}>Pic2Nav</Text>
                </View>
                <View style={styles.qrPlaceholder}>
                  <Ionicons name="qr-code" size={32} color="#ffffff" opacity={0.3} />
                </View>
              </View>

              {/* Main Content */}
              <View style={styles.cardMain}>
                <View style={styles.locationIconLarge}>
                  <Ionicons name="location-sharp" size={40} color="#ffffff" />
                </View>
                <Text style={styles.cardTitle}>{locationData?.name || 'Location'}</Text>
                <Text style={styles.cardAddress}>{locationData?.address || 'Address'}</Text>
                
                {locationData?.location && (
                  <View style={styles.coordsContainer}>
                    <Text style={styles.coordsText}>
                      {locationData.location.latitude.toFixed(6)}°N, {locationData.location.longitude.toFixed(6)}°E
                    </Text>
                  </View>
                )}
              </View>

              {/* Bottom Section */}
              <View style={styles.cardBottom}>
                <View style={styles.divider} />
                <View style={styles.metaRow}>
                  <View style={styles.metaItem}>
                    <Ionicons name="calendar-outline" size={14} color="#9ca3af" />
                    <Text style={styles.metaText}>{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</Text>
                  </View>
                  {locationData?.rating && (
                    <View style={styles.metaItem}>
                      <Ionicons name="star" size={14} color="#fbbf24" />
                      <Text style={styles.metaText}>{locationData.rating}/5</Text>
                    </View>
                  )}
                </View>
                <View style={styles.linkContainer}>
                  <Ionicons name="link" size={12} color="#6b7280" />
                  <Text style={styles.linkText}>pic2nav.com</Text>
                </View>
              </View>
            </LinearGradient>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
            <View style={styles.actionIcon}>
              <Ionicons name="share-social" size={24} color="#ffffff" />
            </View>
            <Text style={styles.actionText}>Share Card</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionButton, styles.secondaryButton]} onPress={handleDownload}>
            <View style={[styles.actionIcon, styles.secondaryIcon]}>
              <Ionicons name="download" size={24} color="#000000" />
            </View>
            <Text style={[styles.actionText, styles.secondaryText]}>Save to Device</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.hint}>
          This card can be shared on social media or sent to friends
        </Text>
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
    fontFamily: 'LeagueSpartan_700Bold',
    color: '#ffffff',
    fontFamily: 'LeagueSpartan_700Bold',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 100,
  },
  cardContainer: {
    marginBottom: 32,
  },
  card: {
    borderRadius: 32,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.4,
    shadowRadius: 30,
    elevation: 12,
  },
  cardGradient: {
    padding: 32,
    minHeight: 450,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 60,
  },
  logoContainer: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  logoText: {
    fontSize: 20,
    fontFamily: 'LeagueSpartan_700Bold',
    color: '#ffffff',
    letterSpacing: 1,
  },
  qrPlaceholder: {
    width: 60,
    height: 60,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardMain: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  locationIconLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  cardTitle: {
    fontSize: 28,
    fontFamily: 'LeagueSpartan_700Bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  cardAddress: {
    fontSize: 15,
    fontFamily: 'LeagueSpartan_400Regular',
    color: '#d1d5db',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  coordsContainer: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  coordsText: {
    fontSize: 12,
    fontFamily: 'LeagueSpartan_600SemiBold',
    color: '#9ca3af',
    letterSpacing: 0.5,
  },
  cardBottom: {
    marginTop: 40,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginBottom: 20,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 12,
    fontFamily: 'LeagueSpartan_600SemiBold',
    color: '#9ca3af',
  },
  linkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 16,
  },
  linkText: {
    fontSize: 11,
    fontFamily: 'LeagueSpartan_600SemiBold',
    color: '#6b7280',
    letterSpacing: 0.5,
  },
  actions: {
    gap: 12,
    marginBottom: 16,
  },
  actionButton: {
    backgroundColor: '#000000',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButton: {
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  secondaryIcon: {
    backgroundColor: '#f3f4f6',
  },
  actionText: {
    fontSize: 16,
    fontFamily: 'LeagueSpartan_700Bold',
    color: '#ffffff',
    fontFamily: 'LeagueSpartan_700Bold',
  },
  secondaryText: {
    color: '#000000',
  },
  hint: {
    fontSize: 13,
    color: '#6b7280',
    textAlign: 'center',
  },
});
