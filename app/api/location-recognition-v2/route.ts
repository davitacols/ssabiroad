import { NextRequest, NextResponse } from 'next/server';
import * as exifParser from 'exif-parser';
import NodeCache from 'node-cache';

interface Location {
  latitude: number;
  longitude: number;
}

interface LocationResult {
  success: boolean;
  name?: string;
  address?: string;
  location?: Location;
  confidence: number;
  method: string;
  error?: string;
  nearbyPlaces?: any[];
  photos?: string[];
  deviceAnalysis?: any;
  description?: string;
}

// Ultra-fast cache with 5-minute TTL
const cache = new NodeCache({ stdTTL: 300 });

class LocationRecognizer {
  constructor() {}

  // Ultra-fast EXIF GPS extraction
  extractGPS(buffer: Buffer): LocationResult | null {
    try {
      const parser = exifParser.create(buffer);
      const result = parser.parse();
      
      if (result.tags.GPSLatitude && result.tags.GPSLongitude) {
        const lat = result.tags.GPSLatitude;
        const lng = result.tags.GPSLongitude;
        
        if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
          return {
            success: true,
            name: 'GPS Location',
            location: { latitude: lat, longitude: lng },
            confidence: 0.95,
            method: 'exif-gps-fast'
          };
        }
      }
    } catch {}
    return null;
  }

  // Fast distance calculation
  calculateDistance(p1: Location, p2: Location): number {
    const dLat = p2.latitude - p1.latitude;
    const dLon = p2.longitude - p1.longitude;
    return Math.sqrt(dLat * dLat + dLon * dLon) * 111; // Approximate km
  }

  // Cached nearby places lookup
  async getNearbyPlaces(lat: number, lng: number): Promise<any[]> {
    const key = `places_${Math.round(lat*100)}_${Math.round(lng*100)}`;
    const cached = cache.get(key);
    if (cached) return cached as any[];
    
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=500&type=point_of_interest&key=${process.env.GOOGLE_PLACES_API_KEY}`,
        { signal: AbortSignal.timeout(2000) }
      );
      
      const data = await response.json();
      const places = data.results?.slice(0, 3).map((p: any) => ({
        name: p.name,
        type: p.types?.[0]?.replace(/_/g, ' ') || 'Place',
        rating: p.rating || 0
      })) || [];
      
      cache.set(key, places);
      return places;
    } catch {
      return [];
    }
  }
  
  // Skip photos for speed
  async getLocationPhotos(): Promise<string[]> {
    return [];
  }
  
  // Minimal device analysis for speed
  analyzeDeviceData(buffer: Buffer): any {
    try {
      const parser = exifParser.create(buffer);
      const result = parser.parse();
      return {
        camera: result.tags?.Make || 'Unknown',
        model: result.tags?.Model || 'Unknown'
      };
    } catch {
      return null;
    }
  }

  // Ultra-fast enrichment with minimal data
  async enrichLocationData(baseResult: LocationResult, buffer: Buffer): Promise<LocationResult> {
    const { latitude, longitude } = baseResult.location!;
    
    // Only get cached address if available
    const addressKey = `addr_${Math.round(latitude*1000)}_${Math.round(longitude*1000)}`;
    let address = cache.get(addressKey) as string;
    
    if (!address) {
      try {
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${process.env.GOOGLE_MAPS_API_KEY}`,
          { signal: AbortSignal.timeout(1500) }
        );
        const data = await response.json();
        address = data.results?.[0]?.formatted_address || 'Unknown';
        cache.set(addressKey, address);
      } catch {
        address = 'Unknown';
      }
    }
    
    return {
      ...baseResult,
      address,
      nearbyPlaces: await this.getNearbyPlaces(latitude, longitude),
      deviceAnalysis: this.analyzeDeviceData(buffer),
      confidence: 0.98
    };
  }

  // Ultra-fast V2 pipeline with GPS injection support
  async recognize(buffer: Buffer, injectedGPS?: Location): Promise<LocationResult> {
    // First try injected GPS from live camera
    if (injectedGPS) {
      const injectedResult: LocationResult = {
        success: true,
        name: 'Live Camera Location',
        location: injectedGPS,
        confidence: 0.98,
        method: 'camera-gps-injected'
      };
      return await this.enrichLocationData(injectedResult, buffer);
    }
    
    // Fallback to EXIF GPS
    const gpsResult = this.extractGPS(buffer);
    if (gpsResult?.location) {
      return await this.enrichLocationData(gpsResult, buffer);
    }
    
    return {
      success: false,
      confidence: 0,
      method: 'no-gps-data',
      error: 'No GPS data available'
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const image = formData.get('image') as File;
    
    if (!image) {
      return NextResponse.json({ error: 'Image required' }, { status: 400 });
    }
    
    const buffer = Buffer.from(await image.arrayBuffer());
    
    // Check for injected GPS coordinates
    let injectedGPS: Location | undefined;
    const lat = formData.get('latitude');
    const lng = formData.get('longitude');
    const gpsSource = formData.get('gps_source');
    
    if (lat && lng && gpsSource === 'camera_injected') {
      injectedGPS = {
        latitude: parseFloat(lat as string),
        longitude: parseFloat(lng as string)
      };
      console.log('📍 Using injected GPS from live camera:', injectedGPS);
    }
    
    const recognizer = new LocationRecognizer();
    const result = await recognizer.recognize(buffer, injectedGPS);
    
    return NextResponse.json(result);
    
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}