// /app/api/geocode/route.ts
import { NextRequest, NextResponse } from 'next/server';

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "AIzaSyC56tMVTlDcInBCHog0YqkuQ2cgH9JJuhU";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const address = searchParams.get('address');
  
  if (!address) {
    return NextResponse.json({ error: 'address parameter is required' }, { status: 400 });
  }
  
  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_MAPS_API_KEY}`
    );
    
    if (!response.ok) {
      throw new Error(`Geocoding API error: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data.status !== 'OK') {
      throw new Error(`Google API error: ${data.status}`);
    }
    
    if (!data.results || data.results.length === 0) {
      return NextResponse.json({ error: 'No results found for the address' }, { status: 404 });
    }
    
    // Extract important information from the first result
    const result = data.results[0];
    return NextResponse.json({
      formatted_address: result.formatted_address,
      place_id: result.place_id,
      location: result.geometry.location,
      location_type: result.geometry.location_type,
      viewport: result.geometry.viewport,
      address_components: result.address_components,
      types: result.types
    });
    
  } catch (error) {
    console.error('Error geocoding address:', error);
    return NextResponse.json({ error: 'Failed to geocode address' }, { status: 500 });
  }
}