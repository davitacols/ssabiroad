import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, StatusBar, Animated, Dimensions, ScrollView, ActivityIndicator, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';

const { width } = Dimensions.get('window');

const LANDMARKS = [
  { name: 'Eiffel Tower', country: 'France', image: 'https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?w=800', fact: 'Built in 1889, stands 330m tall. Named after engineer Gustave Eiffel.' },
  { name: 'Statue of Liberty', country: 'USA', image: 'https://images.unsplash.com/photo-1485738422979-f5c462d49f74?w=800', fact: 'Gift from France in 1886. Represents freedom and democracy.' },
  { name: 'Big Ben', country: 'UK', image: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800', fact: 'Completed in 1859. The bell weighs 13.5 tons.' },
  { name: 'Taj Mahal', country: 'India', image: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?w=800', fact: 'Built 1632-1653 by Emperor Shah Jahan for his wife.' },
  { name: 'Colosseum', country: 'Italy', image: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800', fact: 'Built in 80 AD. Could hold 50,000-80,000 spectators.' },
  { name: 'Great Wall', country: 'China', image: 'https://images.unsplash.com/photo-1508804185872-d7badad00f7d?w=800', fact: 'Over 13,000 miles long. Built over 2,000 years.' },
  { name: 'Sydney Opera House', country: 'Australia', image: 'https://images.unsplash.com/photo-1523059623039-a9ed027e7fad?w=800', fact: 'Opened in 1973. Hosts over 1,500 performances annually.' },
  { name: 'Burj Khalifa', country: 'UAE', image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800', fact: 'World\'s tallest building at 828m. Completed in 2010.' },
  { name: 'Machu Picchu', country: 'Peru', image: 'https://images.unsplash.com/photo-1587595431973-160d0d94add1?w=800', fact: 'Built by Incas around 1450. Sits at 2,430m elevation.' },
  { name: 'Christ the Redeemer', country: 'Brazil', image: 'https://images.unsplash.com/photo-1483729558449-99ef09a8c325?w=800', fact: 'Completed in 1931. Stands 30m tall atop Corcovado Mountain.' },
  { name: 'Petra', country: 'Jordan', image: 'https://images.unsplash.com/photo-1578895101408-1a36b834405b?w=800', fact: 'Ancient city carved into rock around 300 BC.' },
  { name: 'Sagrada Familia', country: 'Spain', image: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=800', fact: 'Designed by Gaudí. Construction started 1882, still ongoing.' },
  { name: 'Angkor Wat', country: 'Cambodia', image: 'https://images.unsplash.com/photo-1545554865-4c7884b29e2e?w=800', fact: 'Largest religious monument. Built in 12th century.' },
  { name: 'Stonehenge', country: 'UK', image: 'https://images.unsplash.com/photo-1599833975787-5d9f0e5d8c6e?w=800', fact: 'Prehistoric monument built around 3000 BC.' },
  { name: 'Acropolis', country: 'Greece', image: 'https://images.unsplash.com/photo-1555993539-1732b0258235?w=800', fact: 'Ancient citadel built in 5th century BC. Home to Parthenon.' },
  { name: 'Golden Gate Bridge', country: 'USA', image: 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=800', fact: 'Opened in 1937. Spans 2.7km across San Francisco Bay.' },
  { name: 'Mount Fuji', country: 'Japan', image: 'https://images.unsplash.com/photo-1490806843957-31f4c9a91c65?w=800', fact: 'Japan\'s highest mountain at 3,776m. Active volcano.' },
  { name: 'Pyramids of Giza', country: 'Egypt', image: 'https://images.unsplash.com/photo-1572252009286-268acec5ca0a?w=800', fact: 'Built around 2560 BC. Great Pyramid was tallest for 3,800 years.' },
  { name: 'Neuschwanstein', country: 'Germany', image: 'https://images.unsplash.com/photo-1467269204594-9661b134dd2b?w=800', fact: 'Built 1869-1886 by King Ludwig II. Inspired Disney castle.' },
  { name: 'Forbidden City', country: 'China', image: 'https://images.unsplash.com/photo-1508804185872-d7badad00f7d?w=800', fact: 'Imperial palace from 1420-1912. Has 980 buildings.' },
];

export default function LandmarkGameScreen() {
  const router = useRouter();
  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  const [options, setOptions] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [questionNum, setQuestionNum] = useState(0);
  const [usedLandmarks, setUsedLandmarks] = useState<string[]>([]);
  const [showFact, setShowFact] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [answered, setAnswered] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [highScore, setHighScore] = useState(0);
  const [nearbyLandmarks, setNearbyLandmarks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [locationName, setLocationName] = useState('');
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const fadeAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    loadHighScore();
    fetchNearbyLandmarks();
  }, []);

  useEffect(() => {
    if (currentQuestion) {
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
    }
  }, [currentQuestion]);

  const loadHighScore = async () => {
    try {
      const stored = await AsyncStorage.getItem('landmarkGameHighScore');
      if (stored) setHighScore(parseInt(stored));
    } catch (error) {
      console.error(error);
    }
  };

  const saveHighScore = async (newScore: number) => {
    try {
      if (newScore > highScore) {
        await AsyncStorage.setItem('landmarkGameHighScore', newScore.toString());
        setHighScore(newScore);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const fetchNearbyLandmarks = async () => {
    setLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setNearbyLandmarks(LANDMARKS);
        setLoading(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;
      setUserLocation({ lat: latitude, lng: longitude });

      const reverseGeo = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (reverseGeo[0]) {
        const { city, region, country } = reverseGeo[0];
        setLocationName(city || region || country || 'your area');
      }

      const response = await fetch(
        `https://ssabiroad.vercel.app/api/landmarks/nearby?lat=${latitude}&lng=${longitude}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch landmarks');
      }
      
      const data = await response.json();

      if (data.landmarks && data.landmarks.length > 0) {
        const landmarks = data.landmarks.map((place: any) => ({
          name: place.name,
          country: reverseGeo[0]?.country || 'Local',
          vicinity: place.vicinity,
          image: place.photoReference
            ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${place.photoReference}&key=AIzaSyBXLKbWmpZpE9wm7hEZ6PVEYR6y9ewR5ho`
            : 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800',
          fact: `Located in ${reverseGeo[0]?.city || reverseGeo[0]?.region}. ${place.vicinity || ''}${place.rating ? ` Rated ${place.rating}/5` : ''}`
        }));
        setNearbyLandmarks(landmarks.length >= 10 ? landmarks : [...landmarks, ...LANDMARKS].slice(0, 20));
      } else {
        setNearbyLandmarks(LANDMARKS);
      }
    } catch (error) {
      console.error(error);
      setNearbyLandmarks(LANDMARKS);
    }
    setLoading(false);
  };

  const startGame = () => {
    if (nearbyLandmarks.length === 0 && LANDMARKS.length === 0) return;
    setScore(0);
    setQuestionNum(0);
    setUsedLandmarks([]);
    setGameStarted(true);
    setTimeout(() => nextQuestion(), 100);
  };

  const nextQuestion = () => {
    fadeAnim.setValue(0);
    setShowFact(false);
    
    const landmarksToUse = nearbyLandmarks.length >= 10 ? nearbyLandmarks : LANDMARKS;
    const availableLandmarks = landmarksToUse.filter(l => !usedLandmarks.includes(l.name));
    
    if (availableLandmarks.length === 0) {
      endGame(score);
      return;
    }
    
    const randomLandmark = availableLandmarks[Math.floor(Math.random() * availableLandmarks.length)];
    
    const wrongOptions = landmarksToUse
      .filter(l => l.name !== randomLandmark.name)
      .sort(() => 0.5 - Math.random())
      .slice(0, 3)
      .map(l => l.name);
    
    const allOptions = [randomLandmark.name, ...wrongOptions].sort(() => 0.5 - Math.random());
    
    setCurrentQuestion(randomLandmark);
    setOptions(allOptions);
    setAnswered(false);
    setSelectedAnswer(null);
    setUsedLandmarks([...usedLandmarks, randomLandmark.name]);
  };

  const handleAnswer = (answer: string) => {
    if (answered) return;
    
    setAnswered(true);
    setSelectedAnswer(answer);
    
    const correct = answer === currentQuestion.name;
    const newScore = correct ? score + 10 : score;
    
    if (correct) {
      setScore(newScore);
      setShowFact(true);
    }
    
    setTimeout(() => {
      if (questionNum < 9) {
        setQuestionNum(questionNum + 1);
        nextQuestion();
      } else {
        endGame(newScore);
      }
    }, correct ? 2500 : 1500);
  };

  const endGame = (finalScore: number) => {
    setGameStarted(false);
    setScore(finalScore);
    setQuestionNum(10);
    saveHighScore(finalScore);
  };

  const openInMaps = (landmarkName: string, vicinity: string) => {
    const query = encodeURIComponent(`${landmarkName} ${vicinity}`);
    const url = `https://www.google.com/maps/search/?api=1&query=${query}`;
    Linking.openURL(url);
  };

  if (!gameStarted) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" />
        
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingScreen}>
            <ActivityIndicator size="large" color="#000" />
            <Text style={styles.loadingText}>Finding landmarks near you...</Text>
          </View>
        ) : (
          <View style={styles.startScreen}>
            <Text style={styles.emoji}>🌍</Text>
            <Text style={styles.title}>Landmark Quiz</Text>
            <Text style={styles.subtitle}>
              {locationName ? `Discover landmarks in ${locationName}` : 'Test your knowledge of world landmarks'}
            </Text>
          
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statNum}>{nearbyLandmarks.length > 0 ? nearbyLandmarks.length : 20}</Text>
              <Text style={styles.statLabel}>Landmarks</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statNum}>{highScore}</Text>
              <Text style={styles.statLabel}>Best Score</Text>
            </View>
          </View>

          {score > 0 && questionNum === 10 && (
            <>
              <View style={styles.resultCard}>
                <Text style={styles.resultTitle}>Last Game</Text>
                <Text style={styles.resultScore}>{score}/100</Text>
                <Text style={styles.resultText}>{score === 100 ? 'Perfect! 🎉' : score >= 70 ? 'Great job! 👏' : 'Keep trying! 💪'}</Text>
              </View>
              
              {nearbyLandmarks.length > 0 && (
                <View style={styles.landmarksSection}>
                  <Text style={styles.landmarksTitle}>Nearby Landmarks to Visit</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.landmarksScroll}>
                    {nearbyLandmarks.slice(0, 10).map((landmark, idx) => (
                      <TouchableOpacity 
                        key={idx} 
                        style={styles.landmarkCard}
                        onPress={() => openInMaps(landmark.name, landmark.vicinity || '')}
                      >
                        <Image source={{ uri: landmark.image }} style={styles.landmarkCardImage} />
                        <View style={styles.landmarkCardInfo}>
                          <Text style={styles.landmarkCardName} numberOfLines={2}>{landmark.name}</Text>
                          <Text style={styles.landmarkCardVicinity} numberOfLines={1}>{landmark.vicinity || landmark.country}</Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </>
          )}

          <TouchableOpacity 
            style={[styles.playBtn, (nearbyLandmarks.length === 0 && LANDMARKS.length === 0) && styles.playBtnDisabled]} 
            onPress={startGame}
            disabled={nearbyLandmarks.length === 0 && LANDMARKS.length === 0}
          >
            <Text style={styles.playBtnText}>Start Quiz</Text>
          </TouchableOpacity>
          </View>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <View style={styles.gameHeader}>
        <View style={styles.progress}>
          <View style={[styles.progressFill, { width: `${((questionNum + 1) / 10) * 100}%` }]} />
        </View>
        <View style={styles.gameInfo}>
          <Text style={styles.questionCount}>{questionNum + 1}/10</Text>
          <Text style={styles.gameScore}>{score} pts</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <Animated.View style={[styles.gameContent, { opacity: fadeAnim }]}>
        {currentQuestion && (
          <>
            <View style={styles.imageContainer}>
              <Image source={{ uri: currentQuestion.image }} style={styles.landmarkImage} />
              <View style={styles.imageGradient} />
            </View>

            <View style={styles.questionCard}>
              <Text style={styles.question}>Which landmark is this?</Text>
              
              {showFact && answered && selectedAnswer === currentQuestion.name && (
                <View style={styles.factCard}>
                  <Text style={styles.factTitle}>Did you know?</Text>
                  <Text style={styles.factText}>{currentQuestion.fact}</Text>
                  <Text style={styles.factCountry}>{currentQuestion.country}</Text>
                </View>
              )}
              
              <View style={styles.optionsGrid}>
                {options.map((option, index) => {
                  const isCorrect = option === currentQuestion.name;
                  const isSelected = option === selectedAnswer;
                  const showResult = answered;
                  
                  return (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.option,
                        showResult && isCorrect && styles.optionCorrect,
                        showResult && isSelected && !isCorrect && styles.optionWrong,
                      ]}
                      onPress={() => handleAnswer(option)}
                      disabled={answered}
                    >
                      <Text style={[
                        styles.optionText,
                        showResult && isCorrect && styles.optionTextCorrect,
                        showResult && isSelected && !isCorrect && styles.optionTextWrong,
                      ]}>
                        {option}
                      </Text>
                      {showResult && isCorrect && <Text style={styles.checkmark}>✓</Text>}
                      {showResult && isSelected && !isCorrect && <Text style={styles.cross}>✕</Text>}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </>
        )}
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { paddingTop: 50, paddingHorizontal: 20, paddingBottom: 20 },
  backText: { fontSize: 16, fontWeight: '500', color: '#000' },
  loadingScreen: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  loadingText: { fontSize: 15, color: '#6b7280', fontWeight: '500' },
  startScreen: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  emoji: { fontSize: 64, marginBottom: 20 },
  title: { fontSize: 32, fontWeight: '700', color: '#000', marginBottom: 8, letterSpacing: -0.5 },
  subtitle: { fontSize: 15, color: '#6b7280', textAlign: 'center', marginBottom: 48, lineHeight: 22 },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 32, width: '100%' },
  statBox: { flex: 1, backgroundColor: '#f9fafb', borderRadius: 12, padding: 24, alignItems: 'center' },
  statNum: { fontSize: 28, fontWeight: '600', color: '#000', marginBottom: 6 },
  statLabel: { fontSize: 12, color: '#6b7280', fontWeight: '500' },
  resultCard: { backgroundColor: '#000', borderRadius: 12, padding: 28, marginBottom: 32, width: '100%', alignItems: 'center' },
  resultTitle: { fontSize: 12, color: '#9ca3af', marginBottom: 12, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 1 },
  resultScore: { fontSize: 42, fontWeight: '600', color: '#fff', marginBottom: 8 },
  resultText: { fontSize: 15, color: '#d1d5db', fontWeight: '500' },
  playBtn: { backgroundColor: '#000', borderRadius: 12, paddingVertical: 20, paddingHorizontal: 48, width: '100%' },
  playBtnDisabled: { backgroundColor: '#d1d5db' },
  playBtnText: { fontSize: 16, fontWeight: '600', color: '#fff', textAlign: 'center', letterSpacing: 0.5 },
  gameHeader: { paddingTop: 50, paddingHorizontal: 20, paddingBottom: 20 },
  progress: { height: 3, backgroundColor: '#e5e7eb', borderRadius: 2, marginBottom: 16, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#000', borderRadius: 2 },
  gameInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  questionCount: { fontSize: 13, fontWeight: '500', color: '#6b7280' },
  gameScore: { fontSize: 16, fontWeight: '600', color: '#000' },
  gameContent: { paddingBottom: 40 },
  imageContainer: { height: 320, position: 'relative' },
  landmarkImage: { width: '100%', height: '100%', backgroundColor: '#f3f4f6' },
  imageGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 80, backgroundColor: 'rgba(255,255,255,0.95)' },
  questionCard: { backgroundColor: '#fff', paddingHorizontal: 20, paddingTop: 32, paddingBottom: 20 },
  question: { fontSize: 20, fontWeight: '600', color: '#000', marginBottom: 28, letterSpacing: -0.3 },
  optionsGrid: { gap: 10 },
  option: { backgroundColor: '#f9fafb', borderRadius: 8, padding: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 2, borderColor: 'transparent' },
  optionCorrect: { backgroundColor: '#000', borderColor: '#000' },
  optionWrong: { backgroundColor: '#f3f4f6', borderColor: '#e5e7eb' },
  optionText: { fontSize: 15, fontWeight: '500', color: '#000', flex: 1 },
  optionTextCorrect: { color: '#fff' },
  optionTextWrong: { color: '#6b7280' },
  checkmark: { fontSize: 18, color: '#fff', fontWeight: '700' },
  cross: { fontSize: 16, color: '#6b7280', fontWeight: '700' },
  factCard: { backgroundColor: '#f9fafb', borderRadius: 12, padding: 20, marginBottom: 20 },
  factTitle: { fontSize: 12, fontWeight: '600', color: '#6b7280', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 },
  factText: { fontSize: 14, color: '#000', lineHeight: 22, marginBottom: 8 },
  factCountry: { fontSize: 13, fontWeight: '500', color: '#6b7280' },
  landmarksSection: { width: '100%', marginBottom: 24 },
  landmarksTitle: { fontSize: 16, fontWeight: '600', color: '#000', marginBottom: 16, paddingHorizontal: 0 },
  landmarksScroll: { marginHorizontal: -32 },
  landmarkCard: { width: 160, marginLeft: 12, backgroundColor: '#f9fafb', borderRadius: 12, overflow: 'hidden' },
  landmarkCardImage: { width: '100%', height: 120, backgroundColor: '#e5e7eb' },
  landmarkCardInfo: { padding: 12 },
  landmarkCardName: { fontSize: 14, fontWeight: '600', color: '#000', marginBottom: 4 },
  landmarkCardVicinity: { fontSize: 12, color: '#6b7280' },
});
