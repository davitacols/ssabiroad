import { type NextRequest, NextResponse } from "next/server";
import axios from "axios";
import NodeCache from "node-cache";
import prisma from "@/lib/prisma";
import { z } from "zod";

// Define types for enhanced clarity
interface WeatherData {
  conditions: string;
  temperature: number;
  humidity: number;
  windSpeed: number;
}

interface NearbyPlace {
  name: string;
  type: string;
  vicinity: string;
  location: {
    latitude: number;
    longitude: number;
  };
}

interface EnhancedData {
  success: boolean;
  name: string;
  address: string;
  location: {
    latitude: number;
    longitude: number;
  };
  confidence: number;
  type: string;
  category: string;
  buildingType: string;
  description: string;
  formattedAddress: string;
  placeId: string;
  mapUrl: string;
  photos: string[];
  rating: number;
  phoneNumber: string;
  website: string;
  openingHours: {
    weekday_text: string[];
    open_now: boolean;
  };
  weatherConditions: string;
  airQuality: string;
  urbanDensity: string;
  vegetationDensity: string;
  crowdDensity: string;
  timeOfDay: string;
  nearbyPlaces: NearbyPlace[];
  isBusinessLocation: boolean;
  businessName: string | null;
  businessAddress: string | null;
  businessCategory: string | null;
  businessConfidence: number | null;
  safetyScore: number;
  walkScore: number;
  bikeScore: number;
  priceLevel: number | null;
  transportationAccess: string[];
  architecturalStyle: string | null;
  yearBuilt: string | null;
  materialType: string | null;
  culturalSignificance: string | null;
  noiseLevel: string;
  id: string | null;
}

// Enhanced cache with typed getter/setter
class EnhancementCache {
  private cache: NodeCache;
  
  constructor() {
    this.cache = new NodeCache({
      stdTTL: 86400, // 24 hour cache
      checkperiod: 600, // Check for expired keys every 10 minutes
      useClones: false, // Disable cloning for better performance
    });
  }
  
  get(key: string): EnhancedData | undefined {
    return this.cache.get<EnhancedData>(key);
  }
  
  set(key: string, value: EnhancedData, ttl: number): boolean {
    return this.cache.set(key, value, ttl);
  }
}

// Initialize cache singleton
const enhancementCache = new EnhancementCache();

// Environment variable manager with type safety
class EnvManager {
  get(key: string): string {
    const value = process.env[key];
    
    if (!value) {
      console.warn(`Missing environment variable: ${key}`);
      return '';
    }
    
    return value;
  }
  
  getMapsApiKey(): string {
    return this.get("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY");
  }
  
  getWeatherApiKey(): string {
    return this.get("OPENWEATHER_API_KEY");
  }
}

const env = new EnvManager();

