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
  weather?: any;
  locationDetails?: any;
  timezone?: string;
  elevation?: any;
  transit?: any[];
  demographics?: any;
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

  // Comprehensive nearby places lookup
  async getNearbyPlaces(lat: number, lng: number): Promise<any[]> {
    const key = `places_${Math.round(lat*1000)}_${Math.round(lng*1000)}`;
    const cached = cache.get(key);
    if (cached) return cached as any[];
    
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=1000&key=${process.env.GOOGLE_PLACES_API_KEY}`,
        { signal: AbortSignal.timeout(3000) }
      );
      
      const data = await response.json();
      const places = data.results?.slice(0, 10).map((p: any) => ({
        name: p.name,
        type: p.types?.[0]?.replace(/_/g, ' ') || 'Place',
        rating: p.rating || 0,
        distance: Math.round(this.calculateDistance(
          { latitude: lat, longitude: lng },
          { latitude: p.geometry.location.lat, longitude: p.geometry.location.lng }
        ) * 1000),
        address: p.vicinity,
        placeId: p.place_id,
        priceLevel: p.price_level
      })) || [];
      
      cache.set(key, places, 300);
      return places;
    } catch {
      return [];
    }
  }
  
  // Get location photos
  async getLocationPhotos(lat: number, lng: number): Promise<string[]> {
    const key = `photos_${Math.round(lat*1000)}_${Math.round(lng*1000)}`;
    const cached = cache.get(key);
    if (cached) return cached as string[];
    
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=500&key=${process.env.GOOGLE_PLACES_API_KEY}`,
        { signal: AbortSignal.timeout(2000) }
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
      
      cache.set(key, photos, 300);
      return photos;
    } catch {
      return [];
    }
  }
  
  // Comprehensive device analysis
  analyzeDeviceData(buffer: Buffer): any {
    try {
      const parser = exifParser.create(buffer);
      const result = parser.parse();
      
      return {
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
    } catch {
      return null;
    }
  }

  // Enhanced location enrichment with comprehensive data
  async enrichLocationData(baseResult: LocationResult, buffer: Buffer): Promise<LocationResult> {
    const { latitude, longitude } = baseResult.location!;
    
    const addressKey = `addr_${Math.round(latitude*1000)}_${Math.round(longitude*1000)}`;
    let address = cache.get(addressKey) as string;
    let locationDetails = cache.get(`details_${addressKey}`) as any;
    
    // Comprehensive parallel processing
    const [places, photos, weather, elevation, transit, demographics] = await Promise.all([
      this.getNearbyPlaces(latitude, longitude),
      this.getLocationPhotos(latitude, longitude),
      this.getWeatherData(latitude, longitude),
      this.getElevationData(latitude, longitude),
      this.getTransitData(latitude, longitude),
      this.getDemographicData(latitude, longitude),
      !address ? this.getDetailedAddress(latitude, longitude).then(data => {
        address = data.address;
        locationDetails = data.details;
        cache.set(addressKey, data.address, 600);
        cache.set(`details_${addressKey}`, data.details, 600);
      }) : Promise.resolve()
    ]);
    
    return {
      ...baseResult,
      address: address || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
      nearbyPlaces: places,
      photos: photos,
      deviceAnalysis: this.analyzeDeviceData(buffer),
      weather: weather,
      locationDetails: locationDetails,
      elevation: elevation,
      transit: transit,
      demographics: demographics,
      confidence: 0.98,
      description: `Comprehensive location data with ${places.length} nearby places, weather, elevation, and transit info`
    };
  }
  
  private async getDetailedAddress(lat: number, lng: number): Promise<{address: string, details: any}> {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${process.env.GOOGLE_PLACES_API_KEY}`,
        { signal: AbortSignal.timeout(3000) }
      );
      const data = await response.json();
      const result = data.results?.[0];
      
      if (result) {
        const details = {
          country: result.address_components?.find((c: any) => c.types.includes('country'))?.long_name,
          city: result.address_components?.find((c: any) => c.types.includes('locality'))?.long_name,
          state: result.address_components?.find((c: any) => c.types.includes('administrative_area_level_1'))?.long_name,
          postalCode: result.address_components?.find((c: any) => c.types.includes('postal_code'))?.long_name,
          neighborhood: result.address_components?.find((c: any) => c.types.includes('neighborhood'))?.long_name,
          placeId: result.place_id
        };
        return {
          address: result.formatted_address,
          details
        };
      }
    } catch {}
    return {
      address: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
      details: null
    };
  }
  
  private async getWeatherData(lat: number, lng: number): Promise<any> {
    try {
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true&hourly=temperature_2m,relative_humidity_2m,precipitation&timezone=auto&forecast_days=1`,
        { signal: AbortSignal.timeout(2000) }
      );
      const data = await response.json();
      return {
        temperature: data.current_weather?.temperature,
        windSpeed: data.current_weather?.windspeed,
        weatherCode: data.current_weather?.weathercode,
        timezone: data.timezone,
        humidity: data.hourly?.relative_humidity_2m?.[0],
        precipitation: data.hourly?.precipitation?.[0]
      };
    } catch {
      return null;
    }
  }
  
  private async getElevationData(lat: number, lng: number): Promise<any> {
    try {
      const response = await fetch(
        `https://api.open-meteo.com/v1/elevation?latitude=${lat}&longitude=${lng}`,
        { signal: AbortSignal.timeout(1500) }
      );
      const data = await response.json();
      return {
        elevation: data.elevation?.[0],
        unit: 'meters'
      };
    } catch {
      return null;
    }
  }
  
  private async getTransitData(lat: number, lng: number): Promise<any> {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=1000&type=transit_station&key=${process.env.GOOGLE_PLACES_API_KEY}`,
        { signal: AbortSignal.timeout(2000) }
      );
      const data = await response.json();
      return data.results?.slice(0, 5).map((station: any) => ({
        name: station.name,
        type: station.types?.find((t: string) => t.includes('station'))?.replace(/_/g, ' ') || 'Transit',
        distance: Math.round(this.calculateDistance(
          { latitude: lat, longitude: lng },
          { latitude: station.geometry.location.lat, longitude: station.geometry.location.lng }
        ) * 1000),
        rating: station.rating
      })) || [];
    } catch {
      return [];
    }
  }
  
  private async getDemographicData(lat: number, lng: number): Promise<any> {
    try {
      // Using Census API for US locations
      const response = await fetch(
        `https://api.census.gov/data/2021/acs/acs5?get=B01003_001E,B25077_001E,B08303_001E&for=tract:*&in=state:*&key=${process.env.CENSUS_API_KEY}`,
        { signal: AbortSignal.timeout(3000) }
      );
      // This is a simplified approach - in production you'd need to geocode to census tract first
      return {
        dataSource: 'US Census',
        note: 'Demographic data available for US locations',
        populationDensity: 'Variable by area',
        medianIncome: 'Varies by census tract'
      };
    } catch {
      return {
        dataSource: 'Limited',
        note: 'Demographic data not available for this location'
      };
    }
  }

  // V2 pipeline - EXIF GPS data with fallback to basic analysis
  async recognize(buffer: Buffer, providedLocation?: Location): Promise<LocationResult> {
    console.log('📍 V2: Checking EXIF GPS data...');
    
    const gpsResult = this.extractGPS(buffer);
    if (gpsResult?.location) {
      console.log('✅ Found EXIF GPS:', gpsResult.location);
      return await this.enrichLocationData(gpsResult, buffer);
    }
    
    console.log('❌ No EXIF GPS data found');
    
    // If no GPS and no provided location, return error
    if (!providedLocation) {
      return {
        success: false,
        confidence: 0,
        method: 'no-exif-gps',
        error: 'No GPS coordinates found in image metadata. Please use V1 for text-based analysis.'
      };
    }
    
    // Use provided location as fallback (but mark it clearly)
    console.log('📍 Using provided location as fallback');
    const fallbackResult = {
      success: true,
      name: 'Provided Location',
      location: providedLocation,
      confidence: 0.3,
      method: 'provided-location-fallback'
    };
    
    return await this.enrichLocationData(fallbackResult, buffer);
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
    
    const lat = formData.get('latitude');
    const lng = formData.get('longitude');
    const providedLocation = lat && lng ? {
      latitude: parseFloat(lat as string),
      longitude: parseFloat(lng as string)
    } : undefined;
    
    const recognizer = new LocationRecognizer();
    const result = await recognizer.recognize(buffer, providedLocation);
    
    return NextResponse.json(result);
    
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}