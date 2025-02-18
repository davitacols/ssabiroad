// /app/api/location-search/route.ts
import { NextRequest, NextResponse } from 'next/server';

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "AIzaSyC56tMVTlDcInBCHog0YqkuQ2cgH9JJuhU";

// Enhanced location-search route handler
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');
  
  if (!query) {
    return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
  }
  
  // Step 1: Use Place Autocomplete for user input (this helps with partial addresses)
  const autocompleteEndpoint = 'https://maps.googleapis.com/maps/api/place/autocomplete/json';
  const autocompleteParams = new URLSearchParams({
    input: query,
    key: process.env.GOOGLE_MAPS_API_KEY || '',
    types: 'address', // Focus on addresses
  });
  
  const autocompleteResponse = await fetch(`${autocompleteEndpoint}?${autocompleteParams}`);
  const autocompleteData = await autocompleteResponse.json();
  
  // If we get ZERO_RESULTS, try geocoding directly (might be coordinates)
  if (autocompleteData.status === 'ZERO_RESULTS') {
    // Check if query could be coordinates
    const coordRegex = /^-?\d+(\.\d+)?,-?\d+(\.\d+)?$/;
    if (coordRegex.test(query)) {
      const geocodingEndpoint = 'https://maps.googleapis.com/maps/api/geocode/json';
      const geocodingParams = new URLSearchParams({
        latlng: query,
        key: process.env.GOOGLE_MAPS_API_KEY || ''
      });
      
      const geocodingResponse = await fetch(`${geocodingEndpoint}?${geocodingParams}`);
      const geocodingData = await geocodingResponse.json();
      
      if (geocodingData.status === 'OK') {
        // Return formatted address data
        return NextResponse.json(geocodingData.results.map(result => ({
          place_id: result.place_id,
          description: result.formatted_address,
          coordinates: {
            lat: result.geometry.location.lat,
            lng: result.geometry.location.lng
          },
          address_components: result.address_components
        })));
      }
    }
    
    // If still no results, return empty array
    return NextResponse.json([], { status: 200 });
  }
  
  if (autocompleteData.status !== 'OK') {
    throw new Error(`Google API error: ${autocompleteData.status}`);
  }
  
  // Step 2: For each suggestion, get full details
  const suggestions = await Promise.all(
    autocompleteData.predictions.map(async (prediction) => {
      const detailsEndpoint = 'https://maps.googleapis.com/maps/api/place/details/json';
      const detailsParams = new URLSearchParams({
        place_id: prediction.place_id,
        fields: 'name,formatted_address,geometry,address_component,place_id,type,url',
        key: process.env.GOOGLE_MAPS_API_KEY || ''
      });
      
      const detailsResponse = await fetch(`${detailsEndpoint}?${detailsParams}`);
      const detailsData = await detailsResponse.json();
      
      if (detailsData.status === 'OK') {
        const { result } = detailsData;
        return {
          place_id: result.place_id,
          description: result.formatted_address,
          coordinates: {
            lat: result.geometry.location.lat,
            lng: result.geometry.location.lng
          },
          address_components: result.address_components,
          types: result.types,
          url: result.url
        };
      }
      
      // If details lookup fails, return basic info
      return {
        place_id: prediction.place_id,
        description: prediction.description
      };
    })
  );
  
  return NextResponse.json(suggestions);
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const address = formData.get('address');
  const lat = formData.get('lat');
  const lng = formData.get('lng');
  
  if (address) {
    // Process by address
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(String(address))}&key=${GOOGLE_MAPS_API_KEY}`
      );
      
      const data = await response.json();
      
      if (data.status !== 'OK') {
        throw new Error(`Google API error: ${data.status}`);
      }
      
      return NextResponse.json(data.results[0] || {});
      
    } catch (error) {
      console.error('Error processing address:', error);
      return NextResponse.json({ error: 'Failed to process address' }, { status: 500 });
    }
  } else if (lat && lng) {
    // Process by coordinates
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_API_KEY}`
      );
      
      const data = await response.json();
      
      if (data.status !== 'OK') {
        throw new Error(`Google API error: ${data.status}`);
      }
      
      return NextResponse.json(data.results[0] || {});
      
    } catch (error) {
      console.error('Error processing coordinates:', error);
      return NextResponse.json({ error: 'Failed to process coordinates' }, { status: 500 });
    }
  } else {
    return NextResponse.json({ error: 'Address or coordinates are required' }, { status: 400 });
  }
}