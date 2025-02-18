// /app/api/accessibility/route.ts
import { NextRequest, NextResponse } from 'next/server';

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "AIzaSyC56tMVTlDcInBCHog0YqkuQ2cgH9JJuhU";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const placeId = searchParams.get('place_id');
  
  if (!placeId) {
    return NextResponse.json({ error: 'place_id parameter is required' }, { status: 400 });
  }
  
  try {
    // First fetch place details to get more information
    const detailsResponse = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=address_component,formatted_address,geometry,name,wheelchair_accessible_entrance&key=${GOOGLE_MAPS_API_KEY}`
    );
    
    if (!detailsResponse.ok) {
      throw new Error(`Failed to fetch place details: ${detailsResponse.statusText}`);
    }
    
    const detailsData = await detailsResponse.json();
    
    if (detailsData.status !== 'OK') {
      throw new Error(`Google API error: ${detailsData.status}`);
    }
    
    const placeDetails = detailsData.result;
    
    // Attempt to gather accessibility information
    // Note: For comprehensive accessibility data, you would need to integrate with 
    // specialized accessibility databases or crowd-sourced platforms
    
    const accessibilityData = {
      wheelchair_accessible_entrance: placeDetails.wheelchair_accessible_entrance || false,
      place_name: placeDetails.name,
      place_address: placeDetails.formatted_address,
      estimated_accessibility: {
        // This is a placeholder. In a real implementation, you would use more
        // data sources to determine these values
        wheelchair_accessible: placeDetails.wheelchair_accessible_entrance || 'unknown',
        has_accessible_parking: 'unknown',
        has_accessible_restroom: 'unknown',
        has_braille: 'unknown',
        is_service_animal_friendly: 'unknown',
        has_step_free_access: 'unknown'
      },
      note: 'For comprehensive accessibility data, consider integrating with specialized accessibility databases or platforms like AXS Map, AccessNow, or similar services'
    };
    
    return NextResponse.json(accessibilityData);
    
  } catch (error) {
    console.error('Error fetching accessibility data:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch accessibility data',
      note: 'Accessibility data may be limited for many locations'
    }, { status: 200 });
  }
}