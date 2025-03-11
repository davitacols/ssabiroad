"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Loader2, Navigation, Search, Plus, Minus, LayersIcon } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { LocationSearch } from "@/components/location-search"

interface MapLocation {
  id: string | number
  name: string
  address?: string
  location: {
    lat: number
    lng: number
  }
  type?: string
  category?: string
  verified?: boolean
}

interface LocationMapProps {
  locations?: MapLocation[]
  initialCenter?: { lat: number; lng: number }
  initialZoom?: number
  height?: string
  onLocationSelect?: (location: MapLocation) => void
}

export function LocationMap({
  locations = [],
  initialCenter,
  initialZoom = 13,
  height = "600px",
  onLocationSelect,
}: LocationMapProps) {
  const [map, setMap] = useState<google.maps.Map | null>(null)
  const [markers, setMarkers] = useState<google.maps.Marker[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(
    initialCenter || null
  )
  const [selectedLocation, setSelectedLocation] = useState<MapLocation | null>(null)
  const [infoWindow, setInfoWindow] = useState<google.maps.InfoWindow | null>(null)
  const [mapType, setMapType] = useState<google.maps.MapTypeId>(google.maps.MapTypeId.ROADMAP)
  
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<google.maps.Map | null>(null)

  // Get user's current location
  const getUserLocation = useCallback(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userPos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          }
          setUserLocation(userPos)
          createMap(userPos)
        },
        (error) => {
          console.error("Error getting user location:", error)
          setError("Unable to get your location. Please check your browser permissions.")
          // Use a default location (New York City)
          const defaultLocation = { lat: 40.7128, lng: -74.0060 }
          setUserLocation(defaultLocation)
          createMap(defaultLocation)
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      )
    } else {
      setError("Geolocation is not supported by this browser.")
      // Use a default location
      const defaultLocation = { lat: 40.7128, lng: -74.0060 }
      setUserLocation(defaultLocation)
      createMap(defaultLocation)
    }
  }, [createMap])

  // Create the map instance
  const createMap = useCallback((center?: { lat: number; lng: number }) => {
    if (!mapRef.current || !window.google) return

    const mapCenter = center || userLocation || initialCenter || { lat: 40.7128, lng: -74.0060 }
    
    const mapOptions: google.maps.MapOptions = {
      center: mapCenter,
      zoom: initialZoom,
      mapTypeId: mapType,
      mapTypeControl: false,
      fullscreenControl: false,
      streetViewControl: false,
      zoomControl: false,
      styles: [
        {
          featureType: "poi",
          elementType: "labels",
          stylers: [{ visibility: "off" }]
        }
      ]
    }

    const newMap = new google.maps.Map(mapRef.current, mapOptions)
    setMap(newMap)
    mapInstanceRef.current = newMap

    // Create info window
    const newInfoWindow = new google.maps.InfoWindow()
    setInfoWindow(newInfoWindow)

    // Add user location marker
    if (mapCenter) {
      const userMarker = new google.maps.Marker({
        position: mapCenter,
        map: newMap,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: "#4f46e5",
          fillOpacity: 0.7,
          strokeColor: "#ffffff",
          strokeWeight: 2,
        },
        title: "Your Location",
        zIndex: 1000,
      })

      // Add a pulsing effect to the user marker
      const userMarkerAnimation = () => {
        const scale = 10 + Math.sin(Date.now() / 500) * 1.5
        userMarker.setIcon({
          path: google.maps.SymbolPath.CIRCLE,
          scale: scale,
          fillColor: "#4f46e5",
          fillOpacity: 0.7,
          strokeColor: "#ffffff",
          strokeWeight: 2,
        })
        requestAnimationFrame(userMarkerAnimation)
      }
      requestAnimationFrame(userMarkerAnimation)
    }

    // Add location markers
    addMarkers(newMap, locations)
    
    setIsLoading(false)
  }, [initialZoom, locations, mapType, addMarkers])

  // Initialize the map
  useEffect(() => {
    // Check if Google Maps API is loaded
    if (typeof window === "undefined" || !window.google || !window.google.maps) {
      // Load Google Maps API if not already loaded
      const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
      
      if (!googleMapsApiKey) {
        setError("Google Maps API key is not configured")
        setIsLoading(false)
        return
      }
      
      if (!document.getElementById("google-maps-script")) {
        const script = document.createElement("script")
        script.id = "google-maps-script"
        script.src = `https://maps.googleapis.com/maps/api/js?key=${googleMapsApiKey}&libraries=places`
        script.async = true
        script.defer = true
        script.onload = initializeMap
        document.head.appendChild(script)
      }
    } else {
      initializeMap()
    }

    return () => {
      // Clean up markers when component unmounts
      if (markers.length > 0) {
        markers.forEach(marker => marker.setMap(null))
      }
    }
  }, [markers.length, initializeMap])

  // Initialize the map
  const initializeMap = useCallback(() => {
    if (!mapRef.current || !window.google) return

    setIsLoading(true)

    // Get user's location if not provided
    if (!userLocation && !initialCenter) {
      getUserLocation()
    } else {
      createMap(userLocation || initialCenter)
    }
  }, [getUserLocation, createMap, initialCenter, userLocation])

  // Add markers for locations
  const addMarkers = useCallback((mapInstance: google.maps.Map, locations: MapLocation[]) => {
    if (!mapInstance || !window.google) return

    // Clear existing markers
    markers.forEach(marker => marker.setMap(null))
    const newMarkers: google.maps.Marker[] = []

    // Add markers for each location
    locations.forEach(location => {
      const marker = new google.maps.Marker({
        position: location.location,
        map: mapInstance,
        title: location.name,
        animation: google.maps.Animation.DROP,
      })

      // Add click event to marker
      marker.addListener("click", () => {
        if (infoWindow) {
          // Create info window content
          const content = `
            <div class="p-2">
              <h3 class="font-medium text-base">${location.name}</h3>
              ${location.address ? `<p class="text-sm text-gray-500">${location.address}</p>` : ''}
              ${location.type ? `<p class="text-xs mt-1">Type: ${location.type}</p>` : ''}
            </div>
          `
          infoWindow.setContent(content)
          infoWindow.open(mapInstance, marker)
          setSelectedLocation(location)
          
          if (onLocationSelect) {
            onLocationSelect(location)
          }
        }
      })

      newMarkers.push(marker)
    })

    setMarkers(newMarkers)
  }, [markers, infoWindow, onLocationSelect])

  // Update markers when locations change
  useEffect(() => {
    if (map && locations.length > 0) {
      addMarkers(map, locations)
    }
  }, [map, locations, addMarkers])

  // Center map on user location
  const centerOnUserLocation = useCallback(() => {
    if (!map || !userLocation) return
    
    map.setCenter(userLocation)
    map.setZoom(15)
  }, [map, userLocation])

  // Handle zoom in
  const handleZoomIn = useCallback(() => {
    if (!map) return
    map.setZoom(map.getZoom()! + 1)
  }, [map])

  // Handle zoom out
  const handleZoomOut = useCallback(() => {
    if (!map) return
    map.setZoom(map.getZoom()! - 1)
  }, [map])

  // Toggle map type
  const toggleMapType = useCallback(() => {
    if (!map) return
    
    const newMapType = map.getMapTypeId() === google.maps.MapTypeId.ROADMAP
      ? google.maps.MapTypeId.SATELLITE
      : google.maps.MapTypeId.ROADMAP
    
    map.setMapTypeId(newMapType)
    setMapType(newMapType)
  }, [map])

  // Handle location selection from search
  const handleLocationSelect = useCallback((location: any) => {
    if (!map) return
    
    const newLocation = {
      id: location.placeId,
      name: location.name,
      address: location.address,
      location: location.location,
    }
    
    map.setCenter(location.location)
    map.setZoom(16)
    
    // Create a temporary marker
    const marker = new google.maps.Marker({
      position: location.location,
      map: map,
      title: location.name,
      animation: google.maps.Animation.DROP,
    })
    
    // Show info window
    if (infoWindow) {
      const content = `
        <div class="p-2">
          <h3 class="font-medium text-base">${location.name}</h3>
          ${location.address ? `<p class="text-sm text-gray-500">${location.address}</p>` : ''}
        </div>
      `
      infoWindow.setContent(content)
      infoWindow.open(map, marker)
    }
    
    setSelectedLocation(newLocation)
    
    if (onLocationSelect) {
      onLocationSelect(newLocation)
    }
  }, [map, infoWindow, onLocationSelect])

  return (
    <div className="relative w-full" style={{ height }}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
          <div className="flex flex-col items-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
            <p className="text-sm font-medium">Loading map...</p>
          </div>
        </div>
      )}
      
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
          <Card className="p-4 max-w-md">
            <div className="flex flex-col items-center text-center">
              <div className="text-destructive mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-alert-circle"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
              </div>
              <h3 className="text-lg font-medium mb-1">Map Error</h3>
              <p className="text-sm text-muted-foreground mb-4">{error}</p>
              <Button onClick={() => window.location.reload()}>Try Again</Button>
            </div>
          </Card>
        </div>
      )}
      
      {/* Map container */}
      <div ref={mapRef} className="w-full h-full rounded-lg" />
      
      {/* Map controls */}
      <div className="absolute top-4 left-4 right-4 flex justify-between z-10">
        <div className="w-full max-w-md">
          <LocationSearch 
            onLocationSelect={handleLocationSelect}
            placeholder="Search for a location..."
            className="w-full"
          />
        </div>
        
        <div className="flex gap-2 ml-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="secondary" 
                  size="icon" 
                  className="h-9 w-9 bg-background/90 backdrop-blur-sm shadow-md"
                  onClick={toggleMapType}
                >
                  <LayersIcon className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Toggle Map Type</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
      
      {/* Zoom controls */}
      <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex flex-col gap-2 z-10">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="secondary" 
                size="icon" 
                className="h-9 w-9 bg-background/90 backdrop-blur-sm shadow-md"
                onClick={handleZoomIn}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p>Zoom In</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="secondary" 
                size="icon" 
                className="h-9 w-9 bg-background/90 backdrop-blur-sm shadow-md"
                onClick={handleZoomOut}
              >
                <Minus className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p>Zoom Out</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      
      {/* Current location button */}
      <div className="absolute bottom-4 right-4 z-10">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="secondary" 
                size="icon" 
                className="h-10 w-10 bg-primary text-primary-foreground shadow-md"
                onClick={centerOnUserLocation}
              >
                <Navigation className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p>My Location</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      
      {/* Selected location info */}
      {selectedLocation && (
        <div className="absolute bottom-4 left-4 z-10 max-w-xs">
          <Card className="p-3 bg-background/90 backdrop-blur-sm shadow-md">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-medium text-sm">{selectedLocation.name}</h3>
                {selectedLocation.address && (
                  <p className="text-xs text-muted-foreground">{selectedLocation.address}</p>
                )}
              </div>
              {selectedLocation.verified && (
                <Badge variant="outline" className="ml-2 text-xs">Verified</Badge>
              )}
            </div>
            {selectedLocation.type && (
              <div className="mt-2 flex items-center">
                <span className="text-xs text-muted-foreground mr-1">Type:</span>
                <span className="text-xs">{selectedLocation.type}</span>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  )
}
