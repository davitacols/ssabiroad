import { View, Text, StyleSheet, TouchableOpacity, StatusBar, Alert, Image, ImageBackground, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Sharing from 'expo-sharing';
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
        format: 'png',
        quality: 1,
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri);
      } else {
        Alert.alert('Sharing not available');
      }
    } catch (error) {
      console.log('Error sharing card:', error);
      Alert.alert('Error', 'Could not share card');
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

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Card Preview */}
        <View style={styles.cardContainer} ref={cardRef} collapsable={false}>
          {locationData?.image ? (
            <ImageBackground
              source={{ uri: locationData.image }}
              style={styles.card}
              imageStyle={styles.cardImageStyle}
            >
              <LinearGradient
                colors={['rgba(0,0,0,0.7)', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.8)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.cardOverlay}
              >
                <View style={styles.cardHeader}>
                  <Ionicons name="location" size={48} color="#ffffff" />
                </View>
                
                <View style={styles.cardBody}>
                  <Text style={styles.cardTitle}>{locationData?.name || 'Location'}</Text>
                  <Text style={styles.cardAddress}>{locationData?.address || 'Address'}</Text>
                  
                  {locationData?.rating && (
                    <View style={styles.cardRating}>
                      <Ionicons name="star" size={20} color="#fbbf24" />
                      <Text style={styles.ratingText}>{locationData.rating}</Text>
                    </View>
                  )}
                </View>

                <View style={styles.cardFooter}>
                  <Text style={styles.cardBrand}>Pic2Nav</Text>
                  <Text style={styles.cardSubtext}>Discover & Share Locations</Text>
                </View>
              </LinearGradient>
            </ImageBackground>
          ) : (
            <LinearGradient
              colors={['#6366f1', '#8b5cf6', '#d946ef']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.card}
            >
              <View style={styles.cardHeader}>
                <Ionicons name="location" size={48} color="#ffffff" />
              </View>
              
              <View style={styles.cardBody}>
                <Text style={styles.cardTitle}>{locationData?.name || 'Location'}</Text>
                <Text style={styles.cardAddress}>{locationData?.address || 'Address'}</Text>
                
                {locationData?.rating && (
                  <View style={styles.cardRating}>
                    <Ionicons name="star" size={20} color="#fbbf24" />
                    <Text style={styles.ratingText}>{locationData.rating}</Text>
                  </View>
                )}
              </View>

              <View style={styles.cardFooter}>
                <Text style={styles.cardBrand}>Pic2Nav</Text>
                <Text style={styles.cardSubtext}>Discover & Share Locations</Text>
              </View>
            </LinearGradient>
          )}
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
    fontWeight: '700',
    color: '#ffffff',
    fontFamily: 'LeagueSpartan_700Bold',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  cardContainer: {
    marginBottom: 32,
  },
  card: {
    borderRadius: 24,
    minHeight: 400,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  cardImageStyle: {
    borderRadius: 24,
  },
  cardOverlay: {
    flex: 1,
    padding: 32,
    justifyContent: 'space-between',
  },
  cardHeader: {
    alignItems: 'center',
  },
  cardBody: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  cardTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 12,
    fontFamily: 'LeagueSpartan_700Bold',
  },
  cardAddress: {
    fontSize: 16,
    color: '#ffffff',
    textAlign: 'center',
    opacity: 0.9,
    marginBottom: 16,
  },
  cardRating: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  ratingText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    marginLeft: 8,
  },
  cardFooter: {
    alignItems: 'center',
  },
  cardBrand: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
    fontFamily: 'LeagueSpartan_700Bold',
  },
  cardSubtext: {
    fontSize: 14,
    color: '#ffffff',
    opacity: 0.8,
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
    fontWeight: '700',
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
