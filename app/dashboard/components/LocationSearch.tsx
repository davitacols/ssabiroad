"use client";

import { useState, useEffect } from "react";
import { Search, Loader2, X, MapPin, Info, Globe, Map, Building, Navigation } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface LocationSearchProps {
  onSelectLocation: (location: {
    lat: number;
    lng: number;
    accuracy: number;
    details?: LocationDetails;
  }) => void;
}

interface Suggestion {
  place_id: string;
  description: string;
  structured_formatting?: {
    main_text?: string;
    secondary_text?: string;
  };
}

interface LocationDetails {
  address_components: any[];
  formatted_address: string;
  geometry: {
    location: { lat: number; lng: number };
    viewport: any;
  };
  place_id: string;
  types: string[];
  name?: string;
  photos?: any[];
  rating?: number;
  user_ratings_total?: number;
  opening_hours?: any;
  website?: string;
  formatted_phone_number?: string;
  international_phone_number?: string;
  reviews?: any[];
  price_level?: number;
  vicinity?: string;
  adr_address?: string;
  utc_offset_minutes?: number;
  business_status?: string;
  icon?: string;
  icon_mask_base_uri?: string;
  icon_background_color?: string;
  nearby_places?: any[];
  demographic_data?: any;
  local_government_data?: any;
  weather_data?: any;
  accessibility_data?: any;
  public_records?: any;
  property_data?: any;
  zoning_info?: any;
  environmental_data?: any;
  historical_data?: any;
  transit_data?: any;
  satellite_imagery?: any;
}

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "AIzaSyC56tMVTlDcInBCHog0YqkuQ2cgH9JJuhU";

