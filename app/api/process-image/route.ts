import { NextRequest, NextResponse } from 'next/server';
import { NextApiRequest, NextApiResponse } from 'next';
import * as vision from '@google-cloud/vision';
import axios from 'axios';
import * as exifParser from 'exif-parser';

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

;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Decode the Base64 credentials
  const base64Credentials = process.env.GCLOUD_CREDENTIALS;
  if (!base64Credentials) {
    res.status(500).json({ error: 'GCLOUD_CREDENTIALS environment variable is not set.' });
    return;
  }

  const credentialsBuffer = Buffer.from(base64Credentials, 'base64');
  const credentialsJson = credentialsBuffer.toString('utf8');
  const serviceAccount = JSON.parse(credentialsJson);

  // Initialize the Vision client with the credentials
  const client = new vision.ImageAnnotatorClient({
    credentials: {
      client_email: serviceAccount.client_email,
      private_key: serviceAccount.private_key,
    },
    projectId: serviceAccount.project_id,
  });

  // Your existing logic
  try {
    // For example, if you're processing an image:
    const [result] = await client.labelDetection(/* your image source */);
    // Process result...
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

class BuildingAnalyzer {
  private static readonly KNOWN_BUILDINGS = {
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

  static async analyzeImage(imageBuffer: Buffer, currentLocation: Location): Promise<BuildingDetectionResponse> {
    try {
      const client = new vision.ImageAnnotatorClient();
      const [textData, landmarkData, objectData, propertyData, webData, safetyData] = await Promise.all([
        client.textDetection({ image: { content: imageBuffer } }),
        client.landmarkDetection({ image: { content: imageBuffer } }),
        client.objectLocalization({ image: { content: imageBuffer } }),
        client.imageProperties({ image: { content: imageBuffer } }),
        client.webDetection({ image: { content: imageBuffer } }),
        client.safeSearchDetection({ image: { content: imageBuffer } })
      ]);

      // Try detection methods in order
      const textResult = await this.detectFromText(client, imageBuffer, currentLocation);
      if (textResult.success) {
        return this.enrichResult(textResult, objectData[0], propertyData[0], webData[0], safetyData[0]);
      }

      const landmarkResult = await this.detectLandmark(client, imageBuffer);
      if (landmarkResult.success) {
        return this.enrichResult(landmarkResult, objectData[0], propertyData[0], webData[0], safetyData[0]);
      }

      const visualResult = await this.detectFromVisuals(objectData[0], propertyData[0], webData[0], currentLocation);
      if (visualResult.success) {
        return this.enrichResult(visualResult, objectData[0], propertyData[0], webData[0], safetyData[0]);
      }

      return { success: false, type: 'detection-failed', error: 'Building not identified' };
    } catch (error) {
      console.error('Analysis failed:', error);
      return { success: false, type: 'detection-failed', error: 'Analysis error occurred' };
    }
  }

  private static async detectFromText(
    client: vision.ImageAnnotatorClient,
    imageBuffer: Buffer,
    location: Location
  ): Promise<BuildingDetectionResponse> {
    const [result] = await client.textDetection({ image: { content: imageBuffer } });
    const texts = result.textAnnotations || [];
    const allTexts = [texts[0]?.description || '', ...texts.slice(1).map(t => t.description || '')];
  
    for (const text of allTexts.filter(t => t.length > 5)) {
      const knownBuilding = await this.matchKnownBuilding(text);
      if (knownBuilding) return knownBuilding;
  
      const geocoded = await this.geocodeText(text);
      if (geocoded) return geocoded;
  
      const buildingNames = text.match(/\b([A-Z][a-z]+ )+(?:Building|Tower|Hall|Center|Museum|Library)\b/g);
      if (buildingNames) {
        for (const name of buildingNames) {
          const geocoded = await this.geocodeText(name);
          if (geocoded) return geocoded;
        }
      }
  
      const addresses = text.match(/\b\d+\s+[A-Z][a-z]+\s+(?:Street|Ave|Avenue|Road|Rd|Boulevard|Blvd)\b/g);
      if (addresses) {
        for (const address of addresses) {
          const geocoded = await this.geocodeText(address);
          if (geocoded) return geocoded;
        }
      }
  
      // Check Google Places for nearby matches
      const placeMatch = await this.findNearbyPlaceByName(text, location);
      if (placeMatch) return placeMatch;
    }
  
    return { success: false, type: 'text-detection', error: 'No building found in text' };
  }
  
  private static async findNearbyPlaceByName(name: string, location: Location): Promise<BuildingDetectionResponse | null> {
    try {
      const response = await axios.get('https://maps.googleapis.com/maps/api/place/textsearch/json', {
        params: {
          query: name,
          location: `${location.latitude},${location.longitude}`,
          radius: 500, // Limit search to nearby buildings
          key: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
        }
      });
  
      const place = response.data.results?.[0];
      if (place) {
        return {
          success: true,
          type: 'place-match',
          address: place.formatted_address,
          location: {
            latitude: place.geometry.location.lat,
            longitude: place.geometry.location.lng
          },
          description: name,
          confidence: 0.8
        };
      }
    } catch (error) {
      console.warn('Google Places API failed:', error);
    }
    return null;
  }
  
  private static async detectLandmark(
    client: vision.ImageAnnotatorClient,
    imageBuffer: Buffer
  ): Promise<BuildingDetectionResponse> {
    const [result] = await client.landmarkDetection({ image: { content: imageBuffer } });
    const landmark = result.landmarkAnnotations?.[0];
    
    if (landmark) {
      try {
        const geocoded = await this.geocodeText(landmark.description || '');
        if (geocoded) {
          return {
            ...geocoded,
            confidence: landmark.score,
            type: 'landmark'
          };
        }
      } catch (error) {
        console.warn('Landmark geocoding failed:', error);
      }
    }

    return { success: false, type: 'landmark', error: 'No landmark detected' };
  }

  private static async detectFromVisuals(
    objectData: vision.protos.google.cloud.vision.v1.IAnnotateImageResponse,
    propertyData: vision.protos.google.cloud.vision.v1.IAnnotateImageResponse,
    webData: vision.protos.google.cloud.vision.v1.IAnnotateImageResponse,
    location: Location
  ): Promise<BuildingDetectionResponse> {
    const objects = objectData.localizedObjectAnnotations || [];
    const buildingObjects = objects.filter(obj => 
      ['Building', 'House', 'Architecture', 'Tower', 'Skyscraper'].includes(obj.name || '')
    );

    if (buildingObjects.length > 0) {
      const bestMatch = buildingObjects.reduce((a, b) => (b.score || 0) > (a.score || 0) ? b : a);
      const nearbyPlace = await this.findNearbyPlace(location);

      return {
        success: true,
        type: 'visual-detection',
        description: bestMatch.name || 'Unknown Building',
        confidence: bestMatch.score || 0,
        location: nearbyPlace?.location || location,
        address: nearbyPlace?.address,
        features: this.extractFeatures(objects, webData.webDetection?.webEntities || [], propertyData)
      };
    }

    return { success: false, type: 'visual-detection', error: 'No building features found' };
  }

  private static async findNearbyPlace(location: Location) {
    try {
      const response = await axios.get('https://maps.googleapis.com/maps/api/place/nearbysearch/json', {
        params: {
          location: `${location.latitude},${location.longitude}`,
          radius: 100,
          type: 'point_of_interest',
          key: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
        }
      });

      const place = response.data.results?.[0];
      if (place) {
        return {
          location: {
            latitude: place.geometry.location.lat,
            longitude: place.geometry.location.lng
          },
          address: place.vicinity
        };
      }
    } catch (error) {
      console.error('Place search failed:', error);
    }
    return null;
  }

  private static async matchKnownBuilding(text: string): Promise<BuildingDetectionResponse | null> {
    const normalizedText = text.toLowerCase();
    for (const [name, info] of Object.entries(this.KNOWN_BUILDINGS)) {
      if (normalizedText.includes(name.toLowerCase())) {
        return {
          success: true,
          type: 'known-building',
          ...info
        };
      }
    }
    return null;
  }

  private static async geocodeText(text: string): Promise<BuildingDetectionResponse | null> {
    try {
      const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
        params: {
          address: text,
          key: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
        }
      });

      const result = response.data.results[0];
      if (result) {
        return {
          success: true,
          type: 'geocoded',
          address: result.formatted_address,
          location: {
            latitude: result.geometry.location.lat,
            longitude: result.geometry.location.lng
          },
          description: text,
          confidence: 0.7
        };
      }
    } catch (error) {
      console.warn('Geocoding failed:', error);
    }
    return null;
  }

  private static extractFeatures(
    objects: vision.protos.google.cloud.vision.v1.ILocalizedObjectAnnotation[],
    webEntities: vision.protos.google.cloud.vision.v1.IWebEntity[],
    propertyData: vision.protos.google.cloud.vision.v1.IAnnotateImageResponse
  ): BuildingFeatures {
    const architecturalElements = ['Window', 'Door', 'Column', 'Arch', 'Dome', 'Spire', 'Tower', 'Balcony'];
    const materials = ['Glass', 'Steel', 'Concrete', 'Stone', 'Brick', 'Wood', 'Marble'];
    const styles = ['Modern', 'Gothic', 'Art Deco', 'Classical', 'Victorian', 'Contemporary', 'Baroque', 'Renaissance', 'Minimalist', 'Brutalist'];

    return {
      architecture: [...new Set(objects.map(obj => obj.name).filter(name => architecturalElements.includes(name || '')))],
      materials: [...new Set(objects.map(obj => obj.name).filter(name => materials.includes(name || '')))],
      style: [...new Set(webEntities.map(e => e.description).filter(desc => styles.some(style => desc?.toLowerCase().includes(style.toLowerCase()))))]
    };
  }

  private static enrichResult(
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
      safetyScore: this.calculateSafety(safetyData.safeSearchAnnotation),
      features: {
        ...base.features,
        ...this.extractFeatures(
          objectData.localizedObjectAnnotations || [],
          webData.webDetection?.webEntities || [],
          propertyData
        )
      }
    };
  }

  private static calculateBrightness(colors: vision.protos.google.cloud.vision.v1.IColorInfo[]): number {
    if (!colors.length) return 0;
    return colors.reduce((sum, color) => {
      const rgb = color.color;
      return sum + ((rgb?.red || 0) + (rgb?.green || 0) + (rgb?.blue || 0)) / (3 * 255);
    }, 0) / colors.length;
  }

  private static calculateContrast(colors: vision.protos.google.cloud.vision.v1.IColorInfo[]): number {
    if (colors.length < 2) return 0;
    const brightnesses = colors.map(c => 
      ((c.color?.red || 0) + (c.color?.green || 0) + (c.color?.blue || 0)) / (3 * 255)
    );
    return Math.max(...brightnesses) - Math.min(...brightnesses);
  }

  private static calculateSafety(safeSearch?: vision.protos.google.cloud.vision.v1.ISafeSearchAnnotation): number {
    if (!safeSearch) return 1.0;
    const scores = {
      'VERY_UNLIKELY': 1.0,
      'UNLIKELY': 0.8,
      'POSSIBLE': 0.6,
      'LIKELY': 0.4,
      'VERY_LIKELY': 0.2
    };
    return ([
      scores[safeSearch.violence || ''] || 1.0,
      scores[safeSearch.adult || ''] || 1.0,
      scores[safeSearch.spoof || ''] || 1.0
    ].reduce((a, b) => a + b) / 3);
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const formData = await request.formData();
    const image = formData.get('image') as File | null;
    const lat = formData.get('currentLat');
    const lng = formData.get('currentLng');

    if (!image || !(image instanceof File)) {
      return NextResponse.json({ success: false, error: 'Invalid image' }, { status: 400 });
    }

    const imageBuffer = Buffer.from(await image.arrayBuffer());
    const location = lat && lng ? {
      latitude: parseFloat(lat.toString()),
      longitude: parseFloat(lng.toString())
    } : await extractExifLocation(imageBuffer);

    if (!location) {
      return NextResponse.json({ success: false, error: 'Location required' }, { status: 400 });
    }

    const result = await BuildingAnalyzer.analyzeImage(imageBuffer, location);
    return NextResponse.json(result, { status: result.success ? 200 : 404 });
  } catch (error) {
    console.error('Request failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Server error'
    }, { status: 500 });
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
        key: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''
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