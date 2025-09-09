import { NextRequest, NextResponse } from 'next/server';

interface LocationSimilarity {
  locationId: string;
  name: string;
  coordinates: { lat: number; lng: number };
  similarity: number;
  matchType: 'exact' | 'nearby' | 'business' | 'landmark';
  distance: number;
  photos: string[];
  visitCount: number;
}

class LocationMatcher {
  calculateSimilarity(loc1: any, loc2: any): LocationSimilarity | null {
    // Check for null/undefined locations first
    if (!loc1?.location?.latitude || !loc1?.location?.longitude || !loc2?.location?.latitude || !loc2?.location?.longitude) {
      return null;
    }
    
    const distance = this.calculateDistance(
      loc1.location.latitude, loc1.location.longitude,
      loc2.location.latitude, loc2.location.longitude
    );
    
    let similarity = 0;
    let matchType: 'exact' | 'nearby' | 'business' | 'landmark' = 'nearby';

    if (loc1.name && loc2.name && 
        this.normalizeBusinessName(loc1.name) === this.normalizeBusinessName(loc2.name)) {
      similarity = 0.95;
      matchType = 'business';
    }
    else if (distance < 0.05) {
      similarity = 0.85;
      matchType = 'exact';
    }
    else if (distance < 0.2) {
      similarity = Math.max(0.6, 1 - (distance / 0.2) * 0.4);
      matchType = 'nearby';
    }
    
    if (similarity > 0.6) {
      return {
        locationId: loc2.id || `${loc2.location.latitude}_${loc2.location.longitude}`,
        name: loc2.name || loc2.address,
        coordinates: { lat: loc2.location.latitude, lng: loc2.location.longitude },
        similarity,
        matchType,
        distance: Math.round(distance * 1000),
        photos: loc2.photos || [],
        visitCount: loc2.visitCount || 1
      };
    }
    
    return null;
  }
  
  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    return 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)) * R;
  }
  
  private normalizeBusinessName(name: string): string {
    return name.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim();
  }
}

export async function POST(request: NextRequest) {
  try {
    const { location, recentLocations } = await request.json();

    if (!location?.location?.latitude || !location?.location?.longitude) {
      return NextResponse.json({ error: 'Invalid location data' }, { status: 400 });
    }
    
    if (!location?.location?.latitude || !location?.location?.longitude) {
      return NextResponse.json({ error: 'Invalid location data' }, { status: 400 });
    }
    
    const matcher = new LocationMatcher();
    const similarities: LocationSimilarity[] = [];
    
    for (const recentLoc of (recentLocations || []).slice(0, 1000)) {
      const similarity = matcher.calculateSimilarity(location, recentLoc);
      if (similarity) {
        similarities.push(similarity);
      }
    }
    
    similarities.sort((a, b) => b.similarity - a.similarity);
    
    return NextResponse.json({
      success: true,
      matches: similarities.slice(0, 10),
      isDuplicate: similarities.length > 0 && similarities[0].similarity > 0.9,
      bestMatch: similarities[0] || null,
      totalMatches: similarities.length
    });
    
  } catch (error) {
    console.error('Location similarity error:', error);
    return NextResponse.json({ error: 'Similarity check failed' }, { status: 500 });
  }
}