import { NextRequest, NextResponse } from 'next/server';
import * as vision from '@google-cloud/vision';
import axios from 'axios';
import * as exifParser from 'exif-parser';

// Enhanced Type Definitions
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
      
      // Parallel processing of different detection methods
      const [
        textDetection,
        landmarkDetection,
        objectDetection,
        imageProperties,
        webDetection,
        safeSearch
      ] = await Promise.all([
        client.textDetection({ image: { content: imageBuffer } }),
        client.landmarkDetection({ image: { content: imageBuffer } }),
        client.objectLocalization({ image: { content: imageBuffer } }),
        client.imageProperties({ image: { content: imageBuffer } }),
        client.webDetection({ image: { content: imageBuffer } }),
        client.safeSearchDetection({ image: { content: imageBuffer } })
      ]);

      // Process text-based detection
      const textResult = await this.detectBuildingFromText(client, imageBuffer, currentLocation);
      if (textResult.success) {
        return this.enrichDetectionResult(textResult, objectDetection[0], imageProperties[0], webDetection[0], safeSearch[0]);
      }

      // Process landmark detection
      const landmarkResult = await this.detectLandmarks(client, imageBuffer);
      if (landmarkResult.success) {
        return this.enrichDetectionResult(landmarkResult, objectDetection[0], imageProperties[0], webDetection[0], safeSearch[0]);
      }

      // Attempt detection using visual features
      const visualResult = await this.detectBuildingFromVisualFeatures(
        objectDetection[0],
        imageProperties[0],
        webDetection[0],
        currentLocation
      );

      if (visualResult.success) {
        return this.enrichDetectionResult(visualResult, objectDetection[0], imageProperties[0], webDetection[0], safeSearch[0]);
      }

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

  private static async detectBuildingFromVisualFeatures(
    objectResult: vision.protos.google.cloud.vision.v1.IAnnotateImageResponse,
    propertyResult: vision.protos.google.cloud.vision.v1.IAnnotateImageResponse,
    webResult: vision.protos.google.cloud.vision.v1.IAnnotateImageResponse,
    currentLocation: Location
  ): Promise<BuildingDetectionResponse> {
    const objects = objectResult.localizedObjectAnnotations || [];
    const webEntities = webResult.webDetection?.webEntities || [];
    
    // Check for building-related objects
    const buildingObjects = objects.filter(obj => 
      ['Building', 'House', 'Architecture', 'Tower', 'Skyscraper'].includes(obj.name || '')
    );

    if (buildingObjects.length > 0) {
      // Get the most confident building detection
      const topBuilding = buildingObjects.reduce((prev, current) => 
        (current.score || 0) > (prev.score || 0) ? current : prev
      );

      // Extract relevant web entities
      const relevantEntities = webEntities
        .filter(entity => (entity.score || 0) > 0.5)
        .map(entity => entity.description || '')
        .filter(desc => desc.length > 0);

      // Attempt to get location from nearby landmarks
      const locationInfo = await this.findNearbyLandmarks(currentLocation);

      return {
        success: true,
        type: 'visual-detection',
        description: topBuilding.name || 'Unknown Building',
        confidence: topBuilding.score || 0,
        location: locationInfo?.location || currentLocation,
        address: locationInfo?.address,
        features: {
          architecture: this.extractArchitecturalFeatures(objects),
          materials: this.extractBuildingMaterials(objects),
          style: this.extractBuildingStyle(relevantEntities),
          condition: this.assessBuildingCondition(propertyResult)
        },
        similarBuildings: relevantEntities.slice(0, 5)
      };
    }

    return {
      success: false,
      type: 'visual-detection',
      error: 'No building features detected'
    };
  }

  private static async enrichDetectionResult(
    baseResult: BuildingDetectionResponse,
    objectResult: vision.protos.google.cloud.vision.v1.IAnnotateImageResponse,
    propertyResult: vision.protos.google.cloud.vision.v1.IAnnotateImageResponse,
    webResult: vision.protos.google.cloud.vision.v1.IAnnotateImageResponse,
    safeSearchResult: vision.protos.google.cloud.vision.v1.IAnnotateImageResponse
  ): Promise<BuildingDetectionResponse> {
    const colors = propertyResult.imagePropertiesAnnotation?.dominantColors?.colors || [];
    const safeSearch = safeSearchResult.safeSearchAnnotation;

    return {
      ...baseResult,
      imageProperties: {
        dominantColors: colors.slice(0, 3).map(color => 
          `rgb(${color.color?.red || 0}, ${color.color?.green || 0}, ${color.color?.blue || 0})`
        ),
        brightness: this.calculateAverageBrightness(colors),
        contrast: this.calculateImageContrast(colors)
      },
      safetyScore: this.calculateSafetyScore(safeSearch),
      features: {
        ...baseResult.features,
        architecture: this.extractArchitecturalFeatures(objectResult.localizedObjectAnnotations || []),
        materials: this.extractBuildingMaterials(objectResult.localizedObjectAnnotations || []),
        style: this.extractBuildingStyle(webResult.webDetection?.webEntities || [])
      }
    };
  }

  private static async findNearbyLandmarks(location: Location): Promise<{ location: Location; address: string } | null> {
    try {
      const response = await axios.get('https://maps.googleapis.com/maps/api/place/nearbysearch/json', {
        params: {
          location: `${location.latitude},${location.longitude}`,
          radius: 100,
          type: 'point_of_interest',
          key: process.env.GOOGLE_MAPS_API_KEY
        }
      });

      if (response.data.results?.[0]) {
        const place = response.data.results[0];
        return {
          location: {
            latitude: place.geometry.location.lat,
            longitude: place.geometry.location.lng
          },
          address: place.vicinity
        };
      }
    } catch (error) {
      console.error('Nearby landmarks search failed:', error);
    }
    return null;
  }

  private static calculateSafetyScore(safeSearch: vision.protos.google.cloud.vision.v1.ISafeSearchAnnotation | undefined): number {
    if (!safeSearch) return 1.0;
    
    const likelihoodMap: { [key: string]: number } = {
      'VERY_UNLIKELY': 1.0,
      'UNLIKELY': 0.8,
      'POSSIBLE': 0.6,
      'LIKELY': 0.4,
      'VERY_LIKELY': 0.2
    };

    const scores = [
      likelihoodMap[safeSearch.violence || ''] || 1.0,
      likelihoodMap[safeSearch.adult || ''] || 1.0,
      likelihoodMap[safeSearch.spoof || ''] || 1.0
    ];

    return scores.reduce((a, b) => a + b, 0) / scores.length;
  }

  private static extractArchitecturalFeatures(objects: vision.protos.google.cloud.vision.v1.ILocalizedObjectAnnotation[]): string[] {
    const features = new Set<string>();
    const architecturalElements = [
      'Window', 'Door', 'Column', 'Arch', 'Dome', 'Spire', 'Tower', 'Balcony'
    ];

    objects.forEach(obj => {
      if (architecturalElements.includes(obj.name || '')) {
        features.add(obj.name || '');
      }
    });

    return Array.from(features);
  }

  private static extractBuildingMaterials(objects: vision.protos.google.cloud.vision.v1.ILocalizedObjectAnnotation[]): string[] {
    const materials = new Set<string>();
    const commonMaterials = [
      'Glass', 'Steel', 'Concrete', 'Stone', 'Brick', 'Wood', 'Marble'
    ];

    objects.forEach(obj => {
      if (commonMaterials.includes(obj.name || '')) {
        materials.add(obj.name || '');
      }
    });

    return Array.from(materials);
  }

  private static extractBuildingStyle(entities: vision.protos.google.cloud.vision.v1.IWebEntity[]): string[] {
    const styles = new Set<string>();
    const architecturalStyles = [
      'Modern', 'Gothic', 'Art Deco', 'Classical', 'Victorian', 'Contemporary',
      'Baroque', 'Renaissance', 'Minimalist', 'Brutalist'
    ];

    entities.forEach(entity => {
      const description = entity.description || '';
      architecturalStyles.forEach(style => {
        if (description.toLowerCase().includes(style.toLowerCase())) {
          styles.add(style);
        }
      });
    });

    return Array.from(styles);
  }

  private static calculateAverageBrightness(colors: vision.protos.google.cloud.vision.v1.IColorInfo[]): number {
    if (colors.length === 0) return 0;

    const totalBrightness = colors.reduce((sum, color) => {
      const rgb = color.color;
      if (!rgb) return sum;
      return sum + ((rgb.red || 0) + (rgb.green || 0) + (rgb.blue || 0)) / (3 * 255);
    }, 0);

    return totalBrightness / colors.length;
  }

  private static calculateImageContrast(colors: vision.protos.google.cloud.vision.v1.IColorInfo[]): number {
    if (colors.length < 2) return 0;

    const brightnesses = colors.map(color => {
      const rgb = color.color;
      if (!rgb) return 0;
      return ((rgb.red || 0) + (rgb.green || 0) + (rgb.blue || 0)) / (3 * 255);
    });

    const maxBrightness = Math.max(...brightnesses);
    const minBrightness = Math.min(...brightnesses);

    return maxBrightness - minBrightness;
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

    if (!image || !(image instanceof File)) {
      return NextResponse.json(
        { success: false, error: 'Invalid image file' },
        { status: 400 }
      );
    }

    const imageBuffer = Buffer.from(await image.arrayBuffer());
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

    const result = await BuildingDetectionService.detectBuilding(
      imageBuffer,
      currentLocation
    );

    return NextResponse.json(result, { 
      status: result.success ? 200 : 404 
    });

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