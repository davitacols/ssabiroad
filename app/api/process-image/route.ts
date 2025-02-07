// app/api/process-image/route.ts

import { NextRequest, NextResponse } from 'next/server';
import * as vision from '@google-cloud/vision';
import axios from 'axios';
import * as exifParser from 'exif-parser';

// Types
interface Location {
  latitude: number;
  longitude: number;
}

interface BuildingFeatures {
  architecture?: string[];
  materials?: string[];
  style?: string[];
  estimatedAge?: string;
  condition?: string;
}

interface BuildingDetectionResponse {
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

// Configuration
const KNOWN_BUILDINGS = {
  "Empire State Building": {
    address: "20 W 34th St, New York, NY 10118, USA",
    location: { latitude: 40.748817, longitude: -73.985428 },
    description: "Empire State Building",
    confidence: 0.9
  },
  "Eiffel Tower": {
    address: "Champ de Mars, 5 Avenue Anatole France, 75007 Paris, France", 
    location: { latitude: 48.858844, longitude: 2.294351 },
    description: "Eiffel Tower",
    confidence: 0.9
  }
};

// Vision Client initialization
const getVisionClient = () => {
  const base64Credentials = process.env.NEXT_PUBLIC_GCLOUD_CREDENTIALS;
  if (!base64Credentials) {
    throw new Error('GCLOUD_CREDENTIALS environment variable is not set.');
  }

  const credentialsBuffer = Buffer.from(base64Credentials, 'base64');
  const credentials = JSON.parse(credentialsBuffer.toString('utf8'));

  return new vision.ImageAnnotatorClient({
    credentials: {
      client_email: credentials.client_email,
      private_key: credentials.private_key,
    },
    projectId: credentials.project_id,
  });
};

// Utility Functions
async function extractExifLocation(buffer: Buffer): Promise<Location | null> {
  try {
    const parser = exifParser.create(buffer);
    const result = parser.parse();
    
    if (result.tags.GPSLatitude && result.tags.GPSLongitude) {
      return {
        latitude: result.tags.GPSLatitude,
        longitude: result.tags.GPSLongitude
      };
    }
  } catch (error) {
    console.error('EXIF location extraction failed:', error);
  }
  return null;
}

async function performGooglePlacesSearch(query: string, location: Location) {
  try {
    const response = await axios.get('https://maps.googleapis.com/maps/api/place/textsearch/json', {
      params: {
        query,
        location: `${location.latitude},${location.longitude}`,
        radius: 500,
        key: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
      }
    });
    return response.data.results?.[0];
  } catch (error) {
    console.error('Places API error:', error);
    return null;
  }
}

// Image Analysis Class
class BuildingAnalyzer {
  private client: vision.ImageAnnotatorClient;
  
  constructor(client: vision.ImageAnnotatorClient) {
    this.client = client;
  }

