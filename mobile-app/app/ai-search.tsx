import { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, SafeAreaView, StatusBar, ActivityIndicator, Linking, KeyboardAvoidingView, Platform, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { getApiUrl, API_CONFIG } from '../config/api';
import { useTheme, getColors } from '../contexts/ThemeContext';
import MenuBar from '../components/MenuBar';

interface Message {
  id: string;
  type: 'user' | 'ai';
  text: string;
  places?: any[];
  timestamp: Date;
}

export default function AISearchScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const colors = getColors(theme);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [userLocation, setUserLocation] = useState<any>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
    getUserLocation();
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

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const handleSend = async () => {
    if (!query.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      text: query.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    const currentQuery = query.trim();
    setQuery('');
    setLoading(true);

    try {
      const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.AI_CHAT), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query: currentQuery,
          conversationHistory: messages.slice(-6).map(m => ({ type: m.type, text: m.text })),
          userLocation: userLocation ? { latitude: userLocation.latitude, longitude: userLocation.longitude } : null
        }),
      });

      const data = await response.json();

      let responseText = data.success ? data.response : `Sorry, ${data.error || 'something went wrong.'}`;
      
      // Parse if it's a JSON string
      if (typeof responseText === 'string') {
        // Decode HTML entities
        responseText = responseText.replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
        
        // Try to parse as JSON
        try {
          const parsed = JSON.parse(responseText);
          responseText = parsed.response || parsed.message || parsed.text || parsed.answer || responseText;
        } catch {}
        
        // Remove remaining JSON formatting
        responseText = responseText.replace(/```[a-z]*\n?/gi, '').replace(/```/g, '');
        responseText = responseText.replace(/\{[^}]*needsPlaceSearch[^}]*\}/gi, '');
        responseText = responseText.replace(/[{}\[\]"]/g, '').replace(/needsPlaceSearch:\s*(true|false),?/gi, '');
        responseText = responseText.replace(/response:\s*/gi, '');
        responseText = responseText.replace(/\n{3,}/g, '\n\n').trim();
      }

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        text: responseText,
        places: data.places,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (err) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        text: 'Sorry, I\'m having trouble connecting. Please check your internet and try again.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
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
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>AI Assistant</Text>
          <Text style={styles.headerSubtitle}>Find places instantly</Text>
        </View>
      </View>

      <KeyboardAvoidingView 
        style={styles.chatContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={100}
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
                <View style={styles.logoGradient}>
                  <Ionicons name="sparkles" size={36} color="#fff" />
                </View>
              </View>
              <Text style={styles.emptyTitle}>Ask me anything</Text>
              <Text style={styles.emptySubtitle}>I can help you find places, compare locations, get directions, and more</Text>
              
              <View style={styles.suggestionsGrid}>
                {suggestedQueries.map((item, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={styles.suggestionCard}
                    onPress={() => {
                      setQuery(item.query);
                      setTimeout(() => handleSend(), 100);
                    }}
                  >
                    <View style={styles.suggestionIcon}>
                      <Ionicons name={item.icon as any} size={24} color="#fff" />
                    </View>
                    <Text style={styles.suggestionText}>{item.text}</Text>
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
                  <View style={styles.aiAvatar}>
                    <Ionicons name="sparkles" size={12} color="#fff" />
                  </View>
                )}
                <View style={[
                  styles.messageContent,
                  message.type === 'user' && styles.userMessageContent
                ]}>
                  {message.type === 'user' ? (
                    <View style={styles.userMessageGradient}>
                      <Text style={styles.userText}>{message.text}</Text>
                    </View>
                  ) : (
                    <View style={styles.aiMessageBox}>
                      <Text style={styles.aiText}>{message.text}</Text>
                    </View>
                  )}
                </View>
              </View>

              {message.places && message.places.length > 0 && (
                <View style={styles.placesContainer}>
                  {message.places.map((place, idx) => (
                    <TouchableOpacity
                      key={idx}
                      style={styles.placeCard}
                      activeOpacity={0.7}
                      onPress={() => {
                        if (place.location) {
                          Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${place.location.lat},${place.location.lng}`);
                        }
                      }}
                    >
                      <View style={styles.placeIconContainer}>
                        <Ionicons name="location-sharp" size={20} color="#fff" />
                      </View>
                      
                      <View style={styles.placeInfo}>
                        <Text style={styles.placeName} numberOfLines={1}>{place.name}</Text>
                        {place.address && (
                          <Text style={styles.placeAddress} numberOfLines={2}>{place.address}</Text>
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
                        <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          ))}

          {loading && (
            <View style={[styles.messageBubble, styles.aiBubble]}>
              <View style={styles.aiAvatar}>
                <Ionicons name="sparkles" size={12} color="#fff" />
              </View>
              <View style={styles.loadingContainer}>
                <View style={styles.typingDot} />
                <View style={[styles.typingDot, styles.typingDotDelay1]} />
                <View style={[styles.typingDot, styles.typingDotDelay2]} />
              </View>
            </View>
          )}
        </ScrollView>

        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <Ionicons name="search" size={20} color="#9ca3af" style={styles.searchIcon} />
            <TextInput
              style={styles.input}
              placeholder="Ask me anything about places..."
              placeholderTextColor="#9ca3af"
              value={query}
              onChangeText={setQuery}
              onSubmitEditing={handleSend}
              returnKeyType="send"
              maxLength={200}
            />
            {query.trim() && (
              <TouchableOpacity onPress={() => setQuery('')} style={styles.clearButton}>
                <Ionicons name="close-circle" size={20} color="#9ca3af" />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity 
            style={[styles.sendButton, (!query.trim() || loading) && styles.sendButtonDisabled]} 
            onPress={handleSend}
            disabled={!query.trim() || loading}
          >
            <View style={[styles.sendButtonGradient, { backgroundColor: query.trim() && !loading ? '#fff' : '#333' }]}>
              <Ionicons name="arrow-up" size={20} color={query.trim() && !loading ? '#000' : '#6b7280'} />
            </View>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
      <MenuBar />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20, flexDirection: 'row', alignItems: 'center', backgroundColor: '#000' },
  backButton: { marginRight: 16, padding: 4 },
  headerContent: { flex: 1 },
  headerTitle: { fontSize: 28, fontFamily: 'LeagueSpartan_700Bold', color: '#fff', marginBottom: 2 },
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
  inputContainer: { flexDirection: 'row', padding: 16, backgroundColor: '#000', borderTopWidth: 1, borderTopColor: '#1a1a1a', gap: 10, alignItems: 'center' },
  inputWrapper: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1a1a', borderRadius: 24, paddingHorizontal: 16, borderWidth: 1, borderColor: '#333' },
  searchIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 15, color: '#fff', paddingVertical: 0, height: 44 },
  clearButton: { padding: 4 },
  sendButton: { width: 48, height: 48, borderRadius: 24 },
  sendButtonGradient: { width: '100%', height: '100%', borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  sendButtonDisabled: { opacity: 1 },
});
