import { View, Text, StyleSheet, TouchableOpacity, StatusBar, ScrollView, Share, Alert, TextInput } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import * as Clipboard from 'expo-clipboard';

export default function ShareLocationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [message, setMessage] = useState('');
  
  const locationData = params.location ? JSON.parse(params.location as string) : null;

  const generateShareLink = () => {
    const baseUrl = 'https://pic2nav.com/location';
    const lat = locationData?.latitude || locationData?.lat;
    const lng = locationData?.longitude || locationData?.lng;
    return `${baseUrl}?lat=${lat}&lng=${lng}&name=${encodeURIComponent(locationData?.name || 'Location')}`;
  };

  const handleCopyLink = async () => {
    await Clipboard.setStringAsync(generateShareLink());
    Alert.alert('Copied!', 'Link copied to clipboard');
  };

  const handleShareVia = async (platform: string) => {
    const link = generateShareLink();
    const text = message || `Check out this location: ${locationData?.name || 'Amazing place'}`;
    
    try {
      await Share.share({
        message: `${text}\n\n${link}`,
        title: 'Share Location',
      });
    } catch (error) {
      console.log('Error sharing:', error);
    }
  };

  const handleCreateCard = () => {
    router.push({
      pathname: '/location-card',
      params: { location: JSON.stringify(locationData) }
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Share Location</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Location Info */}
        <View style={styles.locationCard}>
          <View style={styles.locationIcon}>
            <Ionicons name="location" size={32} color="#6366f1" />
          </View>
          <View style={styles.locationInfo}>
            <Text style={styles.locationName}>{locationData?.name || 'Location'}</Text>
            <Text style={styles.locationAddress}>{locationData?.address || 'Address not available'}</Text>
          </View>
        </View>

        {/* Custom Message */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ADD MESSAGE (OPTIONAL)</Text>
          <TextInput
            style={styles.messageInput}
            placeholder="Add a personal message..."
            placeholderTextColor="#9ca3af"
            value={message}
            onChangeText={setMessage}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Quick Share */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>QUICK SHARE</Text>
          
          <TouchableOpacity style={styles.shareOption} onPress={() => handleShareVia('general')}>
            <View style={styles.shareIcon}>
              <Ionicons name="share-social" size={24} color="#000000" />
            </View>
            <View style={styles.shareText}>
              <Text style={styles.shareTitle}>Share via...</Text>
              <Text style={styles.shareDesc}>Choose app to share</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#d1d5db" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.shareOption} onPress={handleCopyLink}>
            <View style={styles.shareIcon}>
              <Ionicons name="link" size={24} color="#000000" />
            </View>
            <View style={styles.shareText}>
              <Text style={styles.shareTitle}>Copy Link</Text>
              <Text style={styles.shareDesc}>Copy to clipboard</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#d1d5db" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.shareOption} onPress={handleCreateCard}>
            <View style={styles.shareIcon}>
              <Ionicons name="image" size={24} color="#000000" />
            </View>
            <View style={styles.shareText}>
              <Text style={styles.shareTitle}>Create Card</Text>
              <Text style={styles.shareDesc}>Beautiful shareable image</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#d1d5db" />
          </TouchableOpacity>
        </View>

        {/* Social Platforms */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SHARE TO</Text>
          
          <View style={styles.platformsGrid}>
            <TouchableOpacity style={styles.platformCard} onPress={() => handleShareVia('whatsapp')}>
              <View style={[styles.platformIcon, { backgroundColor: '#25D366' }]}>
                <Ionicons name="logo-whatsapp" size={28} color="#ffffff" />
              </View>
              <Text style={styles.platformName}>WhatsApp</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.platformCard} onPress={() => handleShareVia('messenger')}>
              <View style={[styles.platformIcon, { backgroundColor: '#0084FF' }]}>
                <Ionicons name="chatbubbles" size={28} color="#ffffff" />
              </View>
              <Text style={styles.platformName}>Messenger</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.platformCard} onPress={() => handleShareVia('twitter')}>
              <View style={[styles.platformIcon, { backgroundColor: '#1DA1F2' }]}>
                <Ionicons name="logo-twitter" size={28} color="#ffffff" />
              </View>
              <Text style={styles.platformName}>Twitter</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.platformCard} onPress={() => handleShareVia('instagram')}>
              <View style={[styles.platformIcon, { backgroundColor: '#E4405F' }]}>
                <Ionicons name="logo-instagram" size={28} color="#ffffff" />
              </View>
              <Text style={styles.platformName}>Instagram</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Collaborative Collections */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>COLLABORATIVE</Text>
          
          <TouchableOpacity style={styles.shareOption} onPress={() => router.push('/invite-collaborators')}>
            <View style={styles.shareIcon}>
              <Ionicons name="people" size={24} color="#000000" />
            </View>
            <View style={styles.shareText}>
              <Text style={styles.shareTitle}>Invite to Collection</Text>
              <Text style={styles.shareDesc}>Let friends add locations</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#d1d5db" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.shareOption} onPress={() => router.push('/share-journey')}>
            <View style={styles.shareIcon}>
              <Ionicons name="map" size={24} color="#000000" />
            </View>
            <View style={styles.shareText}>
              <Text style={styles.shareTitle}>Share Journey</Text>
              <Text style={styles.shareDesc}>Share your entire journey</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#d1d5db" />
          </TouchableOpacity>
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
  locationCard: {
    backgroundColor: '#ffffff',
    margin: 20,
    padding: 20,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  locationIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#eef2ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  locationInfo: {
    flex: 1,
  },
  locationName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 4,
    fontFamily: 'LeagueSpartan_700Bold',
  },
  locationAddress: {
    fontSize: 13,
    color: '#6b7280',
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  shareOption: {
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
  shareIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  shareText: {
    flex: 1,
  },
  shareTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 2,
    fontFamily: 'LeagueSpartan_700Bold',
  },
  shareDesc: {
    fontSize: 13,
    color: '#6b7280',
  },
  platformsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  platformCard: {
    flex: 1,
    minWidth: '22%',
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
  },
});
