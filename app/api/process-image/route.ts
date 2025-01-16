import { NextResponse } from 'next/server';
import { v1 as vision } from '@google-cloud/vision';
import exifParser from 'exif-parser';
import { promises as fs } from 'fs';

// Types
type TravelMode = 'DRIVING' | 'WALKING' | 'BICYCLING' | 'TRANSIT' | 'FLIGHT' | 'SHIP';
type BuildingType = 'commercial' | 'residential' | 'historical' | 'industrial' | 'religious' | 'educational';
type PrimaryMode = 'road' | 'transit' | 'flight' | 'ship';
type TrafficSeverity = 'low' | 'medium' | 'high';
type CrowdDensity = 'low' | 'medium' | 'high';

interface Location {
  lat: number;
  lng: number;
  altitude?: number;
  accuracy?: number;
}

interface DirectionStep {
  instruction: string;
  distance: string;
  duration: string;
  travelMode: TravelMode;
  polyline?: string;
  trafficInfo?: string;
  alternatives?: Array<{ instruction: string; duration: string }>;
}

interface Directions {
  distance: string;
  duration: string;
  primaryMode: PrimaryMode;
  steps: DirectionStep[];
  alternativeRoutes?: Directions[];
  trafficSeverity?: TrafficSeverity;
  estimatedCost?: {
    value: number;
    currency: string;
  };
}

interface Building {
  description: string;
  confidence: number;
  location?: Location;
  address?: string;
  buildingType?: BuildingType;
  estimatedHeight?: number;
  estimatedAge?: number;
  historicalInfo?: {
    constructionYear?: number;
    architect?: string;
    historicalEvents?: Array<{ year: number; description: string }>;
    culturalSignificance?: string;
    architecturalStyle?: string;
  };
  openingHours?: Record<string, string>;
  accessibility?: {
    wheelchairAccess: boolean;
    elevators: boolean;
    parkingAvailable: boolean;
  };
  nearbyAmenities?: Array<{
    type: string;
    name: string;
    distance: string;
  }>;
  weather?: {
    temperature: number;
    conditions: string;
    humidity: number;
    windSpeed: number;
  };
  images?: {
    thumbnail: string;
    streetView?: string;
    historical?: string[];
  };
}

interface BuildingResponse {
  success: boolean;
  type: 'landmark' | 'text-detection' | 'image-metadata' | 'building' | 'unknown';
  description?: string;
  confidence?: number;
  location?: Location;
  address?: string;
  directions?: Directions;
  errorMessage?: string;
  buildings?: Building[];
  analysis?: {
    timeOfDay: string;
    lightingConditions: string;
    weatherConditions: string;
    crowdDensity?: CrowdDensity;
    mainColors: string[];
    architecturalFeatures: string[];
  };
  recommendations?: {
    bestTimeToVisit: string;
    similarBuildings: string[];
    nearbyAttractions: string[];
  };
}

// Vision client with enhanced error handling and caching
class VisionClient {
  private static instance: vision.ImageAnnotatorClient | null = null;
  private static readonly cache = new Map<string, { data: unknown; timestamp: number }>();
  private static readonly MAX_RETRIES = 3;
  private static readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
  private static readonly RETRY_DELAY = 1000; // Base delay in milliseconds

  private static async withRetry<T>(operation: () => Promise<T>): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < this.MAX_RETRIES; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        if (attempt === this.MAX_RETRIES - 1) break;
        
