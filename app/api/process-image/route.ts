import { NextRequest, NextResponse } from 'next/server';
import * as vision from '@google-cloud/vision';
import axios from 'axios';
import * as exifParser from 'exif-parser';

// Type Definitions
interface Location {
  latitude: number;
  longitude: number;
}

interface BuildingDetectionResponse {
  success: boolean;
  type: string;
  address?: string;
  location?: Location;
  description?: string;
  confidence?: number;
  error?: string;
}

class BuildingDetectionService {
  private static knownBuildings = {
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

  static async detectBuilding(
    imageBuffer: Buffer, 
    currentLocation: Location
  ): Promise<BuildingDetectionResponse> {
    try {
      const client = new vision.ImageAnnotatorClient();
      
      // Text-based detection
      const textDetectionResult = await this.detectBuildingFromText(client, imageBuffer, currentLocation);
      if (textDetectionResult.success) return textDetectionResult;
      
      // Landmark detection
      const landmarkDetectionResult = await this.detectLandmarks(client, imageBuffer);
      if (landmarkDetectionResult.success) return landmarkDetectionResult;
      
      return {
        success: false,
        type: 'detection-failed',
        location: currentLocation,
        error: 'Unable to identify building'
      };
    } catch (error) {
      console.error('Building detection error:', error);
      return {
        success: false,
        type: 'detection-failed',
        location: currentLocation,
        error: 'Unexpected error during detection'
      };
    }
  }

  private static async detectBuildingFromText(
    client: vision.ImageAnnotatorClient, 
    imageBuffer: Buffer, 
    currentLocation: Location
  ): Promise<BuildingDetectionResponse> {
    try {
      const [textResult] = await client.textDetection({ image: { content: imageBuffer } });
      const detectedTexts = textResult.textAnnotations || [];
      
      const fullText = detectedTexts[0]?.description || '';
      const textCandidates = [fullText, ...detectedTexts.slice(1).map(a => a.description)]
        .filter(text => text && text.length > 5);
      
      for (const text of textCandidates) {
        // Try matching known buildings first
        const buildingInfo = await this.matchKnownBuilding(text);
        if (buildingInfo) return buildingInfo;
        
        // If no known building, use text to geocode
        const geocodeResult = await this.geocodeAddress(text);
        if (geocodeResult) return geocodeResult;
        
        // Extract potential building names or addresses from text
        const buildingNameMatches = text.match(/\b([A-Z][a-z]+ )+(?:Building|Tower|Hall|Center|Museum|Library)\b/g);
        if (buildingNameMatches) {
          for (const match of buildingNameMatches) {
            const detailedGeocodeResult = await this.geocodeAddress(match);
            if (detailedGeocodeResult) return detailedGeocodeResult;
          }
        }
        
        // Try extracting street addresses
        const addressMatches = text.match(/\b\d+\s+[A-Z][a-z]+\s+(?:Street|Ave|Avenue|Road|Rd|Boulevard|Blvd)\b/g);
        if (addressMatches) {
          for (const match of addressMatches) {
            const detailedGeocodeResult = await this.geocodeAddress(match);
            if (detailedGeocodeResult) return detailedGeocodeResult;
          }
        }
      }
      
      return {
        success: false,
        type: 'text-detection',
        location: currentLocation,
        error: 'No specific building identified'
      };
    } catch (error) {
      console.error('Text detection error:', error);
      return {
        success: false,
        type: 'text-detection',
        error: 'Text detection processing failed'
      };
    }
  }

  private static async matchKnownBuilding(text: string): Promise<BuildingDetectionResponse | null> {
    const normalizedText = text.trim().toLowerCase();
    
    for (const [buildingName, info] of Object.entries(this.knownBuildings)) {
      if (normalizedText.includes(buildingName.toLowerCase())) {
        return {
          success: true,
          type: 'text-detection',
          address: info.address,
          location: info.location,
          description: info.description,
          confidence: info.confidence
        };
      }
    }
    
    return null;
  }

  private static async detectLandmarks(
    client: vision.ImageAnnotatorClient, 
    imageBuffer: Buffer
  ): Promise<BuildingDetectionResponse> {
    try {
      const [landmarkResult] = await client.landmarkDetection({ image: { content: imageBuffer } });
      const landmarks = landmarkResult.landmarkAnnotations || [];

      if (landmarks.length > 0) {
        const topLandmark = landmarks[0];
        
        try {
          const geocodeResponse = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
            params: {
              address: topLandmark.description,
              key: process.env.GOOGLE_MAPS_API_KEY || ''
            }
          });

          const result = geocodeResponse.data.results[0];
          if (result) {
            return {
              success: true,
              type: 'landmark',
              address: result.formatted_address,
              location: {
                latitude: result.geometry.location.lat,
                longitude: result.geometry.location.lng
              },
              description: topLandmark.description,
              confidence: topLandmark.score
            };
          }
        } catch (geocodeError) {
          console.warn('Landmark geocoding failed', geocodeError);
        }
      }

      return {
        success: false,
        type: 'landmark',
        error: 'No landmarks detected'
      };
    } catch (error) {
      console.error('Landmark detection error:', error);
      return {
        success: false,
        type: 'landmark',
        error: 'Landmark detection processing failed'
      };
    }
  }

  private static async geocodeAddress(address: string): Promise<BuildingDetectionResponse | null> {
    try {
      const geocodeResponse = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
        params: {
          address,
          key: process.env.GOOGLE_MAPS_API_KEY || ''
        }
      });
  
      const result = geocodeResponse.data.results[0];
      if (result) {
        return {
          success: true,
          type: 'text-detection',
          address: result.formatted_address,
          location: {
            latitude: result.geometry.location.lat,
            longitude: result.geometry.location.lng
          },
          description: address,
          confidence: 0.7
        };
      }
      return null;
    } catch (geocodeError) {
      console.warn(`Geocoding failed for: ${address}`, geocodeError);
      return null;
    }
  }
}


