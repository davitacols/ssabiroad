import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface RecentLocationCardProps {
  location: {
    id: string;
    name: string;
    address: string;
    type: string;
    timestamp: string;
    imageUri?: string;
    confidence?: number;
  };
  onPress?: () => void;
}

export const RecentLocationCard: React.FC<RecentLocationCardProps> = ({
  location,
  onPress,
}) => {
  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.content}>
        {location.imageUri && (
          <Image source={{ uri: location.imageUri }} style={styles.image} />
        )}
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>
            {location.name}
          </Text>
          <Text style={styles.address} numberOfLines={1}>
            {location.address}
          </Text>
          <View style={styles.metadata}>
            <View style={styles.typeContainer}>
              <Ionicons name="business" size={14} color="#6b7280" />
              <Text style={styles.type}>{location.type}</Text>
            </View>
            <Text style={styles.timestamp}>
              {formatDate(location.timestamp)}
            </Text>
          </View>
          {location.confidence && (
            <View style={styles.confidenceContainer}>
              <Text style={styles.confidenceLabel}>Confidence: </Text>
              <Text style={styles.confidenceValue}>
                {Math.round(location.confidence * 100)}%
              </Text>
            </View>
          )}
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  image: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 15,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  address: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  metadata: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  typeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  type: {
    fontSize: 12,
    color: '#6b7280',
  },
  timestamp: {
    fontSize: 12,
    color: '#9ca3af',
  },
  confidenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  confidenceLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  confidenceValue: {
    fontSize: 12,
    color: '#2563eb',
    fontWeight: '600',
  },
});