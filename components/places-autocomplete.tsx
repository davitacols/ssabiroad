"use client"

import type React from "react"
import { useState, useEffect, useCallback, useRef } from "react"
import { Input } from "@/components/ui/input"
import * as LucideIcons from "lucide-react"
import { cn } from "@/lib/utils"

// Define types for the places autocomplete component
interface PlacesAutocompleteProps {
  placeholder: string
  className?: string
  onPlaceSelect?: (place: any) => void
  renderInput?: (props: { value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void }) => React.ReactNode
}

// Define global type for Google Maps
declare global {
  interface Window {
    google: any
  }
}

export const PlacesAutocomplete = ({ placeholder, className, onPlaceSelect, renderInput }: PlacesAutocompleteProps) => {
  const [inputValue, setInputValue] = useState("")
  const autoCompleteRef = useRef<HTMLInputElement>(null)
  const [predictions, setPredictions] = useState<any[]>([])
  const [showPredictions, setShowPredictions] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [autocompleteService, setAutocompleteService] = useState<any>(null)
  const [placesService, setPlacesService] = useState<any>(null)

  // Enhanced mock data with more interesting locations
  const mockPredictions = [
    { place_id: "mock1", description: "Kyoto Imperial Palace, Kyoto, Japan" },
    { place_id: "mock2", description: "Santorini, Greece" },
    { place_id: "mock3", description: "Machu Picchu, Peru" },
    { place_id: "mock4", description: "Louvre Museum, Paris, France" },
    { place_id: "mock5", description: "Grand Canyon National Park, Arizona, USA" },
    { place_id: "mock6", description: "Taj Mahal, Agra, India" },
    { place_id: "mock7", description: "Great Barrier Reef, Australia" },
  ]

  // Filter mock predictions based on input
  const getFilteredMockPredictions = useCallback(
    (input: string) => {
      if (!input) return []
      return mockPredictions.filter((p) => p.description.toLowerCase().includes(input.toLowerCase()))
    },
    [mockPredictions],
  )

  // Load Google Maps API and initialize services
  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
      console.warn("Google Maps API key is missing. Using fallback search functionality.")
      setApiError("API key missing")
      return
    }

    setIsLoading(true)

    // Check if script already exists
    const existingScript = document.getElementById("google-maps-script")
    if (existingScript) {
      if (window.google && window.google.maps && window.google.maps.places) {
        initializeServices()
        setIsLoading(false)
      }
      return
    }

    // Load Google Maps JavaScript API script with error handling
    const googleMapScript = document.createElement("script")
    googleMapScript.id = "google-maps-script"
    googleMapScript.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`
    googleMapScript.async = true
    googleMapScript.defer = true

    // Handle script load error
    googleMapScript.onerror = () => {
      console.error("Failed to load Google Maps API script")
      setApiError("Failed to load API")
      setIsLoading(false)
    }

    googleMapScript.onload = () => {
      initializeServices()
      setIsLoading(false)
    }

    window.document.body.appendChild(googleMapScript)

    return () => {
      // Don't remove the script on component unmount as other components might be using it
    }
  }, [])

  // Initialize services
  const initializeServices = () => {
    if (window.google && window.google.maps && window.google.maps.places) {
      try {
        setAutocompleteService(new window.google.maps.places.AutocompleteService())
        setPlacesService(new window.google.maps.places.PlacesService(document.createElement("div")))
        setApiError(null)
      } catch (error) {
        console.error("Error initializing Google Places Autocomplete:", error)
        setApiError("initialization_error")
      }
    } else {
      console.error("Google Maps API not correctly loaded")
      setApiError("api_not_loaded")
    }
  }

  // Handle input changes and fetch predictions
  useEffect(() => {
    const handleInputEvent = (e: Event) => {
      const target = e.target as HTMLInputElement
      const value = target.value
      setInputValue(value)

      if (value.length > 0) {
        if (autocompleteService) {
          autocompleteService.getPlacePredictions({ input: value }, (predictions: any, status: any) => {
            if (window.google && status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
              setPredictions(predictions)
              setShowPredictions(true)
              setApiError(null)
            } else if (window.google && status === window.google.maps.places.PlacesServiceStatus.BILLING_NOT_ENABLED) {
              console.error("Google Maps API billing not enabled")
              setApiError("billing_not_enabled")
              // Use fallback for predictions
              setPredictions(getFilteredMockPredictions(value))
              setShowPredictions(true)
            } else if (window.google && status === window.google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
              setPredictions([])
              setShowPredictions(false)
            } else {
              setPredictions(getFilteredMockPredictions(value))
              setShowPredictions(true)
            }
          })
        } else {
          // Use mock predictions if service is not available
          setPredictions(getFilteredMockPredictions(value))
          setShowPredictions(value.length > 0 && getFilteredMockPredictions(value).length > 0)
        }
      } else {
        setPredictions([])
        setShowPredictions(false)
      }
    }

    if (autoCompleteRef.current) {
      autoCompleteRef.current.addEventListener("input", handleInputEvent)
    }

    return () => {
      if (autoCompleteRef.current) {
        autoCompleteRef.current.removeEventListener("input", handleInputEvent)
      }
    }
  }, [autocompleteService, getFilteredMockPredictions])

  // Handle input changes for fallback mode
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setInputValue(value)

    if ((apiError || !autocompleteService) && value.length > 0) {
      // Use fallback predictions when API has errors
      setPredictions(getFilteredMockPredictions(value))
      setShowPredictions(true)
    } else if (value.length === 0) {
      setPredictions([])
      setShowPredictions(false)
    }
  }

  // Handle prediction click and get place details
  const handlePredictionClick = (placeId: string) => {
    // If it's a mock prediction or we have API errors, use fallback
    if (apiError || placeId.startsWith("mock") || !placesService) {
      const selectedPrediction = predictions.find((p) => p.place_id === placeId)
      if (selectedPrediction) {
        setInputValue(selectedPrediction.description)
        setPredictions([])
        setShowPredictions(false)

        if (onPlaceSelect) {
          // Create a simplified place object for the fallback
          onPlaceSelect({
            name: selectedPrediction.description,
            formatted_address: selectedPrediction.description,
            place_id: placeId,
            geometry: {
              location: { lat: () => 0, lng: () => 0 }, // Placeholder coordinates
            },
          })
        }
      }
      return
    }

    // Use the actual Places API if available
    try {
      placesService.getDetails({ placeId: placeId }, (place: any, status: any) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && place) {
          setInputValue(place.formatted_address || place.name || "")
          setPredictions([])
          setShowPredictions(false)

          if (onPlaceSelect) {
            onPlaceSelect(place)
          }
        } else if (status === window.google.maps.places.PlacesServiceStatus.BILLING_NOT_ENABLED) {
          setApiError("billing_not_enabled")
          // Fall back to just using the prediction text
          const selectedPrediction = predictions.find((p) => p.place_id === placeId)
          if (selectedPrediction) {
            setInputValue(selectedPrediction.description)
            if (onPlaceSelect) {
              onPlaceSelect({
                name: selectedPrediction.description,
                formatted_address: selectedPrediction.description,
                place_id: placeId,
              })
            }
          }
        }
      })
    } catch (error) {
      console.error("Error getting place details:", error)
      // Fallback to just using the prediction text
      const selectedPrediction = predictions.find((p) => p.place_id === placeId)
      if (selectedPrediction) {
        setInputValue(selectedPrediction.description)
        if (onPlaceSelect) {
          onPlaceSelect({
            name: selectedPrediction.description,
            formatted_address: selectedPrediction.description,
            place_id: placeId,
          })
        }
      }
    }
  }

  // Close predictions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (autoCompleteRef.current && !autoCompleteRef.current.contains(event.target as Node)) {
        setShowPredictions(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  return (
    <div className="relative w-full" ref={autoCompleteRef}>
      <div className="relative">
        {renderInput ? (
          renderInput({
            value: inputValue,
            onChange: handleInputChange
          })
        ) : (
          <Input
            type="text"
            placeholder={placeholder}
            className={cn(className)}
            value={inputValue}
            onChange={handleInputChange}
          />
        )}
        {isLoading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <LucideIcons.Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        )}
        {apiError === "billing_not_enabled" && (
          <div
            className="absolute right-3 top-1/2 transform -translate-y-1/2"
            title="Using fallback search (Google Maps billing not enabled)"
          >
            <LucideIcons.AlertCircle className="h-4 w-4 text-amber-500" />
          </div>
        )}
      </div>

      {showPredictions && predictions.length > 0 && (
        <div className="absolute z-[9999] mt-1 w-full bg-background/95 backdrop-blur-sm border border-border rounded-md shadow-lg max-h-60 overflow-auto">
          {apiError === "billing_not_enabled" && (
            <div className="px-3 py-2 text-xs text-amber-500 bg-amber-50/30 dark:bg-amber-950/30 border-b border-border">
              <div className="flex items-center">
                <LucideIcons.AlertTriangle className="w-3 h-3 mr-1" />
                <span>Using fallback search mode</span>
              </div>
            </div>
          )}

          {predictions.map((prediction) => (
            <div
              key={prediction.place_id}
              className="px-4 py-2.5 hover:bg-muted cursor-pointer text-sm border-b border-border/50 last:border-0"
              onClick={() => handlePredictionClick(prediction.place_id)}
            >
              <div className="flex items-center">
                <LucideIcons.MapPin className="w-4 h-4 mr-2 text-primary" />
                <span>{prediction.description}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

