import axios from "axios"
import NodeCache from "node-cache"

// Cache for Zoopla API responses
const zoplaCache = new NodeCache({
  stdTTL: 86400, // 24 hour cache
  checkperiod: 600, // Check for expired keys every 10 minutes
  useClones: false, // Disable cloning for better performance
})

// Helper function to get environment variables
function getEnv(key: string): string | undefined {
  if (typeof process !== "undefined" && process.env) {
    const value = process.env[key]
    if (value) return value
  }
  
  if (typeof window !== "undefined" && key.startsWith("NEXT_PUBLIC_")) {
    if ((window as any).__ENV && (window as any).__ENV[key]) {
      return (window as any).__ENV[key]
    }
    if ((window as any).process?.env && (window as any).process.env[key]) {
      return (window as any).process.env[key]
    }
  }
  
  console.warn(`Environment variable ${key} not found`)
  return undefined
}

export interface ZooplaPropertyData {
  listingId?: string;
  price?: string;
  priceHistory?: {
    date: string;
    price: string;
  }[];
  propertyType?: string;
  bedrooms?: number;
  bathrooms?: number;
  receptionRooms?: number;
  floorArea?: string;
  energyRating?: string;
  councilTaxBand?: string;
  tenure?: string;
  listingStatus?: string;
  listingDate?: string;
  description?: string;
  features?: string[];
  nearbyAmenities?: {
    type: string;
    name: string;
    distance: string;
  }[];
  schools?: {
    name: string;
    type: string;
    distance: string;
    rating?: string;
  }[];
  transportLinks?: {
    type: string;
    name: string;
    distance: string;
  }[];
  similarProperties?: {
    id: string;
    price: string;
    address: string;
    propertyType: string;
    bedrooms: number;
  }[];
  marketStats?: {
    averagePrice?: string;
    priceChange?: string;
    timeOnMarket?: string;
  };
  areaInfo?: {
    description?: string;
    averagePrice?: string;
    popularPropertyTypes?: string[];
  };
}

/**
 * Fetches property data from Zoopla for a given location
 */
export async function fetchZooplaPropertyData(
  location: { latitude: number; longitude: number },
  address?: string,
  postcode?: string
): Promise<ZooplaPropertyData | null> {
  try {
    // Generate cache key based on location and address
    const cacheKey = `zoopla_${location.latitude.toFixed(5)}_${location.longitude.toFixed(5)}_${address || ""}_${postcode || ""}`;
    
    // Check cache first
    const cachedData = zoplaCache.get(cacheKey);
    if (cachedData) {
      console.log("Using cached Zoopla data");
      return cachedData as ZooplaPropertyData;
    }
    
    // Get API key from environment variables
    const apiKey = getEnv("ZOOPLA_API_KEY");
    if (!apiKey) {
      console.warn("Zoopla API key not found");
      return null;
    }
    
    // Prepare search parameters
    const params: any = {
      api_key: apiKey,
      radius: 0.1, // 0.1 mile radius
    };
    
    // Add location parameters
    if (location) {
      params.latitude = location.latitude;
      params.longitude = location.longitude;
    }
    
    // Add address or postcode if available
    if (postcode) {
      params.postcode = postcode;
    } else if (address) {
      params.address = address;
    }
    
    // Make API request to Zoopla
    const response = await axios.get("https://api.zoopla.co.uk/api/v1/property_listings", {
      params,
      timeout: 5000,
    });
    
    // Process response
    if (response.data && response.data.listing && response.data.listing.length > 0) {
      const listing = response.data.listing[0];
      
      // Extract property data
      const propertyData: ZooplaPropertyData = {
        listingId: listing.listing_id,
        price: listing.price,
        propertyType: listing.property_type,
        bedrooms: parseInt(listing.num_bedrooms) || undefined,
        bathrooms: parseInt(listing.num_bathrooms) || undefined,
        receptionRooms: parseInt(listing.num_reception_rooms) || undefined,
        floorArea: listing.floor_area,
        energyRating: listing.energy_rating,
        listingStatus: listing.listing_status,
        listingDate: listing.first_published_date,
        description: listing.description,
        features: listing.bullet || [],
        tenure: listing.tenure,
      };
      
      // Add area information if available
      if (response.data.area_info) {
        propertyData.areaInfo = {
          description: response.data.area_info.description,
          averagePrice: response.data.area_info.average_price,
          popularPropertyTypes: response.data.area_info.popular_property_types,
        };
      }
      
      // Add market stats if available
      if (response.data.market_stats) {
        propertyData.marketStats = {
          averagePrice: response.data.market_stats.average_price,
          priceChange: response.data.market_stats.price_change,
          timeOnMarket: response.data.market_stats.time_on_market,
        };
      }
      
      // Cache the result
      zoplaCache.set(cacheKey, propertyData, 3600); // Cache for 1 hour
      
      return propertyData;
    }
    
    // No property found
    return null;
  } catch (error) {
    console.error("Error fetching Zoopla property data:", error);
    return null;
  }
}

