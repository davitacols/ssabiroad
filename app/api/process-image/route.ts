import { NextResponse } from 'next/server';
import { v1 as vision } from '@google-cloud/vision';
import exifParser from 'exif-parser';
import { promises as fs } from 'fs';

// Type definitions for exif-parser
declare module 'exif-parser' {
  interface Tags {
    GPSLatitude?: number;
    GPSLongitude?: number;
  }
  
  interface ExifResult {
    tags: Tags;
  }
  
  interface Parser {
    parse(): ExifResult;
  }
  
  interface ExifParser {
    create(buffer: Buffer): Parser;
  }
  
  const parser: ExifParser;
}

// Types
type TravelMode = 'DRIVING' | 'WALKING' | 'BICYCLING' | 'TRANSIT' | 'FLIGHT' | 'SHIP';
type BuildingType = 'commercial' | 'residential' | 'historical' | 'industrial' | 'religious' | 'educational';
type PrimaryMode = 'road' | 'transit' | 'flight' | 'ship';
type TrafficSeverity = 'low' | 'medium' | 'high';
type CrowdDensity = 'low' | 'medium' | 'high';
type ArchitecturalStyle = 'Modern' | 'Contemporary' | 'Classical' | 'Gothic' | 'Victorian' | 'Art Deco' | 'Brutalist' | 'Baroque' | 'Renaissance' | 'Post-modern';
type BuildingCondition = 'excellent' | 'good' | 'fair' | 'poor';
type LightingCondition = 'bright' | 'moderate' | 'dim' | 'dark';
type UrbanDensity = 'high' | 'medium' | 'low';

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

interface ArchitecturalFeatures {
  style: ArchitecturalStyle;
  materials: string[];
  structuralElements: string[];
  facadeFeatures: string[];
  heightEstimate: number;
  periodFeatures: string[];
  condition: BuildingCondition;
}

interface SecurityFeatures {
  cameras: boolean;
  accessControl: boolean;
  lighting: boolean;
  securityPersonnel: boolean;
  emergencyExits: number;
}

interface WeatherInfo {
  condition: string;
  temperature?: number;
  humidity?: number;
  lighting: LightingCondition;
}

