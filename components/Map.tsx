'use client'

import { useState, useCallback, useEffect } from 'react'
import { GoogleMap, useJsApiLoader, Marker, StandaloneSearchBox } from '@react-google-maps/api'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

const containerStyle = {
  width: '100%',
  height: '500px'
}

const defaultCenter = {
  lat: 6.5244,
  lng: 3.3792
}

const libraries: ("places" | "drawing" | "geometry" | "localContext" | "visualization")[] = ['places']

interface MarkerData {
  position: google.maps.LatLngLiteral
  title: string
  address: string
}

export default function Map() {
  const [markers, setMarkers] = useState<MarkerData[]>([])
  const [searchBox, setSearchBox] = useState<google.maps.places.SearchBox | null>(null)
  const [map, setMap] = useState<google.maps.Map | null>(null)
  const [apiError, setApiError] = useState<string>('')
  
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '',
    libraries
  })

  useEffect(() => {
    const handleGoogleMapsError = () => {
      if (window.google && !window.google.maps) {
        setApiError('Google Maps failed to load. Please check API key configuration.')
      }
    }

    window.addEventListener('error', handleGoogleMapsError)
    return () => window.removeEventListener('error', handleGoogleMapsError)
  }, [])

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
      setApiError('Google Maps API key is missing. Please check your environment variables.')
    }
  }, [])

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
    if (searchBox) {
      try {
        const places = searchBox.getPlaces()
        if (!places || places.length === 0) return

        const bounds = new window.google.maps.LatLngBounds()

        const newMarkers: MarkerData[] = places.map(place => ({
          position: place.geometry!.location!.toJSON(),
          title: place.name || 'Unknown location',
          address: place.formatted_address || 'No address available'
        }))

        setMarkers(newMarkers)

        places.forEach(place => {
          if (place.geometry?.viewport) {
            bounds.union(place.geometry.viewport)
          } else if (place.geometry?.location) {
            bounds.extend(place.geometry.location)
          }
        })

        map?.fitBounds(bounds)
      } catch (error) {
        console.error('Error handling places:', error)
        setApiError('Error processing location search.')
      }
    }
  }, [searchBox, map])

  const onMapClick = useCallback((event: google.maps.MapMouseEvent) => {
    try {
      const newMarker: MarkerData = {
        position: event.latLng!.toJSON(),
        title: 'Custom Location',
        address: 'Custom Marker'
      }
      setMarkers(current => [...current, newMarker])
    } catch (error) {
      console.error('Error adding marker:', error)
      setApiError('Error adding marker to map.')
    }
  }, [])

  if (loadError || apiError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
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

  if (!isLoaded) {
    return (
      <Card className="p-4">
        <div className="flex items-center justify-center h-[500px]">
          <div className="animate-pulse">Loading maps...</div>
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
              type="text"
              placeholder="Search for a location"
              className="flex-1"
            />
            <Button type="submit">
              <Search className="h-4 w-4" />
              <span className="sr-only">Search</span>
            </Button>
          </div>
        </StandaloneSearchBox>
      </div>
      
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={defaultCenter}
        zoom={10}
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
        {markers.map((marker, index) => (
          <Marker
            key={index}
            position={marker.position}
            title={marker.title}
          />
        ))}
      </GoogleMap>

      {markers.length > 0 && (
        <div className="mt-4 space-y-2">
          <h3 className="font-semibold">Selected Locations:</h3>
          {markers.map((marker, index) => (
            <div key={index} className="text-sm">
              {marker.title} - {marker.address}
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}

