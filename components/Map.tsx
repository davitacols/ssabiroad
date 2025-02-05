'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { 
  GoogleMap, 
  useJsApiLoader, 
  Marker, 
  StandaloneSearchBox,
  InfoWindow
} from '@react-google-maps/api'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, AlertCircle, Loader2, X } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { toast } from "@/components/ui/use-toast"

// Map configuration
const MAPS_CONFIG = {
  containerStyle: {
    width: '100%',
    height: '600px'
  },
  defaultCenter: {
    lat: 6.5244,
    lng: 3.3792
  },
  defaultZoom: 12,
  libraries: ['places'] as ("places" | "drawing" | "geometry" | "localContext" | "visualization")[]
}

interface MarkerData {
  id: string
  position: google.maps.LatLngLiteral
  title: string
  address: string
  description?: string
}

interface SavedLocation {
  id: string
  position: google.maps.LatLngLiteral
  title: string
  address: string
  description?: string
  visits: number
}

export default function MapComponent() {
  // State management
  const [markers, setMarkers] = useState<MarkerData[]>([])
  const [savedLocations, setSavedLocations] = useState<SavedLocation[]>([])
  const [activeMarker, setActiveMarker] = useState<string | null>(null)
  const [searchBox, setSearchBox] = useState<google.maps.places.SearchBox | null>(null)
  const [map, setMap] = useState<google.maps.Map | null>(null)
  const [apiError, setApiError] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Load Google Maps
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '',
    libraries: MAPS_CONFIG.libraries
  })

  // Error handling for missing API key
  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
      setApiError('Google Maps API key is missing. Please check your environment variables.')
    }
  }, [])

  // Fetch saved locations on mount
  useEffect(() => {
    const fetchSavedLocations = async () => {
      try {
        const response = await fetch('/api/saved-locations', {
          credentials: 'include'
        })
        if (response.ok) {
          const data = await response.json()
          setSavedLocations(data)
        }
      } catch (error) {
        console.error('Error fetching saved locations:', error)
        toast({
          title: "Error",
          description: "Failed to load saved locations",
          variant: "destructive"
        })
      }
    }

    if (isLoaded) {
      fetchSavedLocations()
    }
  }, [isLoaded])

  // Map event handlers
  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map)
    setApiError('')
  }, [])

  const onUnmount = useCallback(() => {
    setMap(null)
  }, [])

  const onSearchBoxLoad = useCallback((ref: google.maps.places.SearchBox) => {
    setSearchBox(ref)
  }, [])

  const onPlacesChanged = useCallback(() => {
    if (!searchBox || !map) return

    setIsLoading(true)
    try {
      const places = searchBox.getPlaces()
      if (!places || places.length === 0) {
        toast({
          title: "No Results",
          description: "No places found for this search",
        })
        return
      }

      const bounds = new window.google.maps.LatLngBounds()
      const newMarkers: MarkerData[] = places.map(place => ({
        id: Math.random().toString(36).substr(2, 9),
        position: place.geometry!.location!.toJSON(),
        title: place.name || 'Unknown location',
        address: place.formatted_address || 'No address available',
        description: place.types?.join(', ')
      }))

      setMarkers(newMarkers)

      places.forEach(place => {
        if (place.geometry?.viewport) {
          bounds.union(place.geometry.viewport)
        } else if (place.geometry?.location) {
          bounds.extend(place.geometry.location)
        }
      })

      map.fitBounds(bounds)
      
      // Clear search input
      if (searchInputRef.current) {
        searchInputRef.current.value = ''
      }
    } catch (error) {
      console.error('Error handling places:', error)
      toast({
        title: "Error",
        description: "Failed to process location search",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }, [searchBox, map])

  const onMapClick = useCallback((event: google.maps.MapMouseEvent) => {
    try {
      const newMarker: MarkerData = {
        id: Math.random().toString(36).substr(2, 9),
        position: event.latLng!.toJSON(),
        title: 'Custom Location',
        address: 'Custom Marker'
      }
      setMarkers(current => [...current, newMarker])
    } catch (error) {
      console.error('Error adding marker:', error)
      toast({
        title: "Error",
        description: "Failed to add marker",
        variant: "destructive"
      })
    }
  }, [])

  const saveLocation = async (marker: MarkerData) => {
    try {
      const response = await fetch('/api/saved-locations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(marker),
      })

      if (response.ok) {
        const savedLocation = await response.json()
        setSavedLocations(current => [...current, savedLocation])
        toast({
          title: "Success",
          description: "Location saved successfully",
        })
      } else {
        throw new Error('Failed to save location')
      }
    } catch (error) {
      console.error('Error saving location:', error)
      toast({
        title: "Error",
        description: "Failed to save location",
        variant: "destructive"
      })
    }
  }

  // Error handling
  if (loadError || apiError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Map Loading Error</AlertTitle>
        <AlertDescription>
          {loadError?.message || apiError}
          <div className="mt-2 text-sm">
            Please ensure:
            <ul className="list-disc pl-4">
              <li>Your Google Maps API key is correct and set as NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in your .env.local file</li>
              <li>The API key has Maps JavaScript API and Places API enabled</li>
              <li>Your domain is allowed in the API key restrictions</li>
              <li>You have billing enabled for your Google Cloud Project</li>
            </ul>
          </div>
        </AlertDescription>
      </Alert>
    )
  }

  // Loading state
  if (!isLoaded) {
    return (
      <Card className="p-4">
        <div className="flex items-center justify-center h-[600px]">
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Loading maps...</span>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-4">
      <div className="mb-4">
        <StandaloneSearchBox
          onLoad={onSearchBoxLoad}
          onPlacesChanged={onPlacesChanged}
        >
          <div className="flex gap-2">
            <Input
              ref={searchInputRef}
              type="text"
              placeholder="Search for a location"
              className="flex-1"
              disabled={isLoading}
            />
            <Button 
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              <span className="sr-only">Search</span>
            </Button>
          </div>
        </StandaloneSearchBox>
      </div>
      
      <GoogleMap
        mapContainerStyle={MAPS_CONFIG.containerStyle}
        center={MAPS_CONFIG.defaultCenter}
        zoom={MAPS_CONFIG.defaultZoom}
        onLoad={onLoad}
        onUnmount={onUnmount}
        onClick={onMapClick}
        options={{
          zoomControl: true,
          streetViewControl: true,
          mapTypeControl: true,
          fullscreenControl: true,
        }}
      >
        {/* Current markers */}
        {markers.map((marker) => (
          <Marker
            key={marker.id}
            position={marker.position}
            title={marker.title}
            onClick={() => setActiveMarker(marker.id)}
          >
            {activeMarker === marker.id && (
              <InfoWindow onCloseClick={() => setActiveMarker(null)}>
                <div className="p-2">
                  <h3 className="font-semibold">{marker.title}</h3>
                  <p className="text-sm">{marker.address}</p>
                  {marker.description && (
                    <p className="text-sm text-gray-600">{marker.description}</p>
                  )}
                  <Button 
                    size="sm"
                    className="mt-2"
                    onClick={() => saveLocation(marker)}
                  >
                    Save Location
                  </Button>
                </div>
              </InfoWindow>
            )}
          </Marker>
        ))}

        {/* Saved locations */}
        {savedLocations.map((location) => (
          <Marker
            key={location.id}
            position={location.position}
            title={location.title}
            icon={{
              url: '/saved-location-marker.png',
              scaledSize: new window.google.maps.Size(30, 30)
            }}
            onClick={() => setActiveMarker(location.id)}
          >
            {activeMarker === location.id && (
              <InfoWindow onCloseClick={() => setActiveMarker(null)}>
                <div className="p-2">
                  <h3 className="font-semibold">{location.title}</h3>
                  <p className="text-sm">{location.address}</p>
                  {location.description && (
                    <p className="text-sm text-gray-600">{location.description}</p>
                  )}
                  <p className="text-sm text-gray-600">Visits: {location.visits}</p>
                </div>
              </InfoWindow>
            )}
          </Marker>
        ))}
      </GoogleMap>

      {/* Selected locations list */}
      {(markers.length > 0 || savedLocations.length > 0) && (
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Selected Locations:</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMarkers([])}
            >
              <X className="h-4 w-4 mr-2" />
              Clear All
            </Button>
          </div>
          {markers.map((marker) => (
            <div 
              key={marker.id} 
              className="text-sm p-2 bg-gray-50 rounded-md flex justify-between items-center"
            >
              <div>
                <div className="font-medium">{marker.title}</div>
                <div className="text-gray-600">{marker.address}</div>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setMarkers(current => 
                  current.filter(m => m.id !== marker.id)
                )}
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Remove</span>
              </Button>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}