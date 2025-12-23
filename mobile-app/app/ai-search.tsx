import { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, SafeAreaView, StatusBar, ActivityIndicator, Linking, KeyboardAvoidingView, Platform, Animated, Keyboard, Image, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Markdown from 'react-native-markdown-display';
import { getApiUrl, API_CONFIG } from '../config/api';
import { useTheme, getColors } from '../contexts/ThemeContext';
import MenuBar from '../components/MenuBar';

interface Message {
  id: string;
  type: 'user' | 'ai';
  text: string;
  places?: any[];
  timestamp: Date;
  imageUri?: string;
  locationData?: any;
}

export default function AISearchScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const colors = getColors(theme);
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [userLocation, setUserLocation] = useState<any>(null);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [lastImageData, setLastImageData] = useState<{uri: string, location: any} | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<any>(null);
  const [placeDetails, setPlaceDetails] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const menuTranslateY = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
    getUserLocation();
    loadMessages();

    const keyboardShowListener = Keyboard.addListener('keyboardDidShow', () => {
      setIsKeyboardVisible(true);
    });
    
    const keyboardHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setIsKeyboardVisible(false);
    });

    return () => {
      keyboardShowListener.remove();
      keyboardHideListener.remove();
    };
  }, []);

  const getUserLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({});
        setUserLocation(location.coords);
      }
    } catch (error) {
      console.log('Location error:', error);
    }
  };

  const loadMessages = async () => {
    try {
      const stored = await AsyncStorage.getItem('aiChatMessages');
      if (stored) setMessages(JSON.parse(stored));
    } catch (err) {
      console.log('Load error:', err);
    }
  };

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
    if (messages.length > 0) {
      AsyncStorage.setItem('aiChatMessages', JSON.stringify(messages)).catch(e => console.log('Save error:', e));
    }
  }, [messages]);

  const pickImage = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'image/*',
      copyToCacheDirectory: true,
    });
    if (!result.canceled && result.assets?.[0]) {
      setUploadedImage(result.assets[0].uri);
    }
  };

  const handleSend = async () => {
    if (!query.trim() && !uploadedImage) return;

    // Check if user is correcting previous location
    const correctionMatch = query.match(/^(?:correct|actually|it'?s|this is|the address is)\s+(.+)/i);
    if (correctionMatch && lastImageData) {
      const correctedAddress = correctionMatch[1].trim();
      
      const userMessage: Message = {
        id: Date.now().toString(),
        type: 'user',
        text: query.trim(),
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, userMessage]);
      setQuery('');
      setLoading(true);

      try {
        // Geocode corrected address FIRST
        const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(correctedAddress)}&key=AIzaSyBXLKbWmpZpE9wm7hEZ6PVEYR6y9ewR5ho`;
        const geocodeRes = await fetch(geocodeUrl);
        const geocodeData = await geocodeRes.json();
        
        if (!geocodeData.results?.[0]) {
          throw new Error('Could not geocode address');
        }
        
        const location = geocodeData.results[0].geometry.location;
        
        // Retrain model with corrected data
        const trainFormData = new FormData();
        trainFormData.append('file', { uri: lastImageData.uri, type: 'image/jpeg', name: 'photo.jpg' } as any);
        trainFormData.append('label', correctedAddress);
        trainFormData.append('latitude', location.lat.toString());
        trainFormData.append('longitude', location.lng.toString());
        
        console.log('Training with:', { label: correctedAddress, lat: location.lat, lng: location.lng });
        const trainResponse = await fetch('http://34.224.33.158:8000/train', { 
          method: 'POST', 
          body: trainFormData,
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        const trainResult = await trainResponse.text();
        console.log('Training response status:', trainResponse.status);
        console.log('Training response:', trainResult);
        
        // Show response with GEOCODED coordinates
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: 'ai',
          text: `Thanks for the correction! I've updated the model with:\n\n${correctedAddress}\nLat: ${location.lat}\nLng: ${location.lng}`,
          locationData: { location: { latitude: location.lat, longitude: location.lng }, address: correctedAddress },
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, aiMessage]);
        setLastImageData({ uri: lastImageData.uri, location: { latitude: location.lat, longitude: location.lng } });
      } catch (err: any) {
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: 'ai',
          text: 'Sorry, I couldn\'t process that correction. Please try again.',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, errorMessage]);
      } finally {
        setLoading(false);
      }
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      text: uploadedImage ? (query.trim() || 'Analyze this image') : query.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    const currentQuery = query.trim();
    const currentImage = uploadedImage;
    setQuery('');
    setUploadedImage(null);
    setLoading(true);

    try {
      if (currentImage) {
        const formData = new FormData();
        formData.append('image', { uri: currentImage, type: 'image/jpeg', name: 'photo.jpg' } as any);
        const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.LOCATION_RECOGNITION), { method: 'POST', body: formData });
        const data = await response.json();
        console.log('Image analysis response:', data);
        
        // Don't train automatically - wait for user confirmation or correction
        
        let responseText = '';
        if (data.address) {
          responseText += `${data.address}\n`;
        }
        if (data.confidence) {
          responseText += `Confidence: ${(data.confidence * 100).toFixed(1)}%\n`;
        }
        if (data.location) {
          responseText += `\nCoordinates\nLat: ${data.location.latitude}\nLng: ${data.location.longitude}\n`;
        }
        if (data.weather) {
          responseText += `\nWeather\nTemp: ${data.weather.temperature}°C\nHumidity: ${data.weather.humidity}%\nWind: ${data.weather.windSpeed} km/h\n`;
        }
        if (data.elevation) {
          responseText += `\nElevation: ${data.elevation.elevation}m\n`;
        }
        if (data.nearbyPlaces && data.nearbyPlaces.length > 0) {
          responseText += `\nNearby Places\n`;
          data.nearbyPlaces.slice(0, 3).forEach((place: any) => {
            responseText += `• ${place.name} (${place.distance}m)\n`;
          });
        }
        
        const aiMessage: Message = { 
          id: (Date.now() + 1).toString(), 
          type: 'ai', 
          text: responseText || 'Image analyzed successfully',
          imageUri: currentImage,
          locationData: data,
          timestamp: new Date() 
        };
        setMessages(prev => [...prev, aiMessage]);
        setLastImageData({ uri: currentImage, location: data.location });
      } else {
      const url = getApiUrl(API_CONFIG.ENDPOINTS.AI_CHAT);
      console.log('Calling AI API:', url);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query: currentQuery,
          conversationHistory: messages.slice(-8).filter(m => m.text && m.text.trim()).map(m => ({ type: m.type, text: m.text })),
          userLocation: userLocation ? { latitude: userLocation.latitude, longitude: userLocation.longitude } : null
        }),
      });

      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);

      let responseText = data.success ? data.response : `Sorry, ${data.error || 'something went wrong.'}`;
      
      // Decode all HTML entities
      const decodeHTML = (text: string) => {
        if (!text || typeof text !== 'string') return '';
        return text
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/\\&quot;/g, '"')
          .replace(/\\n/g, '\n')
          .replace(/\\"/g, '"');
      };
      
      responseText = decodeHTML(responseText || '');
      
      // Extract response from nested JSON if present
      const jsonPattern = /\{[\s\S]*?"needsPlaceSearch"[\s\S]*?"response"\s*:\s*"([\s\S]*?)"[\s\S]*?\}/;
      const match = responseText.match(jsonPattern);
      if (match && match[1]) {
        responseText = match[1].replace(/\\n/g, '\n').replace(/\\"/g, '"');
      }
      
      // Remove any remaining JSON wrapper
      responseText = responseText
        .replace(/^\{[\s\S]*"response"\s*:\s*"/, '')
        .replace(/"[\s\S]*\}$/, '')
        .replace(/\\n/g, '\n')
        .replace(/\\"/g, '"')
        .trim();

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        text: responseText,
        places: data.places,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiMessage]);
      }
    } catch (err: any) {
      console.error('AI Chat error:', err);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        text: `Error: ${err.message || 'Connection failed'}. Please try again.`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const fetchPlaceDetails = async (place: any) => {
    setSelectedPlace(place);
    setLoadingDetails(true);
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${place.location.lat},${place.location.lng}&radius=50&keyword=${encodeURIComponent(place.name)}&key=AIzaSyBXLKbWmpZpE9wm7hEZ6PVEYR6y9ewR5ho`
      );
      const data = await response.json();
      if (data.results?.[0]) {
        const placeId = data.results[0].place_id;
        const detailsResponse = await fetch(
          `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_address,formatted_phone_number,opening_hours,rating,website&key=AIzaSyBXLKbWmpZpE9wm7hEZ6PVEYR6y9ewR5ho`
        );
        const detailsData = await detailsResponse.json();
        setPlaceDetails(detailsData.result);
      }
    } catch (error) {
      console.error('Error fetching place details:', error);
    } finally {
      setLoadingDetails(false);
    }
  };

  const suggestedQueries = [
    { icon: 'restaurant', text: 'Best restaurants nearby', query: 'What are the best restaurants near me?' },
    { icon: 'cafe', text: 'Coffee shops', query: 'Find me a good coffee shop' },
    { icon: 'fitness', text: 'Gyms nearby', query: 'Where can I find gyms near me?' },
    { icon: 'business', text: 'Compare places', query: 'Compare restaurants in my area' },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
      
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>NaviSense by Pic2Nav</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>Smart location intelligence</Text>
        </View>
      </View>

      <KeyboardAvoidingView 
        style={[styles.chatContainer, { backgroundColor: colors.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView 
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        >
          {messages.length === 0 && (
            <Animated.View style={[styles.emptyState, { opacity: fadeAnim }]}>
              <View style={styles.logoContainer}>
                <View style={[styles.logoGradient, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Ionicons name="sparkles" size={36} color={colors.text} />
                </View>
              </View>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>Ask me anything</Text>
              <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>Find places, analyze images, or get location insights with AI-powered intelligence</Text>
              
              <View style={styles.suggestionsGrid}>
                {suggestedQueries.map((item, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={[styles.suggestionCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                    onPress={() => {
                      setQuery(item.query);
                      setTimeout(() => handleSend(), 100);
                    }}
                  >
                    <View style={[styles.suggestionIcon, { backgroundColor: colors.background, borderColor: colors.border }]}>
                      <Ionicons name={item.icon as any} size={24} color={colors.text} />
                    </View>
                    <Text style={[styles.suggestionText, { color: colors.text }]}>{item.text}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </Animated.View>
          )}

          {messages.map((message) => (
            <View key={message.id}>
              <View style={[
                styles.messageBubble,
                message.type === 'user' ? styles.userBubble : styles.aiBubble
              ]}>
                {message.type === 'ai' && (
                  <View style={[styles.aiAvatar, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Ionicons name="sparkles" size={12} color={colors.text} />
                  </View>
                )}
                <View style={[
                  styles.messageContent,
                  message.type === 'user' && styles.userMessageContent
                ]}>
                  {message.type === 'user' ? (
                    <View style={[styles.userMessageGradient, { backgroundColor: theme === 'dark' ? '#fff' : '#000' }]}>
                      <Text style={[styles.userText, { color: theme === 'dark' ? '#000' : '#fff' }]}>{message.text}</Text>
                    </View>
                  ) : (
                    <View style={[styles.aiMessageBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
                      <Markdown
                        style={{
                          body: { color: colors.text, fontSize: 15, lineHeight: 24, fontFamily: 'LeagueSpartan_400Regular' },
                          strong: { fontFamily: 'LeagueSpartan_700Bold', color: colors.text },
                          em: { fontStyle: 'italic', color: colors.text },
                          link: { color: '#3b82f6', textDecorationLine: 'underline' },
                          bullet_list: { color: colors.text },
                          ordered_list: { color: colors.text },
                          list_item: { color: colors.text, marginBottom: 4 },
                          code_inline: { backgroundColor: colors.background, color: colors.text, paddingHorizontal: 4, borderRadius: 4, fontFamily: 'monospace' },
                          code_block: { backgroundColor: colors.background, color: colors.text, padding: 12, borderRadius: 8, fontFamily: 'monospace' },
                        }}
                      >
                        {message.text}
                      </Markdown>
                      {message.imageUri && (
                        <Text style={[styles.correctionHint, { color: colors.textSecondary }]}>Not correct? Reply with: "Actually it's [correct address]"</Text>
                      )}
                      {message.locationData?.location && (
                        <TouchableOpacity 
                          style={[styles.viewMapButton, { backgroundColor: colors.background, borderColor: colors.border }]}
                          onPress={() => {
                            const { latitude, longitude } = message.locationData.location;
                            Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`);
                          }}
                        >
                          <Ionicons name="map" size={16} color={colors.text} />
                          <Text style={[styles.viewMapText, { color: colors.text }]}>View in Maps</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                </View>
              </View>

              {message.places && message.places.length > 0 && (
                <View style={styles.placesContainer}>
                  {message.places.map((place, idx) => (
                    <TouchableOpacity
                      key={idx}
                      style={[styles.placeCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                      activeOpacity={0.7}
                      onPress={() => fetchPlaceDetails(place)}
                    >
                      <View style={[styles.placeIconContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
                        <Ionicons name="location-sharp" size={20} color={colors.text} />
                      </View>
                      
                      <View style={styles.placeInfo}>
                        <Text style={[styles.placeName, { color: colors.text }]} numberOfLines={1}>{place.name}</Text>
                        {place.address && (
                          <Text style={[styles.placeAddress, { color: colors.textSecondary }]} numberOfLines={2}>{place.address}</Text>
                        )}
                        
                        <View style={styles.placeMetaRow}>
                          {place.rating && (
                            <View style={styles.ratingBadge}>
                              <Ionicons name="star" size={12} color="#fbbf24" />
                              <Text style={styles.ratingText}>{place.rating}</Text>
                            </View>
                          )}
                          {place.open_now !== undefined && (
                            <View style={[styles.statusDot, place.open_now ? styles.openDot : styles.closedDot]}>
                              <Text style={styles.statusText}>{place.open_now ? 'Open now' : 'Closed'}</Text>
                            </View>
                          )}
                        </View>
                      </View>

                      <View style={styles.arrowContainer}>
                        <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          ))}

          {loading && (
            <View style={[styles.messageBubble, styles.aiBubble]}>
              <View style={[styles.aiAvatar, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Ionicons name="sparkles" size={12} color={colors.text} />
              </View>
              <View style={[styles.loadingContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[styles.typingDot, { backgroundColor: colors.textSecondary }]} />
                <View style={[styles.typingDot, styles.typingDotDelay1, { backgroundColor: colors.textSecondary }]} />
                <View style={[styles.typingDot, styles.typingDotDelay2, { backgroundColor: colors.textSecondary }]} />
              </View>
            </View>
          )}
        </ScrollView>

        <View style={[styles.inputContainer, { backgroundColor: colors.background, borderTopColor: colors.border, paddingBottom: isKeyboardVisible ? 0 : Math.max(insets.bottom, 8) }]}>
          {uploadedImage && (
            <View style={styles.imagePreview}>
              <Image source={{ uri: uploadedImage }} style={[styles.previewImage, { backgroundColor: colors.card }]} />
              <TouchableOpacity onPress={() => setUploadedImage(null)} style={[styles.removeImage, { backgroundColor: colors.background }]}>
                <Ionicons name="close-circle" size={20} color={colors.text} />
              </TouchableOpacity>
            </View>
          )}
          <View style={styles.inputRow}>
            <TouchableOpacity onPress={pickImage} style={[styles.uploadButton, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Ionicons name="image" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
            <View style={[styles.inputWrapper, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="search" size={20} color={colors.textSecondary} style={styles.searchIcon} />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="Ask NaviSense AI anything..."
              placeholderTextColor={colors.textSecondary}
              value={query}
              onChangeText={setQuery}
              onSubmitEditing={handleSend}
              returnKeyType="send"
              maxLength={200}
            />
            {query.trim() && (
              <TouchableOpacity onPress={() => setQuery('')} style={styles.clearButton}>
                <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity 
            style={[styles.sendButton, (!query.trim() && !uploadedImage || loading) && styles.sendButtonDisabled]} 
            onPress={handleSend}
            disabled={(!query.trim() && !uploadedImage) || loading}
          >
            <View style={[styles.sendButtonGradient, { backgroundColor: (query.trim() || uploadedImage) && !loading ? (theme === 'dark' ? '#fff' : '#000') : colors.border }]}>
              <Ionicons name="arrow-up" size={20} color={(query.trim() || uploadedImage) && !loading ? (theme === 'dark' ? '#000' : '#fff') : colors.textSecondary} />
            </View>
          </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Place Details Modal */}
      <Modal visible={!!selectedPlace} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>{selectedPlace?.name}</Text>
              <TouchableOpacity onPress={() => { setSelectedPlace(null); setPlaceDetails(null); }}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            {loadingDetails ? (
              <View style={styles.modalLoading}>
                <ActivityIndicator size="large" color={colors.text} />
              </View>
            ) : (
              <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
                {placeDetails?.formatted_address && (
                  <View style={styles.detailRow}>
                    <Ionicons name="location" size={20} color={colors.textSecondary} />
                    <Text style={[styles.detailText, { color: colors.text }]}>{placeDetails.formatted_address}</Text>
                  </View>
                )}
                {placeDetails?.formatted_phone_number && (
                  <TouchableOpacity style={styles.detailRow} onPress={() => Linking.openURL(`tel:${placeDetails.formatted_phone_number}`)}>
                    <Ionicons name="call" size={20} color={colors.textSecondary} />
                    <Text style={[styles.detailText, { color: '#3b82f6' }]}>{placeDetails.formatted_phone_number}</Text>
                  </TouchableOpacity>
                )}
                {placeDetails?.opening_hours && (
                  <View style={styles.detailRow}>
                    <Ionicons name="time" size={20} color={colors.textSecondary} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.detailText, { color: placeDetails.opening_hours.open_now ? '#10b981' : '#ef4444' }]}>
                        {placeDetails.opening_hours.open_now ? 'Open now' : 'Closed'}
                      </Text>
                      {placeDetails.opening_hours.weekday_text?.slice(0, 3).map((day: string, idx: number) => (
                        <Text key={idx} style={[styles.hoursText, { color: colors.textSecondary }]}>{day}</Text>
                      ))}
                    </View>
                  </View>
                )}
                {placeDetails?.rating && (
                  <View style={styles.detailRow}>
                    <Ionicons name="star" size={20} color="#fbbf24" />
                    <Text style={[styles.detailText, { color: colors.text }]}>{placeDetails.rating} / 5</Text>
                  </View>
                )}
                {placeDetails?.website && (
                  <TouchableOpacity style={styles.detailRow} onPress={() => Linking.openURL(placeDetails.website)}>
                    <Ionicons name="globe" size={20} color={colors.textSecondary} />
                    <Text style={[styles.detailText, { color: '#3b82f6' }]} numberOfLines={1}>Visit website</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={[styles.viewMapButtonLarge, { backgroundColor: theme === 'dark' ? '#fff' : '#000' }]}
                  onPress={() => {
                    if (selectedPlace?.location) {
                      Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${selectedPlace.location.lat},${selectedPlace.location.lng}`);
                    }
                  }}
                >
                  <Ionicons name="map" size={20} color={theme === 'dark' ? '#000' : '#fff'} />
                  <Text style={[styles.viewMapButtonText, { color: theme === 'dark' ? '#000' : '#fff' }]}>View in Maps</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20, flexDirection: 'row', alignItems: 'center', backgroundColor: '#000' },
  backButton: { marginRight: 16, padding: 4 },
  headerContent: { flex: 1 },
  headerTitle: { fontSize: 22, fontFamily: 'LeagueSpartan_700Bold', color: '#fff', marginBottom: 2 },
  headerSubtitle: { fontSize: 14, color: '#6b7280' },
  chatContainer: { flex: 1, backgroundColor: '#000' },
  messagesContainer: { flex: 1 },
  messagesContent: { padding: 20, paddingBottom: 8 },
  emptyState: { alignItems: 'center', paddingTop: 60 },
  logoContainer: { marginBottom: 32 },
  logoGradient: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', backgroundColor: '#1a1a1a', borderWidth: 1, borderColor: '#333' },
  emptyTitle: { fontSize: 36, fontFamily: 'LeagueSpartan_700Bold', color: '#fff', marginBottom: 12 },
  emptySubtitle: { fontSize: 15, color: '#6b7280', marginBottom: 40, textAlign: 'center', paddingHorizontal: 20, lineHeight: 22 },
  suggestionsGrid: { width: '100%', gap: 10 },
  suggestionCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1a1a', borderRadius: 14, padding: 18, borderWidth: 1, borderColor: '#333' },
  suggestionIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center', marginRight: 14, borderWidth: 1, borderColor: '#333' },
  suggestionText: { fontSize: 15, fontFamily: 'LeagueSpartan_600SemiBold', color: '#fff', flex: 1 },
  messageBubble: { flexDirection: 'row', marginBottom: 20, alignItems: 'flex-start' },
  userBubble: { justifyContent: 'flex-end' },
  aiBubble: { justifyContent: 'flex-start' },
  aiAvatar: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 10, backgroundColor: '#1a1a1a', borderWidth: 1, borderColor: '#333' },
  messageContent: { maxWidth: '80%' },
  userMessageContent: { marginLeft: 'auto' },
  userMessageGradient: { paddingHorizontal: 18, paddingVertical: 12, borderRadius: 20, backgroundColor: '#fff' },
  userText: { fontSize: 15, lineHeight: 22, color: '#000', fontFamily: 'LeagueSpartan_400Regular' },
  aiMessageBox: { backgroundColor: '#1a1a1a', paddingHorizontal: 18, paddingVertical: 12, borderRadius: 20, borderWidth: 1, borderColor: '#333' },
  aiText: { fontSize: 15, lineHeight: 24, color: '#e5e7eb', fontFamily: 'LeagueSpartan_400Regular' },
  correctionHint: { fontSize: 12, color: '#6b7280', marginTop: 8, fontStyle: 'italic' },
  viewMapButton: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12, paddingVertical: 8, paddingHorizontal: 12, backgroundColor: '#000', borderRadius: 8, alignSelf: 'flex-start', borderWidth: 1, borderColor: '#333' },
  viewMapText: { fontSize: 13, color: '#fff', fontFamily: 'LeagueSpartan_600SemiBold' },
  loadingContainer: { flexDirection: 'row', backgroundColor: '#1a1a1a', paddingHorizontal: 18, paddingVertical: 12, borderRadius: 20, gap: 6, borderWidth: 1, borderColor: '#333' },
  typingDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#6b7280' },
  typingDotDelay1: { opacity: 0.7 },
  typingDotDelay2: { opacity: 0.4 },
  placesContainer: { marginLeft: 38, marginTop: 12, gap: 10 },
  placeCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1a1a', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#333' },
  placeIconContainer: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center', marginRight: 12, borderWidth: 1, borderColor: '#333' },
  placeInfo: { flex: 1 },
  placeName: { fontSize: 15, fontFamily: 'LeagueSpartan_700Bold', color: '#fff', marginBottom: 4 },
  placeAddress: { fontSize: 13, color: '#9ca3af', marginBottom: 8, lineHeight: 18 },
  placeMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  ratingBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#422006', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  ratingText: { fontSize: 12, fontFamily: 'LeagueSpartan_700Bold', color: '#fbbf24' },
  statusDot: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  openDot: { backgroundColor: '#064e3b' },
  closedDot: { backgroundColor: '#450a0a' },
  statusText: { fontSize: 11, fontFamily: 'LeagueSpartan_600SemiBold', color: '#fff' },
  arrowContainer: { marginLeft: 8 },
  inputContainer: { paddingHorizontal: 12, paddingTop: 8, backgroundColor: '#000', borderTopWidth: 1, borderTopColor: '#1a1a1a' },
  imagePreview: { marginBottom: 12, position: 'relative', alignSelf: 'flex-start' },
  previewImage: { width: 80, height: 80, borderRadius: 12, backgroundColor: '#1a1a1a' },
  removeImage: { position: 'absolute', top: -8, right: -8, backgroundColor: '#000', borderRadius: 10 },
  inputRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  uploadButton: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#1a1a1a', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#333' },
  inputWrapper: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1a1a', borderRadius: 24, paddingHorizontal: 16, borderWidth: 1, borderColor: '#333' },
  searchIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 15, color: '#fff', paddingVertical: 0, height: 44 },
  clearButton: { padding: 4 },
  sendButton: { width: 48, height: 48, borderRadius: 24 },
  sendButtonGradient: { width: '100%', height: '100%', borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  sendButtonDisabled: { opacity: 1 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontFamily: 'LeagueSpartan_700Bold', flex: 1, marginRight: 12 },
  modalLoading: { paddingVertical: 40, alignItems: 'center' },
  modalScroll: { maxHeight: 400 },
  detailRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 16 },
  detailText: { fontSize: 15, fontFamily: 'LeagueSpartan_400Regular', flex: 1 },
  hoursText: { fontSize: 13, fontFamily: 'LeagueSpartan_400Regular', marginTop: 4 },
  viewMapButtonLarge: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 16, borderRadius: 12, marginTop: 20 },
  viewMapButtonText: { fontSize: 16, fontFamily: 'LeagueSpartan_700Bold' },
});
