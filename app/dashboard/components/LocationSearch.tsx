"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Search, Loader2, X, MapPin, Info, Cloud, Droplets, Thermometer, Wind, Users } from "lucide-react"
import * as Dialog from "@radix-ui/react-dialog"
import * as Tabs from "@radix-ui/react-tabs"
import * as ScrollArea from "@radix-ui/react-scroll-area"
import { motion, AnimatePresence } from "framer-motion"

// Types
interface LocationSearchProps {
  onSelectLocation: (location: {
    lat: number
    lng: number
    accuracy: number
    details?: LocationDetails
  }) => void
}

interface Suggestion {
  place_id: string
  description: string
  structured_formatting?: {
    main_text?: string
    secondary_text?: string
  }
}

interface LocationDetails {
  address_components: any[]
  formatted_address: string
  geometry: {
    location: { lat: number; lng: number }
    viewport: any
  }
  place_id: string
  types: string[]
  name?: string
  photos?: any[]
  rating?: number
  user_ratings_total?: number
  opening_hours?: { weekday_text: string[] }
  website?: string
  formatted_phone_number?: string
  international_phone_number?: string
  reviews?: any[]
  price_level?: number
  vicinity?: string
  adr_address?: string
  utc_offset_minutes?: number
  business_status?: string
  icon?: string
  icon_mask_base_uri?: string
  icon_background_color?: string
  nearby_places?: any[]
  demographic_data?: DemographicData
  local_government_data?: any
  weather_data?: WeatherData
  accessibility_data?: any
  public_records?: any
  property_data?: PropertyData
  zoning_info?: ZoningInfo
  environmental_data?: any
  historical_data?: any
  transit_data?: any
  satellite_imagery?: any
}

interface WeatherData {
  temperature?: number
  feels_like?: number
  humidity?: number
  pressure?: number
  weather_condition?: string
  wind_speed?: number
  wind_direction?: number
  cloudiness?: number
  visibility?: number
  location?: {
    name?: string
    country?: string
    sunrise?: string
    sunset?: string
  }
}

interface DemographicData {
  population?: number
  median_age?: number
  households?: number
  income?: {
    median?: number
    average?: number
  }
  education?: {
    high_school?: number
    bachelors?: number
    graduate?: number
  }
  employment?: {
    employed?: number
    unemployed?: number
  }
}

interface PropertyData {
  lot_size?: number
  year_built?: number
  last_sale_date?: string
  last_sale_price?: number
}

interface ZoningInfo {
  zoning_code?: string
}

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "YOUR_API_KEY_HERE"

