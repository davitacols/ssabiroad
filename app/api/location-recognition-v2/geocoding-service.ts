import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 3600 });

export class GeocodingService {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async getDetailedAddress(lat: number, lng: number): Promise<{ address: string; details: any }> {
    if (!this.apiKey) {
      return {
        address: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
        details: null
      };
    }

    const cacheKey = `geocode_${lat.toFixed(6)}_${lng.toFixed(6)}`;
    const cached = cache.get(cacheKey) as { address: string; details: any } | undefined;
    if (cached) {
      console.log('✅ Using cached geocoding result:', cached.address);
      return cached;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${this.apiKey}`;
      console.log('🔍 Geocoding request for:', `${lat.toFixed(4)}, ${lng.toFixed(4)}`);

      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      console.log('📍 Geocoding response status:', response.status);

      if (!response.ok) {
        console.log('❌ Geocoding HTTP error:', response.status);
        return {
          address: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
          details: null
        };
      }

      const data = await response.json();
      console.log('📍 Geocoding API status:', data.status);

      if (data.status !== 'OK') {
        console.log('❌ Geocoding API error:', data.status, data.error_message);
        return {
          address: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
          details: null
        };
      }

      const result = data.results?.[0];

      if (result?.formatted_address) {
        const details = {
          country: result.address_components?.find((c: any) => c.types.includes('country'))?.long_name,
          city: result.address_components?.find((c: any) => c.types.includes('locality'))?.long_name,
          state: result.address_components?.find((c: any) => c.types.includes('administrative_area_level_1'))?.long_name,
          postalCode: result.address_components?.find((c: any) => c.types.includes('postal_code'))?.long_name,
          neighborhood: result.address_components?.find((c: any) => c.types.includes('neighborhood'))?.long_name,
          placeId: result.place_id
        };
        const addressData = {
          address: result.formatted_address,
          details
        };
        cache.set(cacheKey, addressData, 3600);
        console.log('✅ Geocoded and cached:', result.formatted_address);
        return addressData;
      } else {
        console.log('❌ No geocoding results found');
      }
    } catch (error) {
      console.log('❌ Geocoding error:', error.message);
      if (error.name === 'AbortError') {
        console.log('⏱️ Geocoding request timed out');
      }
    }

    return {
      address: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
      details: null
    };
  }
}
