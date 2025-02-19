"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Search, Loader2, X, MapPin, Info, Globe, Map, Building } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

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
  opening_hours?: any
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
  demographic_data?: any
  local_government_data?: any
  weather_data?: any
  accessibility_data?: any
  public_records?: any
  property_data?: any
  zoning_info?: any
  environmental_data?: any
  historical_data?: any
  transit_data?: any
  satellite_imagery?: any
}

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "YOUR_API_KEY_HERE"

export default function LocationSearch({ onSelectLocation }: LocationSearchProps) {
  const [search, setSearch] = useState("")
  const [activeSuggestion, setActiveSuggestion] = useState<number | null>(null)
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isApiLoaded, setIsApiLoaded] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [locationDetails, setLocationDetails] = useState<LocationDetails | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [searchType, setSearchType] = useState<"address" | "coordinates" | "place">("address")

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640)
    }

    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  useEffect(() => {
    let timeoutId: NodeJS.Timeout

    if (search.trim() === "") {
      setSuggestions([])
      setError(null)
      return
    }

    const coordRegex = /^-?\d+(\.\d+)?,-?\d+(\.\d+)?$/
    if (coordRegex.test(search.trim())) {
      setSearchType("coordinates")
    } else {
      setSearchType("address")
    }

    setIsLoading(true)
    setError(null)

    timeoutId = setTimeout(async () => {
      try {
        let endpoint = "/api/location-search"

        if (searchType === "coordinates") {
          endpoint = "/api/reverse-geocode"
        }

        const response = await fetch(`${endpoint}?query=${encodeURIComponent(search)}`)

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

  const fetchDetailedLocationInfo = async (placeId: string): Promise<LocationDetails> => {
    try {
      const placeDetailsResponse = await fetch(`/api/place-details?place_id=${placeId}`)
      if (!placeDetailsResponse.ok) {
        throw new Error("Failed to fetch place details")
      }

      const placeDetails = await placeDetailsResponse.json()

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
        fetchData(
          `/api/nearby-places?lat=${placeDetails.geometry.location.lat}&lng=${placeDetails.geometry.location.lng}`,
        ),
        fetchData(
          `/api/demographic-data?lat=${placeDetails.geometry.location.lat}&lng=${placeDetails.geometry.location.lng}`,
        ),
        fetchData(`/api/government-data?address=${encodeURIComponent(placeDetails.formatted_address)}`),
        fetchData(`/api/weather?lat=${placeDetails.geometry.location.lat}&lng=${placeDetails.geometry.location.lng}`),
        fetchData(`/api/accessibility?place_id=${placeId}`),
        fetchData(`/api/public-records?address=${encodeURIComponent(placeDetails.formatted_address)}`),
        fetchData(`/api/property-data?address=${encodeURIComponent(placeDetails.formatted_address)}`),
        fetchData(
          `/api/zoning-info?lat=${placeDetails.geometry.location.lat}&lng=${placeDetails.geometry.location.lng}`,
        ),
        fetchData(
          `/api/environmental-data?lat=${placeDetails.geometry.location.lat}&lng=${placeDetails.geometry.location.lng}`,
        ),
        fetchData(`/api/historical-data?address=${encodeURIComponent(placeDetails.formatted_address)}`),
        fetchData(
          `/api/transit-data?lat=${placeDetails.geometry.location.lat}&lng=${placeDetails.geometry.location.lng}`,
        ),
        fetchData(
          `/api/satellite-imagery?lat=${placeDetails.geometry.location.lat}&lng=${placeDetails.geometry.location.lng}`,
        ),
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (search.trim() === "") return

    if (suggestions.length > 0) {
      await handleSelect(suggestions[0])
    } else {
      setIsLoading(true)
      setError(null)

      try {
        let endpoint = "/api/geocode"
        let params = `address=${encodeURIComponent(search)}`

        const coordRegex = /^-?\d+(\.\d+)?,-?\d+(\.\d+)?$/
        if (coordRegex.test(search.trim())) {
          endpoint = "/api/reverse-geocode"
          params = `latlng=${encodeURIComponent(search)}`
        }

        const geocodeResponse = await fetch(`${endpoint}?${params}`)

        if (!geocodeResponse.ok) {
          throw new Error("Failed to geocode address")
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

  useEffect(() => {
    const loadScript = async () => {
      try {
        await new Promise((resolve, reject) => {
          const script = document.createElement("script")
          script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`
          script.async = true
          script.onload = resolve
          script.onerror = reject
          document.head.appendChild(script)
        })
        setIsApiLoaded(true)
      } catch (error) {
        console.error("Error loading Google Maps API:", error)
      }
    }

    if (!window.google) {
      loadScript()
    } else {
      setIsApiLoaded(true)
    }
  }, [])

  return (
    <motion.div
      className="relative w-full max-w-2xl mx-auto px-4 sm:px-0"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Comprehensive Location Search</h2>
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
        <Card className="mt-4">
          <CardHeader>
            <CardTitle>{locationDetails.name || locationDetails.formatted_address}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Location Details</h3>
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
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Public Information</h3>
                {locationDetails.types.includes("establishment") ? (
                  <div>
                    <h4 className="text-md font-semibold mt-2 mb-1">Business Information</h4>
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
                    {locationDetails.accessibility_data?.entrances && (
                      <div className="mt-2">
                        <p className="font-medium">Door Entrances:</p>
                        <ul className="list-disc list-inside ml-2">
                          {locationDetails.accessibility_data.entrances.map((entrance: string, index: number) => (
                            <li key={index} className="text-sm">
                              {entrance}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {locationDetails.business_status && (
                      <p className="mt-2">
                        <strong>Business Status:</strong> {locationDetails.business_status}
                      </p>
                    )}
                    {locationDetails.rating && (
                      <p>
                        <strong>Rating:</strong> {locationDetails.rating} ({locationDetails.user_ratings_total} reviews)
                      </p>
                    )}
                    {locationDetails.price_level && (
                      <p>
                        <strong>Price Level:</strong> {"$".repeat(locationDetails.price_level)}
                      </p>
                    )}
                  </div>
                ) : (
                  <div>
                    {locationDetails.public_records ? (
                      <>
                        <p>
                          <strong>Zoning:</strong> {locationDetails.zoning_info?.zoning_code || "N/A"}
                        </p>
                        <p>
                          <strong>Property Size:</strong> {locationDetails.property_data?.lot_size || "N/A"}
                        </p>
                        <p>
                          <strong>Year Built:</strong> {locationDetails.property_data?.year_built || "N/A"}
                        </p>
                        <p>
                          <strong>Last Sale Date:</strong> {locationDetails.property_data?.last_sale_date || "N/A"}
                        </p>
                        <p>
                          <strong>Last Sale Price:</strong> {locationDetails.property_data?.last_sale_price || "N/A"}
                        </p>
                      </>
                    ) : (
                      <p>No public records available for this location.</p>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-lg font-semibold mb-2">Additional Information</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  "nearby_places",
                  "demographic_data",
                  "local_government_data",
                  "weather_data",
                  "accessibility_data",
                ].map((dataType) => (
                  <div key={dataType} className="p-2 bg-gray-100 dark:bg-gray-700 rounded">
                    <p className="text-sm font-medium">
                      {dataType.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                    </p>
                    {locationDetails[dataType as keyof LocationDetails] ? (
                      <p className="text-xs text-green-600 dark:text-green-400">Available</p>
                    ) : (
                      <p className="text-xs text-red-600 dark:text-red-400">Not Available</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-4">
              <Button
                as={Link}
                href={`https://www.google.com/maps/search/?api=1&query=${locationDetails.geometry.location.lat},${locationDetails.geometry.location.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center"
              >
                <Map className="w-4 h-4 mr-2" />
                View in Map
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </motion.div>
  )
}

