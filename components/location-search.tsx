"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Search, MapPin, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { useRouter } from "next/navigation"

interface PlacePrediction {
  place_id: string
  description: string
  structured_formatting: {
    main_text: string
    secondary_text: string
  }
  types: string[]
}

interface LocationSearchProps {
  onLocationSelect?: (location: {
    name: string
    address: string
    placeId: string
    location: { lat: number; lng: number }
  }) => void
  placeholder?: string
  className?: string
}

export function LocationSearch({
  onLocationSelect,
  placeholder = "Search locations, addresses, businesses...",
  className = "",
}: LocationSearchProps) {
  const [query, setQuery] = useState("")
  const [predictions, setPredictions] = useState<PlacePrediction[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isGettingLocation, setIsGettingLocation] = useState(false)
  const autocompleteService = useRef<google.maps.places.AutocompleteService | null>(null)
  const placesService = useRef<google.maps.places.PlacesService | null>(null)
  const searchRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  // Initialize Google Maps services
  useEffect(() => {
    // Check if the Google Maps API is loaded
    if (typeof window !== "undefined" && window.google && window.google.maps) {
      autocompleteService.current = new google.maps.places.AutocompleteService()

      // Create a dummy div for PlacesService (it requires a DOM element)
      const placesDiv = document.createElement("div")
      placesService.current = new google.maps.places.PlacesService(placesDiv)
    } else {
      // Load the Google Maps API if it's not already loaded
      const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

      if (!googleMapsApiKey) {
        console.error("Google Maps API key is not configured")
        return
      }

      if (!document.getElementById("google-maps-script")) {
        const script = document.createElement("script")
        script.id = "google-maps-script"
        script.src = `https://maps.googleapis.com/maps/api/js?key=${googleMapsApiKey}&libraries=places`
        script.async = true
        script.defer = true
        script.onload = () => {
          if (window.google && window.google.maps) {
            autocompleteService.current = new window.google.maps.places.AutocompleteService()
            const placesDiv = document.createElement("div")
            placesService.current = new window.google.maps.places.PlacesService(placesDiv)
          }
        }
        document.head.appendChild(script)
      }
    }

    // Handle clicks outside the search component to close suggestions
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  // Handle search input changes
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setQuery(value)

    if (value.length > 1 && autocompleteService.current) {
      setIsLoading(true)
      setShowSuggestions(true)

      autocompleteService.current.getPlacePredictions(
        {
          input: value,
          types: ["establishment", "geocode", "address"], // Include businesses, addresses, and geographic locations
          componentRestrictions: { country: "us" }, // Optional: restrict to a specific country
        },
        (predictions, status) => {
          setIsLoading(false)
          if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
            setPredictions(predictions)
          } else {
            setPredictions([])
          }
        },
      )
    } else {
      setPredictions([])
      setShowSuggestions(false)
    }
  }

  // Handle selection of a place from suggestions
  const handlePlaceSelect = (prediction: PlacePrediction) => {
    setQuery(prediction.structured_formatting.main_text)
    setShowSuggestions(false)

    if (placesService.current) {
      placesService.current.getDetails(
        {
          placeId: prediction.place_id,
          fields: ["name", "formatted_address", "geometry", "place_id"],
        },
        (place, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && place && place.geometry?.location) {
            const location = {
              name: place.name || prediction.structured_formatting.main_text,
              address: place.formatted_address || prediction.description,
              placeId: place.place_id || prediction.place_id,
              location: {
                lat: place.geometry.location.lat(),
                lng: place.geometry.location.lng(),
              },
            }

            if (onLocationSelect) {
              onLocationSelect(location)
            } else {
              // Navigate to location details page if no callback is provided
              router.push(`/locations/${place.place_id}`)
            }
          }
        },
      )
    }
  }

  // Handle "Near Me" button click
  const handleNearMeClick = () => {
    setIsGettingLocation(true)

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude
          const lng = position.coords.longitude

          // Use reverse geocoding to get the address
          const geocoder = new google.maps.Geocoder()
          geocoder.geocode({ location: { lat, lng } }, (results, status) => {
            setIsGettingLocation(false)

            if (status === "OK" && results && results[0]) {
              const place = results[0]
              setQuery(place.formatted_address)

              if (onLocationSelect) {
                onLocationSelect({
                  name: place.formatted_address,
                  address: place.formatted_address,
                  placeId: place.place_id,
                  location: { lat, lng },
                })
              } else {
                // Navigate to location details page
                router.push(`/locations/${place.place_id}`)
              }
            } else {
              console.error("Geocoder failed due to: " + status)
            }
          })
        },
        (error) => {
          setIsGettingLocation(false)
          console.error("Error getting current location:", error)
          alert("Unable to get your current location. Please check your browser permissions.")
        },
      )
    } else {
      setIsGettingLocation(false)
      alert("Geolocation is not supported by this browser.")
    }
  }

  // Get icon for place type
  const getPlaceIcon = (types: string[]) => {
    if (types.includes("establishment")) {
      return "🏢"
    } else if (types.includes("street_address") || types.includes("route")) {
      return "🏠"
    } else if (types.includes("locality") || types.includes("administrative_area_level_1")) {
      return "🏙️"
    } else {
      return "📍"
    }
  }

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={placeholder}
          value={query}
          onChange={handleSearchChange}
          onFocus={() => query.length > 1 && setPredictions.length > 0 && setShowSuggestions(true)}
          className="pl-8 h-9 bg-muted/50 text-sm w-full pr-20"
        />
        <Button
          size="sm"
          className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7"
          variant="ghost"
          onClick={handleNearMeClick}
          disabled={isGettingLocation}
        >
          {isGettingLocation ? (
            <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
          ) : (
            <MapPin className="h-3.5 w-3.5 mr-1" />
          )}
          Near Me
        </Button>
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && (
        <Card className="absolute z-10 w-full mt-1 max-h-60 overflow-auto shadow-lg">
          {isLoading ? (
            <div className="p-2 text-center text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin mx-auto mb-1" />
              Searching...
            </div>
          ) : predictions.length > 0 ? (
            <ul className="py-1">
              {predictions.map((prediction) => (
                <li
                  key={prediction.place_id}
                  className="px-3 py-2 hover:bg-muted cursor-pointer text-sm"
                  onClick={() => handlePlaceSelect(prediction)}
                >
                  <div className="flex items-start">
                    <span className="mr-2">{getPlaceIcon(prediction.types)}</span>
                    <div>
                      <div className="font-medium">{prediction.structured_formatting.main_text}</div>
                      <div className="text-xs text-muted-foreground">
                        {prediction.structured_formatting.secondary_text}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : query.length > 1 ? (
            <div className="p-2 text-center text-sm text-muted-foreground">No results found</div>
          ) : null}
        </Card>
      )}
    </div>
  )
}

