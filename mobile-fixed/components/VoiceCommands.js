import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, PermissionsAndroid, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Voice from '@react-native-voice/voice';
import * as Speech from 'expo-speech';

const VoiceCommands = ({ onCommand, isActive }) => {
  const [isListening, setIsListening] = useState(false);
  const [recognizedText, setRecognizedText] = useState('');
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    Voice.onSpeechStart = onSpeechStart;
    Voice.onSpeechEnd = onSpeechEnd;
    Voice.onSpeechResults = onSpeechResults;
    Voice.onSpeechError = onSpeechError;

    checkVoiceSupport();

    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, []);

  const checkVoiceSupport = async () => {
    try {
      const available = await Voice.isAvailable();
      setIsSupported(available);
    } catch (error) {
      setIsSupported(false);
    }
  };

  const requestMicrophonePermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: 'Microphone Permission',
            message: 'This app needs access to microphone for voice commands',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        return false;
      }
    }
    return true;
  };

  const onSpeechStart = () => {
    setIsListening(true);
  };

  const onSpeechEnd = () => {
    setIsListening(false);
  };

  const onSpeechResults = (event) => {
    const text = event.value[0];
    setRecognizedText(text);
    processCommand(text);
  };

  const onSpeechError = (error) => {
    console.log('Speech error:', error);
    setIsListening(false);
    Alert.alert('Voice Error', 'Could not recognize speech. Please try again.');
  };

  const startListening = async () => {
    if (!isSupported) {
      Alert.alert('Voice Commands', 'Speech recognition not supported on this device');
      return;
    }

    const hasPermission = await requestMicrophonePermission();
    if (!hasPermission) {
      Alert.alert('Permission Required', 'Microphone permission is required for voice commands');
      return;
    }

    try {
      await Voice.start('en-US');
      Speech.speak('Listening...');
    } catch (error) {
      console.log('Start listening error:', error);
      Alert.alert('Voice Error', 'Could not start voice recognition');
    }
  };

  const stopListening = async () => {
    try {
      await Voice.stop();
    } catch (error) {
      console.log('Stop listening error:', error);
    }
  };

  const toggleListening = async () => {
    if (isListening) {
      await stopListening();
    } else {
      await startListening();
    }
  };

  const processCommand = (text) => {
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('take') && (lowerText.includes('photo') || lowerText.includes('picture'))) {
      onCommand('takePhoto');
      Speech.speak('Taking photo');
    } else if (lowerText.includes('analyze') || lowerText.includes('scan')) {
      onCommand('analyze');
      Speech.speak('Analyzing image');
    } else if (lowerText.includes('gallery') || lowerText.includes('choose')) {
      onCommand('openGallery');
      Speech.speak('Opening gallery');
    } else if (lowerText.includes('save') && lowerText.includes('location')) {
      onCommand('saveLocation');
      Speech.speak('Saving location');
    } else {
      Speech.speak('Command not recognized. Try saying take photo, analyze, open gallery, or save location');
    }

    setTimeout(() => {
      setRecognizedText('');
    }, 3000);
  };

  if (!isActive) return null;

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.voiceButton, isListening && styles.listening]}
        onPress={toggleListening}
      >
        <Ionicons name={isListening ? "mic" : "mic-outline"} size={24} color="#ffffff" />
      </TouchableOpacity>
      
      {recognizedText && (
        <Text style={styles.recognizedText}>"{recognizedText}"</Text>
      )}
      
      {isListening && (
        <Text style={styles.listeningText}>Listening...</Text>
      )}
      
      {!isSupported && (
        <Text style={styles.unsupportedText}>Voice not supported</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    alignItems: 'center',
  },
  voiceButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },
  listening: {
    backgroundColor: '#ef4444',
    transform: [{ scale: 1.1 }],
  },
  recognizedText: {
    marginTop: 8,
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0.8)',
    color: '#ffffff',
    borderRadius: 8,
    fontSize: 12,
    maxWidth: 200,
    textAlign: 'center',
  },
  listeningText: {
    marginTop: 4,
    color: '#6366f1',
    fontSize: 12,
    fontWeight: '600',
  },
  unsupportedText: {
    marginTop: 4,
    color: '#ef4444',
    fontSize: 10,
    fontWeight: '600',
  },
});

export default VoiceCommands;