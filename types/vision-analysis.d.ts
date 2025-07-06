// Type definitions for AI vision analysis

export interface VisionData {
  text: string;
  landmarks: Array<{
    description: string;
    score: number;
    locations: Array<{
      latLng: {
        latitude: number;
        longitude: number;
      };
    }>;
  }>;
  labels: Array<{
    description: string;
    score: number;
  }>;
  logos: Array<{
    description: string;
    score: number;
  }>;
  objects: Array<{
    name: string;
    score: number;
  }>;
}

export interface AIAnalysis {
  name: string;
  city?: string;
  country?: string;
  type: string;
  confidence: number;
  features?: string[];
  description: string;
}

export interface LocationSearchResult {
  name: string;
  address: string;
  location: {
    latitude: number;
    longitude: number;
  };
  confidence: number;
  placeId: string;
}