  async analyzeImage(imageBuffer: Buffer, location: Location): Promise<BuildingDetectionResponse> {
    try {
      const [
        textResult,
        landmarkResult,
        objectResult,
        propertyResult,
        webResult,
        safetyResult
      ] = await Promise.all([
        this.client.textDetection({ image: { content: imageBuffer } }),
        this.client.landmarkDetection({ image: { content: imageBuffer } }),
        this.client.objectLocalization({ image: { content: imageBuffer } }),
        this.client.imageProperties({ image: { content: imageBuffer } }),
        this.client.webDetection({ image: { content: imageBuffer } }),
        this.client.safeSearchDetection({ image: { content: imageBuffer } })
      ]);

      // Process results in order of reliability
      const textAnalysis = await this.analyzeFromText(textResult[0], location);
      if (textAnalysis.success) return this.enrichResult(textAnalysis, objectResult[0], propertyResult[0], webResult[0], safetyResult[0]);

      const landmarkAnalysis = await this.analyzeFromLandmark(landmarkResult[0]);
      if (landmarkAnalysis.success) return this.enrichResult(landmarkAnalysis, objectResult[0], propertyResult[0], webResult[0], safetyResult[0]);

      const visualAnalysis = await this.analyzeFromVisual(objectResult[0], location);
      if (visualAnalysis.success) return this.enrichResult(visualAnalysis, objectResult[0], propertyResult[0], webResult[0], safetyResult[0]);

      return { success: false, type: 'unknown', error: 'Building not identified' };

    } catch (error) {
      console.error('Analysis failed:', error);
      return { 
        success: false, 
        type: 'error', 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  private async analyzeFromText(result: vision.protos.google.cloud.vision.v1.IAnnotateImageResponse, location: Location): Promise<BuildingDetectionResponse> {
    const texts = result.textAnnotations || [];
    if (!texts.length) return { success: false, type: 'text', error: 'No text found' };

    // Check for known buildings
    for (const [name, info] of Object.entries(KNOWN_BUILDINGS)) {
      if (texts[0].description?.toLowerCase().includes(name.toLowerCase())) {
        return { success: true, type: 'known-building', ...info };
      }
    }

    // Try to find a place using detected text
    const place = await performGooglePlacesSearch(texts[0].description || '', location);
    if (place) {
      return {
        success: true,
        type: 'place-match',
        address: place.formatted_address,
        location: {
          latitude: place.geometry.location.lat,
          longitude: place.geometry.location.lng
        },
        description: place.name,
        confidence: 0.8
      };
    }

    return { success: false, type: 'text', error: 'No building found in text' };
  }

  private async analyzeFromLandmark(result: vision.protos.google.cloud.vision.v1.IAnnotateImageResponse): Promise<BuildingDetectionResponse> {
    const landmark = result.landmarkAnnotations?.[0];
    if (!landmark) return { success: false, type: 'landmark', error: 'No landmark detected' };

    return {
      success: true,
      type: 'landmark',
      description: landmark.description || 'Unknown Landmark',
      location: landmark.locations?.[0]?.latLng ? {
        latitude: landmark.locations[0].latLng.latitude || 0,
        longitude: landmark.locations[0].latLng.longitude || 0
      } : undefined,
      confidence: landmark.score || 0
    };
  }

  private async analyzeFromVisual(
    result: vision.protos.google.cloud.vision.v1.IAnnotateImageResponse,
    location: Location
  ): Promise<BuildingDetectionResponse> {
    const objects = result.localizedObjectAnnotations || [];
    const buildings = objects.filter(obj => 
      ['Building', 'House', 'Architecture'].includes(obj.name || '')
    );

    if (!buildings.length) {
      return { success: false, type: 'visual', error: 'No building detected' };
    }

    const bestMatch = buildings.reduce((a, b) => 
      (b.score || 0) > (a.score || 0) ? b : a
    );

    return {
      success: true,
      type: 'visual',
      description: bestMatch.name || 'Unknown Building',
      confidence: bestMatch.score || 0,
      location
    };
  }

  private enrichResult(
    base: BuildingDetectionResponse,
    objectData: vision.protos.google.cloud.vision.v1.IAnnotateImageResponse,
    propertyData: vision.protos.google.cloud.vision.v1.IAnnotateImageResponse,
    webData: vision.protos.google.cloud.vision.v1.IAnnotateImageResponse,
    safetyData: vision.protos.google.cloud.vision.v1.IAnnotateImageResponse
  ): BuildingDetectionResponse {
    const colors = propertyData.imagePropertiesAnnotation?.dominantColors?.colors || [];
    
    return {
      ...base,
      imageProperties: {
        dominantColors: colors.slice(0, 3).map(c => 
          `rgb(${c.color?.red || 0}, ${c.color?.green || 0}, ${c.color?.blue || 0})`
        ),
        brightness: this.calculateBrightness(colors),
        contrast: this.calculateContrast(colors)
      },
      safetyScore: this.calculateSafetyScore(safetyData.safeSearchAnnotation),
      features: this.extractBuildingFeatures(objectData, webData)
    };
  }

  private calculateBrightness(colors: vision.protos.google.cloud.vision.v1.IColorInfo[]): number {
    if (!colors.length) return 0;
    return colors.reduce((sum, color) => {
      const rgb = color.color;
      return sum + ((rgb?.red || 0) + (rgb?.green || 0) + (rgb?.blue || 0)) / (3 * 255);
    }, 0) / colors.length;
  }

  private calculateContrast(colors: vision.protos.google.cloud.vision.v1.IColorInfo[]): number {
    if (colors.length < 2) return 0;
    const brightnesses = colors.map(c => 
      ((c.color?.red || 0) + (c.color?.green || 0) + (c.color?.blue || 0)) / (3 * 255)
    );
    return Math.max(...brightnesses) - Math.min(...brightnesses);
  }

  private calculateSafetyScore(safeSearch?: vision.protos.google.cloud.vision.v1.ISafeSearchAnnotation): number {
    if (!safeSearch) return 1.0;
    const scores = {
      'VERY_UNLIKELY': 1.0,
      'UNLIKELY': 0.8,
      'POSSIBLE': 0.6,
      'LIKELY': 0.4,
      'VERY_LIKELY': 0.2
    };
    
    return Math.min(
      scores[safeSearch.violence || ''] || 1.0,
      scores[safeSearch.adult || ''] || 1.0,
      scores[safeSearch.spoof || ''] || 1.0
    );
  }

  private extractBuildingFeatures(
    objectData: vision.protos.google.cloud.vision.v1.IAnnotateImageResponse,
    webData: vision.protos.google.cloud.vision.v1.IAnnotateImageResponse
  ): BuildingFeatures {
    const objects = objectData.localizedObjectAnnotations || [];
    const webEntities = webData.webDetection?.webEntities || [];

    return {
      architecture: this.extractArchitecturalElements(objects),
      materials: this.extractMaterials(objects),
      style: this.extractStyles(webEntities)
    };
  }

  private extractArchitecturalElements(objects: vision.protos.google.cloud.vision.v1.ILocalizedObjectAnnotation[]): string[] {
    const elements = ['Window', 'Door', 'Column', 'Arch', 'Dome', 'Spire', 'Tower', 'Balcony'];
    return [...new Set(objects
      .map(obj => obj.name)
      .filter((name): name is string => 
        typeof name === 'string' && elements.includes(name)
      ))];
  }

  private extractMaterials(objects: vision.protos.google.cloud.vision.v1.ILocalizedObjectAnnotation[]): string[] {
    const materials = ['Glass', 'Steel', 'Concrete', 'Stone', 'Brick', 'Wood', 'Marble'];
    return [...new Set(objects
      .map(obj => obj.name)
      .filter((name): name is string => 
        typeof name === 'string' && materials.includes(name)
      ))];
  }

  private extractStyles(webEntities: vision.protos.google.cloud.vision.v1.IWebEntity[]): string[] {
    const styles = ['Modern', 'Gothic', 'Art Deco', 'Classical', 'Victorian', 'Contemporary'];
    return [...new Set(webEntities
      .map(e => e.description)
      .filter((desc): desc is string => 
        typeof desc === 'string' && styles.some(style => 
          desc.toLowerCase().includes(style.toLowerCase())
        )
      ))];
  }
}

// API Route Handler
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const formData = await request.formData();
    const image = formData.get('image') as File | null;
    const lat = formData.get('currentLat');
    const lng = formData.get('currentLng');

    if (!image || !(image instanceof File)) {
      return NextResponse.json(
        { success: false, error: 'Invalid or missing image' },
        { status: 400 }
      );
    }

    const imageBuffer = Buffer.from(await image.arrayBuffer());
    const location = lat && lng ? {
      latitude: parseFloat(lat.toString()),
      longitude: parseFloat(lng.toString())
    } : await extractExifLocation(imageBuffer);

    if (!location) {
      return NextResponse.json(
        { success: false, error: 'Location data required' },
        { status: 400 }
      );
    }

    const client = getVisionClient();
    const analyzer = new BuildingAnalyzer(client);
    const result = await analyzer.analyzeImage(imageBuffer, location);

    return NextResponse.json(result, { 
      status: result.success ? 200 : 404 
    });

  } catch (error) {
    console.error('Processing failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 });
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};