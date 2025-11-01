import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface RegionHint {
  countryCode: string;
  region: string;
  searchPriority: string[];
  biasCoordinates?: { lat: number; lng: number };
}

export class GeofenceOptimizer {
  private static regionMappings = {
    UK: {
      bounds: { minLat: 49, maxLat: 61, minLng: -8, maxLng: 2 },
      searchSuffixes: ['UK', 'United Kingdom', 'London', 'England'],
      commonChains: ['Tesco', 'Sainsburys', 'Boots', 'Costa']
    },
    US: {
      bounds: { minLat: 25, maxLat: 49, minLng: -125, maxLng: -66 },
      searchSuffixes: ['USA', 'United States', 'US'],
      commonChains: ['Walmart', 'Target', 'CVS', 'Starbucks']
    }
  };

  static async getRegionHint(
    latitude?: number,
    longitude?: number,
    ipAddress?: string
  ): Promise<RegionHint | null> {
    if (latitude && longitude) {
      for (const [code, region] of Object.entries(this.regionMappings)) {
        const { bounds } = region;
        if (
          latitude >= bounds.minLat &&
          latitude <= bounds.maxLat &&
          longitude >= bounds.minLng &&
          longitude <= bounds.maxLng
        ) {
          return {
            countryCode: code,
            region: code,
            searchPriority: region.searchSuffixes,
            biasCoordinates: { lat: latitude, lng: longitude }
          };
        }
      }
    }

    if (ipAddress) {
      const geoData = await this.getIPGeolocation(ipAddress);
      if (geoData) {
        return {
          countryCode: geoData.countryCode,
          region: geoData.region,
          searchPriority: this.regionMappings[geoData.countryCode as keyof typeof this.regionMappings]?.searchSuffixes || [],
          biasCoordinates: geoData.coordinates
        };
      }
    }

    return null;
  }

  private static async getIPGeolocation(ip: string): Promise<any> {
    try {
      const response = await fetch(`http://ip-api.com/json/${ip}`);
      const data = await response.json();
      
      if (data.status === 'success') {
        return {
          countryCode: data.countryCode,
          region: data.regionName,
          coordinates: { lat: data.lat, lng: data.lon }
        };
      }
    } catch (error) {
      console.error('IP geolocation failed:', error);
    }
    return null;
  }

  static filterByRegion(
    candidates: any[],
    regionHint: RegionHint
  ): any[] {
    const { bounds } = this.regionMappings[regionHint.countryCode as keyof typeof this.regionMappings] || {};
    
    if (!bounds) return candidates;

    return candidates.filter(candidate => {
      const lat = candidate.geometry?.location?.lat;
      const lng = candidate.geometry?.location?.lng;
      
      if (!lat || !lng) return false;

      return (
        lat >= bounds.minLat &&
        lat <= bounds.maxLat &&
        lng >= bounds.minLng &&
        lng <= bounds.maxLng
      );
    });
  }

  static buildRegionalSearchQuery(
    businessName: string,
    regionHint: RegionHint
  ): string[] {
    const queries = [];
    
    for (const suffix of regionHint.searchPriority) {
      queries.push(`${businessName} ${suffix}`);
    }
    
    queries.push(businessName);
    
    return queries;
  }

  static async saveRegionOptimization(
    region: string,
    countryCode: string,
    searchHints: any
  ): Promise<void> {
    await prisma.regionOptimization.upsert({
      where: { region_countryCode: { region, countryCode } },
      update: { searchHints, updatedAt: new Date() },
      create: { region, countryCode, searchHints }
    });
  }
}