// Component for Weather Card
const WeatherCard = ({ data }: { data: WeatherData }) => {
  if (!data) return null

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-900 dark:text-gray-100">
          <Cloud className="w-5 h-5 text-blue-500" />
          Weather Conditions
        </h3>
      </div>
      <div className="p-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Thermometer className="w-5 h-5 text-red-500 mt-1" />
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Temperature</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {data.temperature ? `${data.temperature.toFixed(1)}°C` : "N/A"}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Feels like: {data.feels_like ? `${data.feels_like.toFixed(1)}°C` : "N/A"}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Droplets className="w-5 h-5 text-blue-500 mt-1" />
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Humidity</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {data.humidity ? `${data.humidity}%` : "N/A"}
                </p>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Wind className="w-5 h-5 text-gray-500 mt-1" />
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Wind</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {data.wind_speed ? `${data.wind_speed.toFixed(1)} m/s` : "N/A"}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Direction: {data.wind_direction ? `${data.wind_direction}°` : "N/A"}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Cloud className="w-5 h-5 text-gray-500 mt-1" />
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Conditions</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {data.weather_condition || "N/A"}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Cloudiness: {data.cloudiness ? `${data.cloudiness}%` : "N/A"}
                </p>
              </div>
            </div>
          </div>
        </div>
        {data.location && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Location: {data.location.name}, {data.location.country}
            </p>
            <div className="flex gap-4 mt-1 text-sm text-gray-500 dark:text-gray-400">
              <p>Sunrise: {data.location.sunrise ? new Date(data.location.sunrise).toLocaleTimeString() : "N/A"}</p>
              <p>Sunset: {data.location.sunset ? new Date(data.location.sunset).toLocaleTimeString() : "N/A"}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Component for Demographics Card
const DemographicsCard = ({ data }: { data: DemographicData }) => {
  const formatNumber = (num?: number) => {
    if (num === undefined) return "N/A"
    return new Intl.NumberFormat("en-US").format(num)
  }

  const formatPercentage = (num?: number) => {
    if (num === undefined) return "N/A"
    return `${num.toFixed(1)}%`
  }

  const formatCurrency = (num?: number) => {
    if (num === undefined) return "N/A"
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(num)
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-900 dark:text-gray-100">
          <Users className="w-5 h-5 text-purple-500" />
          Demographics
        </h3>
      </div>
      <div className="p-4">
        {!data || Object.keys(data).length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400">No demographic data available for this location</p>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Population</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {formatNumber(data.population)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Median Age</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {data.median_age ? `${data.median_age} years` : "N/A"}
                </p>
              </div>
            </div>

            {data.income && (
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Income</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Median Income</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {formatCurrency(data.income.median)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Average Income</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {formatCurrency(data.income.average)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {data.education && (
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Education</p>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">High School</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {formatPercentage(data.education.high_school)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Bachelor's</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {formatPercentage(data.education.bachelors)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Graduate</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {formatPercentage(data.education.graduate)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {data.employment && (
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Employment</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Employed</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {formatPercentage(data.employment.employed)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Unemployed</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {formatPercentage(data.employment.unemployed)}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// LocationSearch main component
export default function LocationSearch({ onSelectLocation }: LocationSearchProps) {
  // State management
  const [search, setSearch] = useState("")
  const [activeSuggestion, setActiveSuggestion] = useState<number | null>(null)
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isApiLoaded, setIsApiLoaded] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [locationDetails, setLocationDetails] = useState<LocationDetails | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [searchType, setSearchType] = useState<"address" | "coordinates" | "place" | "company">("address")

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640)
    }

    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  // Handle search input changes
  useEffect(() => {
    let timeoutId: NodeJS.Timeout

    if (search.trim() === "") {
      setSuggestions([])
      setError(null)
      return
    }

    // Check if search is coordinates
    const coordRegex = /^-?\d+(\.\d+)?,-?\d+(\.\d+)?$/
    if (coordRegex.test(search.trim())) {
      setSearchType("coordinates")
    } else {
      // If not coordinates, we'll determine the type in the API
      setSearchType("place")
    }

    setIsLoading(true)
    setError(null)

    // Debounce API calls
    timeoutId = setTimeout(async () => {
      try {
        const endpoint = searchType === "coordinates" ? "/api/reverse-geocode" : "/api/location-search"
        const response = await fetch(`${endpoint}?query=${encodeURIComponent(search)}&type=${searchType}`)

        if (!response.ok) {
          throw new Error("Failed to fetch suggestions")
        }

        const data = await response.json()

        if (data.length === 0) {
          setError("No results found. Try a different search term or format.")
        }

        setSuggestions(data)
      } catch (error) {
        console.error("Error fetching suggestions:", error)
        setSuggestions([])
        setError("An error occurred while fetching suggestions. Please try again.")
      } finally {
        setIsLoading(false)
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [search, searchType])

  // Fetch detailed location information
  const fetchDetailedLocationInfo = async (placeId: string): Promise<LocationDetails> => {
    try {
      const placeDetailsResponse = await fetch(`/api/place-details?place_id=${placeId}`)
      if (!placeDetailsResponse.ok) {
        throw new Error("Failed to fetch place details")
      }

      const placeDetails = await placeDetailsResponse.json()
      const { geometry, formatted_address } = placeDetails
      const { lat, lng } = geometry.location

      // Fetch additional data in parallel
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
        satelliteImagery,
      ] = await Promise.all([
        fetchData(`/api/nearby-places?lat=${lat}&lng=${lng}`),
        fetchData(`/api/demographics?lat=${lat}&lng=${lng}`),
        fetchData(`/api/government-data?address=${encodeURIComponent(formatted_address)}`),
        fetchData(`/api/weather?lat=${lat}&lng=${lng}`),
        fetchData(`/api/accessibility?place_id=${placeId}`),
        fetchData(`/api/public-records?address=${encodeURIComponent(formatted_address)}`),
        fetchData(`/api/property-data?address=${encodeURIComponent(formatted_address)}`),
        fetchData(`/api/zoning-info?lat=${lat}&lng=${lng}`),
        fetchData(`/api/environmental-data?lat=${lat}&lng=${lng}`),
        fetchData(`/api/historical-data?address=${encodeURIComponent(formatted_address)}`),
        fetchData(`/api/transit-data?lat=${lat}&lng=${lng}`),
        fetchData(`/api/satellite-imagery?lat=${lat}&lng=${lng}`),
      ])

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
        satellite_imagery: satelliteImagery,
      }
    } catch (error) {
      console.error("Error fetching detailed location info:", error)
      throw error
    }
  }

  // Helper function to fetch data with error handling
  const fetchData = async (url: string) => {
    try {
      const response = await fetch(url)
      if (!response.ok) {
        if (response.status === 404) {
          return null
        }
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      return await response.json()
    } catch (error) {
      console.error(`Error fetching data from ${url}:`, error)
      return null
    }
  }

  // Handle selection of a location suggestion
  const handleSelect = async (suggestion: Suggestion) => {
    setSearch(suggestion.description)
    setSuggestions([])
    setIsLoading(true)
    setIsProcessing(true)
    setError(null)

    try {
      const details = await fetchDetailedLocationInfo(suggestion.place_id)
      setLocationDetails(details)

      const location = {
        lat: details.geometry.location.lat,
        lng: details.geometry.location.lng,
        accuracy: 20,
        details: details,
      }

      onSelectLocation(location)
    } catch (error) {
      console.error("Error handling location:", error)
      setError("Failed to fetch comprehensive location details. Please try again.")
    } finally {
      setIsLoading(false)
      setIsProcessing(false)
    }
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (search.trim() === "") return

    if (suggestions.length > 0) {
      await handleSelect(suggestions[0])
    } else {
      setIsLoading(true)
      setError(null)

      try {
        const coordRegex = /^-?\d+(\.\d+)?,-?\d+(\.\d+)?$/
        const isCoordinates = coordRegex.test(search.trim())

        const endpoint = isCoordinates ? "/api/reverse-geocode" : "/api/geocode"
        const params = isCoordinates
          ? `latlng=${encodeURIComponent(search)}`
          : `address=${encodeURIComponent(search)}&type=${searchType}`

        const geocodeResponse = await fetch(`${endpoint}?${params}`)

        if (!geocodeResponse.ok) {
          throw new Error(`Failed to ${isCoordinates ? "reverse geocode" : "geocode"} address`)
        }

        const geocodeResult = await geocodeResponse.json()

        if (geocodeResult.results && geocodeResult.results.length > 0) {
          const result = geocodeResult.results[0]
          await handleSelect({
            place_id: result.place_id,
            description: result.formatted_address || search,
          })
        } else if (geocodeResult.place_id) {
          await handleSelect({
            place_id: geocodeResult.place_id,
            description: geocodeResult.formatted_address || search,
          })
        } else {
          setError("Could not find location. Please try a different search term.")
        }
      } catch (error) {
        console.error("Error geocoding address:", error)
        setError("Failed to process location. Please try again.")
      } finally {
        setIsLoading(false)
      }
    }
  }

  // Handle keyboard navigation for suggestions
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!suggestions.length) return

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault()
        setActiveSuggestion((prev) => (prev === null ? 0 : Math.min(prev + 1, suggestions.length - 1)))
        break
      case "ArrowUp":
        e.preventDefault()
        setActiveSuggestion((prev) => (prev === null ? suggestions.length - 1 : Math.max(prev - 1, 0)))
        break
      case "Enter":
        if (activeSuggestion !== null) {
          e.preventDefault()
          handleSelect(suggestions[activeSuggestion])
        }
        break
      case "Escape":
        setSuggestions([])
        setActiveSuggestion(null)
        break
    }
  }

  // Load Google Maps API
  useEffect(() => {
    const loadScript = async () => {
      // Check if Google Maps API is already loaded
      if (window.google) {
        setIsApiLoaded(true)
        return
      }

      try {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement("script")
          script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`
          script.async = true
          script.onload = () => resolve()
          script.onerror = () => reject(new Error("Failed to load Google Maps API"))
          document.head.appendChild(script)
        })
        setIsApiLoaded(true)
      } catch (error) {
        console.error("Error loading Google Maps API:", error)
        setError("Failed to load mapping service. Please try again later.")
      }
    }

    loadScript()
  }, [])

  return (
    <div className="w-full max-w-4xl mx-auto bg-white dark:bg-gray-900 shadow-lg rounded-lg overflow-hidden">
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">Advanced Location Intelligence</h2>

        {/* Search Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Enter address, place name, company, or coordinates (lat,lng)..."
                className="w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                aria-label="Location search"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                  aria-label="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <button
              type="submit"
              disabled={!search.trim() || isLoading || isProcessing}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-offset-gray-900"
              aria-label="Search location"
            >
              {isLoading || isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : "Search"}
            </button>
          </div>
        </form>

        {/* Search category tags */}
        <div className="mt-4 flex flex-wrap gap-2">
          {["Address", "Company", "Coordinates", "Properties", "Public Data"].map((item) => (
            <span
              key={item}
              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
            >
              {item}
            </span>
          ))}
        </div>

        {/* Error display */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-3 bg-red-50 dark:bg-red-900 text-red-600 dark:text-red-200 text-sm rounded-md border border-red-200 dark:border-red-800"
          >
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <p>{error}</p>
            </div>
          </motion.div>
        )}

        {/* Suggestions dropdown */}
        <AnimatePresence>
          {suggestions.length > 0 && (
            <Dialog.Root open={suggestions.length > 0} onOpenChange={() => setSuggestions([])}>
              <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/50 dark:bg-black/70" />
                <Dialog.Content className="fixed top-[20%] left-1/2 -translate-x-1/2 bg-white dark:bg-gray-800 rounded-md shadow-lg p-4 max-w-md w-full max-h-[60vh] overflow-hidden">
                  <ScrollArea.Root className="h-full overflow-hidden">
                    <ScrollArea.Viewport className="h-full w-full">
                      {suggestions.map((suggestion, index) => (
                        <motion.div
                          key={suggestion.place_id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.2, delay: index * 0.05 }}
                          onClick={() => handleSelect(suggestion)}
                          className={`p-3 flex items-start gap-3 cursor-pointer ${
                            activeSuggestion === index
                              ? "bg-blue-50 dark:bg-blue-900"
                              : "hover:bg-gray-50 dark:hover:bg-gray-700"
                          } transition-colors duration-150 border-b border-gray-100 dark:border-gray-700 last:border-0`}
                        >
                          <MapPin className="text-blue-500 w-5 h-5 mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                              {suggestion.structured_formatting?.main_text || suggestion.description}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                              {suggestion.structured_formatting?.secondary_text || ""}
                            </p>
                          </div>
                        </motion.div>
                      ))}
                    </ScrollArea.Viewport>
                    <ScrollArea.Scrollbar
                      className="flex select-none touch-none p-0.5 bg-gray-100 dark:bg-gray-700 transition-colors duration-[160ms] ease-out hover:bg-gray-200 dark:hover:bg-gray-600 data-[orientation=vertical]:w-2.5 data-[orientation=horizontal]:flex-col data-[orientation=horizontal]:h-2.5"
                      orientation="vertical"
                    >
                      <ScrollArea.Thumb className="flex-1 bg-gray-300 dark:bg-gray-500 rounded-[10px] relative before:content-[''] before:absolute before:top-1/2 before:left-1/2 before:-translate-x-1/2 before:-translate-y-1/2 before:w-full before:h-full before:min-w-[44px] before:min-h-[44px]" />
                    </ScrollArea.Scrollbar>
                  </ScrollArea.Root>
                </Dialog.Content>
              </Dialog.Portal>
            </Dialog.Root>
          )}
        </AnimatePresence>

        {locationDetails && (
          <div className="mt-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {locationDetails.name || locationDetails.formatted_address}
              </h3>
            </div>
            <Tabs.Root defaultValue="details" className="w-full">
              <Tabs.List className="flex border-b border-gray-200 dark:border-gray-700">
                {["Details", "Public Info", "Additional", "Map"].map((tab) => (
                  <Tabs.Trigger
                    key={tab}
                    value={tab.toLowerCase()}
                    className="px-4 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:text-gray-700 dark:focus:text-gray-200 focus:bg-gray-100 dark:focus:bg-gray-700"
                  >
                    {tab}
                  </Tabs.Trigger>
                ))}
              </Tabs.List>
              <Tabs.Content value="details" className="p-4">
                <div className="space-y-2 text-gray-700 dark:text-gray-300">
                  <p>
                    <strong>Address:</strong> {locationDetails.formatted_address}
                  </p>
                  <p>
                    <strong>Coordinates:</strong> {locationDetails.geometry.location.lat},{" "}
                    {locationDetails.geometry.location.lng}
                  </p>
                  <p>
                    <strong>Type:</strong> {locationDetails.types.join(", ")}
                  </p>
                  {locationDetails.website && (
                    <p>
                      <strong>Website:</strong>{" "}
                      <a
                        href={locationDetails.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:underline"
                      >
                        {locationDetails.website}
                      </a>
                    </p>
                  )}
                  {locationDetails.formatted_phone_number && (
                    <p>
                      <strong>Phone:</strong> {locationDetails.formatted_phone_number}
                    </p>
                  )}
                  {locationDetails.types.includes("establishment") && (
                    <div className="mt-4">
                      <h4 className="font-semibold mb-2">Company Information</h4>
                      {locationDetails.name && (
                        <p>
                          <strong>Company Name:</strong> {locationDetails.name}
                        </p>
                      )}
                      {locationDetails.business_status && (
                        <p>
                          <strong>Business Status:</strong> {locationDetails.business_status}
                        </p>
                      )}
                      {locationDetails.rating && (
                        <p>
                          <strong>Rating:</strong> {locationDetails.rating} ({locationDetails.user_ratings_total}{" "}
                          reviews)
                        </p>
                      )}
                      {locationDetails.price_level && (
                        <p>
                          <strong>Price Level:</strong> {"$".repeat(locationDetails.price_level)}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </Tabs.Content>
              <Tabs.Content value="public" className="p-4">
                {locationDetails.types.includes("establishment") ? (
                  <div className="space-y-4 text-gray-700 dark:text-gray-300">
                    <div>
                      <h4 className="font-semibold mb-2">Business Information</h4>
                      {locationDetails.opening_hours && (
                        <div>
                          <p className="font-medium">Working Hours:</p>
                          <ul className="list-disc list-inside ml-2">
                            {locationDetails.opening_hours.weekday_text.map((day: string, index: number) => (
                              <li key={index} className="text-sm">
                                {day}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {locationDetails.business_status && (
                        <p>
                          <strong>Business Status:</strong> {locationDetails.business_status}
                        </p>
                      )}
                      {locationDetails.rating && (
                        <p>
                          <strong>Rating:</strong> {locationDetails.rating} ({locationDetails.user_ratings_total}{" "}
                          reviews)
                        </p>
                      )}
                      {locationDetails.price_level && (
                        <p>
                          <strong>Price Level:</strong> {"$".repeat(locationDetails.price_level)}
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 text-gray-700 dark:text-gray-300">
                    {locationDetails.public_records ? (
                      <>
                        {locationDetails.zoning_info?.zoning_code && (
                          <p>
                            <strong>Zoning:</strong> {locationDetails.zoning_info.zoning_code}
                          </p>
                        )}
                        {locationDetails.property_data?.lot_size && (
                          <p>
                            <strong>Property Size:</strong> {locationDetails.property_data.lot_size} sq ft
                          </p>
                        )}
                        {locationDetails.property_data?.year_built && (
                          <p>
                            <strong>Year Built:</strong> {locationDetails.property_data.year_built}
                          </p>
                        )}
                        {locationDetails.property_data?.last_sale_date && (
                          <p>
                            <strong>Last Sale Date:</strong>{" "}
                            {new Date(locationDetails.property_data.last_sale_date).toLocaleDateString()}
                          </p>
                        )}
                        {locationDetails.property_data?.last_sale_price && (
                          <p>
                            <strong>Last Sale Price:</strong> $
                            {locationDetails.property_data.last_sale_price.toLocaleString()}
                          </p>
                        )}
                      </>
                    ) : (
                      <p>No public records available for this location.</p>
                    )}
                  </div>
                )}
              </Tabs.Content>
              <Tabs.Content value="additional" className="p-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <DemographicsCard data={locationDetails.demographic_data} />
                  <WeatherCard data={locationDetails.weather_data} />
                </div>
              </Tabs.Content>
              <Tabs.Content value="map" className="p-4">
                <div className="aspect-video relative">
                  <iframe
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    loading="lazy"
                    allowFullScreen
                    referrerPolicy="no-referrer-when-downgrade"
                    src={`https://www.google.com/maps/embed/v1/place?key=${GOOGLE_MAPS_API_KEY}&q=${locationDetails.geometry.location.lat},${locationDetails.geometry.location.lng}`}
                  ></iframe>
                </div>
              </Tabs.Content>
            </Tabs.Root>
          </div>
        )}
      </div>
    </div>
  )
}

