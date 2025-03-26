import { type NextRequest, NextResponse } from "next/server"

// Enhanced configuration and security
const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
const GOOGLE_MAPS_BASE_URL = "https://maps.googleapis.com/maps/api"

// Advanced configuration
const CONFIG = {
  MAX_RETRIES: 2,
  RETRY_DELAY_MS: 500,
  DEFAULT_RADIUS: 5000,
  MAX_RESULTS: 20,
  CACHE_DURATION_MS: 1000 * 60 * 60, // 1 hour cache
}

// Enhanced type definitions
interface LocationGeometry {
  location: { lat: number; lng: number }
  viewport?: {
    northeast: { lat: number; lng: number }
    southwest: { lat: number; lng: number }
  }
}

interface PlaceDetails {
  place_id: string
  name: string
  formatted_address: string
  geometry: LocationGeometry
  types: string[]
  rating?: number
  user_ratings_total?: number
  opening_hours?: OpeningHours
  photos?: PhotoReference[]
  price_level?: number
  website?: string
  formatted_phone_number?: string
}

interface NearbyPlace extends Omit<PlaceDetails, 'formatted_address'> {
  vicinity: string
  business_status?: string
}

interface OpeningHours {
  open_now: boolean
  periods?: Array<{
    open: { day: number, time: string }
    close?: { day: number, time: string }
  }>
  weekday_text?: string[]
}

interface PhotoReference {
  photo_reference: string
  height?: number
  width?: number
  html_attributions?: string[]
}

// Simple in-memory cache
class APICache {
  private cache = new Map<string, { data: any, timestamp: number }>();

  set(key: string, data: any) {
    this.cache.set(key, {
      data, 
      timestamp: Date.now()
    });
  }

  get(key: string) {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    // Check if cache is still valid
    if (Date.now() - entry.timestamp > CONFIG.CACHE_DURATION_MS) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }

  clear(key?: string) {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }
}
const apiCache = new APICache();

// Utility function for exponential backoff
async function retryFetch(url: string, options?: RequestInit, maxRetries = CONFIG.MAX_RETRIES) {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, CONFIG.RETRY_DELAY_MS * Math.pow(2, attempt)));
      }
    }
  }

  console.error('Fetch failed after retries:', lastError);
  throw lastError;
}

// Helper function to get place details
async function getPlaceDetails(placeId: string): Promise<Partial<PlaceDetails>> {
  if (!placeId) return {};

  const params = new URLSearchParams({
    place_id: placeId,
    key: GOOGLE_MAPS_API_KEY!,
    fields: 'geometry,types,rating,user_ratings_total,price_level,opening_hours,formatted_address,name'
  });

  const cacheKey = `placedetails:${placeId}`;
  const cachedResult = apiCache.get(cacheKey);
  if (cachedResult) return cachedResult;

  try {
    const data = await retryFetch(`${GOOGLE_MAPS_BASE_URL}/place/details/json?${params}`);

    if (data.status === 'OK') {
      const result = data.result;
      const details: Partial<PlaceDetails> = {
        place_id: result.place_id,
        name: result.name,
        formatted_address: result.formatted_address,
        geometry: result.geometry,
        types: result.types,
        rating: result.rating,
        user_ratings_total: result.user_ratings_total,
        price_level: result.price_level,
        opening_hours: result.opening_hours
      };

      apiCache.set(cacheKey, details);
      return details;
    }

    return {};
  } catch (error) {
    console.error('Place Details Error:', error);
    return {};
  }
}

