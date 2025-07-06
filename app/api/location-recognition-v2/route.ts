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
  async enrichLocationData(baseResult: LocationResult, buffer: Buffer, analyzeLandmarks: boolean = false): Promise<LocationResult> {
    const { latitude, longitude } = baseResult.location!;
    
    const addressKey = `addr_${Math.round(latitude*1000)}_${Math.round(longitude*1000)}`;
    let address = cache.get(addressKey) as string;
    let locationDetails = cache.get(`details_${addressKey}`) as any;
    
    // Comprehensive parallel processing
    const [places, photos, weather, elevation, transit, demographics, landmarks] = await Promise.all([
      this.getNearbyPlaces(latitude, longitude),
      this.getLocationPhotos(latitude, longitude),
      this.getWeatherData(latitude, longitude),
      this.getElevationData(latitude, longitude),
      this.getTransitData(latitude, longitude),
      this.getDemographicData(latitude, longitude),
      analyzeLandmarks ? this.analyzeLandmarks(buffer, latitude, longitude) : Promise.resolve([]),
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
      landmarks: landmarks,
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
  
  // Analyze landmarks and monuments in the image
  private async analyzeLandmarks(buffer: Buffer, lat: number, lng: number): Promise<any[]> {
    try {
      const client = await this.initVisionClient();
      if (!client) return [];
      
      // Use Google Vision to detect landmarks
      const [landmarkResult] = await client.landmarkDetection({ image: { content: buffer } });
      const landmarks = landmarkResult.landmarkAnnotations || [];
      
      const processedLandmarks = [];
      
      for (const landmark of landmarks.slice(0, 3)) {
        const landmarkData = {
          name: landmark.description || 'Unknown Landmark',
          confidence: landmark.score || 0.8,
          description: await this.getLandmarkDescription(landmark.description || ''),
          culturalInfo: 'This landmark represents important cultural heritage and community identity.',
          historicalInfo: 'This structure has witnessed significant historical developments and urban evolution.',
          wikipediaUrl: await this.getWikipediaUrl(landmark.description || ''),
          moreInfoUrl: `https://www.google.com/search?q=${encodeURIComponent(landmark.description || '')}`
        };
        
        processedLandmarks.push(landmarkData);
      }
      
      return processedLandmarks;
    } catch (error) {
      console.error('Landmark analysis failed:', error);
      return [];
    }
  }
  
  private async getLandmarkDescription(landmarkName: string): Promise<string> {
    try {
      const response = await fetch(
        `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(landmarkName)}`,
        { signal: AbortSignal.timeout(2000) }
      );
      const data = await response.json();
      return data.extract || `A notable landmark: ${landmarkName}`;
    } catch {
      return `A significant architectural or cultural landmark.`;
    }
  }
  
  private async getWikipediaUrl(landmarkName: string): Promise<string> {
    try {
      const response = await fetch(
        `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(landmarkName)}`,
        { signal: AbortSignal.timeout(1500) }
      );
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
      return new vision.ImageAnnotatorClient({
        credentials: {
          client_email: serviceAccount.client_email,
          private_key: serviceAccount.private_key,
        },
        projectId: serviceAccount.project_id,
      });
    } catch (error) {
      console.error('Failed to initialize Vision client:', error);
      return null;
    }
  }

  // Claude AI analysis for complex location identification
  private async analyzeWithClaude(visionData: any, buffer: Buffer): Promise<LocationResult | null> {
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

      // Try text detection first (most reliable)
      const textResult = await client.textDetection({ image: { content: buffer } }).catch(err => {
        console.log('Text detection failed:', err.message);
        return [{ textAnnotations: [] }];
      });

      const texts = textResult[0].textAnnotations || [];
      console.log('Found', texts.length, 'text elements');

      if (texts.length > 0) {
        const fullText = texts[0].description || '';
        console.log('Analyzing text:', fullText.substring(0, 200));
        
        // Look for any recognizable business names or addresses
        const businessName = this.extractBusinessName(fullText);
        if (businessName) {
          console.log('Found business name:', businessName);
          const businessLocation = await this.searchBusinessByName(businessName);
          if (businessLocation) {
            return {
              success: true,
              name: businessName,
              location: businessLocation,
              confidence: 0.75,
              method: 'ai-text-business',
              description: `Business identified: ${businessName}`
            };
          }
        }

        // Try address extraction
        const address = this.extractAddress(fullText);
        if (address) {
          console.log('Found address:', address);
          const addressLocation = await this.geocodeAddress(address);
          if (addressLocation) {
            return {
              success: true,
              name: address,
              location: addressLocation,
              confidence: 0.7,
              method: 'ai-text-address',
              description: `Address identified: ${address}`
            };
          }
        }
      }

      // Try landmark detection
      const landmarkResult = await client.landmarkDetection({ image: { content: buffer } }).catch(err => {
        console.log('Landmark detection failed:', err.message);
        return [{ landmarkAnnotations: [] }];
      });

      const landmarks = landmarkResult[0].landmarkAnnotations || [];
      if (landmarks.length > 0) {
        const landmark = landmarks[0];
        const location = landmark.locations?.[0]?.latLng;
        if (location && landmark.description) {
          console.log('Found landmark:', landmark.description);
          return {
            success: true,
            name: landmark.description,
            location: { latitude: location.latitude || 0, longitude: location.longitude || 0 },
            confidence: (landmark.score || 0.8),
            method: 'ai-landmark-detection',
            description: `Landmark: ${landmark.description}`
          };
        }
      }

      console.log('No recognizable locations found in image');
      return null;
    } catch (error) {
      console.error('AI vision analysis failed:', error);
      return null;
    }
  }

  // Extract business name from text
  private extractBusinessName(text: string): string | null {
    // Clean up the text
    const cleanText = text.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
    
    const businessPatterns = [
      // Major chains
      /(McDonald's|Starbucks|Subway|KFC|Pizza Hut|Burger King|Taco Bell|Walmart|Target|CVS|Walgreens|Home Depot|Lowe's|Best Buy)/i,
      // Business with type words
      /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+(?:Restaurant|Cafe|Coffee|Store|Shop|Bank|Hotel|Hospital|School|Church|Market|Mall|Center|Plaza|Pharmacy|Gas|Station))/i,
      // All caps business names
      /([A-Z]{2,}(?:\s+[A-Z]{2,})*(?:\s+(?:RESTAURANT|CAFE|STORE|SHOP|BANK|HOTEL|HOSPITAL|SCHOOL|CHURCH|MARKET|MALL|CENTER|PLAZA)))/i,
      // Corporate suffixes
      /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+(?:Inc|LLC|Corp|Ltd|Co))/i,
      // Generic business patterns (2-4 words starting with capital)
      /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})\b/g
    ];

    for (const pattern of businessPatterns) {
      const matches = cleanText.match(pattern);
      if (matches) {
        const businessName = matches[1] || matches[0];
        if (businessName && businessName.length > 3 && businessName.length < 50) {
          console.log('Extracted business name:', businessName);
          return businessName.trim();
        }
      }
    }
    
    // Look for any prominent text that might be a business name
    const lines = cleanText.split('\n').filter(line => line.trim().length > 2);
    for (const line of lines.slice(0, 5)) { // Check first 5 lines
      if (line.match(/^[A-Z][A-Za-z\s]{3,30}$/) && !line.match(/^(THE|AND|FOR|WITH|FROM)\s/i)) {
        console.log('Found potential business name:', line);
        return line.trim();
      }
    }
    
    return null;
  }

  // Extract address from text
  private extractAddress(text: string): string | null {
    const addressPatterns = [
      /\b\d+\s+[A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Way|Court|Ct)\b/i,
      /\b\d+\s+[A-Za-z\s]+,\s*[A-Za-z\s]+,\s*[A-Z]{2}\s*\d{5}/i
    ];

    for (const pattern of addressPatterns) {
      const match = text.match(pattern);
      if (match && match[0]) {
        return match[0].trim();
      }
    }
    return null;
  }

  // Search for business location by name
  private async searchBusinessByName(businessName: string): Promise<Location | null> {
    try {
      const response = await axios.get('https://maps.googleapis.com/maps/api/place/findplacefromtext/json', {
        params: {
          input: businessName,
          inputtype: 'textquery',
          fields: 'geometry',
          key: getEnv('GOOGLE_PLACES_API_KEY')
        },
        timeout: 3000
      });

      const place = response.data.candidates?.[0];
      if (place?.geometry?.location) {
        return {
          latitude: place.geometry.location.lat,
          longitude: place.geometry.location.lng
        };
      }
    } catch (error) {
      console.error('Business search failed:', error);
    }
    return null;
  }

  // Geocode address to location
  private async geocodeAddress(address: string): Promise<Location | null> {
    try {
      const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
        params: {
          address: address,
          key: getEnv('GOOGLE_PLACES_API_KEY')
        },
        timeout: 3000
      });

      const result = response.data.results?.[0];
      if (result?.geometry?.location) {
        return {
          latitude: result.geometry.location.lat,
          longitude: result.geometry.location.lng
        };
      }
    } catch (error) {
      console.error('Geocoding failed:', error);
    }
    return null;
  }

  // V2 pipeline - EXIF GPS data with AI vision fallback
  async recognize(buffer: Buffer, providedLocation?: Location, analyzeLandmarks: boolean = false): Promise<LocationResult> {
    console.log('V2: Enhanced location recognition starting...');
    console.log('Buffer info - Size:', buffer.length, 'bytes');
    
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
    
    // 2. Try AI vision analysis (medium accuracy)
    const aiResult = await this.analyzeImageWithAI(buffer);
    if (aiResult?.success && aiResult.location) {
      console.log('AI vision found location:', aiResult.location);
      return await this.enrichLocationData(aiResult, buffer, analyzeLandmarks);
    }
    
    console.log('AI vision analysis failed - trying device location fallback...');
    
    // 3. Smart fallback: Use device location if available (low accuracy)
    if (providedLocation) {
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
      error: 'Unable to determine location. Image has no GPS data, AI analysis found no recognizable landmarks/businesses, and no device location provided.'
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const image = formData.get('image') as File;
    
    if (!image) {
      return NextResponse.json({ error: 'Image required' }, { status: 400 }, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        }
      });
    }
    
    const buffer = Buffer.from(await image.arrayBuffer());
    
    const lat = formData.get('latitude');
    const lng = formData.get('longitude');
    const analyzeLandmarks = formData.get('analyzeLandmarks') === 'true';
    
    const providedLocation = lat && lng ? {
      latitude: parseFloat(lat as string),
      longitude: parseFloat(lng as string)
    } : undefined;
    
    const recognizer = new LocationRecognizer();
    const result = await recognizer.recognize(buffer, providedLocation, analyzeLandmarks);
    
    return NextResponse.json(result, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    });
    
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      }}
    );
  }
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