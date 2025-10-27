import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';

interface Point {
  x: number;
  y: number;
}

interface ARMeasurementToolProps {
  onMeasurementComplete: (distance: number) => void;
}

export default function ARMeasurementTool({ onMeasurementComplete }: ARMeasurementToolProps) {
  const [points, setPoints] = useState<Point[]>([]);
  const [measuring, setMeasuring] = useState(false);

  const startMeasurement = () => {
    setPoints([]);
    setMeasuring(true);
  };

  const addPoint = (x: number, y: number) => {
    const newPoints = [...points, { x, y }];
    setPoints(newPoints);

    if (newPoints.length === 2) {
      const distance = calculateDistance(newPoints[0], newPoints[1]);
      onMeasurementComplete(distance);
      setMeasuring(false);
    }
  };

  const calculateDistance = (p1: Point, p2: Point): number => {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    return Math.sqrt(dx * dx + dy * dy) * 0.1;
  };

  const reset = () => {
    setPoints([]);
    setMeasuring(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.controls}>
        <TouchableOpacity 
          style={[styles.button, measuring && styles.buttonActive]} 
          onPress={startMeasurement}
        >
          <Ionicons name="resize" size={20} color="#ffffff" />
          <Text style={styles.buttonText}>Measure</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.button} onPress={reset}>
          <Ionicons name="refresh" size={20} color="#ffffff" />
          <Text style={styles.buttonText}>Reset</Text>
        </TouchableOpacity>
      </View>

      {measuring && (
        <View style={styles.hint}>
          <Text style={styles.hintText}>
            {points.length === 0 ? 'Tap first point' : 'Tap second point'}
          </Text>
        </View>
      )}

      {points.map((point, index) => (
        <View
          key={index}
          style={[styles.point, { left: point.x, top: point.y }]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  controls: {
    position: 'absolute',
    top: 20,
    right: 20,
    gap: 10,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  buttonActive: {
    backgroundColor: '#6366f1',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  hint: {
    position: 'absolute',
    top: 100,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 12,
    padding: 16,
  },
  hintText: {
    fontSize: 14,
    color: '#ffffff',
    textAlign: 'center',
  },
  point: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#6366f1',
    borderWidth: 3,
    borderColor: '#ffffff',
  },
});