// Get nearby places
async function getNearbyPlaces(
  lat: number, 
  lng: number, 
  radius = CONFIG.DEFAULT_RADIUS, 
  type = ''
): Promise<NearbyPlace[]> {
  if (!lat || !lng) return [];

  const params = new URLSearchParams({
    location: `${lat},${lng}`,
    radius: radius.toString(),
    key: GOOGLE_MAPS_API_KEY!,
  });

  if (type) params.append('type', type);

  const cacheKey = `nearby:${params.toString()}`;
  const cachedResult = apiCache.get(cacheKey);
  if (cachedResult) return cachedResult;

  try {
    const data = await retryFetch(`${GOOGLE_MAPS_BASE_URL}/place/nearbysearch/json?${params}`);

    if (data.status === 'OK') {
      const enrichedResults: NearbyPlace[] = await Promise.all(
        data.results.slice(0, CONFIG.MAX_RESULTS).map(async (result: any): Promise<NearbyPlace> => ({
          place_id: result.place_id,
          name: result.name,
          vicinity: result.vicinity,
          geometry: result.geometry,
          types: result.types,
          rating: result.rating,
          user_ratings_total: result.user_ratings_total,
          price_level: result.price_level,
          business_status: result.business_status,
          opening_hours: result.opening_hours
        }))
      );

      apiCache.set(cacheKey, enrichedResults);
      return enrichedResults;
    }

    return [];
  } catch (error) {
    console.error('Nearby Places Error:', error);
    return [];
  }
}

// Place Autocomplete
async function getPlaceAutocomplete(query: string, type?: string) {
  if (!query) return [];

  const params = new URLSearchParams({
    input: query,
    key: GOOGLE_MAPS_API_KEY!,
    types: type || ''
  });

  const cacheKey = `autocomplete:${params.toString()}`;
  const cachedResult = apiCache.get(cacheKey);
  if (cachedResult) return cachedResult;

  try {
    const data = await retryFetch(`${GOOGLE_MAPS_BASE_URL}/place/autocomplete/json?${params}`);

    if (data.status === 'OK') {
      const enrichedResults = await Promise.all(
        data.predictions.slice(0, CONFIG.MAX_RESULTS).map(async (prediction: any) => {
          const placeDetails = await getPlaceDetails(prediction.place_id);
          return {
            place_id: prediction.place_id,
            name: prediction.structured_formatting.main_text,
            formatted_address: prediction.description,
            ...placeDetails
          };
        })
      );

      apiCache.set(cacheKey, enrichedResults);
      return enrichedResults;
    }

    return [];
  } catch (error) {
    console.error('Place Autocomplete Error:', error);
    return [];
  }
}

// Advanced geocoding
async function advancedGeocoding(input: string, options: { 
  language?: string, 
  region?: string, 
  resultType?: string[] 
} = {}) {
  const { language = 'en', region = '', resultType = [] } = options;
  
  const params = new URLSearchParams({
    key: GOOGLE_MAPS_API_KEY!,
    address: input,
    language,
  });

  if (region) params.append('region', region);
  if (resultType.length) params.append('result_type', resultType.join('|'));

  const cacheKey = `geocode:${params.toString()}`;
  const cachedResult = apiCache.get(cacheKey);
  if (cachedResult) return cachedResult;

  try {
    const data = await retryFetch(`${GOOGLE_MAPS_BASE_URL}/geocode/json?${params}`);

    if (data.status === 'OK') {
      const enrichedResults = await Promise.all(
        data.results.map(async (result: any) => ({
          ...result,
          nearby_places: await getNearbyPlaces(
            result.geometry.location.lat, 
            result.geometry.location.lng
          )
        }))
      );

      apiCache.set(cacheKey, enrichedResults);
      return enrichedResults;
    }

    throw new Error(data.status);
  } catch (error) {
    console.error('Advanced Geocoding Error:', error);
    return null;
  }
}

