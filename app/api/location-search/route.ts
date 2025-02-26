import { NextRequest, NextResponse } from 'next/server';

// Use the environment variable consistently
const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "AIzaSyC56tMVTlDcInBCHog0YqkuQ2cgH9JJuhU";

// Enhanced location-search route handler with better error handling
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');
    const radius = searchParams.get('radius') || '5000'; // Default 5km radius
    const type = searchParams.get('type') || ''; // Optional type filter
    
    if (!query) {
      return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
    }
    
    // Check if query could be coordinates
    const coordRegex = /^-?\d+(\.\d+)?,-?\d+(\.\d+)?$/;
    if (coordRegex.test(query)) {
      return await getDetailsByCoordinates(query);
    }
    
    // Step 1: Use Place Autocomplete API
    const autocompleteEndpoint = 'https://maps.googleapis.com/maps/api/place/autocomplete/json';
    const autocompleteParams = new URLSearchParams({
      input: query,
      key: GOOGLE_MAPS_API_KEY,
    });
    
    // Add types parameter only if type is provided
    if (type) {
      // For 'place' type, use establishment instead which is a valid Google type
      const googleType = type === 'place' ? 'establishment' : type;
      autocompleteParams.append('types', googleType);
    }
    
    const autocompleteResponse = await fetch(`${autocompleteEndpoint}?${autocompleteParams}`);
    const autocompleteData = await autocompleteResponse.json();
    
    if (autocompleteData.status === 'ZERO_RESULTS') {
      // Try text search for more flexible matching
      const textSearchResult = await tryTextSearch(query, type);
      if (textSearchResult && textSearchResult.length > 0) {
        return NextResponse.json(textSearchResult);
      }
      
      // Return empty array if no results found
      return NextResponse.json([], { status: 200 });
    }
    
    if (autocompleteData.status !== 'OK') {
      console.error(`Autocomplete API error for query "${query}": ${autocompleteData.status}`);
      
      // Fallback to text search
      const textSearchResult = await tryTextSearch(query, type);
      if (textSearchResult && textSearchResult.length > 0) {
        return NextResponse.json(textSearchResult);
      }
      
      return NextResponse.json([], { status: 200 });
    }
    
    // Step 2: Get detailed information for each suggestion
    const suggestions = await Promise.all(
      autocompleteData.predictions.map(async (prediction) => {
        return await getPlaceDetails(prediction.place_id);
      })
    );
    
    // Filter out any null results
    const validSuggestions = suggestions.filter(suggestion => suggestion !== null);
    
    return NextResponse.json(validSuggestions);
  } catch (error) {
    console.error("Location search error:", error);
    return NextResponse.json({ error: 'Failed to process location search' }, { status: 500 });
  }
}

// Extract geocoding by coordinates to a reusable function
async function getDetailsByCoordinates(latlng: string) {
  try {
    const geocodingEndpoint = 'https://maps.googleapis.com/maps/api/geocode/json';
    const geocodingParams = new URLSearchParams({
      latlng: latlng,
      key: GOOGLE_MAPS_API_KEY
    });
    
    const geocodingResponse = await fetch(`${geocodingEndpoint}?${geocodingParams}`);
    const geocodingData = await geocodingResponse.json();
    
    if (geocodingData.status === 'OK') {
      // Get coordinates for additional data
      const [lat, lng] = latlng.split(',').map(parseFloat);
      
      // Map results to consistent format
      const formattedResults = await Promise.all(
        geocodingData.results.map(async (result) => {
          // Get nearby places
          const nearbyPlaces = await getNearbyPlaces(lat, lng);
          
          return {
            place_id: result.place_id,
            name: extractName(result),
            formatted_address: result.formatted_address,
            address_components: result.address_components,
            geometry: result.geometry,
            location: {
              lat: result.geometry.location.lat,
              lng: result.geometry.location.lng
            },
            plus_code: result.plus_code,
            types: result.types,
            nearby_places: nearbyPlaces
          };
        })
      );
      
      return NextResponse.json(formattedResults);
    }
    
    if (geocodingData.status === 'ZERO_RESULTS') {
      return NextResponse.json([], { status: 200 });
    }
    
    console.error(`Geocoding API error for coordinates "${latlng}": ${geocodingData.status}`);
    return NextResponse.json({ error: `Geocoding failed: ${geocodingData.status}` }, { status: 400 });
  } catch (error) {
    console.error("Geocoding error:", error);
    return NextResponse.json({ error: 'Failed to process coordinates' }, { status: 500 });
  }
}

