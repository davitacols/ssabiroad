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
