import { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, SafeAreaView, StatusBar, ActivityIndicator, Linking, KeyboardAvoidingView, Platform, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { getApiUrl, API_CONFIG } from '../config/api';

interface Message {
  id: string;
  type: 'user' | 'ai';
  text: string;
  places?: any[];
  timestamp: Date;
}

export default function AISearchScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const scrollViewRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

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
          conversationHistory: messages.slice(-6).map(m => ({ type: m.type, text: m.text }))
        }),
      });

      const data = await response.json();

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        text: data.success ? data.response : `Sorry, ${data.error || 'something went wrong.'}`,
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
    { icon: 'restaurant', text: 'Find restaurants nearby', query: 'best restaurants near me' },
    { icon: 'fitness', text: 'Gyms in my area', query: 'gyms near me' },
    { icon: 'cafe', text: 'Coffee shops', query: 'coffee shops nearby' },
    { icon: 'medical', text: 'Hospitals', query: 'hospitals near me' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      <LinearGradient
        colors={['#000000', '#1a1a1a']}
        style={styles.header}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>AI Assistant</Text>
          <Text style={styles.headerSubtitle}>Find places instantly</Text>
        </View>
      </LinearGradient>

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
                <LinearGradient
                  colors={['#8b5cf6', '#6366f1']}
                  style={styles.logoGradient}
                >
                  <Ionicons name="location" size={40} color="#fff" />
                </LinearGradient>
              </View>
              <Text style={styles.emptyTitle}>Where to?</Text>
              <Text style={styles.emptySubtitle}>Ask me about any place you want to find</Text>
              
              <View style={styles.suggestionsGrid}>
                {suggestedQueries.map((item, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={styles.suggestionCard}
                    onPress={() => setQuery(item.query)}
                  >
                    <View style={styles.suggestionIcon}>
                      <Ionicons name={item.icon as any} size={24} color="#8b5cf6" />
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
                  <LinearGradient
                    colors={['#8b5cf6', '#6366f1']}
                    style={styles.aiAvatar}
                  >
                    <Ionicons name="sparkles" size={14} color="#fff" />
                  </LinearGradient>
                )}
                <View style={[
                  styles.messageContent,
                  message.type === 'user' && styles.userMessageContent
                ]}>
                  {message.type === 'user' ? (
                    <LinearGradient
                      colors={['#000000', '#1a1a1a']}
                      style={styles.userMessageGradient}
                    >
                      <Text style={styles.userText}>{message.text}</Text>
                    </LinearGradient>
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
                        <Ionicons name="location-sharp" size={20} color="#8b5cf6" />
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
              <LinearGradient
                colors={['#8b5cf6', '#6366f1']}
                style={styles.aiAvatar}
              >
                <Ionicons name="sparkles" size={14} color="#fff" />
              </LinearGradient>
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
              placeholder="Where do you want to go?"
              placeholderTextColor="#9ca3af"
              value={query}
              onChangeText={setQuery}
              onSubmitEditing={handleSend}
              returnKeyType="send"
              multiline
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
            <LinearGradient
              colors={query.trim() && !loading ? ['#000000', '#1a1a1a'] : ['#e5e7eb', '#d1d5db']}
              style={styles.sendButtonGradient}
            >
              <Ionicons name="arrow-forward" size={22} color={query.trim() && !loading ? '#fff' : '#9ca3af'} />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20, flexDirection: 'row', alignItems: 'center' },
  backButton: { marginRight: 16, padding: 4 },
  headerContent: { flex: 1 },
  headerTitle: { fontSize: 28, fontWeight: '700', color: '#fff', marginBottom: 2 },
  headerSubtitle: { fontSize: 14, color: '#9ca3af' },
  chatContainer: { flex: 1, backgroundColor: '#f9fafb' },
  messagesContainer: { flex: 1 },
  messagesContent: { padding: 20, paddingBottom: 8 },
  emptyState: { alignItems: 'center', paddingTop: 40 },
  logoContainer: { marginBottom: 24 },
  logoGradient: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', shadowColor: '#8b5cf6', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 8 },
  emptyTitle: { fontSize: 32, fontWeight: '700', color: '#000', marginBottom: 8 },
  emptySubtitle: { fontSize: 16, color: '#6b7280', marginBottom: 32 },
  suggestionsGrid: { width: '100%', gap: 12 },
  suggestionCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  suggestionIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#f5f3ff', alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  suggestionText: { fontSize: 16, fontWeight: '600', color: '#000', flex: 1 },
  messageBubble: { flexDirection: 'row', marginBottom: 16, alignItems: 'flex-start' },
  userBubble: { justifyContent: 'flex-end' },
  aiBubble: { justifyContent: 'flex-start' },
  aiAvatar: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 12, shadowColor: '#8b5cf6', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 3 },
  messageContent: { maxWidth: '75%' },
  userMessageContent: { marginLeft: 'auto' },
  userMessageGradient: { paddingHorizontal: 20, paddingVertical: 14, borderRadius: 24, borderBottomRightRadius: 6 },
  userText: { fontSize: 16, lineHeight: 22, color: '#fff', fontWeight: '500' },
  aiMessageBox: { backgroundColor: '#fff', paddingHorizontal: 20, paddingVertical: 14, borderRadius: 24, borderBottomLeftRadius: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  aiText: { fontSize: 16, lineHeight: 22, color: '#000' },
  loadingContainer: { flexDirection: 'row', backgroundColor: '#fff', paddingHorizontal: 20, paddingVertical: 14, borderRadius: 24, borderBottomLeftRadius: 6, gap: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  typingDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#d1d5db' },
  typingDotDelay1: { opacity: 0.7 },
  typingDotDelay2: { opacity: 0.4 },
  placesContainer: { marginLeft: 44, marginTop: 8, gap: 12 },
  placeCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  placeIconContainer: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#f5f3ff', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  placeInfo: { flex: 1 },
  placeName: { fontSize: 16, fontWeight: '700', color: '#000', marginBottom: 4 },
  placeAddress: { fontSize: 13, color: '#6b7280', marginBottom: 8, lineHeight: 18 },
  placeMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  ratingBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#fef3c7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  ratingText: { fontSize: 13, fontWeight: '700', color: '#92400e' },
  statusDot: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  openDot: { backgroundColor: '#d1fae5' },
  closedDot: { backgroundColor: '#fee2e2' },
  statusText: { fontSize: 12, fontWeight: '600', color: '#000' },
  arrowContainer: { marginLeft: 8 },
  inputContainer: { flexDirection: 'row', padding: 16, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#f3f4f6', gap: 12, alignItems: 'center' },
  inputWrapper: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9fafb', borderRadius: 28, paddingHorizontal: 20, paddingVertical: 4, borderWidth: 1, borderColor: '#e5e7eb' },
  searchIcon: { marginRight: 12 },
  input: { flex: 1, fontSize: 16, color: '#000', paddingVertical: 12, maxHeight: 100 },
  clearButton: { padding: 4 },
  sendButton: { width: 56, height: 56, borderRadius: 28 },
  sendButtonGradient: { width: '100%', height: '100%', borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  sendButtonDisabled: { opacity: 1 },
});
