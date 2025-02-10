// app/api/process-image/types.ts
export interface Location {
  latitude: number;
  longitude: number;
}

export interface BuildingFeatures {
  architecture?: string[];
  materials?: string[];
  style?: string[];
  estimatedAge?: string;
  condition?: string;
}

export interface BuildingDetectionResponse {
  success: boolean;
  type: string;
  address?: string;
  location?: Location;
  description?: string;
  confidence?: number;
  features?: BuildingFeatures;
  similarBuildings?: string[];
  safetyScore?: number;
  error?: string;
  imageProperties?: {
    dominantColors: string[];
    brightness: number;
    contrast: number;
  };
}