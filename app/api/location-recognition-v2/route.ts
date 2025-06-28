import { NextRequest, NextResponse } from 'next/server';
import * as vision from '@google-cloud/vision';
import * as exifParser from 'exif-parser';

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
  weatherData?: any;
  description?: string;
}

class LocationRecognizer {
  private visionClient: vision.ImageAnnotatorClient;

  constructor() {
    const credentials = JSON.parse(Buffer.from(process.env.GCLOUD_CREDENTIALS!, 'base64').toString());
    this.visionClient = new vision.ImageAnnotatorClient({
      credentials: {
        client_email: credentials.client_email,
        private_key: credentials.private_key,
      },
      projectId: credentials.project_id,
    });
  }

  // EXIF GPS extraction with reverse geocoding
  async extractGPS(buffer: Buffer): Promise<LocationResult | null> {
    try {
      const parser = exifParser.create(buffer);
      const result = parser.parse();
      
      if (result.tags.GPSLatitude && result.tags.GPSLongitude) {
        const lat = result.tags.GPSLatitude;
        const lng = result.tags.GPSLongitude;
        
        if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
          console.log(`📍 Found GPS coordinates: ${lat}, ${lng}`);
          
          // Reverse geocode to get address
          try {
            const response = await fetch(
              `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${process.env.GOOGLE_MAPS_API_KEY}`
            );
            
            const data = await response.json();
            
            if (data.results && data.results.length > 0) {
              const address = data.results[0].formatted_address;
              console.log(`🏠 Reverse geocoded address: ${address}`);
              
              return {
                success: true,
                name: 'GPS Location',
                address: address,
                location: { latitude: lat, longitude: lng },
                confidence: 0.95,
                method: 'exif-gps'
              };
            }
          } catch (geocodeError) {
            console.log('⚠️ Reverse geocoding failed, returning coordinates only');
          }
          
          // Fallback: return coordinates without address
          return {
            success: true,
            name: 'GPS Location',
            location: { latitude: lat, longitude: lng },
            confidence: 0.95,
            method: 'exif-gps'
          };
        }
      }
    } catch (error) {
      console.log('No EXIF GPS data found');
    }
    return null;
  }

  // Calculate distance between two points
  calculateDistance(point1: Location, point2: Location): number {
    const R = 6371; // Earth's radius in km
    const dLat = (point2.latitude - point1.latitude) * Math.PI / 180;
    const dLon = (point2.longitude - point1.longitude) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(point1.latitude * Math.PI / 180) * Math.cos(point2.latitude * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  // Get nearby places using Google Places API
  async getNearbyPlaces(lat: number, lng: number): Promise<any[]> {
    try {
      console.log('🏢 Fetching nearby places...');
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=1000&key=${process.env.GOOGLE_PLACES_API_KEY}`
      );
      
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        const places = data.results.slice(0, 10).map((place: any) => ({
          name: place.name,
          type: place.types?.[0]?.replace(/_/g, ' ') || 'Place',
          rating: place.rating || 0,
          distance: Math.round(this.calculateDistance(
            { latitude: lat, longitude: lng },
            { latitude: place.geometry.location.lat, longitude: place.geometry.location.lng }
          ) * 1000), // Convert to meters
          address: place.vicinity,
          placeId: place.place_id,
          priceLevel: place.price_level
        }));
        
        console.log(`✅ Found ${places.length} nearby places`);
        return places;
      }
    } catch (error) {
      console.log('❌ Failed to fetch nearby places');
    }
    return [];
  }
  
  // Get location photos using Google Places API
  async getLocationPhotos(lat: number, lng: number): Promise<string[]> {
    try {
      console.log('📸 Fetching location photos...');
      
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=500&key=${process.env.GOOGLE_PLACES_API_KEY}`
      );
      
      const data = await response.json();
      const photos: string[] = [];
      
      if (data.results) {
        for (const place of data.results.slice(0, 5)) {
          if (place.photos && place.photos.length > 0) {
            const photoRef = place.photos[0].photo_reference;
            const photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photoRef}&key=${process.env.GOOGLE_PLACES_API_KEY}`;
            photos.push(photoUrl);
          }
        }
      }
      
      console.log(`✅ Found ${photos.length} location photos`);
      return photos;
    } catch (error) {
      console.log('❌ Failed to fetch location photos');
    }
    return [];
  }
  
  // Analyze device and image metadata
  async analyzeDeviceData(buffer: Buffer): Promise<any> {
    try {
      console.log('📱 Analyzing device data...');
      const parser = exifParser.create(buffer);
      const result = parser.parse();
      
      const deviceInfo = {
        camera: {
          make: result.tags?.Make || 'Unknown',
          model: result.tags?.Model || 'Unknown',
          software: result.tags?.Software || 'Unknown'
        },
        image: {
          width: result.tags?.ExifImageWidth || result.imageSize?.width || 0,
          height: result.tags?.ExifImageHeight || result.imageSize?.height || 0,
          orientation: result.tags?.Orientation || 1,
          dateTime: result.tags?.DateTime ? new Date(result.tags.DateTime * 1000).toISOString() : null,
          flash: result.tags?.Flash !== undefined ? (result.tags.Flash > 0) : null
        },
        settings: {
          focalLength: result.tags?.FocalLength || null,
          aperture: result.tags?.FNumber || null,
          iso: result.tags?.ISO || null,
          exposureTime: result.tags?.ExposureTime || null
        }
      };
      
      console.log(`✅ Analyzed device: ${deviceInfo.camera.make} ${deviceInfo.camera.model}`);
      return deviceInfo;
    } catch (error) {
      console.log('❌ Failed to analyze device data');
      return null;
    }
  }

  // Enrich GPS location with comprehensive data
  async enrichLocationData(baseResult: LocationResult, buffer: Buffer): Promise<LocationResult> {
    const { latitude, longitude } = baseResult.location!;
    console.log('🔍 Enriching location data...');
    
    try {
      // Parallel data fetching for better performance
      const [nearbyPlaces, locationPhotos, deviceAnalysis] = await Promise.all([
        this.getNearbyPlaces(latitude, longitude),
        this.getLocationPhotos(latitude, longitude),
        this.analyzeDeviceData(buffer)
      ]);
      
      return {
        ...baseResult,
        nearbyPlaces,
        photos: locationPhotos,
        deviceAnalysis,
        confidence: 0.98, // Higher confidence with enriched data
        description: `GPS location enriched with ${nearbyPlaces.length} nearby places, ${locationPhotos.length} photos, and device analysis`
      };
    } catch (error) {
      console.log('⚠️ Failed to enrich location data, returning basic GPS result');
      return baseResult;
    }
  }

  // Enhanced V2 pipeline - EXIF GPS with comprehensive data
  async recognize(buffer: Buffer, userLocation?: Location): Promise<LocationResult> {
    try {
      console.log('🔍 V2: Enhanced GPS location recognition...');
      
      // Check GPS data in V2
      console.log('📍 Checking EXIF GPS data...');
      const gpsResult = await this.extractGPS(buffer);
      if (gpsResult && gpsResult.location) {
        console.log('✅ Found GPS coordinates, enriching with comprehensive data...');
        
        // Enrich with comprehensive location data
        const enrichedResult = await this.enrichLocationData(gpsResult, buffer);
        return enrichedResult;
      }

      // No EXIF data found
      console.log('❌ No EXIF GPS data found');
      return {
        success: false,
        confidence: 0,
        method: 'no-exif-gps',
        error: 'No EXIF GPS data found in image'
      };

    } catch (error) {
      return {
        success: false,
        confidence: 0,
        method: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
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
    
    const recognizer = new LocationRecognizer();
    const result = await recognizer.recognize(buffer);
    
    return NextResponse.json(result);
    
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}