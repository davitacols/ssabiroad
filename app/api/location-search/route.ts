import { NextRequest, NextResponse } from "next/server";

// Configuration
const GOOGLE_PLACES_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
const GOOGLE_PLACES_BASE_URL = "https://maps.googleapis.com/maps/api/place";

// Type Definitions
interface PlaceResult {
  place_id: string;
  name: string;
  formatted_address: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    }
  };
  types: string[];
  rating?: number;
  user_ratings_total?: number;
  business_status?: string;
  opening_hours?: {
    open_now: boolean;
  };
  price_level?: number;
}

// Utility function for error handling and retries
async function fetchWithRetry(url: string, options?: RequestInit, maxRetries = 2) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      if (attempt === maxRetries - 1) {
        console.error('API request failed:', error);
        throw error;
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, 500 * Math.pow(2, attempt)));
    }
  }
}

// Place Search Function
async function searchPlaces(query: string, options: {
  type?: string;
  radius?: number;
  minPrice?: number;
  maxPrice?: number;
  openNow?: boolean;
} = {}) {
  const {
    type = '',
    radius = 5000,
    minPrice,
    maxPrice,
    openNow = false
  } = options;

  const params = new URLSearchParams({
    query,
    key: GOOGLE_PLACES_API_KEY!,
  });

  // Optional parameters
  if (type) params.append('type', type);
  if (radius) params.append('radius', radius.toString());
  if (minPrice !== undefined) params.append('minprice', minPrice.toString());
  if (maxPrice !== undefined) params.append('maxprice', maxPrice.toString());
  if (openNow) params.append('opennow', 'true');

  try {
    const url = `${GOOGLE_PLACES_BASE_URL}/textsearch/json?${params}`;
    const data = await fetchWithRetry(url);

    if (data.status === 'OK') {
      // Map and enrich results
      return data.results.map((place: any): PlaceResult => ({
        place_id: place.place_id,
        name: place.name,
        formatted_address: place.formatted_address,
        geometry: place.geometry,
        types: place.types,
        rating: place.rating,
        user_ratings_total: place.user_ratings_total,
        business_status: place.business_status,
        opening_hours: place.opening_hours,
        price_level: place.price_level
      }));
    }

    return [];
  } catch (error) {
    console.error('Place Search Error:', error);
    return [];
  }
}

// Place Autocomplete Function
async function getPlaceAutocomplete(input: string, options: {
  types?: string;
  strictBounds?: boolean;
} = {}) {
  const {
    types = '',
    strictBounds = false
  } = options;

  const params = new URLSearchParams({
    input,
    key: GOOGLE_PLACES_API_KEY!,
  });

  // Optional parameters
  if (types) params.append('types', types);
  if (strictBounds) params.append('strictbounds', 'true');

  try {
    const url = `${GOOGLE_PLACES_BASE_URL}/autocomplete/json?${params}`;
    const data = await fetchWithRetry(url);

    if (data.status === 'OK') {
      return data.predictions.map((prediction: any) => ({
        place_id: prediction.place_id,
        description: prediction.description,
        types: prediction.types,
        main_text: prediction.structured_formatting?.main_text,
        secondary_text: prediction.structured_formatting?.secondary_text
      }));
    }

    return [];
  } catch (error) {
    console.error('Place Autocomplete Error:', error);
    return [];
  }
}

// Place Details Function
async function getPlaceDetails(placeId: string) {
  const params = new URLSearchParams({
    place_id: placeId,
    key: GOOGLE_PLACES_API_KEY!,
    fields: 'place_id,name,formatted_address,geometry,type,rating,user_ratings_total,opening_hours,website,formatted_phone_number,photos'
  });

  try {
    const url = `${GOOGLE_PLACES_BASE_URL}/details/json?${params}`;
    const data = await fetchWithRetry(url);

    if (data.status === 'OK') {
      return data.result;
    }

    return null;
  } catch (error) {
    console.error('Place Details Error:', error);
    return null;
  }
}

// GET Route Handler
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Extract search parameters
    const query = searchParams.get('query');
    const searchType = searchParams.get('searchType') || 'search';
    const type = searchParams.get('type') || '';
    const radius = searchParams.get('radius') 
      ? parseInt(searchParams.get('radius')!) 
      : 5000;
    const minPrice = searchParams.get('minPrice') 
      ? parseInt(searchParams.get('minPrice')!) 
      : undefined;
    const maxPrice = searchParams.get('maxPrice') 
      ? parseInt(searchParams.get('maxPrice')!) 
      : undefined;
    const openNow = searchParams.get('openNow') === 'true';
    const placeId = searchParams.get('placeId');

    // Validate query
    if (!query && !placeId) {
      return NextResponse.json(
        { error: 'Query or Place ID is required' }, 
        { status: 400 }
      );
    }

    // Handle different search types
    let results;
    switch(searchType) {
      case 'autocomplete':
        results = await getPlaceAutocomplete(query!, { types: type });
        break;
      case 'details':
        if (placeId) {
          results = await getPlaceDetails(placeId);
        } else {
          return NextResponse.json(
            { error: 'Place ID is required for details search' }, 
            { status: 400 }
          );
        }
        break;
      default:
        results = await searchPlaces(query!, {
          type,
          radius,
          minPrice,
          maxPrice,
          openNow
        });
    }

    return NextResponse.json(results || [], { status: 200 });
  } catch (error) {
    console.error('Location Search Error:', error);
    return NextResponse.json(
      { error: 'Failed to process location search' }, 
      { status: 500 }
    );
  }
}

// POST Route Handler (optional)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      query,
      searchType = 'search',
      type = '',
      radius = 5000,
      minPrice,
      maxPrice,
      openNow = false,
      placeId
    } = body;

    // Validate query
    if (!query && !placeId) {
      return NextResponse.json(
        { error: 'Query or Place ID is required' }, 
        { status: 400 }
      );
    }

    // Handle different search types
    let results;
    switch(searchType) {
      case 'autocomplete':
        results = await getPlaceAutocomplete(query, { types: type });
        break;
      case 'details':
        if (placeId) {
          results = await getPlaceDetails(placeId);
        } else {
          return NextResponse.json(
            { error: 'Place ID is required for details search' }, 
            { status: 400 }
          );
        }
        break;
      default:
        results = await searchPlaces(query, {
          type,
          radius,
          minPrice,
          maxPrice,
          openNow
        });
    }

    return NextResponse.json(results || [], { status: 200 });
  } catch (error) {
    console.error('Location Search Error:', error);
    return NextResponse.json(
      { error: 'Failed to process location search' }, 
      { status: 500 }
    );
  }
}

export default { GET, POST }