// Try text search for more flexible matching
async function tryTextSearch(query: string, type: string = '') {
  try {
    const textSearchEndpoint = 'https://maps.googleapis.com/maps/api/place/textsearch/json';
    const textSearchParams = new URLSearchParams({
      query: query,
      key: GOOGLE_MAPS_API_KEY
    });
    
    if (type && type !== 'place') {
      textSearchParams.append('type', type);
    }
    
    const textSearchResponse = await fetch(`${textSearchEndpoint}?${textSearchParams}`);
    const textSearchData = await textSearchResponse.json();
    
    if (textSearchData.status === 'OK') {
      return Promise.all(
        textSearchData.results.map(async (result) => {
          const nearbyPlaces = await getNearbyPlaces(
            result.geometry.location.lat,
            result.geometry.location.lng
          );
          
          return {
            place_id: result.place_id,
            name: result.name,
            formatted_address: result.formatted_address,
            geometry: result.geometry,
            location: {
              lat: result.geometry.location.lat,
              lng: result.geometry.location.lng
            },
            types: result.types,
            rating: result.rating,
            user_ratings_total: result.user_ratings_total,
            business_status: result.business_status,
            nearby_places: nearbyPlaces,
            photos: result.photos?.map(photo => ({
              photo_reference: photo.photo_reference,
              html_attribution: photo.html_attributions
            }))
          };
        })
      );
    }
    
    if (textSearchData.status !== 'ZERO_RESULTS') {
      console.error(`Text search API error for query "${query}": ${textSearchData.status}`);
    }
    
    return null;
  } catch (error) {
    console.error("Text search error:", error);
    return null;
  }
}

// Get detailed place information
async function getPlaceDetails(placeId: string) {
  try {
    const detailsEndpoint = 'https://maps.googleapis.com/maps/api/place/details/json';
    const detailsParams = new URLSearchParams({
      place_id: placeId,
      fields: 'name,formatted_address,formatted_phone_number,geometry,address_component,place_id,type,url,website,rating,review,opening_hours,photo,price_level,user_ratings_total,plus_code',
      key: GOOGLE_MAPS_API_KEY
    });
    
    const detailsResponse = await fetch(`${detailsEndpoint}?${detailsParams}`);
    const detailsData = await detailsResponse.json();
    
    if (detailsData.status === 'OK') {
      const { result } = detailsData;
      
      // Get nearby places
      const nearbyPlaces = await getNearbyPlaces(
        result.geometry.location.lat,
        result.geometry.location.lng
      );
      
      return {
        place_id: result.place_id,
        name: result.name,
        formatted_address: result.formatted_address,
        formatted_phone_number: result.formatted_phone_number,
        geometry: result.geometry,
        location: {
          lat: result.geometry.location.lat,
          lng: result.geometry.location.lng
        },
        address_components: result.address_components,
        types: result.types,
        url: result.url,
        website: result.website,
        rating: result.rating,
        reviews: result.reviews?.map(review => ({
          author_name: review.author_name,
          rating: review.rating,
          text: review.text,
          time: review.time
        })),
        opening_hours: result.opening_hours,
        photos: result.photos?.map(photo => ({
          photo_reference: photo.photo_reference,
          html_attribution: photo.html_attributions
        })),
        price_level: result.price_level,
        user_ratings_total: result.user_ratings_total,
        plus_code: result.plus_code,
        nearby_places: nearbyPlaces
      };
    }
    
    if (detailsData.status !== 'ZERO_RESULTS' && detailsData.status !== 'NOT_FOUND') {
      console.error(`Place details API error for place_id "${placeId}": ${detailsData.status}`);
    }
    
    return null;
  } catch (error) {
    console.error("Place details error:", error);
    return null;
  }
}