export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const formData = await request.formData();
    const image = formData.get('image') as File | null;
    const currentLat = formData.get('currentLat');
    const currentLng = formData.get('currentLng');

    // Validate image
    if (!image || !(image instanceof File)) {
      return NextResponse.json(
        { success: false, error: 'Invalid image file' },
        { status: 400 }
      );
    }

    // Convert image to buffer
    const imageBuffer = Buffer.from(await image.arrayBuffer());

    // Determine location
    const currentLocation = currentLat && currentLng 
      ? { 
          latitude: parseFloat(currentLat.toString()), 
          longitude: parseFloat(currentLng.toString()) 
        }
      : await extractLocationFromExif(imageBuffer);

    if (!currentLocation) {
      return NextResponse.json(
        { success: false, error: 'Unable to determine location' },
        { status: 400 }
      );
    }

    // Detect building
    const client = new vision.ImageAnnotatorClient();
    const [textResult] = await client.textDetection({ image: { content: imageBuffer } });
    const detectedTexts = textResult.textAnnotations || [];
    
    const textCandidates = detectedTexts
      .map(a => a.description)
      .filter(text => text && text.length > 5);

    // Attempt detection through various methods
    for (const text of textCandidates) {
      const geocodeResult = await geocodeAddress(text);
      if (geocodeResult) {
        return NextResponse.json(geocodeResult, { status: 200 });
      }
    }

    // Fallback landmark detection
    const [landmarkResult] = await client.landmarkDetection({ image: { content: imageBuffer } });
    const landmarks = landmarkResult.landmarkAnnotations || [];

    if (landmarks.length > 0) {
      const topLandmark = landmarks[0];
      const geocodeResult = await geocodeAddress(topLandmark.description);
      
      if (geocodeResult) {
        return NextResponse.json(geocodeResult, { status: 200 });
      }
    }

    return NextResponse.json(
      { 
        success: false, 
        error: 'Unable to identify building',
        location: currentLocation
      },
      { status: 404 }
    );

  } catch (error) {
    console.error('Processing error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unexpected server error' 
      },
      { status: 500 }
    );
  }
}

async function extractLocationFromExif(buffer: Buffer): Promise<Location | null> {
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

async function geocodeAddress(address: string): Promise<any | null> {
  try {
    const geocodeResponse = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
      params: {
        address,
        key: process.env.GOOGLE_MAPS_API_KEY || ''
      }
    });

    const result = geocodeResponse.data.results[0];
    if (result) {
      return {
        success: true,
        type: 'geocode',
        address: result.formatted_address,
        location: {
          latitude: result.geometry.location.lat,
          longitude: result.geometry.location.lng
        },
        description: address,
        confidence: 0.7
      };
    }
    return null;
  } catch (error) {
    console.warn(`Geocoding failed for: ${address}`, error);
    return null;
  }
}