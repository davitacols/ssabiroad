export type BuildingResponse = {
  success: boolean;
  type: 'landmark' | 'building' | 'image-metadata' | 'text-detection' | 'unknown';
  description?: string;
  confidence?: number;
  location?: {
    lat: number;
    lng: number;
  };
  address?: string;
  error?: string;
  buildings?: {
    description: string;
    confidence: number;
    location?: {
      lat: number;
      lng: number;
    };
    address?: string;
  }[];
};

// EnhancedBuildingResponse inherits properties from BuildingResponse and adds more fields
export type EnhancedBuildingResponse = BuildingResponse & {
  analysis?: {
    colorProperties?: {
      dominantColors: string[];
      colorStatistics: Record<string, number>;
    };
    imageQuality?: string; // e.g., "high", "medium", "low"
  };
  nearbyPlaces?: {
    name: string;
    location: {
      lat: number;
      lng: number;
    };
    distance?: number; // in meters
    type?: string; // e.g., 'restaurant', 'park'
  }[];
  popularTimes?: {
    day: string;
    hours: { hour: number; visitors: number }[];
  };
  estimatedWaitTime?: number; // in minutes
  errorMessage?: string;
};