/**
 * Fetches nearby properties from Zoopla for a given location
 */
export async function fetchNearbyProperties(
  location: { latitude: number; longitude: number },
  radius: number = 0.5
): Promise<ZooplaPropertyData[]> {
  try {
    // Generate cache key
    const cacheKey = `zoopla_nearby_${location.latitude.toFixed(5)}_${location.longitude.toFixed(5)}_${radius}`;
    
    // Check cache first
    const cachedData = zoplaCache.get(cacheKey);
    if (cachedData) {
      console.log("Using cached Zoopla nearby properties data");
      return cachedData as ZooplaPropertyData[];
    }
    
    // Get API key from environment variables
    const apiKey = getEnv("ZOOPLA_API_KEY");
    if (!apiKey) {
      console.warn("Zoopla API key not found");
      return [];
    }
    
    // Make API request to Zoopla
    const response = await axios.get("https://api.zoopla.co.uk/api/v1/property_listings", {
      params: {
        api_key: apiKey,
        latitude: location.latitude,
        longitude: location.longitude,
        radius: radius,
        listing_status: "sale,rent",
        page_size: 10,
      },
      timeout: 5000,
    });
    
    // Process response
    if (response.data && response.data.listing && response.data.listing.length > 0) {
      const properties = response.data.listing.map((listing: any) => {
        return {
          listingId: listing.listing_id,
          price: listing.price,
          propertyType: listing.property_type,
          bedrooms: parseInt(listing.num_bedrooms) || undefined,
          bathrooms: parseInt(listing.num_bathrooms) || undefined,
          address: listing.displayable_address,
          listingStatus: listing.listing_status,
          listingDate: listing.first_published_date,
          description: listing.short_description,
        };
      });
      
      // Cache the result
      zoplaCache.set(cacheKey, properties, 3600); // Cache for 1 hour
      
      return properties;
    }
    
    // No properties found
    return [];
  } catch (error) {
    console.error("Error fetching nearby Zoopla properties:", error);
    return [];
  }
}

/**
 * Fetches property price estimates from Zoopla for a given address or postcode
 */
export async function fetchPropertyEstimate(
  address: string,
  postcode?: string
): Promise<{ estimate?: string; range?: string; confidence?: string }> {
  try {
    // Generate cache key
    const cacheKey = `zoopla_estimate_${address.replace(/\s+/g, "_")}_${postcode || ""}`;
    
    // Check cache first
    const cachedData = zoplaCache.get(cacheKey);
    if (cachedData) {
      console.log("Using cached Zoopla estimate data");
      return cachedData as { estimate?: string; range?: string; confidence?: string };
    }
    
    // Get API key from environment variables
    const apiKey = getEnv("ZOOPLA_API_KEY");
    if (!apiKey) {
      console.warn("Zoopla API key not found");
      return {};
    }
    
    // Prepare parameters
    const params: any = {
      api_key: apiKey,
    };
    
    if (postcode) {
      params.postcode = postcode;
    } else {
      params.address = address;
    }
    
    // Make API request to Zoopla
    const response = await axios.get("https://api.zoopla.co.uk/api/v1/property_estimates", {
      params,
      timeout: 5000,
    });
    
    // Process response
    if (response.data && response.data.estimate) {
      const result = {
        estimate: response.data.estimate.value,
        range: `${response.data.estimate.lower_bound} - ${response.data.estimate.upper_bound}`,
        confidence: response.data.estimate.confidence,
      };
      
      // Cache the result
      zoplaCache.set(cacheKey, result, 86400); // Cache for 24 hours
      
      return result;
    }
    
    // No estimate found
    return {};
  } catch (error) {
    console.error("Error fetching Zoopla property estimate:", error);
    return {};
  }
}
