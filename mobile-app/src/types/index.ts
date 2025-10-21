export interface Location {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  type: string;
  description?: string;
  imageUri?: string;
  timestamp: string;
  confidence?: number;
}

export interface BuildingInfo {
  name: string;
  type: string;
  style: string;
  yearBuilt?: number;
  materials: string[];
  condition: string;
}

export interface LocationInfo {
  address: string;
  city: string;
  state: string;
  country: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
}

export interface AnalysisMetrics {
  confidence: number;
  accuracy: number;
  processingTime: number;
}

export interface EnvironmentalData {
  walkScore: number;
  bikeScore: number;
  airQuality: string;
  noiseLevel: string;
}

export interface CulturalSignificance {
  isHistoric: boolean;
  significance: string;
  protectionStatus: string;
}

export interface BuildingAnalysis {
  buildingInfo: BuildingInfo;
  locationInfo: LocationInfo;
  analysisMetrics: AnalysisMetrics;
  environmentalData: EnvironmentalData;
  culturalSignificance: CulturalSignificance;
  timestamp: string;
  imageUri: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface UserStats {
  totalDetections: number;
  savedLocations: number;
  buildingsAnalyzed: number;
  accuracyScore: number;
}