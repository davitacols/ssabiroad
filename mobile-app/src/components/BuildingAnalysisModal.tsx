import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface BuildingAnalysisModalProps {
  visible: boolean;
  analysis: any;
  onClose: () => void;
  onSave: () => void;
}

export const BuildingAnalysisModal: React.FC<BuildingAnalysisModalProps> = ({
  visible,
  analysis,
  onClose,
  onSave,
}) => {
  if (!analysis) return null;

  const InfoRow = ({ icon, label, value }: { icon: string; label: string; value: string }) => (
    <View style={styles.infoRow}>
      <Ionicons name={icon as any} size={20} color="#6b7280" />
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color="#374151" />
          </TouchableOpacity>
          <Text style={styles.title}>Building Analysis</Text>
          <TouchableOpacity onPress={onSave} style={styles.saveButton}>
            <Ionicons name="bookmark" size={24} color="#2563eb" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          {analysis.imageUri && (
            <Image source={{ uri: analysis.imageUri }} style={styles.image} />
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Building Information</Text>
            <InfoRow
              icon="business"
              label="Name"
              value={analysis.buildingInfo?.name || 'Unknown'}
            />
            <InfoRow
              icon="library"
              label="Type"
              value={analysis.buildingInfo?.type || 'Unknown'}
            />
            <InfoRow
              icon="construct"
              label="Architectural Style"
              value={analysis.buildingInfo?.style || 'Unknown'}
            />
            {analysis.buildingInfo?.yearBuilt && (
              <InfoRow
                icon="calendar"
                label="Year Built"
                value={analysis.buildingInfo.yearBuilt.toString()}
              />
            )}
            <InfoRow
              icon="checkmark-circle"
              label="Condition"
              value={analysis.buildingInfo?.condition || 'Unknown'}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Location Details</Text>
            <InfoRow
              icon="location"
              label="Address"
              value={analysis.locationInfo?.address || 'Unknown'}
            />
            <InfoRow
              icon="map"
              label="City"
              value={analysis.locationInfo?.city || 'Unknown'}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Environmental Data</Text>
            <InfoRow
              icon="walk"
              label="Walk Score"
              value={`${analysis.environmentalData?.walkScore || 0}/100`}
            />
            <InfoRow
              icon="bicycle"
              label="Bike Score"
              value={`${analysis.environmentalData?.bikeScore || 0}/100`}
            />
            <InfoRow
              icon="leaf"
              label="Air Quality"
              value={analysis.environmentalData?.airQuality || 'Unknown'}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Analysis Metrics</Text>
            <InfoRow
              icon="analytics"
              label="Confidence"
              value={`${Math.round((analysis.analysisMetrics?.confidence || 0) * 100)}%`}
            />
            <InfoRow
              icon="time"
              label="Processing Time"
              value={`${analysis.analysisMetrics?.processingTime || 0}ms`}
            />
          </View>

          {analysis.culturalSignificance?.isHistoric && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Cultural Significance</Text>
              <InfoRow
                icon="library"
                label="Historic Status"
                value="Historic Building"
              />
              <InfoRow
                icon="shield"
                label="Protection Status"
                value={analysis.culturalSignificance.protectionStatus}
              />
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374151',
  },
  saveButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  image: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  section: {
    backgroundColor: '#fff',
    margin: 10,
    borderRadius: 12,
    padding: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 15,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
});