// Advanced place search
async function advancedPlaceSearch(query: string, options: {
  type?: string,
  radius?: number,
  language?: string,
  openNow?: boolean,
  minPrice?: number,
  maxPrice?: number
} = {}) {
  const {
    type = '',
    radius = CONFIG.DEFAULT_RADIUS,
    language = 'en',
    openNow = false,
    minPrice,
    maxPrice
  } = options;

  const params = new URLSearchParams({
    query,
    key: GOOGLE_MAPS_API_KEY!,
    language,
  });

  if (type) params.append('type', type);
  if (openNow) params.append('opennow', 'true');
  if (minPrice !== undefined) params.append('minprice', minPrice.toString());
  if (maxPrice !== undefined) params.append('maxprice', maxPrice.toString());

  const cacheKey = `placesearch:${params.toString()}`;
  const cachedResult = apiCache.get(cacheKey);
  if (cachedResult) return cachedResult;

  try {
    // Try Place Autocomplete first
    const autocompleteResults = await getPlaceAutocomplete(query, type);
    if (autocompleteResults.length) {
      return autocompleteResults;
    }

    // Fallback to Text Search
    const data = await retryFetch(`${GOOGLE_MAPS_BASE_URL}/place/textsearch/json?${params}`);

    if (data.status === 'OK') {
      const enrichedResults = await Promise.all(
        data.results.slice(0, CONFIG.MAX_RESULTS).map(async (result: any) => ({
          place_id: result.place_id,
          name: result.name,
          formatted_address: result.formatted_address,
          geometry: result.geometry,
          types: result.types,
          rating: result.rating,
          user_ratings_total: result.user_ratings_total,
          price_level: result.price_level,
          opening_hours: result.opening_hours,
          nearby_places: await getNearbyPlaces(
            result.geometry.location.lat, 
            result.geometry.location.lng,
            radius
          )
        }))
      );

      apiCache.set(cacheKey, enrichedResults);
      return enrichedResults;
    }

    return [];
  } catch (error) {
    console.error('Advanced Place Search Error:', error);
    return [];
  }
}

// GET Route Handler
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Advanced search parameters
    const query = searchParams.get("query")
    const searchType = searchParams.get("searchType") || "default"
    const language = searchParams.get("language") || "en"
    const type = searchParams.get("type")
    const openNow = searchParams.get("openNow") === "true"
    const minPrice = searchParams.get("minPrice") 
      ? parseInt(searchParams.get("minPrice")!) 
      : undefined
    const maxPrice = searchParams.get("maxPrice") 
      ? parseInt(searchParams.get("maxPrice")!) 
      : undefined
    const radius = searchParams.get("radius") 
      ? parseInt(searchParams.get("radius")!) 
      : CONFIG.DEFAULT_RADIUS

    if (!query) {
      return NextResponse.json({ error: "Query parameter is required" }, { status: 400 })
    }

    let results;
    switch(searchType) {
      case "geocode":
        results = await advancedGeocoding(query, { 
          language, 
          resultType: type ? [type] : undefined 
        });
        break;
      case "nearby":
        // Assuming query is coordinates for nearby search
        const [lat, lng] = query.split(',').map(parseFloat);
        results = await getNearbyPlaces(lat, lng, radius, type);
        break;
      default:
        results = await advancedPlaceSearch(query, {
          type,
          radius,
          language,
          openNow,
          minPrice,
          maxPrice
        });
    }

    return NextResponse.json(results || [], { status: 200 })
  } catch (error) {
    console.error("Advanced search error:", error)
    return NextResponse.json({ error: "Failed to process search" }, { status: 500 })
  }
}

// POST Route Handler (optional, can be customized)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      query, 
      searchType = "default", 
      language = "en",
      type,
      openNow,
      minPrice,
      maxPrice,
      radius
    } = body;

    if (!query) {
      return NextResponse.json({ error: "Query parameter is required" }, { status: 400 })
    }

    let results;
    switch(searchType) {
      case "geocode":
        results = await advancedGeocoding(query, { 
          language, 
          resultType: type ? [type] : undefined 
        });
        break;
      case "nearby":
        const [lat, lng] = query.split(',').map(parseFloat);
        results = await getNearbyPlaces(lat, lng, radius, type);
        break;
      default:
        results = await advancedPlaceSearch(query, {
          type,
          radius,
          language,
          openNow,
          minPrice,
          maxPrice
        });
    }

    return NextResponse.json(results || [], { status: 200 })
  } catch (error) {
    console.error("Advanced POST search error:", error)
    return NextResponse.json({ error: "Failed to process search" }, { status: 500 })
  }
}

// Export as default for compatibility
export default { GET, POST }