        const delay = this.RETRY_DELAY * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw new Error(`Operation failed after ${this.MAX_RETRIES} retries: ${lastError?.message}`);
  }

  private static async readCredentialsFile(filePath: string): Promise<unknown> {
    try {
      const fileContent = await fs.readFile(filePath, 'utf8');
      return JSON.parse(fileContent);
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
        throw new Error(`Credentials file not found: ${filePath}`);
      }
      throw error;
    }
  }

  static async getInstance(): Promise<vision.ImageAnnotatorClient> {
    try {
      if (this.instance) return this.instance;

      const credentialsEnv = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
      if (!credentialsEnv) {
        throw new Error('Missing GOOGLE_APPLICATION_CREDENTIALS_JSON environment variable');
      }

      const isFilePath = credentialsEnv.endsWith('.json');
      
      let credentials: unknown;
      if (isFilePath) {
        credentials = await this.readCredentialsFile(credentialsEnv);
      } else {
        try {
          credentials = JSON.parse(credentialsEnv);
        } catch (error) {
          throw new Error('Invalid JSON format in GOOGLE_APPLICATION_CREDENTIALS_JSON');
        }
      }

      if (typeof credentials !== 'object' || !credentials || !('project_id' in credentials)) {
        throw new Error('Invalid credentials format');
      }

      this.instance = await this.withRetry(() => 
        new vision.ImageAnnotatorClient({
          credentials: credentials as object,
          projectId: (credentials as { project_id: string }).project_id
        })
      );

      return this.instance;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to initialize Vision client: ${errorMessage}`);
    }
  }

  static getCached<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    if (Date.now() - cached.timestamp > this.CACHE_DURATION) {
      this.cache.delete(key);
      return null;
    }

    return cached.data as T;
  }

  static setCache<T>(key: string, data: T): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  static clearCache(): void {
    this.cache.clear();
  }
}

// Location and Navigation Services
class LocationService {
  private static readonly API_BASE_URL = "https://maps.googleapis.com/maps/api";

  public static async reverseGeocode(location: Location): Promise<string> {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY || "";
    const response = await fetch(
      `${this.API_BASE_URL}/geocode/json?latlng=${location.lat},${location.lng}&key=${apiKey}`
    ).then((res) => res.json());

    if (response.status === "OK" && response.results.length > 0) {
      return response.results[0].formatted_address;
    }
    throw new Error("Unable to retrieve address for the provided location.");
  }

  public static async getDirections(
    origin: Location,
    destination: Location,
    travelMode: TravelMode = "DRIVING"
  ): Promise<Directions> {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY || "";
    const response = await fetch(
      `${this.API_BASE_URL}/directions/json?origin=${origin.lat},${origin.lng}&destination=${destination.lat},${destination.lng}&mode=${travelMode.toLowerCase()}&key=${apiKey}`
    ).then((res) => res.json());

    if (response.status === "OK" && response.routes.length > 0) {
      const route = response.routes[0];
      const steps = route.legs[0]?.steps.map((step: { 
        html_instructions: string;
        distance: { text: string };
        duration: { text: string };
        travel_mode: string;
        polyline?: { points: string };
        traffic_speed_entry?: Array<{ traffic_condition: string }>;
      }) => ({
        instruction: step.html_instructions,
        distance: step.distance.text,
        duration: step.duration.text,
        travelMode: step.travel_mode.toUpperCase() as TravelMode,
        polyline: step.polyline?.points,
        trafficInfo: step.traffic_speed_entry?.map(entry => entry.traffic_condition),
      })) || [];

      return {
        distance: route.legs[0].distance.text,
        duration: route.legs[0].duration.text,
        primaryMode: travelMode.toLowerCase() as PrimaryMode,
        steps,
        trafficSeverity: "medium", // Placeholder, enhance as needed
      };
    }

    throw new Error("Unable to retrieve directions for the provided locations.");
  }
}

class BuildingDetectionService {
  static async detectBuilding(buffer: Buffer, currentLocation: Location): Promise<BuildingResponse> {
    const client = await VisionClient.getInstance();
    
    const methods = [
      this.detectLandmark,
      this.detectText,
      this.extractExifData,
      this.detectObjects
    ];

    for (const method of methods) {
      try {
        const result = await method.call(this, buffer, currentLocation, client);
        if (result.success) return result;
      } catch (err) {
        console.error(`Detection method failed: ${method.name}`, err);
      }
    }

    return {
      success: false,
      type: 'unknown',
      errorMessage: 'No buildings detected in the image'
    };
  }

  private static async detectLandmark(
    buffer: Buffer,
    currentLocation: Location,
    client: vision.ImageAnnotatorClient
  ): Promise<BuildingResponse> {
    const [result] = await client.landmarkDetection({ image: { content: buffer } });
    const landmark = result.landmarkAnnotations?.[0];
    
    if (!landmark?.locations?.[0]?.latLng) {
      return { success: false, type: 'landmark' };
    }

    const location = {
      lat: landmark.locations[0].latLng.latitude || 0,
      lng: landmark.locations[0].latLng.longitude || 0
    };

    const [address, directions] = await Promise.all([
      this.getAddress(location),
      LocationService.getDirections(currentLocation, location)
    ]);

    return {
      success: true,
      type: 'landmark',
      description: landmark.description || 'Unknown landmark',
      confidence: landmark.score || 0,
      location,
      ...(address && { address }),
      ...(directions && { directions })
    };
  }

  private static async detectText(
    buffer: Buffer,
    currentLocation: Location,
    client: vision.ImageAnnotatorClient
  ): Promise<BuildingResponse> {
    const [result] = await client.textDetection({ image: { content: buffer } });
    const text = result.textAnnotations?.[0]?.description;
    
    if (!text) return { success: false, type: 'text-detection' };

    const place = await this.searchPlace(text);
    if (!place.location) return { success: false, type: 'text-detection' };

    const directions = await LocationService.getDirections(currentLocation, place.location);

    return {
      success: true,
      type: 'text-detection',
      description: text,
      confidence: 0.8,
      location: place.location,
      address: place.address,
      ...(directions && { directions })
    };
  }

  private static async extractExifData(
    buffer: Buffer,
    currentLocation: Location
  ): Promise<BuildingResponse> {
    const parser = exifParser.create(buffer);
    const { tags } = parser.parse();
    
    if (!tags?.GPSLatitude || !tags?.GPSLongitude) {
      return { success: false, type: 'image-metadata' };
    }

    const location = { lat: tags.GPSLatitude, lng: tags.GPSLongitude };
    const [address, directions] = await Promise.all([
      this.getAddress(location),
      LocationService.getDirections(currentLocation, location)
    ]);

    return {
      success: true,
      type: 'image-metadata',
      location,
      ...(address && { address }),
      ...(directions && { directions })
    };
  }

  private static async detectObjects(
    buffer: Buffer,
    currentLocation: Location,
    client: vision.ImageAnnotatorClient
  ): Promise<BuildingResponse> {
    const [result] = await client.objectLocalization({ image: { content: buffer } });
    const buildings = result.localizedObjectAnnotations?.filter(obj =>
      ['Building', 'House', 'Residential Building', 'Architecture'].includes(obj.name || '')
    );

    if (!buildings?.length) return { success: false, type: 'building' };

    const buildingDetails = await Promise.all(
      buildings.map(async (building) => {
        const vertex = building.boundingPoly?.normalizedVertices?.[0];
        if (!vertex) return null;

        const location = { lat: vertex.y || 0, lng: vertex.x || 0 };
        const [address, directions] = await Promise.all([
          this.getAddress(location),
          LocationService.getDirections(currentLocation, location)
        ]);

        return {
          description: building.name || 'Unknown building',
          confidence: building.score || 0,
          location,
          ...(address && { address }),
          ...(directions && { directions })
        };
      })
    );

    const validBuildings = buildingDetails.filter((b): b is Building => b !== null);
    
    return {
      success: true,
      type: 'building',
      description: validBuildings.map(b => b.description).join(', '),
      confidence: Math.max(...validBuildings.map(b => b.confidence)),
      buildings: validBuildings
    };
  }

  private static async getAddress(location: Location): Promise<string | undefined> {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) return undefined;

    const cacheKey = `address_${location.lat}_${location.lng}`;
    const cached = VisionClient.getCached<string>(cacheKey);
    if (cached) return cached;

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${location.lat},${location.lng}&key=${apiKey}`
    );
    const data = await response.json();
    
    const address = data.status === 'OK' ? data.results[0]?.formatted_address : undefined;
    if (address) VisionClient.setCache(cacheKey, address);
    
    return address;
  }

  private static async searchPlace(query: string): Promise<{ location?: Location; address?: string }> {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) throw new Error('Missing Google Maps API key');

    const cacheKey = `place_${query}`;
    const cached = VisionClient.getCached<{ location?: Location; address?: string }>(cacheKey);
    if (cached) return cached;

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${apiKey}`
    );
    const data = await response.json() as {
      status: string;
      results: Array<{
        geometry: { location: Location };
        formatted_address: string;
      }>;
    };

    if (data.status !== 'OK' || !data.results.length) {
      return {};
    }

    const result = {
      location: data.results[0].geometry.location,
      address: data.results[0].formatted_address,
    };

    VisionClient.setCache(cacheKey, result);
    return result;
  }
}

// Helper function for location determination
async function getLocation(
  imageBuffer: Buffer, 
  currentLat: FormDataEntryValue | null, 
  currentLng: FormDataEntryValue | null
): Promise<Location | null> {
  // First try to get location from provided coordinates
  if (currentLat && currentLng) {
    const lat = parseFloat(currentLat.toString());
    const lng = parseFloat(currentLng.toString());
    
    if (!isNaN(lat) && !isNaN(lng)) {
      return { lat, lng };
    }
  }

  // If coordinates aren't provided or are invalid, try EXIF data
  try {
    const parser = exifParser.create(imageBuffer);
    const exifData = parser.parse();
    const { GPSLatitude, GPSLongitude } = exifData.tags || {};

    if (GPSLatitude && GPSLongitude) {
      return {
        lat: GPSLatitude,
        lng: GPSLongitude
      };
    }
  } catch (err) {
    console.error('Error extracting EXIF data:', err);
  }

  return null;
}

// Main route handler
export async function POST(request: Request): Promise<NextResponse<BuildingResponse>> {
  try {
    const formData = await request.formData();
    const image = formData.get('image') as File | null;
    const currentLat = formData.get('currentLat');
    const currentLng = formData.get('currentLng');

    // Validate image
    if (!image || !(image instanceof File)) {
      return NextResponse.json(
        { 
          success: false, 
          type: 'unknown',
          errorMessage: 'Invalid or missing image file' 
        }, 
        { status: 400 }
      );
    }

    // Process image buffer
    const imageBuffer = Buffer.from(await image.arrayBuffer());
    
    // Try to get location from different sources
    const location = await getLocation(imageBuffer, currentLat, currentLng);
    
    if (!location) {
      return NextResponse.json(
        { 
          success: false, 
          type: 'unknown',
          errorMessage: 'Could not determine location from image or provided coordinates' 
        }, 
        { status: 400 }
      );
    }

    // Detect building using the service
    const result = await BuildingDetectionService.detectBuilding(imageBuffer, location);

    return NextResponse.json(
      result, 
      { status: result.success ? 200 : 404 }
    );
  } catch (err) {
    console.error('API Error:', err);
    return NextResponse.json(
      {
        success: false,
        type: 'unknown',
        errorMessage: err instanceof Error ? err.message : 'An unexpected error occurred'
      },
      { status: 500 }
    );
  }
}