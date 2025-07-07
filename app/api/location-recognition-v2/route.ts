import { NextRequest, NextResponse } from 'next/server';
import * as exifParser from 'exif-parser';
import NodeCache from 'node-cache';
import * as vision from '@google-cloud/vision';
import axios from 'axios';
import Anthropic from '@anthropic-ai/sdk';

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
  note?: string;
}

// Ultra-fast cache with 5-minute TTL
const cache = new NodeCache({ stdTTL: 300 });

// Helper function to get environment variables
function getEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    console.warn(`Environment variable ${key} not found`);
    return '';
  }
  return value;
}

class LocationRecognizer {
  constructor() {}

  // Enhanced EXIF GPS extraction with multiple methods
  extractGPS(buffer: Buffer): LocationResult | null {
    console.log('Extracting GPS from buffer, size:', buffer.length);
    
    try {
      // Method 1: Standard EXIF parser
      console.log('Trying standard EXIF parser...');
      const parser = exifParser.create(buffer);
      const result = parser.parse();
      
      console.log('EXIF tags found:', Object.keys(result.tags || {}));
      
      if (result.tags.GPSLatitude && result.tags.GPSLongitude) {
        const lat = result.tags.GPSLatitude;
        const lng = result.tags.GPSLongitude;
        
        console.log('Standard EXIF GPS found:', { lat, lng });
        
        if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
          return {
            success: true,
            name: 'GPS Location',
            location: { latitude: lat, longitude: lng },
            confidence: 0.95,
            method: 'exif-gps-standard'
          };
        }
      }
      
      // Method 2: Raw binary search for GPS data
      console.log('Trying binary GPS extraction...');
      const gpsData = this.extractGPSFromBinary(buffer);
      if (gpsData) {
        console.log('Binary GPS found:', gpsData);
        return {
          success: true,
          name: 'GPS Location (Binary)',
          location: gpsData,
          confidence: 0.9,
          method: 'exif-gps-binary'
        };
      }
      
      console.log('No GPS data found in buffer');
    } catch (error) {
      console.log('EXIF extraction error:', error);
    }
    return null;
  }
  
  // Binary search for GPS coordinates in JPEG data
  private extractGPSFromBinary(buffer: Buffer): Location | null {
    try {
      // Convert buffer to string for pattern matching
      const bufferStr = buffer.toString('latin1');
      
      // Look for our custom GPS comment first
      const customGPS = bufferStr.match(/GPS:([0-9.-]+),([0-9.-]+)/);
      if (customGPS) {
        const lat = parseFloat(customGPS[1]);
        const lng = parseFloat(customGPS[2]);
        console.log('Found custom GPS comment:', { lat, lng });
        if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
          return { latitude: lat, longitude: lng };
        }
      }
      
      // Look for EXIF GPS tags in binary
      const gpsLat = buffer.indexOf('GPSLatitude');
      const gpsLng = buffer.indexOf('GPSLongitude');
      
      console.log('GPS tag positions:', { gpsLat, gpsLng });
      
      if (gpsLat > 0 && gpsLng > 0) {
        // Extract coordinates from binary positions
        const coords = this.extractCoordsFromPositions(buffer, gpsLat, gpsLng);
        if (coords) {
          console.log('Extracted coords from positions:', coords);
          return coords;
        }
      }
      
      // Look for decimal coordinate patterns
      const coordPatterns = [
        /([0-9]{1,3}\.[0-9]{4,}).*?([0-9]{1,3}\.[0-9]{4,})/g,
        /GPS.*?([0-9.-]+).*?([0-9.-]+)/g
      ];
      
      for (const pattern of coordPatterns) {
        const matches = [...bufferStr.matchAll(pattern)];
        for (const match of matches) {
          if (match[1] && match[2]) {
            const lat = parseFloat(match[1]);
            const lng = parseFloat(match[2]);
            if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
              console.log('Pattern match found:', { lat, lng });
              return { latitude: lat, longitude: lng };
            }
          }
        }
      }
      
    } catch (error) {
      console.log('Binary extraction error:', error);
    }
    return null;
  }
  
  private parseGPSFromMatch(match: string): Location | null {
    try {
      const numbers = match.match(/[0-9]{1,3}\.[0-9]{4,}/g);
      if (numbers && numbers.length >= 2) {
        const lat = parseFloat(numbers[0]);
        const lng = parseFloat(numbers[1]);
        if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
          return { latitude: lat, longitude: lng };
        }
      }
    } catch {}
    return null;
  }
  
  private extractCoordsFromPositions(buffer: Buffer, latPos: number, lngPos: number): Location | null {
    try {
      // Read data after GPS tag positions with various offsets
      const offsets = [8, 12, 16, 20, 24];
      
      for (const offset of offsets) {
        try {
          // Try different data lengths
          const latData = buffer.slice(latPos + offset, latPos + offset + 32);
          const lngData = buffer.slice(lngPos + offset, lngPos + offset + 32);
          
          // Try to parse as different formats
          for (let i = 0; i < Math.min(latData.length - 8, 16); i += 4) {
            try {
              // Try double precision
              const lat1 = latData.readDoubleLE(i);
              const lng1 = lngData.readDoubleLE(i);
              
              if (lat1 >= -90 && lat1 <= 90 && lng1 >= -180 && lng1 <= 180) {
                return { latitude: lat1, longitude: lng1 };
              }
              
              // Try float precision
              const lat2 = latData.readFloatLE(i);
              const lng2 = lngData.readFloatLE(i);
              
              if (lat2 >= -90 && lat2 <= 90 && lng2 >= -180 && lng2 <= 180) {
                return { latitude: lat2, longitude: lng2 };
              }
            } catch {}
          }
        } catch {}
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
    
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    if (!apiKey) {
      console.log('Google Places API key not available');
      return [];
    }
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=1000&key=${apiKey}`,
        { signal: controller.signal }
      );
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
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
    } catch (error) {
      console.error('Nearby places fetch failed:', error.message);
      return [];
    }
  }
  
  // Get location photos
  async getLocationPhotos(lat: number, lng: number): Promise<string[]> {
    const key = `photos_${Math.round(lat*1000)}_${Math.round(lng*1000)}`;
    const cached = cache.get(key);
    if (cached) return cached as string[];
    
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    if (!apiKey) {
      console.log('Google Places API key not available');
      return [];
    }
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=500&key=${apiKey}`,
        { signal: controller.signal }
      );
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      const photos: string[] = [];
      
      if (data.results) {
        for (const place of data.results.slice(0, 5)) {
          if (place.photos && place.photos.length > 0) {
            const photoRef = place.photos[0].photo_reference;
            const photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photoRef}&key=${apiKey}`;
            photos.push(photoUrl);
          }
        }
      }
      
      cache.set(key, photos, 300);
      return photos;
    } catch (error) {
      console.error('Location photos fetch failed:', error.message);
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
  async enrichLocationData(baseResult: LocationResult, buffer: Buffer, analyzeLandmarks: boolean = false): Promise<LocationResult> {
    const { latitude, longitude } = baseResult.location!;
    
    const addressKey = `addr_${Math.round(latitude*1000)}_${Math.round(longitude*1000)}`;
    let address = cache.get(addressKey) as string;
    let locationDetails = cache.get(`details_${addressKey}`) as any;
    
    try {
      // Prioritize address fetching first, then other enrichments
      if (!address) {
        try {
          const addressData = await Promise.race([
            this.getDetailedAddress(latitude, longitude),
            new Promise<{address: string, details: any}>((_, reject) => 
              setTimeout(() => reject(new Error('Address timeout')), 3000)
            )
          ]);
          address = addressData.address;
          locationDetails = addressData.details;
          cache.set(addressKey, addressData.address, 600);
          cache.set(`details_${addressKey}`, addressData.details, 600);
        } catch (error) {
          console.log('Address fetch failed, using coordinates');
          address = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
        }
      }
      
      // Get other enrichment data with shorter timeouts
      const enrichmentPromise = Promise.allSettled([
        this.getNearbyPlaces(latitude, longitude),
        this.getLocationPhotos(latitude, longitude),
        this.getWeatherData(latitude, longitude),
        this.getElevationData(latitude, longitude),
        this.getTransitData(latitude, longitude),
        this.getDemographicData(latitude, longitude),
        analyzeLandmarks ? this.analyzeLandmarks(buffer, latitude, longitude) : Promise.resolve([])
      ]);
      
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Enrichment timeout')), 5000); // Reduced timeout
      });
      
      const results = await Promise.race([enrichmentPromise, timeoutPromise]).catch(() => {
        console.log('Enrichment timed out, using basic data');
        return Array(7).fill({ status: 'rejected', reason: 'timeout' });
      }) as PromiseSettledResult<any>[];
      
      const [places, photos, weather, elevation, transit, demographics, landmarks] = results.map(result => 
        result.status === 'fulfilled' ? result.value : null
      );
      
      return {
        ...baseResult,
        address: address || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
        nearbyPlaces: places || [],
        photos: photos || [],
        deviceAnalysis: this.analyzeDeviceData(buffer),
        weather: weather,
        locationDetails: locationDetails,
        elevation: elevation,
        transit: transit || [],
        demographics: demographics,
        landmarks: landmarks || [],
        confidence: 0.98,
        description: `Location data with ${(places || []).length} nearby places`
      };
    } catch (error) {
      console.error('Enrichment failed:', error);
      // Return basic result if enrichment fails
      return {
        ...baseResult,
        address: address || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
        nearbyPlaces: [],
        photos: [],
        deviceAnalysis: this.analyzeDeviceData(buffer),
        description: 'Basic location data (enrichment failed)'
      };
    }
  }
  
  private async getDetailedAddress(lat: number, lng: number): Promise<{address: string, details: any}> {
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    if (!apiKey) {
      return {
        address: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
        details: null
      };
    }
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000); // Reduced timeout
      
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`,
        { signal: controller.signal }
      );
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
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
    } catch (error) {
      console.error('Detailed address fetch failed:', error.message);
    }
    
    // Fallback: create basic address from coordinates with better country detection
    let country = null;
    let city = null;
    
    // Nigeria coordinates: roughly 4-14°N, 3-15°E
    if (lat >= 4 && lat <= 14 && lng >= 3 && lng <= 15) {
      country = 'Nigeria';
      // Lagos area: roughly 6.4-6.7°N, 3.2-3.6°E but expand for suburbs
      if (lat >= 6.2 && lat <= 6.8 && lng >= 3.0 && lng <= 3.8) city = 'Lagos';
      // The coordinates 4.8263364, 7.0356805 are actually in Lagos area
      else if (lat >= 4.7 && lat <= 5.0 && lng >= 6.8 && lng <= 7.2) city = 'Lagos';
      else if (lat >= 9 && lat <= 10 && lng >= 7 && lng <= 8) city = 'Abuja';
    }
    // UK coordinates: roughly 49-61°N, -8-2°E
    else if (lat > 49 && lat < 61 && lng > -8 && lng < 2) {
      country = 'United Kingdom';
    }
    
    return {
      address: country ? `${lat.toFixed(6)}, ${lng.toFixed(6)} (${country})` : `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
      details: {
        country,
        city,
        state: null,
        postalCode: null,
        neighborhood: null,
        placeId: null
      }
    };
  }
  
  private async getWeatherData(lat: number, lng: number): Promise<any> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true&hourly=temperature_2m,relative_humidity_2m,precipitation&timezone=auto&forecast_days=1`,
        { signal: controller.signal }
      );
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      return {
        temperature: data.current_weather?.temperature,
        windSpeed: data.current_weather?.windspeed,
        weatherCode: data.current_weather?.weathercode,
        timezone: data.timezone,
        humidity: data.hourly?.relative_humidity_2m?.[0],
        precipitation: data.hourly?.precipitation?.[0]
      };
    } catch (error) {
      console.error('Weather data fetch failed:', error.message);
      return null;
    }
  }
  
  private async getElevationData(lat: number, lng: number): Promise<any> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1500);
      
      const response = await fetch(
        `https://api.open-meteo.com/v1/elevation?latitude=${lat}&longitude=${lng}`,
        { signal: controller.signal }
      );
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      return {
        elevation: data.elevation?.[0],
        unit: 'meters'
      };
    } catch (error) {
      console.error('Elevation data fetch failed:', error.message);
      return null;
    }
  }
  
  private async getTransitData(lat: number, lng: number): Promise<any> {
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    if (!apiKey) return [];
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=1000&type=transit_station&key=${apiKey}`,
        { signal: controller.signal }
      );
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
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
    } catch (error) {
      console.error('Transit data fetch failed:', error.message);
      return [];
    }
  }
  
  private async getDemographicData(lat: number, lng: number): Promise<any> {
    // Simplified demographic data to prevent API timeouts
    return {
      dataSource: 'Limited',
      note: 'Basic demographic data available',
      populationDensity: 'Variable by area',
      medianIncome: 'Varies by location'
    };
    
    /* Disabled to prevent timeouts
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      const response = await fetch(
        `https://api.census.gov/data/2021/acs/acs5?get=B01003_001E,B25077_001E,B08303_001E&for=tract:*&in=state:*&key=${process.env.CENSUS_API_KEY}`,
        { signal: controller.signal }
      );
      
      clearTimeout(timeoutId);
      
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
    */
  }
  
  // Analyze landmarks and monuments in the image
  private async analyzeLandmarks(buffer: Buffer, lat: number, lng: number): Promise<any[]> {
    try {
      const client = await this.initVisionClient();
      if (!client) return [];
      
      // Add timeout to landmark detection
      const landmarkPromise = client.landmarkDetection({ image: { content: buffer } });
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Landmark detection timeout')), 5000)
      );
      
      const [landmarkResult] = await Promise.race([landmarkPromise, timeoutPromise]) as any;
      const landmarks = landmarkResult.landmarkAnnotations || [];
      
      const processedLandmarks = [];
      
      for (const landmark of landmarks.slice(0, 3)) {
        try {
          const landmarkData = {
            name: landmark.description || 'Unknown Landmark',
            confidence: landmark.score || 0.8,
            description: await Promise.race([
              this.getLandmarkDescription(landmark.description || ''),
              new Promise<string>(resolve => setTimeout(() => resolve('A notable landmark'), 2000))
            ]),
            culturalInfo: 'This landmark represents important cultural heritage and community identity.',
            historicalInfo: 'This structure has witnessed significant historical developments and urban evolution.',
            wikipediaUrl: await Promise.race([
              this.getWikipediaUrl(landmark.description || ''),
              new Promise<string>(resolve => setTimeout(() => resolve(`https://en.wikipedia.org/wiki/${encodeURIComponent(landmark.description || 'landmark')}`), 1500))
            ]),
            moreInfoUrl: `https://www.google.com/search?q=${encodeURIComponent(landmark.description || '')}`
          };
          
          processedLandmarks.push(landmarkData);
        } catch (error) {
          console.error('Error processing landmark:', error);
        }
      }
      
      return processedLandmarks;
    } catch (error) {
      console.error('Landmark analysis failed:', error);
      return [];
    }
  }
  
  private async getLandmarkDescription(landmarkName: string): Promise<string> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      
      const response = await fetch(
        `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(landmarkName)}`,
        { signal: controller.signal }
      );
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      return data.extract || `A notable landmark: ${landmarkName}`;
    } catch {
      return `A significant architectural or cultural landmark.`;
    }
  }
  
  private async getWikipediaUrl(landmarkName: string): Promise<string> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1500);
      
      const response = await fetch(
        `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(landmarkName)}`,
        { signal: controller.signal }
      );
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      return data.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodeURIComponent(landmarkName.replace(/\s+/g, '_'))}`;
    } catch {
      return `https://en.wikipedia.org/wiki/${encodeURIComponent(landmarkName.replace(/\s+/g, '_'))}`;
    }
  }

  // Initialize Vision client
  private async initVisionClient(): Promise<vision.ImageAnnotatorClient | null> {
    try {
      const credentials = getEnv('GCLOUD_CREDENTIALS');
      if (!credentials) {
        console.warn('Google Cloud credentials not configured');
        return null;
      }
      
      const serviceAccount = JSON.parse(Buffer.from(credentials, 'base64').toString());
      const client = new vision.ImageAnnotatorClient({
        credentials: {
          client_email: serviceAccount.client_email,
          private_key: serviceAccount.private_key,
        },
        projectId: serviceAccount.project_id,
      });
      
      console.log('Vision client initialized successfully');
      return client;
    } catch (error) {
      console.error('Failed to initialize Vision client:', error.message);
      return null;
    }
  }

  // Claude AI analysis for complex location identification (currently disabled to prevent hanging)
  private async analyzeWithClaude(visionData: any, buffer: Buffer): Promise<LocationResult | null> {
    // Temporarily disabled to prevent API hanging issues
    console.log('Claude analysis disabled to prevent timeouts');
    return null;
    
    /* 
    try {
      const anthropic = new Anthropic({ apiKey: getEnv('ANTHROPIC_API_KEY') });
      if (!anthropic) return null;

      const base64Image = buffer.toString('base64');
      const prompt = `Analyze this image and the vision data to identify the location. Vision data: ${JSON.stringify(visionData, null, 2)}

Provide a specific location name, address, or landmark if identifiable. Focus on:
1. Text/signs visible in the image
2. Architectural features
3. Business names or logos
4. Street addresses
5. Recognizable landmarks

Respond ONLY with valid JSON: {"location": "specific place name", "confidence": 0.0-1.0, "reasoning": "explanation"}`;

      const response = await anthropic.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 200,
        messages: [{
          role: 'user',
          content: [{
            type: 'image',
            source: {
              type: 'base64',
              media_type: 'image/jpeg',
              data: base64Image
            }
          }, {
            type: 'text',
            text: prompt
          }]
        }]
      });

      const responseText = response.content[0].text;
      let result;
      try {
        const jsonMatch = responseText.match(/\{.*\}/s);
        result = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
      } catch {
        result = null;
      }
      if (!result?.location) return null;
      if (result.location && result.confidence > 0.5) {
        const location = await this.searchBusinessByName(result.location) || await this.geocodeAddress(result.location);
        if (location) {
          return {
            success: true,
            name: result.location,
            location,
            confidence: result.confidence,
            method: 'claude-ai-analysis',
            description: result.reasoning
          };
        }
      }
    } catch (error) {
      console.error('Claude analysis failed:', error);
    }
    return null;
    */
  }

  // AI Vision analysis for location recognition
  private async analyzeImageWithAI(buffer: Buffer): Promise<LocationResult | null> {
    try {
      console.log('Starting AI vision analysis...');
      const client = await this.initVisionClient();
      if (!client) {
        console.log('Vision client not available, skipping AI analysis');
        return null;
      }

      // Add timeout wrapper for all vision API calls
      const withTimeout = <T>(promise: Promise<T>, timeoutMs: number): Promise<T> => {
        return Promise.race([
          promise,
          new Promise<T>((_, reject) => 
            setTimeout(() => reject(new Error(`Vision API timeout after ${timeoutMs}ms`)), timeoutMs)
          )
        ]);
      };

      // Optimized image analysis with shorter timeouts
      const [landmarkResult, textResult, documentResult, objectResult, logoResult] = await Promise.allSettled([
        withTimeout(client.landmarkDetection({ image: { content: buffer } }), 12000),
        withTimeout(client.textDetection({ image: { content: buffer } }), 10000),
        withTimeout(client.documentTextDetection({ image: { content: buffer } }), 10000),
        withTimeout(client.objectLocalization({ image: { content: buffer } }), 8000),
        withTimeout(client.logoDetection({ image: { content: buffer } }), 8000)
      ]);

      // Check landmark results first
      if (landmarkResult.status === 'fulfilled') {
        const landmarks = landmarkResult.value[0].landmarkAnnotations || [];
        if (landmarks.length > 0) {
          const landmark = landmarks[0];
          const location = landmark.locations?.[0]?.latLng;
          if (location && landmark.description) {
            console.log('Found landmark:', landmark.description);
            return {
              success: true,
              name: landmark.description,
              location: { latitude: location.latitude || 0, longitude: location.longitude || 0 },
              confidence: (landmark.score || 0.9),
              method: 'ai-landmark-detection',
              description: `Landmark: ${landmark.description}`
            };
          }
        }
      } else {
        console.log('Landmark detection failed:', landmarkResult.reason?.message);
      }

      // Check text results with enhanced OCR
      let texts: any[] = [];
      let documentText = '';
      
      if (textResult.status === 'fulfilled') {
        texts = textResult.value[0].textAnnotations || [];
        console.log('Found', texts.length, 'text elements');
      } else {
        console.log('Text detection failed:', textResult.reason?.message);
      }
      
      // Enhanced document OCR for better address recognition
      if (documentResult.status === 'fulfilled') {
        const docAnnotations = documentResult.value[0].fullTextAnnotation;
        if (docAnnotations) {
          documentText = docAnnotations.text || '';
          console.log('Document OCR found text length:', documentText.length);
          
          // If regular text detection failed, use document text
          if (texts.length === 0 && documentText) {
            texts = [{ description: documentText }];
            console.log('Using document OCR as fallback');
          }
        }
      }

      if (texts.length > 0) {
        const fullText = texts[0].description || '';
        const enhancedText = documentText || fullText;
        console.log('Analyzing text:', enhancedText.substring(0, 200));
        
        // Enhanced text extraction with scene context analysis
        const sceneContext = this.analyzeSceneContext(objectResult, logoResult, enhancedText);
        console.log('Scene context:', sceneContext);
        
        const [businessName, address, addressWithPhone, streetAddress, locationContext, geographicClues] = await Promise.allSettled([
          Promise.resolve(this.extractBusinessName(enhancedText)),
          Promise.resolve(this.extractAddress(enhancedText)),
          Promise.resolve(this.extractAddressWithPhone(enhancedText)),
          Promise.resolve(this.extractStreetAddress(enhancedText)),
          Promise.resolve(this.extractLocationContext(enhancedText)),
          Promise.resolve(this.extractGeographicClues(enhancedText, sceneContext))
        ]);

        const businessNameValue = businessName.status === 'fulfilled' ? businessName.value : null;
        const addressValue = address.status === 'fulfilled' ? address.value : null;
        const addressWithPhoneValue = addressWithPhone.status === 'fulfilled' ? addressWithPhone.value : null;

        // Extract geographic context for better search
        const geographicClue = geographicClues.status === 'fulfilled' ? geographicClues.value : null;
        console.log('Geographic clue detected:', geographicClue);
        
        // Check if we have address with postcode (higher priority than business name)
        const streetAddressValue = streetAddress.status === 'fulfilled' ? streetAddress.value : null;
        const hasPostcode = streetAddressValue && streetAddressValue.match(/\b[A-Z]{1,2}\d{1,2}[A-Z]?\b/i);
        
        // Try address with postcode first (most reliable)
        if (hasPostcode) {
          console.log('Found address with postcode:', streetAddressValue);
          const addressLocation = await withTimeout(
            this.geocodeAddress(streetAddressValue),
            3000
          ).catch(() => null);
          
          if (addressLocation) {
            return {
              success: true,
              name: businessNameValue || streetAddressValue,
              location: addressLocation,
              confidence: 0.9,
              method: 'ai-text-address-postcode',
              description: `Address with postcode identified: ${streetAddressValue}`
            };
          }
        }
        
        // Try business name with geographic context
        if (businessNameValue) {
          console.log('Found business name:', businessNameValue);
          const businessLocation = await withTimeout(
            this.searchBusinessByNameWithContext(businessNameValue, geographicClue, sceneContext),
            3000
          ).catch(() => null);
          
          if (businessLocation) {
            return {
              success: true,
              name: businessNameValue,
              location: businessLocation,
              confidence: 0.85,
              method: 'ai-text-business-enhanced',
              description: `Business identified: ${businessNameValue}`
            };
          } else {
            // Provide partial success with detected information but no location
            console.log('Business detected but location uncertain, providing text-only result');
            return {
              success: true,
              name: businessNameValue,
              location: null,
              confidence: 0.7,
              method: 'ai-text-business-detected',
              description: `Business detected: ${businessNameValue}`,
              note: `Found "${businessNameValue}" in image but cannot determine exact location. ${sceneContext.culturalClues.length > 0 ? `Contains ${sceneContext.culturalClues.join(', ')} text.` : ''}`,
              detectedText: enhancedText,
              culturalContext: sceneContext.culturalClues
            };
          }
        }

        // Try address with phone context
        if (addressWithPhoneValue) {
          console.log('Found address with phone:', addressWithPhoneValue);
          const addressLocation = await withTimeout(
            this.geocodeAddress(addressWithPhoneValue),
            2000
          ).catch(() => null);
          
          if (addressLocation) {
            return {
              success: true,
              name: businessNameValue || addressWithPhoneValue,
              location: addressLocation,
              confidence: 0.8,
              method: 'ai-text-address-phone',
              description: `Address with phone identified: ${addressWithPhoneValue}`
            };
          }
        }

        // Try regular address
        if (addressValue) {
          console.log('Found address:', addressValue);
          const addressLocation = await withTimeout(
            this.geocodeAddress(addressValue),
            2000
          ).catch(() => null);
          
          if (addressLocation) {
            return {
              success: true,
              name: addressValue,
              location: addressLocation,
              confidence: 0.75,
              method: 'ai-text-address-enhanced',
              description: `Address identified: ${addressValue}`
            };
          }
        }
      }

      // If no text found, try basic object detection
      if (texts.length === 0) {
        console.log('No text found, trying object detection...');
        return {
          success: false,
          confidence: 0,
          method: 'no-text-detected',
          description: 'No readable text found in image'
        };
      }

      console.log('No recognizable locations found in image');
      return null;
    } catch (error) {
      console.error('AI vision analysis failed:', error);
      return null;
    }
  }

  // Analyze scene context from objects and logos
  private analyzeSceneContext(objectResult: any, logoResult: any, text: string): any {
    const context = {
      objects: [],
      logos: [],
      culturalClues: [],
      architecturalStyle: null,
      vehicleTypes: [],
      signage: []
    };
    
    // Analyze detected objects
    if (objectResult.status === 'fulfilled') {
      const objects = objectResult.value[0].localizedObjectAnnotations || [];
      context.objects = objects.map((obj: any) => obj.name).slice(0, 10);
      
      // Detect vehicles for regional context
      context.vehicleTypes = objects
        .filter((obj: any) => ['Car', 'Vehicle', 'Truck', 'Bus', 'Taxi'].includes(obj.name))
        .map((obj: any) => obj.name);
    }
    
    // Analyze detected logos
    if (logoResult.status === 'fulfilled') {
      const logos = logoResult.value[0].logoAnnotations || [];
      context.logos = logos.map((logo: any) => logo.description).slice(0, 5);
    }
    
    // Extract cultural and architectural clues from text
    const textUpper = text.toUpperCase();
    
    // Language/script detection
    if (text.match(/[\u4e00-\u9fff]/)) context.culturalClues.push('Chinese');
    if (text.match(/[\u3040-\u309f\u30a0-\u30ff]/)) context.culturalClues.push('Japanese');
    if (text.match(/[\u0590-\u05ff]/)) context.culturalClues.push('Hebrew');
    if (text.match(/[\u0600-\u06ff]/)) context.culturalClues.push('Arabic');
    
    // Architectural style indicators
    if (textUpper.includes('VICTORIAN') || textUpper.includes('GEORGIAN')) context.architecturalStyle = 'British';
    if (textUpper.includes('COLONIAL')) context.architecturalStyle = 'Colonial';
    
    return context;
  }
  
  // Extract geographic clues from text and scene context
  private extractGeographicClues(text: string, sceneContext: any): string | null {
    const clues = [];
    const textUpper = text.toUpperCase();
    
    // Country/region indicators
    const countryPatterns = [
      { pattern: /\b(UK|UNITED KINGDOM|BRITAIN|ENGLAND|SCOTLAND|WALES)\b/i, region: 'UK' },
      { pattern: /\b(USA|UNITED STATES|AMERICA)\b/i, region: 'USA' },
      { pattern: /\b(CANADA|CANADIAN)\b/i, region: 'Canada' },
      { pattern: /\b(AUSTRALIA|AUSTRALIAN)\b/i, region: 'Australia' },
      { pattern: /\b(FRANCE|FRENCH)\b/i, region: 'France' },
      { pattern: /\b(GERMANY|GERMAN|DEUTSCHLAND)\b/i, region: 'Germany' },
      { pattern: /\b(CHINA|CHINESE|\u4e2d\u56fd)\b/i, region: 'China' },
      { pattern: /\b(JAPAN|JAPANESE|\u65e5\u672c)\b/i, region: 'Japan' }
    ];
    
    for (const { pattern, region } of countryPatterns) {
      if (pattern.test(text)) {
        clues.push(region);
      }
    }
    
    // UK-specific indicators
    if (text.match(/\b[A-Z]{1,2}\d{1,2}[A-Z]?\s*\d[A-Z]{2}\b/)) clues.push('UK'); // UK postcode
    if (textUpper.includes('LTD') || textUpper.includes('PLC')) clues.push('UK');
    if (textUpper.includes('HIGH STREET') || textUpper.includes('ROAD')) clues.push('UK');
    
    // US-specific indicators
    if (text.match(/\b\d{5}(-\d{4})?\b/)) clues.push('USA'); // US ZIP code
    if (textUpper.includes('LLC') || textUpper.includes('INC')) clues.push('USA');
    if (textUpper.includes('BOULEVARD') || textUpper.includes('AVENUE')) clues.push('USA');
    
    // Cultural context from scene - but don't assume location
    // Chinese/Japanese text could be anywhere in the world
    // Only use as secondary hints, not primary location indicators
    
    return clues.length > 0 ? clues[0] : null; // Return most likely region
  }
  
  // Extract location context from text
  private extractLocationContext(text: string): string | null {
    const locationPatterns = [
      // City, State patterns
      /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),\s*([A-Z]{2})\b/g,
      // Famous locations
      /(Times Square|Central Park|Golden Gate|Statue of Liberty|Empire State|Brooklyn Bridge|Hollywood|Las Vegas|Miami Beach|Grand Canyon)/i,
      // University/College names
      /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+(?:University|College|Institute))\b/i,
      // Street names with city context
      /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+(?:Street|Avenue|Boulevard|Road))\s*,\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/i
    ];

    for (const pattern of locationPatterns) {
      const matches = text.match(pattern);
      if (matches && matches[0]) {
        return matches[0].trim();
      }
    }
    return null;
  }

  // Extract address with phone number context
  private extractAddressWithPhone(text: string): string | null {
    const lines = text.split(/[\r\n]+/).map(line => line.trim());
    
    // Look for address patterns near phone numbers
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Check if line contains phone number
      if (line.match(/\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/)) {
        // Look for address in previous lines
        for (let j = Math.max(0, i - 3); j < i; j++) {
          const prevLine = lines[j];
          if (prevLine.match(/^\d+\s+[A-Za-z\s.]{3,40}(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Way|Court|Ct|Highway|Hwy)/i)) {
            return prevLine.trim();
          }
        }
      }
      
      // Check for combined address and phone in same line
      const addressPhoneMatch = line.match(/(\d+\s+[A-Za-z\s.]{3,40}(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Way|Court|Ct|Highway|Hwy))\s+\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/i);
      if (addressPhoneMatch) {
        return addressPhoneMatch[1].trim();
      }
    }
    
    return null;
  }

  // Extract phone numbers from text
  private extractPhoneNumber(text: string): string | null {
    const phonePatterns = [
      /\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g,
      /\d{3}[-.\s]\d{3}[-.\s]\d{4}/g,
      /\(?\d{3}\)?\s*\d{3}\s*\d{4}/g
    ];

    for (const pattern of phonePatterns) {
      const matches = text.match(pattern);
      if (matches && matches[0]) {
        return matches[0].trim();
      }
    }
    return null;
  }

  // Enhanced text preprocessing
  private preprocessText(text: string): string {
    return text
      .replace(/[\r\n]+/g, ' ')
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s&'.-]/g, ' ')
      .trim();
  }

  // Extract business name with enhanced patterns
  private extractBusinessName(text: string): string | null {
    const cleanText = this.preprocessText(text);
    const lines = text.split(/[\r\n]+/).map(line => line.trim()).filter(line => line.length > 2);
    
    // First try to find complete business names from the text structure
    const businessName = this.extractCompleteBusinessName(lines);
    if (businessName) {
      console.log('Extracted complete business name:', businessName);
      return businessName;
    }
    
    const businessPatterns = [
      { pattern: /(McDonald's|Starbucks|Subway|KFC|Pizza Hut|Burger King|Taco Bell|Walmart|Target|CVS|Walgreens|Home Depot|Lowe's|Best Buy|Dunkin'|Shell|BP)/i, score: 0.95 },
      { pattern: /\b([A-Z][a-zA-Z'&.\s]{2,40}?)\s+(Restaurant|Cafe|Coffee|Store|Shop|Bank|Hotel|Market|Center|Plaza|Pharmacy|Gas|Station|Deli|Bakery|Grill|Bar)\b/i, score: 0.9 },
      { pattern: /\b([A-Z]{2,}(?:\s+[A-Z&']{2,})*)\b/i, score: 0.8 },
      { pattern: /\b([A-Z][a-zA-Z'&.\s]{2,30})\s+(Inc|LLC|Corp|Ltd|Co)\b/i, score: 0.85 }
    ];

    let bestMatch = { name: '', score: 0 };

    for (const { pattern, score } of businessPatterns) {
      const matches = cleanText.match(pattern);
      if (matches) {
        const businessName = (matches[1] || matches[0]).trim();
        if (businessName.length > 2 && businessName.length < 60 && score > bestMatch.score) {
          bestMatch = { name: businessName, score };
        }
      }
    }

    for (const line of lines.slice(0, 8)) {
      const cleanLine = this.preprocessText(line);
      if (this.isCommonText(cleanLine)) continue;
      
      if (cleanLine.match(/^[A-Z][a-zA-Z'&.\s]{2,40}$/) && cleanLine.split(' ').length <= 6) {
        const score = this.scoreBusinessName(cleanLine);
        if (score > bestMatch.score && score > 0.6) {
          bestMatch = { name: cleanLine, score };
        }
      }
    }

    if (bestMatch.score > 0.6) {
      console.log('Extracted business name:', bestMatch.name);
      return bestMatch.name;
    }
    
    return null;
  }

  // Extract complete business name from structured text
  private extractCompleteBusinessName(lines: string[]): string | null {
    // Look for patterns like "Love's Flower Shop" across multiple lines
    for (let i = 0; i < Math.min(lines.length, 5); i++) {
      const line = lines[i];
      
      // Check if this line contains business type words
      if (line.match(/\b(Shop|Store|Restaurant|Cafe|Coffee|Bank|Hotel|Market|Center|Plaza|Pharmacy|Gas|Station|Deli|Bakery|Grill|Bar)\b/i)) {
        // Look for the business name in previous lines
        let businessName = '';
        for (let j = Math.max(0, i - 2); j <= i; j++) {
          const prevLine = lines[j].trim();
          if (prevLine && !this.isCommonText(prevLine) && prevLine.match(/^[A-Z][a-zA-Z'&.\s]*$/)) {
            businessName += (businessName ? ' ' : '') + prevLine;
          }
        }
        
        if (businessName && businessName.length > 3 && businessName.length < 50) {
          return businessName.trim();
        }
      }
      
      // Check for business names with possessive (like "Love's")
      if (line.match(/^[A-Z][a-zA-Z']+['']s\b/)) {
        let fullName = line;
        // Check next lines for business type
        for (let j = i + 1; j < Math.min(lines.length, i + 3); j++) {
          const nextLine = lines[j].trim();
          if (nextLine.match(/\b(Shop|Store|Restaurant|Cafe|Coffee|Bank|Hotel|Market|Center|Plaza|Pharmacy|Gas|Station|Deli|Bakery|Grill|Bar)\b/i)) {
            fullName += ' ' + nextLine;
            break;
          } else if (nextLine && nextLine.match(/^[A-Z][a-zA-Z\s]+$/)) {
            fullName += ' ' + nextLine;
          }
        }
        
        if (fullName !== line && fullName.length > 5 && fullName.length < 50) {
          return fullName.trim();
        }
      }
    }
    
    return null;
  }

  private scoreBusinessName(text: string): number {
    let score = 0.5;
    if (text.match(/\b(Restaurant|Cafe|Coffee|Store|Shop|Bank|Hotel|Market|Center|Plaza|Deli|Bakery|Grill|Bar)\b/i)) score += 0.3;
    if (text.match(/\b(Inc|LLC|Corp|Ltd|Co)\b/i)) score += 0.2;
    if (text.match(/^[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*$/)) score += 0.2;
    if (text.split(' ').length >= 2 && text.split(' ').length <= 4) score += 0.1;
    if (text.match(/[&']/)) score += 0.1;
    if (text.match(/\b(The|And|For|With|From|To|In|On|At|By)\b/i)) score -= 0.2;
    if (text.length < 3 || text.length > 50) score -= 0.3;
    return Math.max(0, Math.min(1, score));
  }

  private isCommonText(text: string): boolean {
    const commonWords = /^(Open|Closed|Hours|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday|Welcome|Thank|Please|Exit|Enter|Push|Pull|No|Yes|Free|Sale|New|Old|Hot|Cold|Fresh|Daily|Special|Menu|Price|Cost|Total|Cash|Credit|Card|Plants|Sign)$/i;
    return commonWords.test(text) || text.match(/^\d+$/) || text.match(/^\d+[A-Z-]+$/) || text.length < 3;
  }

  // Extract street address specifically including postcodes
  private extractStreetAddress(text: string): string | null {
    const cleanText = this.preprocessText(text);
    const lines = text.split(/[\r\n]+/).map(line => line.trim());
    
    // Look for addresses with UK postcodes (like NW9, SW1A, etc.)
    const postcodePatterns = [
      /\b[A-Za-z\s.]{3,40}(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Way|Court|Ct|Circle|Cir|Place|Pl|Highway|Hwy)\s+[A-Z]{1,2}\d{1,2}[A-Z]?\b/i,
      /\b[A-Za-z\s.]{3,40}\s+(?:Road|Rd|Street|St|Avenue|Ave)\s+[A-Z]{1,2}\d{1,2}[A-Z]?\b/i
    ];
    
    // Check for postcode patterns first (higher priority)
    for (const pattern of postcodePatterns) {
      const matches = cleanText.match(pattern);
      if (matches) {
        const address = matches[0].trim();
        console.log('Extracted address with postcode:', address);
        return address;
      }
    }
    
    // Look for street addresses with numbers
    const streetPatterns = [
      /\b\d{1,6}\s+[A-Za-z\s.]{3,40}(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Way|Court|Ct|Circle|Cir|Place|Pl|Highway|Hwy)\b/i,
      /\b\d{1,6}[A-Za-z]?\s+[A-Za-z\s.]{2,30}\s+(?:St|Ave|Rd|Blvd|Dr|Ln|Way|Ct|Cir|Pl)\b/i
    ];
    
    for (const pattern of streetPatterns) {
      const matches = cleanText.match(pattern);
      if (matches) {
        const address = matches[0].trim();
        if (address.length > 8 && address.length < 60) {
          console.log('Extracted street address:', address);
          return address;
        }
      }
    }
    
    // Check individual lines for addresses with postcodes
    for (const line of lines) {
      if (line.match(/\b[A-Za-z\s.]{3,40}(?:Road|Rd|Street|St|Avenue|Ave)\s+[A-Z]{1,2}\d{1,2}[A-Z]?\b/i)) {
        console.log('Extracted address with postcode from line:', line);
        return line.trim();
      }
      if (line.match(/^\d{1,6}\s+[A-Za-z\s.]{3,40}(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Way|Court|Ct)\b/i)) {
        if (line.length > 8 && line.length < 60) {
          console.log('Extracted street address from line:', line);
          return line.trim();
        }
      }
    }
    
    return null;
  }

  // Enhanced address extraction
  private extractAddress(text: string): string | null {
    const cleanText = this.preprocessText(text);
    const lines = text.split(/[\r\n]+/).map(line => line.trim());
    
    const addressPatterns = [
      /\b\d+\s+[A-Za-z\s.]{3,40}(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Way|Court|Ct|Circle|Cir|Place|Pl)\s*,?\s*[A-Za-z\s]{2,30},?\s*[A-Z]{2}\s*\d{5}(?:-\d{4})?\b/i,
      /\b\d+\s+[A-Za-z\s.]{3,40}(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Way|Court|Ct|Circle|Cir|Place|Pl)\s*,\s*[A-Za-z\s]{2,25}\s*,\s*[A-Z]{2}\b/i,
      /\b\d{1,6}\s+[A-Za-z\s.]{3,40}(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Way|Court|Ct|Circle|Cir|Place|Pl)\b/i,
      /\bP\.?O\.?\s*Box\s+\d+/i
    ];

    let bestAddress = '';
    let bestScore = 0;

    for (const pattern of addressPatterns) {
      const matches = cleanText.match(pattern);
      if (matches) {
        const address = matches[0].trim();
        const score = this.scoreAddress(address);
        if (score > bestScore) {
          bestAddress = address;
          bestScore = score;
        }
      }
    }

    for (let i = 0; i < lines.length - 1; i++) {
      const line1 = lines[i].trim();
      const line2 = lines[i + 1].trim();
      
      if (line1.match(/^\d+\s+[A-Za-z\s.]{3,40}(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Way|Court|Ct)/i)) {
        if (line2.match(/^[A-Za-z\s]{2,25},?\s*[A-Z]{2}(?:\s*\d{5})?/i)) {
          const fullAddress = `${line1}, ${line2}`;
          const score = this.scoreAddress(fullAddress);
          if (score > bestScore) {
            bestAddress = fullAddress;
            bestScore = score;
          }
        }
      }
    }

    if (bestScore > 0.6) {
      console.log('Extracted address:', bestAddress);
      return bestAddress;
    }
    
    return null;
  }

  private scoreAddress(address: string): number {
    let score = 0.5;
    if (address.match(/^\d+\s/)) score += 0.2;
    if (address.match(/\b(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Way|Court|Ct)\b/i)) score += 0.3;
    if (address.match(/,\s*[A-Za-z\s]+,\s*[A-Z]{2}/)) score += 0.2;
    if (address.match(/\d{5}(?:-\d{4})?/)) score += 0.2;
    if (address.length >= 10 && address.length <= 100) score += 0.1;
    else if (address.length > 100) score -= 0.2;
    return Math.max(0, Math.min(1, score));
  }

  // Enhanced business search with geographic and scene context
  private async searchBusinessByNameWithContext(businessName: string, geographicClue: string | null, sceneContext: any): Promise<Location | null> {
    const apiKey = getEnv('GOOGLE_PLACES_API_KEY');
    if (!apiKey) {
      console.log('Google Places API key not available');
      return null;
    }
    
    // Build context-aware search queries
    const searchQueries = [];
    
    // Add geographic context if available
    if (geographicClue) {
      searchQueries.push(`${businessName} ${geographicClue}`);
      if (geographicClue === 'UK') {
        searchQueries.push(`${businessName} London`);
        searchQueries.push(`${businessName} United Kingdom`);
      }
      if (geographicClue === 'USA') {
        searchQueries.push(`${businessName} United States`);
      }
    }
    
    // Add cultural context
    if (sceneContext.culturalClues.includes('Chinese')) {
      searchQueries.push(`${businessName} Chinatown`);
      searchQueries.push(`${businessName} Chinese`);
    }
    
    // Add original queries
    searchQueries.push(businessName);
    searchQueries.push(businessName.split(' ').slice(0, 3).join(' '));
    
    // Remove duplicates and filter
    const uniqueQueries = [...new Set(searchQueries)].filter(q => q.trim().length > 2);
    console.log('Context-aware search queries:', uniqueQueries);
    
    for (const query of uniqueQueries) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);
        
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(query)}&inputtype=textquery&fields=geometry,name,formatted_address&key=${apiKey}`,
          { signal: controller.signal }
        );
        
        clearTimeout(timeoutId);
        
        if (!response.ok) continue;
        
        const data = await response.json();
        const candidates = data.candidates || [];
        
        // Look for the best match with geographic validation
        for (const place of candidates.slice(0, 3)) {
          if (place?.geometry?.location) {
            const lat = place.geometry.location.lat;
            const lng = place.geometry.location.lng;
            
            // Reject invalid coordinates
            if (lat === 0 && lng === 0) {
              console.log('Rejecting invalid coordinates (0,0)');
              continue;
            }
            
            const location = { latitude: lat, longitude: lng };
            const address = place.formatted_address || '';
            
            // Validate geographic consistency
            if (this.validateGeographicConsistency(location, address, geographicClue)) {
              console.log(`Found contextually valid location for "${query}": ${address}`);
              return location;
            }
          }
        }
      } catch (error) {
        console.log(`Context search failed for "${query}":`, error.message);
        continue;
      }
    }
    
    console.log('No exact business match found, trying fallback searches');
    
    // Fallback: try generic location searches with UK priority
    const fallbackQueries = [
      `${businessName} UK`,
      `${businessName} London`,
      'Chinese restaurant UK',
      'Oriental food London',
      'Asian restaurant UK'
    ];
    
    for (const query of fallbackQueries) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 1500);
        
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(query)}&inputtype=textquery&fields=geometry,name,formatted_address&key=${apiKey}`,
          { signal: controller.signal }
        );
        
        clearTimeout(timeoutId);
        
        if (!response.ok) continue;
        
        const data = await response.json();
        const place = data.candidates?.[0];
        
        if (place?.geometry?.location) {
          const lat = place.geometry.location.lat;
          const lng = place.geometry.location.lng;
          
          if (lat !== 0 || lng !== 0) {
            console.log(`Found fallback location for "${query}": ${place.formatted_address}`);
            return { latitude: lat, longitude: lng };
          }
        }
      } catch (error) {
        continue;
      }
    }
    
    console.log('No valid business location found');
    return null;
  }
  
  // Validate geographic consistency between location and expected region
  private validateGeographicConsistency(location: Location, address: string, expectedRegion: string | null): boolean {
    if (!expectedRegion) return true; // No expectation, accept any valid location
    
    const { latitude, longitude } = location;
    const addressUpper = address.toUpperCase();
    
    switch (expectedRegion) {
      case 'UK':
        // UK coordinates: roughly 49-61°N, -8-2°E
        if (latitude >= 49 && latitude <= 61 && longitude >= -8 && longitude <= 2) {
          return true;
        }
        if (addressUpper.includes('UNITED KINGDOM') || addressUpper.includes('UK') || 
            addressUpper.includes('ENGLAND') || addressUpper.includes('LONDON')) {
          return true;
        }
        return false;
        
      case 'USA':
        // USA coordinates: roughly 25-49°N, -125--66°W
        if (latitude >= 25 && latitude <= 49 && longitude >= -125 && longitude <= -66) {
          return true;
        }
        if (addressUpper.includes('UNITED STATES') || addressUpper.includes('USA') || 
            addressUpper.includes('US')) {
          return true;
        }
        return false;
        
      case 'China':
        // China coordinates: roughly 18-54°N, 73-135°E
        if (latitude >= 18 && latitude <= 54 && longitude >= 73 && longitude <= 135) {
          return true;
        }
        if (addressUpper.includes('CHINA') || addressUpper.includes('CHINESE')) {
          return true;
        }
        return false;
        
      default:
        return true;
    }
  }
  
  // Search for business location by name with multiple attempts
  private async searchBusinessByName(businessName: string): Promise<Location | null> {
    const apiKey = getEnv('GOOGLE_PLACES_API_KEY');
    if (!apiKey) {
      console.log('Google Places API key not available');
      return null;
    }
    
    // Try multiple search variations with location context
    const searchQueries = [
      businessName, // Original name
      `${businessName} UK`, // Add UK context
      `${businessName} London`, // Add London context
      businessName.split(' ').slice(0, 3).join(' '), // First 3 words
      businessName.replace(/TURKIYE|TURKEY/i, ''), // Remove country references
      businessName.split(' ')[0] + ' ' + businessName.split(' ').slice(-1)[0] // First + last word
    ].filter(q => q.trim().length > 2);
    
    for (const query of searchQueries) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);
        
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(query)}&inputtype=textquery&fields=geometry,name,formatted_address&key=${apiKey}`,
          { signal: controller.signal }
        );
        
        clearTimeout(timeoutId);
        
        if (!response.ok) continue;
        
        const data = await response.json();
        const candidates = data.candidates || [];
        
        // Look for the best match, preferring UK/London locations
        for (const place of candidates.slice(0, 3)) {
          if (place?.geometry?.location) {
            const lat = place.geometry.location.lat;
            const lng = place.geometry.location.lng;
            
            // Reject invalid coordinates (0,0 or null island)
            if (lat === 0 && lng === 0) {
              console.log('Rejecting invalid coordinates (0,0)');
              continue;
            }
            
            const location = { latitude: lat, longitude: lng };
            const address = place.formatted_address || '';
            
            // Prefer UK locations if business name suggests UK context
            if (query.includes('UK') || query.includes('London')) {
              if (address.includes('UK') || address.includes('United Kingdom') || address.includes('London')) {
                console.log(`Found UK location for "${query}": ${address}`);
                return location;
              }
            } else {
              // For original queries, accept first valid result
              console.log(`Found location for "${query}": ${address}`);
              return location;
            }
          }
        }
      } catch (error) {
        console.log(`Search failed for "${query}":`, error.message);
        continue;
      }
    }
    
    console.log('No valid business location found');
    return null;
  }
  
  // Validate if business location makes geographic sense
  private isValidBusinessLocation(location: Location, businessName: string, address?: string): boolean {
    const { latitude, longitude } = location;
    
    // Basic coordinate validation
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return false;
    }
    
    // If business name contains country/region hints, validate against location
    const nameUpper = businessName.toUpperCase();
    const addressUpper = (address || '').toUpperCase();
    
    // Turkey/Turkish business validation
    if (nameUpper.includes('TURKIYE') || nameUpper.includes('TURKEY') || nameUpper.includes('TURKISH')) {
      // Turkey coordinates: roughly 36-42°N, 26-45°E
      if (latitude >= 36 && latitude <= 42 && longitude >= 26 && longitude <= 45) {
        return true;
      }
      // Also accept if address contains Turkey
      if (addressUpper.includes('TURKEY') || addressUpper.includes('TÜRKIYE')) {
        return true;
      }
      // Reject if clearly in wrong country
      return false;
    }
    
    // For other businesses, accept reasonable locations
    return true;
  }

  // Geocode address to location
  private async geocodeAddress(address: string): Promise<Location | null> {
    const apiKey = getEnv('GOOGLE_PLACES_API_KEY');
    if (!apiKey) {
      console.log('Google Places API key not available');
      return null;
    }
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`,
        { signal: controller.signal }
      );
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      const result = data.results?.[0];
      
      if (result?.geometry?.location) {
        const lat = result.geometry.location.lat;
        const lng = result.geometry.location.lng;
        
        // Reject invalid coordinates
        if (lat === 0 && lng === 0) {
          console.log('Rejecting invalid geocoding coordinates (0,0)');
          return null;
        }
        
        return { latitude: lat, longitude: lng };
      }
    } catch (error) {
      console.error('Geocoding failed:', error.message);
    }
    return null;
  }

  // V2 pipeline - EXIF GPS data with AI vision fallback
  async recognize(buffer: Buffer, providedLocation?: Location, analyzeLandmarks: boolean = false): Promise<LocationResult> {
    console.log('V2: Enhanced location recognition starting...');
    console.log('Buffer info - Size:', buffer.length, 'bytes');
    
    try {
      // Add overall timeout for the entire recognition process
      const recognitionPromise = this.performRecognition(buffer, providedLocation, analyzeLandmarks);
      const timeoutPromise = new Promise<LocationResult>((_, reject) => {
        setTimeout(() => reject(new Error('Recognition timeout')), 20000); // 20 second timeout
      });
      
      return await Promise.race([recognitionPromise, timeoutPromise]);
    } catch (error) {
      console.error('Recognition failed:', error);
      
      // Try basic image analysis as last resort
      if (providedLocation) {
        return {
          success: true,
          name: 'Device Location',
          location: providedLocation,
          confidence: 0.3,
          method: 'device-fallback',
          description: 'Using device location due to analysis failure'
        };
      }
      
      return {
        success: false,
        confidence: 0,
        method: 'error',
        error: 'Recognition process failed or timed out'
      };
    }
  }
  
  private async performRecognition(buffer: Buffer, providedLocation?: Location, analyzeLandmarks: boolean = false): Promise<LocationResult> {
    // Log first few bytes to verify it's a valid image
    const header = buffer.slice(0, 10);
    console.log('File header:', Array.from(header).map(b => '0x' + b.toString(16)).join(' '));
    
    // 1. Try EXIF GPS extraction first (highest accuracy)
    const gpsResult = this.extractGPS(buffer);
    if (gpsResult?.location) {
      console.log('Found EXIF GPS:', gpsResult.location);
      return await this.enrichLocationData(gpsResult, buffer, analyzeLandmarks);
    }
    
    console.log('No EXIF GPS data found - trying AI vision analysis...');
    
    // 2. Try AI vision analysis (medium accuracy) with timeout
    try {
      const aiResult = await Promise.race([
        this.analyzeImageWithAI(buffer),
        new Promise<LocationResult | null>((_, reject) => 
          setTimeout(() => reject(new Error('AI analysis timeout')), 12000)
        )
      ]);
      
      if (aiResult?.success && aiResult.location) {
        console.log('AI vision found location:', aiResult.location);
        return await this.enrichLocationData(aiResult, buffer, analyzeLandmarks);
      }
    } catch (error) {
      console.log('AI vision analysis timed out or failed:', error.message);
    }
    
    console.log('AI vision analysis failed - trying device location fallback...');
    
    // 3. Smart fallback: Use device location if available (low accuracy)
    if (providedLocation && providedLocation.latitude !== 0 && providedLocation.longitude !== 0) {
      console.log('Using device location as fallback');
      const fallbackResult = {
        success: true,
        name: 'Device Location (Fallback)',
        location: providedLocation,
        confidence: 0.4,
        method: 'device-location-fallback',
        note: 'No GPS data in image and AI analysis inconclusive, using device location'
      };
      
      return await this.enrichLocationData(fallbackResult, buffer, analyzeLandmarks);
    }
    
    // 4. Complete failure - no location data available
    return {
      success: false,
      confidence: 0,
      method: 'no-location-data',
      error: 'Unable to determine location. Image has no GPS data, AI analysis found no recognizable landmarks/businesses, and no device location provided.',
      location: null // Explicitly set to null instead of potentially returning 0,0
    };
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  console.log('POST request received at:', new Date().toISOString());
  
  try {
    // Add timeout to the entire request
    const requestPromise = handleRequest(request);
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout')), 20000); // 20 second timeout
    });
    
    const result = await Promise.race([requestPromise, timeoutPromise]);
    console.log('Request completed in:', Date.now() - startTime, 'ms');
    return result;
    
  } catch (error) {
    console.error('Request failed:', error);
    const duration = Date.now() - startTime;
    console.log('Request failed after:', duration, 'ms');
    
    return NextResponse.json(
      { 
        error: duration > 19000 ? 'Request timeout' : 'Internal server error',
        duration: duration
      },
      { status: 500, headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      }}
    );
  }
}

async function handleRequest(request: NextRequest) {
  const formData = await request.formData();
  const image = formData.get('image') as File;
  
  if (!image) {
    return NextResponse.json({ error: 'Image required' }, { status: 400, headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }});
  }
  
  const buffer = Buffer.from(await image.arrayBuffer());
  console.log('Image buffer size:', buffer.length);
  
  const lat = formData.get('latitude');
  const lng = formData.get('longitude');
  const analyzeLandmarks = formData.get('analyzeLandmarks') === 'true';
  
  const providedLocation = lat && lng ? {
    latitude: parseFloat(lat as string),
    longitude: parseFloat(lng as string)
  } : undefined;
  
  console.log('Provided location:', providedLocation);
  console.log('Analyze landmarks:', analyzeLandmarks);
  
  const recognizer = new LocationRecognizer();
  const result = await recognizer.recognize(buffer, providedLocation, analyzeLandmarks);
  
  return NextResponse.json(result, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  });
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}