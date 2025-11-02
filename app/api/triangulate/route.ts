import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 180;

interface Location {
  latitude: number;
  longitude: number;
}

function calculateDistance(p1: Location, p2: Location): number {
  const R = 6371;
  const dLat = (p2.latitude - p1.latitude) * Math.PI / 180;
  const dLon = (p2.longitude - p1.longitude) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(p1.latitude * Math.PI / 180) * Math.cos(p2.latitude * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function triangulate(locations: Array<{location: Location, confidence: number}>): Location {
  let totalWeight = 0;
  let weightedLat = 0;
  let weightedLng = 0;
  
  for (const loc of locations) {
    const weight = loc.confidence;
    totalWeight += weight;
    weightedLat += loc.location.latitude * weight;
    weightedLng += loc.location.longitude * weight;
  }
  
  return {
    latitude: weightedLat / totalWeight,
    longitude: weightedLng / totalWeight
  };
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const images = formData.getAll('images') as File[];
    
    if (!images || images.length < 2) {
      return NextResponse.json({ error: 'At least 2 images required' }, { status: 400 });
    }
    
    const locations = [];
    
    for (const image of images) {
      const buffer = Buffer.from(await image.arrayBuffer());
      const recognitionFormData = new FormData();
      recognitionFormData.append('image', new Blob([buffer]));
      
      const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000';
      const response = await fetch(`${baseUrl}/api/location-recognition-v2`, {
        method: 'POST',
        body: recognitionFormData
      });
      
      const result = await response.json();
      if (result.success && result.location) {
        locations.push({
          location: result.location,
          confidence: result.confidence || 0.5,
          name: result.name
        });
      }
    }
    
    if (locations.length < 2) {
      return NextResponse.json({ 
        success: false, 
        error: 'Not enough valid locations found' 
      }, { status: 400 });
    }
    
    const triangulatedLocation = triangulate(locations);
    const distances = locations.map(loc => calculateDistance(triangulatedLocation, loc.location));
    const avgDistance = distances.reduce((a, b) => a + b, 0) / distances.length;
    
    return NextResponse.json({
      success: true,
      location: triangulatedLocation,
      confidence: Math.min(...locations.map(l => l.confidence)),
      method: 'multi-image-triangulation',
      sourceLocations: locations,
      averageDistance: avgDistance,
      maxDistance: Math.max(...distances)
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