interface BuildingContext {
  timeOfDay: string;
  weather: WeatherInfo;
  surroundings: {
    urbanDensity: UrbanDensity;
    nearbyLandmarks: string[];
    vegetation: string[];
    infrastructure: string[];
  };
  activity: {
    pedestrianDensity: CrowdDensity;
    trafficDensity: CrowdDensity;
    primaryUse: string[];
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
  architecturalFeatures?: ArchitecturalFeatures;
  securityFeatures?: SecurityFeatures;
  context?: BuildingContext;
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
  error?: string;
  buildings?: Building[];
  analysis?: {
    timeOfDay: string;
    lightingConditions: string;
    weatherConditions: string;
    crowdDensity?: CrowdDensity;
    mainColors: string[];
    architecturalFeatures: ArchitecturalFeatures;
    context: BuildingContext;
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
  private static readonly cache = new Map<string, { data: any; timestamp: number }>();
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

  private static async readCredentialsFile(filePath: string): Promise<any> {
    try {
      const fileContent = await fs.readFile(filePath, 'utf8');
      return JSON.parse(fileContent);
    } catch (error) {
      if (error instanceof Error) {
        if ('code' in error && error.code === 'ENOENT') {
          throw new Error(`Credentials file not found: ${filePath}`);
        }
        throw new Error(`Error reading credentials file: ${error.message}`);
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
      
      let credentials;
      if (isFilePath) {
        credentials = await this.readCredentialsFile(credentialsEnv);
      } else {
        try {
          credentials = JSON.parse(credentialsEnv);
        } catch (error) {
          throw new Error('Invalid JSON format in GOOGLE_APPLICATION_CREDENTIALS_JSON');
        }
      }

      this.instance = new vision.ImageAnnotatorClient({
        credentials: credentials,
        projectId: credentials.project_id
      });

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

class EnvironmentalContext {
  private static readonly URBAN_FEATURES = [
    'Road', 'Street', 'Sidewalk', 'Traffic Light', 'Parking',
    'Tree', 'Garden', 'Park', 'Fence', 'Gate'
  ];

  private static readonly RESIDENTIAL_INDICATORS = [
    'Mailbox', 'Driveway', 'Garden', 'Lawn', 'Residential Street',
    'Garage Door', 'Front Yard', 'Back Yard', 'Fence'
  ];

  private static readonly COMMERCIAL_INDICATORS = [
    'Parking Lot', 'Sign', 'Store Front', 'Shopping Cart',
    'Commercial Vehicle', 'Billboard', 'Business Sign'
  ];

  static async analyzeSurroundings(
    buffer: Buffer,
    client: vision.ImageAnnotatorClient
  ): Promise<{
    environmentType: 'urban' | 'suburban' | 'rural';
    buildingContext: {
      nearbyFeatures: string[];
      probableUsage: BuildingType;
      confidence: number;
    };
  }> {
    const [objectResult] = await client.objectLocalization({ image: { content: buffer } });
    const [labelResult] = await client.labelDetection({ image: { content: buffer } });

    const detectedObjects = objectResult.localizedObjectAnnotations?.map(obj => obj.name) || [];
    const detectedLabels = labelResult.labelAnnotations?.map(label => label.description) || [];
    const allDetections = [...new Set([...detectedObjects, ...detectedLabels])];

    const environmentType = this.determineEnvironmentType(allDetections);
    const nearbyFeatures = this.identifyNearbyFeatures(allDetections);
    const { probableUsage, confidence } = this.determineBuildingType(nearbyFeatures);

    return {
      environmentType,
      buildingContext: {
        nearbyFeatures,
        probableUsage,
        confidence
      }
    };
  }

  static async analyzeEnvironmentalContext(
    buffer: Buffer,
    client: vision.ImageAnnotatorClient,
    location: Location
  ): Promise<BuildingContext> {
    const [imageProperties] = await client.imageProperties({ image: { content: buffer } });
    const dominantColors = imageProperties.imagePropertiesAnnotation?.dominantColors?.colors || [];
    
    const [objectResult] = await client.objectLocalization({ image: { content: buffer } });
    const objects = objectResult.localizedObjectAnnotations || [];

    return {
      timeOfDay: this.determineTimeOfDay(dominantColors),
      weather: await this.analyzeWeatherConditions(location, dominantColors),
      surroundings: await this.analyzeSurroundings(objects),
      activity: this.analyzeActivity(objects)
    };
  }

  private static determineTimeOfDay(
    colors: vision.protos.google.cloud.vision.v1.IColorInfo[]
  ): string {
    const avgBrightness = colors.reduce((sum, color) => {
      const rgb = color.color?.rgb || { red: 0, green: 0, blue: 0 };
      return sum + ((rgb.red || 0) + (rgb.green || 0) + (rgb.blue || 0)) / 3;
    }, 0) / colors.length;

    if (avgBrightness > 200) return 'day';
    if (avgBrightness > 100) return 'twilight';
    return 'night';
  }

  private static async analyzeWeatherConditions(
    location: Location,
    colors: vision.protos.google.cloud.vision.v1.IColorInfo[]
  ): Promise<WeatherInfo> {
    const lighting = this.determineLightingConditions(colors);
    
    return {
      condition: 'clear',
      lighting
    };
  }

  private static determineLightingConditions(
    colors: vision.protos.google.cloud.vision.v1.IColorInfo[]
  ): LightingCondition {
    const avgBrightness = colors.reduce((sum, color) => {
      const rgb = color.color?.rgb || { red: 0, green: 0, blue: 0 };
      return sum + ((rgb.red || 0) + (rgb.green || 0) + (rgb.blue || 0)) / 3;
    }, 0) / colors.length;

    if (avgBrightness > 200) return 'bright';
    if (avgBrightness > 150) return 'moderate';
    if (avgBrightness > 100) return 'dim';
    return 'dark';
  }

  private static async analyzeSurroundings(
    objects: vision.protos.google.cloud.vision.v1.ILocalizedObjectAnnotation[]
  ): Promise<BuildingContext['surroundings']> {
    const buildingCount = objects.filter(obj => 
      obj.name?.toLowerCase().includes('building')).length;

    return {
      urbanDensity: this.calculateUrbanDensity(buildingCount),
      nearbyLandmarks: this.identifyNearbyLandmarks(objects),
      vegetation: this.identifyVegetation(objects),
      infrastructure: this.identifyInfrastructure(objects)
    };
  }

  private static calculateUrbanDensity(buildingCount: number): UrbanDensity {
    if (buildingCount > 5) return 'high';
    if (buildingCount > 2) return 'medium';
    return 'low';
  }

  private static identifyNearbyLandmarks(
    objects: vision.protos.google.cloud.vision.v1.ILocalizedObjectAnnotation[]
  ): string[] {
    return objects
      .filter(obj => obj.name && ['Monument', 'Statue', 'Landmark'].includes(obj.name))
      .map(obj => obj.name || '')
      .filter(Boolean);
  }

  private static identifyVegetation(
    objects: vision.protos.google.cloud.vision.v1.ILocalizedObjectAnnotation[]
  ): string[] {
    return objects
      .filter(obj => obj.name && ['Tree', 'Plant', 'Grass', 'Flower'].includes(obj.name))
      .map(obj => obj.name || '')
      .filter(Boolean);
  }

  private static identifyInfrastructure(
    objects: vision.protos.google.cloud.vision.v1.ILocalizedObjectAnnotation[]
  ): string[] {
    return objects
      .filter(obj => obj.name && ['Road', 'Bridge', 'Railway', 'Station'].includes(obj.name))
      .map(obj => obj.name || '')
      .filter(Boolean);
  }

  private static analyzeActivity(
    objects: vision.protos.google.cloud.vision.v1.ILocalizedObjectAnnotation[]
  ): BuildingContext['activity'] {
    const peopleCount = objects.filter(obj => obj.name === 'Person').length;
    const vehicleCount = objects.filter(obj => 
      ['Car', 'Bus', 'Truck', 'Motorcycle'].includes(obj.name || '')).length;

    return {
      pedestrianDensity: this.calculateDensity(peopleCount),
      trafficDensity: this.calculateDensity(vehicleCount),
      primaryUse: this.determinePrimaryUse(objects)
    };
  }

  private static calculateDensity(count: number): CrowdDensity {
    if (count > 10) return 'high';
    if (count > 5) return 'medium';
    return 'low';
  }

  private static determinePrimaryUse(
    objects: vision.protos.google.cloud.vision.v1.ILocalizedObjectAnnotation[]
  ): string[] {
    const uses = new Set<string>();
    const indicators = {
      'commercial': ['Store', 'Shop', 'Office'],
      'residential': ['House', 'Apartment'],
      'recreational': ['Park', 'Playground'],
      'transportation': ['Bus', 'Train', 'Station']
    };

    for (const [use, keywords] of Object.entries(indicators)) {
      if (objects.some(obj => keywords.includes(obj.name || ''))) {
        uses.add(use);
      }
    }

    return Array.from(uses);
  }

  private static determineEnvironmentType(
    detections: string[]
  ): 'urban' | 'suburban' | 'rural' {
    const urbanScore = this.calculateEnvironmentScore(detections, [
      'Skyscraper', 'Office Building', 'Traffic Light', 'Bus Stop',
      'Subway Station', 'High-rise'
    ]);

    const suburbanScore = this.calculateEnvironmentScore(detections, [
      'Residential Area', 'Garden', 'Lawn', 'Driveway',
      'Single Family Home', 'Tree-lined Street'
    ]);

    const ruralScore = this.calculateEnvironmentScore(detections, [
      'Field', 'Farm', 'Forest', 'Countryside',
      'Barn', 'Agricultural Land'
    ]);

    const scores = {
      urban: urbanScore,
      suburban: suburbanScore,
      rural: ruralScore
    };

    return Object.entries(scores).reduce((a, b) => 
      scores[a as keyof typeof scores] > scores[b[0] as keyof typeof scores] ? a : b[0]
    ) as 'urban' | 'suburban' | 'rural';
  }

  private static calculateEnvironmentScore(
    detections: string[],
    indicators: string[]
  ): number {
    return indicators.reduce((score, indicator) => 
      score + (detections.some(d => d.toLowerCase().includes(indicator.toLowerCase())) ? 1 : 0),
      0
    );
  }

  private static identifyNearbyFeatures(detections: string[]): string[] {
    return this.URBAN_FEATURES.filter(feature =>
      detections.some(d => d.toLowerCase().includes(feature.toLowerCase()))
    );
  }

  private static determineBuildingType(
    nearbyFeatures: string[]
  ): { probableUsage: BuildingType; confidence: number } {
    const scores = {
      residential: this.calculateTypeScore(nearbyFeatures, this.RESIDENTIAL_INDICATORS),
      commercial: this.calculateTypeScore(nearbyFeatures, this.COMMERCIAL_INDICATORS)
    };

    const totalFeatures = nearbyFeatures.length;
    const maxScore = Math.max(scores.residential, scores.commercial);
    const confidence = totalFeatures > 0 ? maxScore / totalFeatures : 0.5;

    return {
      probableUsage: scores.residential >= scores.commercial ? 'residential' : 'commercial',
      confidence
    };
  }

  private static calculateTypeScore(features: string[], indicators: string[]): number {
    return indicators.reduce((score, indicator) =>
      score + (features.some(f => f.toLowerCase().includes(indicator.toLowerCase())) ? 1 : 0),
      0
    );
  }
}

// Location and Navigation Services
class LocationService {
  private static readonly API_BASE_URL = "https://maps.googleapis.com/maps/api";

  public static async reverseGeocode(location: Location): Promise<string> {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) throw new Error("Missing Google Maps API key");
    
    const response = await fetch(
      `${this.API_BASE_URL}/geocode/json?latlng=${location.lat},${location.lng}&key=${apiKey}`
    );
    
    if (!response.ok) {
      throw new Error(`Geocoding API error: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data.status === "OK" && data.results.length > 0) {
      return data.results[0].formatted_address;
    }
    throw new Error("Unable to retrieve address for the provided location.");
  }

  public static async getDirections(
    origin: Location,
    destination: Location,
    travelMode: TravelMode = "DRIVING"
  ): Promise<Directions> {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) throw new Error("Missing Google Maps API key");

    const response = await fetch(
      `${this.API_BASE_URL}/directions/json?origin=${origin.lat},${origin.lng}&destination=${destination.lat},${destination.lng}&mode=${travelMode.toLowerCase()}&key=${apiKey}`
    );

    if (!response.ok) {
      throw new Error(`Directions API error: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.status === "OK" && data.routes.length > 0) {
      const route = data.routes[0];
      const steps = route.legs[0]?.steps.map((step: any) => ({
        instruction: step.html_instructions,
        distance: step.distance.text,
        duration: step.duration.text,
        travelMode: step.travel_mode.toUpperCase() as TravelMode,
        polyline: step.polyline?.points,
        trafficInfo: step.traffic_speed_entry?.map((entry: any) => entry.traffic_condition),
      })) || [];

      return {
        distance: route.legs[0].distance.text,
        duration: route.legs[0].duration.text,
        primaryMode: travelMode.toLowerCase() as PrimaryMode,
        steps,
        trafficSeverity: "medium",
      };
    }

    throw new Error("Unable to retrieve directions for the provided locations.");
  }
}

// Building Detection Service
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
      } catch (error) {
        console.error(`Detection method failed: ${method.name}`, error);
      }
    }

    return {
      success: false,
      type: 'unknown',
      error: 'No buildings detected in the image'
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
      LocationService.reverseGeocode(location),
      LocationService.getDirections(currentLocation, location)
    ]);

    return {
      success: true,
      type: 'landmark',
      description: landmark.description || 'Unknown landmark',
      confidence: landmark.score || 0,
      location,
      address,
      directions
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
      directions
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
      LocationService.reverseGeocode(location),
      LocationService.getDirections(currentLocation, location)
    ]);

    return {
      success: true,
      type: 'image-metadata',
      location,
      address,
      directions
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
    ) || [];

    if (!buildings.length) return { success: false, type: 'building' };

    const buildingDetails = await Promise.all(
      buildings.map(async (building) => {
        const vertex = building.boundingPoly?.normalizedVertices?.[0];
        if (!vertex) return null;

        const location = { lat: vertex.y || 0, lng: vertex.x || 0 };
        const [address, directions] = await Promise.all([
          LocationService.reverseGeocode(location),
          LocationService.getDirections(currentLocation, location)
        ]);

        return {
          description: building.name || 'Unknown building',
          confidence: building.score || 0,
          location,
          address,
          directions
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

  private static async searchPlace(query: string): Promise<{ location?: Location; address?: string }> {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) throw new Error('Missing Google Maps API key');

    const cacheKey = `place_${query}`;
    const cached = VisionClient.getCached<{ location?: Location; address?: string }>(cacheKey);
    if (cached) return cached;

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${apiKey}`
    );

    if (!response.ok) {
      throw new Error(`Places API error: ${response.statusText}`);
    }

    const data = await response.json();

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
  } catch (error) {
    console.error('Error extracting EXIF data:', error);
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
          error: 'Invalid or missing image file',
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
          error: 'Could not determine location from image or provided coordinates',
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
  } catch (error) {
    console.error('An error occurred during building detection:', error);

    return NextResponse.json(
      {
        success: false,
        type: 'internal_server_error',
        error: 'An unexpected error occurred during processing',
      },
      { status: 500 }
    );
  }
}