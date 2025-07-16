import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const VoiceCommands = ({ onCommand, isActive }) => {
  const [isListening, setIsListening] = useState(false);

  const toggleListening = () => {
    setIsListening(!isListening);
    Alert.alert('Voice Commands', 'Voice recognition coming soon!');
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
      
      {isListening && (
        <Text style={styles.listeningText}>Voice feature coming soon</Text>
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