export default function LocationSearch({ onSelectLocation }: LocationSearchProps) {
  const [search, setSearch] = useState("");
  const [activeSuggestion, setActiveSuggestion] = useState<number | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isApiLoaded, setIsApiLoaded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [locationDetails, setLocationDetails] = useState<LocationDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchType, setSearchType] = useState<'address' | 'coordinates' | 'place'>('address');

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    if (search.trim() === "") {
      setSuggestions([]);
      setError(null);
      return;
    }

    // Detect if search is coordinates
    const coordRegex = /^-?\d+(\.\d+)?,-?\d+(\.\d+)?$/;
    if (coordRegex.test(search.trim())) {
      setSearchType('coordinates');
    } else {
      setSearchType('address');
    }

    setIsLoading(true);
    setError(null);
    
    timeoutId = setTimeout(async () => {
      try {
        let endpoint = '/api/location-search';
        
        if (searchType === 'coordinates') {
          endpoint = '/api/reverse-geocode';
        }
        
        const response = await fetch(`${endpoint}?query=${encodeURIComponent(search)}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to fetch suggestions");
        }
        
        const data = await response.json();
        console.log("API Response:", data);
        
        if (data.length === 0) {
          setError("No results found. Try a different search term or format.");
        }
        
        setSuggestions(data);
      } catch (error) {
        console.error("Error fetching suggestions:", error);
        setSuggestions([]);
        setError(error instanceof Error ? error.message : "An unknown error occurred");
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [search]);

  const fetchDetailedLocationInfo = async (placeId: string): Promise<LocationDetails> => {
    try {
      // First, fetch detailed place information using Places API
      const placeDetailsResponse = await fetch(`/api/place-details?place_id=${placeId}`);
      if (!placeDetailsResponse.ok) {
        throw new Error("Failed to fetch place details");
      }
      
      const placeDetails = await placeDetailsResponse.json();
      
      // Run all data fetching in parallel for better performance
      const [
        nearbyPlaces,
        demographicData,
        governmentData,
        weatherData,
        accessibilityData,
        publicRecords,
        propertyData,
        zoningInfo,
        environmentalData,
        historicalData,
        transitData,
        satelliteImagery
      ] = await Promise.all([
        fetchNearbyPlaces(placeDetails.geometry.location),
        fetchDemographicData(placeDetails.geometry.location),
        fetchGovernmentData(placeDetails.formatted_address),
        fetchWeatherData(placeDetails.geometry.location),
        fetchAccessibilityData(placeId),
        fetchPublicRecords(placeDetails.formatted_address),
        fetchPropertyData(placeDetails.formatted_address),
        fetchZoningInfo(placeDetails.geometry.location),
        fetchEnvironmentalData(placeDetails.geometry.location),
        fetchHistoricalData(placeDetails.formatted_address),
        fetchTransitData(placeDetails.geometry.location),
        fetchSatelliteImagery(placeDetails.geometry.location)
      ]);
      
      // Combine all data
      return {
        ...placeDetails,
        nearby_places: nearbyPlaces,
        demographic_data: demographicData,
        local_government_data: governmentData,
        weather_data: weatherData,
        accessibility_data: accessibilityData,
        public_records: publicRecords,
        property_data: propertyData,
        zoning_info: zoningInfo,
        environmental_data: environmentalData,
        historical_data: historicalData,
        transit_data: transitData,
        satellite_imagery: satelliteImagery
      };
    } catch (error) {
      console.error("Error fetching detailed location info:", error);
      return {} as LocationDetails;
    }
  };

  // Helper functions to fetch different types of data
  const fetchNearbyPlaces = async (location: { lat: number, lng: number }) => {
    try {
      const response = await fetch(`/api/nearby-places?lat=${location.lat}&lng=${location.lng}`);
      return await response.json();
    } catch (error) {
      console.error("Error fetching nearby places:", error);
      return null;
    }
  };

  const fetchDemographicData = async (location: { lat: number, lng: number }) => {
    try {
      const response = await fetch(`/api/demographic-data?lat=${location.lat}&lng=${location.lng}`);
      return await response.json();
    } catch (error) {
      console.error("Error fetching demographic data:", error);
      return null;
    }
  };

  const fetchGovernmentData = async (address: string) => {
    try {
      const response = await fetch(`/api/government-data?address=${encodeURIComponent(address)}`);
      return await response.json();
    } catch (error) {
      console.error("Error fetching government data:", error);
      return null;
    }
  };

  const fetchWeatherData = async (location: { lat: number, lng: number }) => {
    try {
      const response = await fetch(`/api/weather?lat=${location.lat}&lng=${location.lng}`);
      return await response.json();
    } catch (error) {
      console.error("Error fetching weather data:", error);
      return null;
    }
  };

  const fetchAccessibilityData = async (placeId: string) => {
    try {
      const response = await fetch(`/api/accessibility?place_id=${placeId}`);
      return await response.json();
    } catch (error) {
      console.error("Error fetching accessibility data:", error);
      return null;
    }
  };

  const fetchPublicRecords = async (address: string) => {
    try {
      const response = await fetch(`/api/public-records?address=${encodeURIComponent(address)}`);
      return await response.json();
    } catch (error) {
      console.error("Error fetching public records:", error);
      return null;
    }
  };

  const fetchPropertyData = async (address: string) => {
    try {
      const response = await fetch(`/api/property-data?address=${encodeURIComponent(address)}`);
      return await response.json();
    } catch (error) {
      console.error("Error fetching property data:", error);
      return null;
    }
  };

  const fetchZoningInfo = async (location: { lat: number, lng: number }) => {
    try {
      const response = await fetch(`/api/zoning-info?lat=${location.lat}&lng=${location.lng}`);
      return await response.json();
    } catch (error) {
      console.error("Error fetching zoning info:", error);
      return null;
    }
  };

  const fetchEnvironmentalData = async (location: { lat: number, lng: number }) => {
    try {
      const response = await fetch(`/api/environmental-data?lat=${location.lat}&lng=${location.lng}`);
      return await response.json();
    } catch (error) {
      console.error("Error fetching environmental data:", error);
      return null;
    }
  };

  const fetchHistoricalData = async (address: string) => {
    try {
      const response = await fetch(`/api/historical-data?address=${encodeURIComponent(address)}`);
      return await response.json();
    } catch (error) {
      console.error("Error fetching historical data:", error);
      return null;
    }
  };

  const fetchTransitData = async (location: { lat: number, lng: number }) => {
    try {
      const response = await fetch(`/api/transit-data?lat=${location.lat}&lng=${location.lng}`);
      return await response.json();
    } catch (error) {
      console.error("Error fetching transit data:", error);
      return null;
    }
  };

  const fetchSatelliteImagery = async (location: { lat: number, lng: number }) => {
    try {
      const response = await fetch(`/api/satellite-imagery?lat=${location.lat}&lng=${location.lng}`);
      return await response.json();
    } catch (error) {
      console.error("Error fetching satellite imagery:", error);
      return null;
    }
  };

  const handleSelect = async (suggestion: Suggestion) => {
    setSearch(suggestion.description);
    setSuggestions([]);
    setIsLoading(true);
    setIsProcessing(true);
    setError(null);

    try {
      // Fetch comprehensive location details
      const details = await fetchDetailedLocationInfo(suggestion.place_id);
      setLocationDetails(details);
      
      // Extract coordinates
      const location = {
        lat: details.geometry.location.lat,
        lng: details.geometry.location.lng,
        accuracy: 20,
        details: details
      };

      // Pass all information to the parent component
      onSelectLocation(location);

    } catch (error) {
      console.error("Error handling location:", error);
      setError("Failed to fetch comprehensive location details. Please try again.");
    } finally {
      setIsLoading(false);
      setIsProcessing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim() === "") return;

    if (suggestions.length > 0) {
      await handleSelect(suggestions[0]);
    } else {
      // Direct geocoding or reverse geocoding based on input
      setIsLoading(true);
      setError(null);
      
      try {
        let endpoint = '/api/geocode';
        let params = `address=${encodeURIComponent(search)}`;
        
        // If input matches coordinate pattern, use reverse geocoding
        const coordRegex = /^-?\d+(\.\d+)?,-?\d+(\.\d+)?$/;
        if (coordRegex.test(search.trim())) {
          endpoint = '/api/reverse-geocode';
          params = `latlng=${encodeURIComponent(search)}`;
        }
        
        const geocodeResponse = await fetch(`${endpoint}?${params}`);
        
        if (!geocodeResponse.ok) {
          const errorData = await geocodeResponse.json();
          throw new Error(errorData.message || "Failed to geocode address");
        }
        
        const geocodeResult = await geocodeResponse.json();
        
        if (geocodeResult.results && geocodeResult.results.length > 0) {
          const result = geocodeResult.results[0];
          await handleSelect({
            place_id: result.place_id,
            description: result.formatted_address || search
          });
        } else if (geocodeResult.place_id) {
          await handleSelect({
            place_id: geocodeResult.place_id,
            description: geocodeResult.formatted_address || search
          });
        } else {
          setError("Could not find location. Please try a different search term.");
        }
      } catch (error) {
        console.error("Error geocoding address:", error);
        setError(error instanceof Error ? error.message : "Failed to process location. Please try again.");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!suggestions.length) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveSuggestion((prev) => (prev === null ? 0 : Math.min(prev + 1, suggestions.length - 1)));
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveSuggestion((prev) => (prev === null ? suggestions.length - 1 : Math.max(prev - 1, 0)));
        break;
      case "Enter":
        if (activeSuggestion !== null) {
          e.preventDefault();
          handleSelect(suggestions[activeSuggestion]);
        }
        break;
      case "Escape":
        setSuggestions([]);
        setActiveSuggestion(null);
        break;
    }
  };

  useEffect(() => {
    const loadScript = async () => {
      try {
        await new Promise((resolve, reject) => {
          const script = document.createElement("script");
          script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
          script.async = true;
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });
        setIsApiLoaded(true);
      } catch (error) {
        console.error("Error loading Google Maps API:", error);
      }
    };

    if (!window.google) {
      loadScript();
    } else {
      setIsApiLoaded(true);
    }
  }, []);

  return (
    <motion.div
      className="relative w-full max-w-2xl mx-auto px-4 sm:px-0"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Comprehensive Location Search
        </h2>
        <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
          <Info className="w-3 h-3 mr-1" />
          <span>Search for any address, place, or coordinates</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="relative flex items-center">
        <div className="absolute left-3 sm:left-4 text-gray-400">
          {isLoading || isProcessing ? (
            <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
          ) : (
            <Search className="w-4 h-4 sm:w-5 sm:h-5" />
          )}
        </div>

        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter address, place name, or coordinates (lat,lng)..."
          className="w-full pl-9 sm:pl-12 pr-16 sm:pr-24 py-2 sm:py-3 rounded-lg 
            bg-white dark:bg-gray-800 
            border-2 border-gray-200 dark:border-gray-700
            focus:border-blue-500 dark:focus:border-blue-400
            shadow-sm focus:ring-2 focus:ring-blue-500/20 
            outline-none transition-all
            text-gray-900 dark:text-gray-100
            placeholder-gray-500 dark:placeholder-gray-400
            text-sm sm:text-base"
        />

        {search && (
          <button
            type="button"
            onClick={() => setSearch("")}
            className="absolute right-20 sm:right-24 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        <button
          type="submit"
          disabled={!search.trim() || isLoading || isProcessing}
          className="absolute right-2 px-3 sm:px-4 py-1 sm:py-1.5 rounded-md
            bg-gradient-to-r from-blue-500 to-blue-600
            hover:from-blue-600 hover:to-blue-700
            text-white text-xs sm:text-sm font-medium
            transition-all duration-200
            disabled:opacity-50 disabled:cursor-not-allowed
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
            dark:focus:ring-offset-gray-800"
        >
          Search
        </button>
      </form>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-2 p-2 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-300 text-sm rounded-md border border-red-200 dark:border-red-700"
        >
          <div className="flex items-start gap-2">
            <X className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        </motion.div>
      )}

      <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 flex flex-wrap gap-2">
        <span className="flex items-center">
          <MapPin className="w-3 h-3 mr-1 text-blue-500" />
          <span>Address</span>
        </span>
        <span className="flex items-center">
          <Globe className="w-3 h-3 mr-1 text-green-500" />
          <span>Coordinates</span>
        </span>
        <span className="flex items-center">
          <Building className="w-3 h-3 mr-1 text-purple-500" />
          <span>Properties</span>
        </span>
        <span className="flex items-center">
          <Map className="w-3 h-3 mr-1 text-orange-500" />
          <span>Public Data</span>
        </span>
      </div>

      <AnimatePresence>
        {suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="fixed sm:absolute inset-x-0 sm:left-0 sm:right-0 top-16 sm:top-auto mt-0 sm:mt-2 
              bg-white dark:bg-gray-800 
              border-t sm:border border-gray-200 dark:border-gray-700 
              sm:rounded-lg shadow-lg 
              max-h-[60vh] sm:max-h-64 
              overflow-auto z-50
              mx-0 sm:mx-4"
          >
            <ul>
              {suggestions.map((suggestion, index) => (
                <motion.li
                  key={suggestion.place_id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                  onClick={() => handleSelect(suggestion)}
                  className={`p-3 sm:p-4 flex items-start gap-3 cursor-pointer
                    ${
                      activeSuggestion === index
                        ? "bg-blue-50 dark:bg-blue-900/30"
                        : "hover:bg-gray-50 dark:hover:bg-gray-700/50"
                    }
                    transition-colors duration-150
                    border-b border-gray-100 dark:border-gray-700 last:border-0`}
                >
                  <MapPin className="text-blue-500 w-4 h-4 sm:w-5 sm:h-5 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-gray-100 truncate text-sm sm:text-base">
                      {suggestion.structured_formatting?.main_text || suggestion.description}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">
                      {suggestion.structured_formatting?.secondary_text || ""}
                    </p>
                    <div className="flex items-center mt-1 text-xs text-blue-500">
                      <Info className="w-3 h-3 mr-1" />
                      <span>Click for comprehensive details</span>
                    </div>
                  </div>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>

      {locationDetails && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-md"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            {locationDetails.name || locationDetails.formatted_address}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Comprehensive information about this location has been retrieved and passed to the parent component.
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-blue-500 mt-0.5" />
              <div>
                <p className="text-gray-700 dark:text-gray-200">Coordinates</p>
                <p className="text-gray-500 dark:text-gray-400">
                  {locationDetails.geometry?.location.lat.toFixed(6)}, {locationDetails.geometry?.location.lng.toFixed(6)}
                </p>
              </div>
            </div>
            
            {locationDetails.address_components && (
              <div className="flex items-start gap-2">
                <Map className="w-4 h-4 text-green-500 mt-0.5" />
                <div>
                  <p className="text-gray-700 dark:text-gray-200">Address Components</p>
                  <p className="text-gray-500 dark:text-gray-400">
                    {locationDetails.address_components.length} components retrieved
                  </p>
                </div>
              </div>
            )}
            
            {locationDetails.types && (
              <div className="flex items-start gap-2">
                <Building className="w-4 h-4 text-purple-500 mt-0.5" />
                <div>
                  <p className="text-gray-700 dark:text-gray-200">Location Type</p>
                  <p className="text-gray-500 dark:text-gray-400">
                    {locationDetails.types[0]?.replace('_', ' ')}
                  </p>
                </div>
              </div>
            )}

            {locationDetails.public_records && (
              <div className="flex items-start gap-2">
                <Globe className="w-4 h-4 text-orange-500 mt-0.5" />
                <div>
                  <p className="text-gray-700 dark:text-gray-200">Public Records</p>
                  <p className="text-gray-500 dark:text-gray-400">Retrieved successfully</p>
                </div>
              </div>
            )}
          </div>
          
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Available Data Categories</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {Object.entries({
                "Demographic Data": locationDetails.demographic_data,
                "Government Data": locationDetails.local_government_data,
                "Weather Information": locationDetails.weather_data,
                "Accessibility Info": locationDetails.accessibility_data,
                "Property Records": locationDetails.property_data,
                "Zoning Information": locationDetails.zoning_info,
                "Environmental Data": locationDetails.environmental_data,
                "Historical Records": locationDetails.historical_data,
                "Transit Information": locationDetails.transit_data,
                "Satellite Imagery": locationDetails.satellite_imagery,
                "Nearby Places": locationDetails.nearby_places,
              }).map(([label, data]) => (
                <div 
                  key={label}
                  className={`p-2 rounded border ${data ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : 'bg-gray-50 dark:bg-gray-700/30 border-gray-200 dark:border-gray-700'}`}
                >
                  <span className={`text-xs font-medium ${data ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}