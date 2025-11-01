import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useState, useRef, useEffect } from 'react';

interface BuildingInfo {
  name: string;
  architecturalStyle: string;
  yearBuilt: number;
  floors: number;
  distance: number;
  energyRating: string;
}

interface BuildingInfoOverlayProps {
  building: BuildingInfo;
  position: { x: number; y: number };
  onPress: () => void;
}

export default function BuildingInfoOverlay({ building, position, onPress }: BuildingInfoOverlayProps) {
  const [expanded, setExpanded] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const toggleExpanded = () => {
    setExpanded(!expanded);
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          left: position.x,
          top: position.y,
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <TouchableOpacity onPress={onPress} activeOpacity={0.9}>
        <View style={styles.marker}>
          <Ionicons name="business" size={28} color="#ffffff" />
        </View>
        
        <View style={styles.infoCard}>
          <Text style={styles.buildingName} numberOfLines={1}>
            {building.name}
          </Text>
          
          <View style={styles.infoRow}>
            <Ionicons name="business-outline" size={14} color="#9ca3af" />
            <Text style={styles.infoText}>{building.architecturalStyle}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={14} color="#9ca3af" />
            <Text style={styles.infoText}>{building.yearBuilt}</Text>
          </View>
          
          <View style={styles.distanceBadge}>
            <Ionicons name="location" size={12} color="#6366f1" />
            <Text style={styles.distanceText}>
              {building.distance < 1 
                ? `${Math.round(building.distance * 1000)}m` 
                : `${building.distance.toFixed(1)}km`}
            </Text>
          </View>
        </View>

        <View style={styles.pointer} />
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    alignItems: 'center',
  },
  marker: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  infoCard: {
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
    minWidth: 160,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  buildingName: {
    fontSize: 14,
    fontFamily: 'LeagueSpartan_700Bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  infoText: {
    fontSize: 12,
    color: '#9ca3af',
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginTop: 6,
    alignSelf: 'flex-start',
    gap: 4,
  },
  distanceText: {
    fontSize: 11,
    fontFamily: 'LeagueSpartan_600SemiBold',
    color: '#6366f1',
  },
  pointer: {
    width: 2,
    height: 30,
    backgroundColor: '#6366f1',
    marginTop: 8,
    alignSelf: 'center',
  },
});