// Get nearby places of interest
async function getNearbyPlaces(lat: number, lng: number, radius: number = 1000) {
  try {
    const nearbyEndpoint = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json';
    const nearbyParams = new URLSearchParams({
      location: `${lat},${lng}`,
      radius: radius.toString(),
      key: GOOGLE_MAPS_API_KEY
    });
    
    const nearbyResponse = await fetch(`${nearbyEndpoint}?${nearbyParams}`);
    const nearbyData = await nearbyResponse.json();
    
    if (nearbyData.status === 'OK') {
      return nearbyData.results.map(place => ({
        place_id: place.place_id,
        name: place.name,
        vicinity: place.vicinity,
        types: place.types,
        location: {
          lat: place.geometry.location.lat,
          lng: place.geometry.location.lng
        },
        business_status: place.business_status,
        rating: place.rating,
        user_ratings_total: place.user_ratings_total,
        price_level: place.price_level,
        opening_hours: place.opening_hours
      }));
    }
    
    if (nearbyData.status !== 'ZERO_RESULTS') {
      console.error(`Nearby places API error for coordinates "${lat},${lng}": ${nearbyData.status}`);
    }
    
    return [];
  } catch (error) {
    console.error("Nearby places error:", error);
    return [];
  }
}

// Extract a meaningful name from address components
function extractName(geocodeResult: any): string {
  // Try to extract the most specific name from the address components
  if (geocodeResult.address_components && geocodeResult.address_components.length > 0) {
    // Priority order for name extraction
    const typesPriority = [
      'premise',
      'subpremise',
      'point_of_interest',
      'establishment',
      'street_number',
      'route',
      'neighborhood',
      'sublocality_level_1',
      'sublocality',
      'locality',
      'administrative_area_level_2'
    ];
    
    for (const type of typesPriority) {
      const component = geocodeResult.address_components.find(
        (comp: any) => comp.types.includes(type)
      );
      if (component) {
        return component.long_name;
      }
    }
  }
  
  // Default to formatted address if no specific name found
  return geocodeResult.formatted_address.split(',')[0] || 'Location';
}

// Enhanced POST method with better error handling
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const address = formData.get('address');
    const lat = formData.get('lat');
    const lng = formData.get('lng');
    
    if (address) {
      // Process by address
      const geocodingEndpoint = 'https://maps.googleapis.com/maps/api/geocode/json';
      const geocodingParams = new URLSearchParams({
        address: String(address),
        key: GOOGLE_MAPS_API_KEY
      });
      
      const geocodingResponse = await fetch(`${geocodingEndpoint}?${geocodingParams}`);
      const geocodingData = await geocodingResponse.json();
      
      if (geocodingData.status === 'OK') {
        const result = geocodingData.results[0];
        
        // Get nearby places
        const nearbyPlaces = await getNearbyPlaces(
          result.geometry.location.lat,
          result.geometry.location.lng
        );
        
        return NextResponse.json({
          ...result,
          nearby_places: nearbyPlaces
        });
      }
      
      if (geocodingData.status === 'ZERO_RESULTS') {
        return NextResponse.json({ error: 'No results found for this address' }, { status: 404 });
      }
      
      console.error(`Geocoding API error for address "${address}": ${geocodingData.status}`);
      return NextResponse.json({ error: `Geocoding failed: ${geocodingData.status}` }, { status: 400 });
    } else if (lat && lng) {
      // Process by coordinates
      const geocodingEndpoint = 'https://maps.googleapis.com/maps/api/geocode/json';
      const geocodingParams = new URLSearchParams({
        latlng: `${lat},${lng}`,
        key: GOOGLE_MAPS_API_KEY
      });
      
      const geocodingResponse = await fetch(`${geocodingEndpoint}?${geocodingParams}`);
      const geocodingData = await geocodingResponse.json();
      
      if (geocodingData.status === 'OK') {
        const result = geocodingData.results[0];
        
        // Get nearby places
        const nearbyPlaces = await getNearbyPlaces(
          Number(lat),
          Number(lng)
        );
        
        return NextResponse.json({
          ...result,
          nearby_places: nearbyPlaces
        });
      }
      
      if (geocodingData.status === 'ZERO_RESULTS') {
        return NextResponse.json({ error: 'No results found for these coordinates' }, { status: 404 });
      }
      
      console.error(`Geocoding API error for coordinates "${lat},${lng}": ${geocodingData.status}`);
      return NextResponse.json({ error: `Geocoding failed: ${geocodingData.status}` }, { status: 400 });
    } else {
      return NextResponse.json({ error: 'Address or coordinates are required' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error processing location data:', error);
    return NextResponse.json({ error: 'Failed to process location data' }, { status: 500 });
  }
}