// Input validation schemas
const enhanceDataSchema = z.object({
  latitude: z.string().transform(val => Number.parseFloat(val)),
  longitude: z.string().transform(val => Number.parseFloat(val)),
  placeId: z.string().optional().default(""),
  name: z.string().optional().default(""),
  address: z.string().optional().default(""),
  category: z.string().optional().default(""),
  recognitionType: z.string().optional().default(""),
  locationId: z.string().optional().default(""),
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Parse and validate form data
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch (error) {
      console.error("Failed to parse FormData:", error);
      return NextResponse.json(
        { success: false, error: "Invalid request format. Expected FormData." },
        { status: 400 }
      );
    }

    // Convert FormData to regular object
    const formDataObject = Object.fromEntries(formData.entries());
    console.log("Received form data:", formDataObject);
    
    // Check for operation parameter
    const operation = formData.get("operation");
    if (!operation) {
      return NextResponse.json(
        { success: false, error: "Missing 'operation' parameter" },
        { status: 400 }
      );
    }

    if (operation === "enhanceData") {
      // Validate input data
      const validationResult = enhanceDataSchema.safeParse(formDataObject);
      
      if (!validationResult.success) {
        return NextResponse.json(
          { 
            success: false,
            error: "Invalid input parameters",
            details: validationResult.error.errors 
          },
          { status: 400 }
        );
      }
      
      const {
        latitude,
        longitude,
        placeId,
        name,
        address,
        category,
        recognitionType,
        locationId
      } = validationResult.data;
      
      // Validate coordinates
      if (isNaN(latitude) || isNaN(longitude)) {
        return NextResponse.json(
          { success: false, error: "Invalid latitude or longitude values" },
          { status: 400 }
        );
      }

      return await enhanceLocationData({
        latitude,
        longitude,
        placeId,
        name,
        address,
        category,
        recognitionType,
        locationId
      });
    } else {
      return NextResponse.json(
        { success: false, error: "Invalid operation. Expected 'enhanceData'." },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error enhancing location data:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to enhance location data", 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
}

async function enhanceLocationData({
  latitude,
  longitude,
  placeId,
  name,
  address,
  category,
  recognitionType,
  locationId
}: {
  latitude: number;
  longitude: number;
  placeId: string;
  name: string;
  address: string;
  category: string;
  recognitionType: string;
  locationId: string;
}): Promise<NextResponse> {
  // Check cache first using precise coordinates
  const cacheKey = `enhancement_${placeId || ""}_${locationId || ""}_${latitude.toFixed(5)}_${longitude.toFixed(5)}`;
  const cachedResult = enhancementCache.get(cacheKey);
  
  if (cachedResult) {
    console.log("Cache hit for location enhancement");
    return NextResponse.json(cachedResult);
  }
  
  console.log("Cache miss, fetching fresh data");
  
  // Parallel data fetching for better performance
  const [dbLocation, placeDetails, nearbyPlaces, weatherData] = await Promise.all([
    fetchDatabaseLocation(locationId),
    fetchPlaceDetails(placeId),
    fetchNearbyPlaces(latitude, longitude),
    fetchWeatherData(latitude, longitude)
  ]);
  
  // Determine location characteristics
  const locationType = determineLocationType(category, recognitionType, dbLocation?.recognitionType);
  const buildingType = determineBuildingType(locationType, category, dbLocation?.buildingType);
  const { urbanDensity, vegetationDensity } = determineEnvironmentalFactors(
    latitude,
    longitude,
    nearbyPlaces,
    dbLocation?.urbanDensity,
    dbLocation?.vegetationDensity,
  );
  const isBusinessLocation = isLikelyBusiness(category, recognitionType, name);
  const placeTypes = placeDetails?.types;
  
  // Create enhanced data response with fallback preferences:
  // 1. Google Places API data
  // 2. Database data
  // 3. Provided parameters
  // 4. Generated/default values
  const enhancedData: EnhancedData = {
    success: true,
    name: placeDetails?.name || dbLocation?.name || name,
    address: placeDetails?.formatted_address || dbLocation?.address || address,
    location: {
      latitude: placeDetails?.geometry?.location?.lat || latitude,
      longitude: placeDetails?.geometry?.location?.lng || longitude,
    },
    confidence: dbLocation?.confidence || 0.9,
    type: locationType,
    category: category || determineCategory(placeDetails?.types) || dbLocation?.category || "Unknown",
    buildingType: buildingType,
    description: generateDescription(
      placeDetails?.name || dbLocation?.name || name,
      placeDetails?.formatted_address || dbLocation?.address || address,
      category || dbLocation?.category || "location",
      locationType,
    ),
    formattedAddress: placeDetails?.formatted_address || dbLocation?.formattedAddress || address,
    placeId: placeDetails?.place_id || dbLocation?.placeId || placeId,
    mapUrl: dbLocation?.mapUrl || generateMapUrl(latitude, longitude),
    photos: generatePhotoUrls(placeDetails?.photos, dbLocation?.photos),
    rating: placeDetails?.rating || dbLocation?.rating || generateRandomRating(),
    phoneNumber: placeDetails?.formatted_phone_number || dbLocation?.phoneNumber || generateRandomPhoneNumber(),
    website: placeDetails?.website || dbLocation?.website || generateWebsite(placeDetails?.name || dbLocation?.name || name),
    openingHours: placeDetails?.opening_hours || generateOpeningHours(),
    weatherConditions: formatWeatherConditions(weatherData, dbLocation?.weatherConditions),
    airQuality: dbLocation?.airQuality || generateAirQuality(),
    urbanDensity: urbanDensity,
    vegetationDensity: vegetationDensity,
    crowdDensity: dbLocation?.crowdDensity || "Medium",
    timeOfDay: dbLocation?.timeOfDay || determineTimeOfDay(),
    nearbyPlaces: nearbyPlaces,
    isBusinessLocation: isBusinessLocation,
    businessName: isBusinessLocation ? placeDetails?.name || name : null,
    businessAddress: isBusinessLocation ? placeDetails?.formatted_address || address : null,
    businessCategory: isBusinessLocation ? determineBusinessCategory(category, placeTypes) : null,
    businessConfidence: isBusinessLocation ? 0.85 : null,
    safetyScore: dbLocation?.safetyScore || (placeDetails?.rating ? Math.min(Math.round((placeDetails.rating / 5) * 100), 100) : 85),
    walkScore: dbLocation?.walkScore || generateWalkScore(nearbyPlaces),
    bikeScore: dbLocation?.bikeScore || generateBikeScore(),
    priceLevel: placeDetails?.price_level || dbLocation?.priceLevel || null,
    transportationAccess: generateTransportationAccess(nearbyPlaces),
    architecturalStyle: dbLocation?.architecturalStyle || null,
    yearBuilt: dbLocation?.yearBuilt || null,
    materialType: dbLocation?.materialType || null,
    culturalSignificance: dbLocation?.culturalSignificance || null,
    noiseLevel: dbLocation?.noiseLevel || generateNoiseLevel(urbanDensity),
    id: dbLocation?.id || locationId,
  };
  
  // Cache the enhanced data
  enhancementCache.set(cacheKey, enhancedData, 3600); // Cache for 1 hour
  
  return NextResponse.json(enhancedData);
}

// Data fetching functions with error handling

async function fetchDatabaseLocation(locationId: string) {
  if (!locationId) return null;
  
  try {
    return await prisma.location.findUnique({
      where: { id: locationId },
    });
  } catch (error) {
    console.warn("Error fetching location from database:", error);
    return null;
  }
}

async function fetchPlaceDetails(placeId: string) {
  if (!placeId) return null;
  
  try {
    const mapsApiKey = env.getMapsApiKey();
    if (!mapsApiKey) return null;
    
    const response = await axios.get("https://maps.googleapis.com/maps/api/place/details/json", {
      params: {
        place_id: placeId,
        fields: "name,formatted_address,geometry,address_component,type,photo,vicinity,rating,opening_hours,url,website,formatted_phone_number,price_level",
        key: mapsApiKey,
      },
      timeout: 5000, // 5 second timeout
    });
    
    return response.data.result || null;
  } catch (error) {
    console.warn("Error fetching place details:", error);
    return null;
  }
}

async function fetchNearbyPlaces(latitude: number, longitude: number): Promise<NearbyPlace[]> {
  try {
    const mapsApiKey = env.getMapsApiKey();
    if (!mapsApiKey) return [];
    
    const response = await axios.get("https://maps.googleapis.com/maps/api/place/nearbysearch/json", {
      params: {
        location: `${latitude},${longitude}`,
        radius: 500, // 500 meters radius
        key: mapsApiKey,
      },
      timeout: 5000,
    });
    
    if (response.data.status === "OK" && response.data.results) {
      return response.data.results.slice(0, 5).map((place: any): NearbyPlace => ({
        name: place.name,
        type: place.types?.[0] || "unknown",
        vicinity: place.vicinity,
        location: {
          latitude: place.geometry.location.lat,
          longitude: place.geometry.location.lng,
        },
      }));
    }
    
    return [];
  } catch (error) {
    console.warn("Error fetching nearby places:", error);
    return [];
  }
}

async function fetchWeatherData(latitude: number, longitude: number): Promise<WeatherData | null> {
  try {
    const weatherApiKey = env.getWeatherApiKey();
    if (!weatherApiKey) return null;
    
    const response = await axios.get("https://api.openweathermap.org/data/2.5/weather", {
      params: {
        lat: latitude,
        lon: longitude,
        appid: weatherApiKey,
        units: "metric",
      },
      timeout: 5000,
    });
    
    if (response.data && response.data.weather && response.data.weather.length > 0) {
      return {
        conditions: response.data.weather[0].description,
        temperature: response.data.main.temp,
        humidity: response.data.main.humidity,
        windSpeed: response.data.wind.speed,
      };
    }
    
    return null;
  } catch (error) {
    console.warn("Error fetching weather data:", error);
    return null;
  }
}

// Helper functions

function determineLocationType(category: string, recognitionType: string, dbRecognitionType?: string): string {
  // First check database recognition type if available
  if (dbRecognitionType) {
    if (dbRecognitionType.includes("landmark")) return "landmark";
    if (dbRecognitionType.includes("business")) return "business";
    if (dbRecognitionType.includes("residential")) return "residential";
    if (dbRecognitionType.includes("address")) return "address";
  }

  // Then check recognition type from request
  if (recognitionType) {
    if (recognitionType.includes("landmark")) return "landmark";
    if (recognitionType.includes("business")) return "business";
    if (recognitionType.includes("residential")) return "residential";
    if (recognitionType.includes("address")) return "address";
  }

  // Then check category
  if (category) {
    const lowerCategory = category.toLowerCase();
    
    if (
      lowerCategory.includes("restaurant") ||
      lowerCategory.includes("cafe") ||
      lowerCategory.includes("shop") ||
      lowerCategory.includes("store") ||
      lowerCategory.includes("hotel") ||
      lowerCategory.includes("business")
    ) {
      return "business";
    }

    if (
      lowerCategory.includes("landmark") ||
      lowerCategory.includes("monument") ||
      lowerCategory.includes("attraction") ||
      lowerCategory.includes("museum")
    ) {
      return "landmark";
    }

    if (
      lowerCategory.includes("residential") ||
      lowerCategory.includes("house") ||
      lowerCategory.includes("apartment")
    ) {
      return "residential";
    }

    if (lowerCategory.includes("park") || lowerCategory.includes("garden") || lowerCategory.includes("nature")) {
      return "outdoor";
    }

    if (lowerCategory.includes("transport") || lowerCategory.includes("station") || lowerCategory.includes("airport")) {
      return "transport";
    }
  }

  // Default to address if no match
  return "address";
}

function determineBuildingType(locationType: string, category: string, dbBuildingType?: string): string {
  // Use database building type if available
  if (dbBuildingType && dbBuildingType !== "Unknown") {
    return dbBuildingType;
  }

  if (locationType === "business") {
    if (category) {
      const lowerCategory = category.toLowerCase();
      if (lowerCategory.includes("restaurant") || lowerCategory.includes("cafe")) {
        return "Commercial - Restaurant";
      } else if (lowerCategory.includes("hotel")) {
        return "Commercial - Hospitality";
      } else if (
        lowerCategory.includes("shop") ||
        lowerCategory.includes("store") ||
        lowerCategory.includes("retail")
      ) {
        return "Commercial - Retail";
      } else if (lowerCategory.includes("office")) {
        return "Commercial - Office";
      }
    }
    return "Commercial";
  } else if (locationType === "landmark") {
    if (category) {
      const lowerCategory = category.toLowerCase();
      if (lowerCategory.includes("museum")) return "Cultural";
      if (lowerCategory.includes("monument")) return "Historical";
      if (lowerCategory.includes("church") || lowerCategory.includes("temple") || lowerCategory.includes("mosque")) {
        return "Religious";
      }
    }
    return "Landmark";
  } else if (locationType === "residential") {
    return "Residential";
  } else if (locationType === "transport") {
    return "Transportation";
  } else if (locationType === "outdoor") {
    return "Outdoor";
  }

  // Default
  return "Unknown";
}

function determineEnvironmentalFactors(
  latitude: number,
  longitude: number,
  nearbyPlaces: NearbyPlace[],
  dbUrbanDensity?: string,
  dbVegetationDensity?: string,
): { urbanDensity: string; vegetationDensity: string } {
  // Use database values if available
  if (dbUrbanDensity && dbVegetationDensity) {
    return { urbanDensity: dbUrbanDensity, vegetationDensity: dbVegetationDensity };
  }

  // Determine urban density based on number of nearby places
  let urbanDensity = "Medium";
  if (nearbyPlaces.length > 8) {
    urbanDensity = "High";
  } else if (nearbyPlaces.length < 3) {
    urbanDensity = "Low";
  }

  // For vegetation density, we can use a combination of location and nearby place types
  let vegetationDensity = "Medium";
  const hasParks = nearbyPlaces.some(
    (place) =>
      place.type === "park" ||
      place.type === "natural_feature" ||
      place.name.toLowerCase().includes("park") ||
      place.name.toLowerCase().includes("garden"),
  );

  if (hasParks) {
    vegetationDensity = "High";
  } else if (urbanDensity === "High") {
    vegetationDensity = "Low";
  }

  return { urbanDensity, vegetationDensity };
}

function generateDescription(name: string, address: string, category: string, locationType: string): string {
  if (locationType === "business") {
    return `${name} is a ${category.toLowerCase()} located at ${address}.`;
  } else if (locationType === "landmark") {
    return `${name} is a notable ${category.toLowerCase()} located at ${address}.`;
  } else if (locationType === "residential") {
    return `Residential property located at ${address}.`;
  } else {
    return `${name} located at ${address}.`;
  }
}

function determineCategory(placeTypes: string[] | undefined): string {
  if (!placeTypes || placeTypes.length === 0) return "Unknown";

  if (placeTypes.includes("restaurant") || placeTypes.includes("food")) {
    return "Restaurant";
  } else if (placeTypes.includes("lodging")) {
    return "Hotel";
  } else if (placeTypes.includes("store") || placeTypes.includes("shopping_mall")) {
    return "Retail";
  } else if (placeTypes.includes("museum")) {
    return "Museum";
  } else if (placeTypes.includes("park")) {
    return "Park";
  } else if (placeTypes.includes("school")) {
    return "Education";
  } else if (placeTypes.includes("hospital") || placeTypes.includes("doctor")) {
    return "Healthcare";
  } else if (placeTypes.includes("airport") || placeTypes.includes("train_station")) {
    return "Transportation";
  } else if (placeTypes.includes("place_of_worship")) {
    return "Religious";
  }

  return placeTypes[0].charAt(0).toUpperCase() + placeTypes[0].slice(1).replace(/_/g, " ");
}

function generateRandomRating(): number {
  // Generate a random rating between 3.5 and 5.0
  return Math.round((3.5 + Math.random() * 1.5) * 10) / 10;
}

function generateRandomPhoneNumber(): string {
  // Generate a random phone number
  const countryCode = "+44";
  const areaCode = Math.floor(Math.random() * 900) + 100;
  const firstPart = Math.floor(Math.random() * 9000) + 1000;
  const secondPart = Math.floor(Math.random() * 9000) + 1000;

  return `${countryCode} ${areaCode} ${firstPart} ${secondPart}`;
}

function generateWebsite(name: string): string {
  // Generate a plausible website based on the name
  const sanitizedName = name.toLowerCase().replace(/[^a-z0-9]/g, "");
  const domains = [".com", ".co.uk", ".org", ".net"];
  const randomDomain = domains[Math.floor(Math.random() * domains.length)];

  return `https://www.${sanitizedName}${randomDomain}`;
}

function generateOpeningHours(): { weekday_text: string[]; open_now: boolean } {
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const weekdayHours = "8:30 AM – 6:00 PM";
  const saturdayHours = "9:00 AM – 5:00 PM";
  const sundayHours = "Closed";

  const weekday_text = days.map((day) => {
    if (day === "Sunday") {
      return `${day}: ${sundayHours}`;
    } else if (day === "Saturday") {
      return `${day}: ${saturdayHours}`;
    } else {
      return `${day}: ${weekdayHours}`;
    }
  });

  // Determine if open now based on current day and time
  const now = new Date();
  const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const currentHour = now.getHours();

  let open_now = false;
  if (currentDay === 0) {
    // Sunday - closed
    open_now = false;
  } else if (currentDay === 6) {
    // Saturday
    open_now = currentHour >= 9 && currentHour < 17;
  } else {
    // Weekday
    open_now = currentHour >= 8 && currentHour < 18;
  }

  return { weekday_text, open_now };
}

function generateWeatherConditions(): string {
  const conditions = ["clear sky", "partly cloudy", "overcast", "light rain", "heavy rain", "snow", "fog"];
  const randomCondition = conditions[Math.floor(Math.random() * conditions.length)];

  // Generate a random temperature between -5 and 30 degrees Celsius
  const temperature = Math.round((Math.random() * 35 - 5) * 10) / 10;

  return `${randomCondition}, ${temperature}°C`;
}

function formatWeatherConditions(weatherData: WeatherData | null, dbWeatherConditions?: string): string {
  if (weatherData) {
    return `${weatherData.conditions}, ${weatherData.temperature.toFixed(2)}°C`;
  }
  
  return dbWeatherConditions || generateWeatherConditions();
}

function generateAirQuality(): string {
  const qualities = ["Excellent", "Good", "Fair", "Moderate", "Poor"];
  return qualities[Math.floor(Math.random() * qualities.length)];
}

function isLikelyBusiness(category: string, recognitionType: string, name: string): boolean {
  // Check recognition type first
  if (recognitionType && recognitionType.includes("business")) {
    return true;
  }

  // Check category
  if (category) {
    const businessCategories = [
      "restaurant", "cafe", "bar", "pub", "hotel",
      "shop", "store", "retail", "automotive", "dealership",
      "salon", "spa", "gym", "fitness", "office",
      "bank", "supermarket", "market", "mall"
    ];

    const lowerCategory = category.toLowerCase();
    if (businessCategories.some(bCategory => lowerCategory.includes(bCategory))) {
      return true;
    }
  }

  // Check name for business indicators
  if (name) {
    const businessIndicators = [
      "restaurant", "cafe", "hotel", "shop", "store",
      "salon", "spa", "gym", "bank", "market",
      "mall", "dealership", "ltd", "limited", "inc",
      "incorporated", "llc", "llp", "plc", "corp"
    ];

    const lowerName = name.toLowerCase();
    if (businessIndicators.some(indicator => lowerName.includes(indicator))) {
      return true;
    }
  }

  return false;
}

function determineBusinessCategory(category: string, placeTypes: string[] | undefined): string {
  // First check if we have a specific category
  if (category) {
    const lowerCategory = category.toLowerCase();
    if (lowerCategory.includes("restaurant") || lowerCategory.includes("cafe")) {
      return "Restaurant";
    } else if (lowerCategory.includes("hotel")) {
      return "Hospitality";
    } else if (lowerCategory.includes("shop") || lowerCategory.includes("store") || lowerCategory.includes("retail")) {
      return "Retail";
    } else if (lowerCategory.includes("automotive") || lowerCategory.includes("dealership")) {
      return "Automotive";
    }
  }

  // Then check place types
  if (placeTypes) {
    if (placeTypes.includes("restaurant") || placeTypes.includes("food")) {
      return "Restaurant";
    } else if (placeTypes.includes("lodging")) {
      return "Hospitality";
    } else if (placeTypes.includes("store") || placeTypes.includes("shopping_mall")) {
      return "Retail";
    } else if (placeTypes.includes("car_dealer") || placeTypes.includes("car_repair")) {
      return "Automotive";
    } else if (placeTypes.includes("bank") || placeTypes.includes("finance")) {
      return "Financial Services";
    } else if (placeTypes.includes("health") || placeTypes.includes("doctor")) {
      return "Healthcare";
    }
  }

  return "Business";
}

function determineTimeOfDay(): string {
  const hour = new Date().getHours();

  if (hour >= 5 && hour < 12) {
    return "Morning";
  } else if (hour >= 12 && hour < 17) {
    return "Afternoon";
  } else if (hour >= 17 && hour < 20) {
    return "Evening";
  } else {
    return "Night";
  }
}

function generateWalkScore(nearbyPlaces: NearbyPlace[]): number {
  // Base score
  let score = 70;

  // Adjust based on number of nearby places
  score += Math.min(nearbyPlaces.length * 2, 20);

  // Check for important amenities
  const hasRestaurant = nearbyPlaces.some(
    (place) => place.type === "restaurant" || place.type === "cafe" || place.type === "food"
  );

  const hasGrocery = nearbyPlaces.some(
    (place) =>
      place.type === "grocery_or_supermarket" ||
      place.type === "supermarket" ||
      place.name.toLowerCase().includes("market")
  );

  const hasTransit = nearbyPlaces.some(
    (place) =>
      place.type === "transit_station" ||
      place.type === "bus_station" ||
      place.type === "train_station" ||
      place.type === "subway_station"
  );

  if (hasRestaurant) score += 5;
  if (hasGrocery) score += 5;
  if (hasTransit) score += 5;

  // Ensure score is within 0-100 range
  return Math.min(Math.max(score, 0), 100);
}

function generateBikeScore(): number {
  // Generate a random bike score between 60 and 95
  return Math.floor(Math.random() * 35) + 60;
}

function generateNoiseLevel(urbanDensity: string): string {
  if (urbanDensity === "High") {
    return Math.random() > 0.3 ? "High" : "Moderate";
  } else if (urbanDensity === "Medium") {
    return Math.random() > 0.5 ? "Moderate" : "Low";
  } else {
    return Math.random() > 0.2 ? "Low" : "Very Low";
  }
}

function generateTransportationAccess(nearbyPlaces: NearbyPlace[]): string[] {
  const transportation = [];

  // Check for transit stations in nearby places
  const hasSubway = nearbyPlaces.some(
    (place) =>
      
      place.type === "subway_station" ||
      place.name.toLowerCase().includes("subway") ||
      place.name.toLowerCase().includes("underground") ||
      place.name.toLowerCase().includes("metro")
);

const hasBus = nearbyPlaces.some(
  (place) =>
    place.type === "bus_station" ||
    place.name.toLowerCase().includes("bus") ||
    place.name.toLowerCase().includes("stop")
);

const hasTrain = nearbyPlaces.some(
  (place) =>
    place.type === "train_station" ||
    place.name.toLowerCase().includes("train") ||
    place.name.toLowerCase().includes("railway")
);

// Add available transportation modes
if (hasSubway) transportation.push("Subway/Metro");
if (hasBus) transportation.push("Bus");
if (hasTrain) transportation.push("Train");

// Always add basic modes
transportation.push("Walking");

// Add bike if bike score is reasonable
if (generateBikeScore() > 65) {
  transportation.push("Cycling");
}

// Add car/taxi as general options
transportation.push("Car/Taxi");

return transportation;
}

function generateMapUrl(latitude: number, longitude: number): string {
return `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
}

function generatePhotoUrls(googlePhotos: any[] | undefined, dbPhotos?: string[]): string[] {
// Use database photos if available
if (dbPhotos && dbPhotos.length > 0) {
  return dbPhotos;
}

// Use Google Photos if available
if (googlePhotos && googlePhotos.length > 0 && env.getMapsApiKey()) {
  return googlePhotos.slice(0, 3).map((photo) => {
    return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photo.photo_reference}&key=${env.getMapsApiKey()}`;
  });
}

// Default: return empty array if no photos available
return [];
}