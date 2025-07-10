import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Voice from '@react-native-voice/voice';
import Icon from 'react-native-vector-icons/MaterialIcons';

const VoiceCommands = ({ onCommand, isActive }) => {
  const [isListening, setIsListening] = useState(false);
  const [recognizedText, setRecognizedText] = useState('');

  useEffect(() => {
    Voice.onSpeechStart = () => setIsListening(true);
    Voice.onSpeechEnd = () => setIsListening(false);
    Voice.onSpeechResults = (event) => {
      const text = event.value[0].toLowerCase();
      setRecognizedText(text);
      processCommand(text);
    };
    Voice.onSpeechError = () => setIsListening(false);

    return () => Voice.destroy().then(Voice.removeAllListeners);
  }, []);

  const processCommand = (text) => {
    if (text.includes('analyze') && text.includes('building')) {
      onCommand('analyze');
    } else if (text.includes('find similar') || text.includes('similar architecture')) {
      onCommand('findSimilar');
    } else if (text.includes('save') && text.includes('location')) {
      onCommand('saveLocation');
    }
  };

  const toggleListening = async () => {
    try {
      if (isListening) {
        await Voice.stop();
      } else {
        await Voice.start('en-US');
      }
    } catch (error) {
      console.log('Voice error:', error);
    }
  };

  if (!isActive) return null;

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.voiceButton, isListening && styles.listening]}
        onPress={toggleListening}
      >
        <Icon name={isListening ? "mic" : "mic-none"} size={24} color="#ffffff" />
      </TouchableOpacity>
      
      {recognizedText && (
        <Text style={styles.recognizedText}>"{recognizedText}"</Text>
      )}
      
      {isListening && (
        <Text style={styles.listeningText}>Listening...</Text>
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
});

export default VoiceCommands;