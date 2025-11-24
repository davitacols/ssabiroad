"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Loader2, Navigation, MapPin, Layers, Satellite, Map as MapIcon, Car, Bus, Bike } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface HomepageMapProps {
  height?: string
  className?: string
}

export function HomepageMap({ height = "400px", className = "" }: HomepageMapProps) {
  const [map, setMap] = useState<google.maps.Map | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [locationAccuracy, setLocationAccuracy] = useState<number | null>(null)
  const [mapType, setMapType] = useState<string>('roadmap')
  const [nearbyPlaces, setNearbyPlaces] = useState<google.maps.places.PlaceResult[]>([])
  const [trafficLayer, setTrafficLayer] = useState<google.maps.TrafficLayer | null>(null)
  const [transitLayer, setTransitLayer] = useState<google.maps.TransitLayer | null>(null)
  const [bikeLayer, setBikeLayer] = useState<google.maps.BicyclingLayer | null>(null)
  const [showTraffic, setShowTraffic] = useState(false)
  const [showTransit, setShowTransit] = useState(false)
  const [showBiking, setShowBiking] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [weatherData, setWeatherData] = useState<any>(null)
  
  const mapRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const userMarkerRef = useRef<google.maps.Marker | null>(null)
  const accuracyCircleRef = useRef<google.maps.Circle | null>(null)
  const directionsServiceRef = useRef<google.maps.DirectionsService | null>(null)
  const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(null)

  // Get user's current location with high accuracy
  const getUserLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by this browser.")
      setIsLoading(false)
      return
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userPos = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        }
        setUserLocation(userPos)
        setLocationAccuracy(position.coords.accuracy)
        createMap(userPos, position.coords.accuracy)
        fetchWeatherData(userPos)
      },
      (error) => {
        console.error("Error getting user location:", error)
        let errorMessage = "Unable to get your location."
        
        switch(error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location access denied. Please enable location permissions."
            break
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information is unavailable."
            break
          case error.TIMEOUT:
            errorMessage = "Location request timed out."
            break
        }
        
        setError(errorMessage)
        // Use default location (Times Square, NYC)
        const defaultLocation = { lat: 40.7580, lng: -73.9855 }
        setUserLocation(defaultLocation)
        createMap(defaultLocation)
        fetchWeatherData(defaultLocation)
      },
      options
    )
  }, [])

  // Create the map with advanced features
  const createMap = useCallback((center: { lat: number; lng: number }, accuracy?: number) => {
    if (!mapRef.current || !window.google) return

    const mapOptions: google.maps.MapOptions = {
      center,
      zoom: 15,
      mapTypeId: mapType,
      mapTypeControl: false,
      fullscreenControl: true,
      streetViewControl: true,
      zoomControl: false,
      gestureHandling: 'cooperative',
      styles: [
        {
          featureType: "poi.business",
          elementType: "labels",
          stylers: [{ visibility: "on" }]
        },
        {
          featureType: "transit.station",
          elementType: "labels",
          stylers: [{ visibility: "on" }]
        }
      ]
    }

    const newMap = new google.maps.Map(mapRef.current, mapOptions)
    setMap(newMap)

    // Add user location marker with custom icon
    const userMarker = new google.maps.Marker({
      position: center,
      map: newMap,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 12,
        fillColor: "#4285f4",
        fillOpacity: 1,
        strokeColor: "#ffffff",
        strokeWeight: 3,
      },
      title: "Your Current Location",
      zIndex: 1000,
    })
    userMarkerRef.current = userMarker

    // Add accuracy circle if available
    if (accuracy && accuracy < 1000) {
      const accuracyCircle = new google.maps.Circle({
        strokeColor: "#4285f4",
        strokeOpacity: 0.3,
        strokeWeight: 1,
        fillColor: "#4285f4",
        fillOpacity: 0.1,
        map: newMap,
        center: center,
        radius: accuracy,
      })
      accuracyCircleRef.current = accuracyCircle
    }

    // Add pulsing animation to user marker
    let scale = 12
    let growing = true
    const animate = () => {
      if (growing) {
        scale += 0.2
        if (scale >= 16) growing = false
      } else {
        scale -= 0.2
        if (scale <= 12) growing = true
      }
      
      if (userMarkerRef.current) {
        userMarkerRef.current.setIcon({
          path: google.maps.SymbolPath.CIRCLE,
          scale: scale,
          fillColor: "#4285f4",
          fillOpacity: 0.8,
          strokeColor: "#ffffff",
          strokeWeight: 3,
        })
      }
      requestAnimationFrame(animate)
    }
    requestAnimationFrame(animate)

    // Initialize advanced services
    directionsServiceRef.current = new google.maps.DirectionsService()
    directionsRendererRef.current = new google.maps.DirectionsRenderer({
      suppressMarkers: false,
      draggable: true
    })
    directionsRendererRef.current.setMap(newMap)

    // Initialize Places service for nearby places
    const service = new google.maps.places.PlacesService(newMap)
    
    // Search for multiple types of nearby places
    const placeTypes = ['restaurant', 'gas_station', 'hospital', 'bank', 'pharmacy']
    const allPlaces: google.maps.places.PlaceResult[] = []
    
    placeTypes.forEach((type, index) => {
      setTimeout(() => {
        const request = {
          location: center,
          radius: 1500,
          type: type as any
        }
        
        service.nearbySearch(request, (results, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && results) {
            allPlaces.push(...results.slice(0, 2)) // 2 places per type
            
            if (index === placeTypes.length - 1) {
              setNearbyPlaces(allPlaces.slice(0, 10))
              // Add place markers inline
              allPlaces.slice(0, 10).forEach((place) => {
                if (place.geometry?.location) {
                  const marker = new window.google.maps.Marker({
                    position: place.geometry.location,
                    map: newMap,
                    title: place.name,
                    icon: {
                      url: place.icon || '',
                      scaledSize: new window.google.maps.Size(30, 30)
                    }
                  })
                  const infoWindow = new window.google.maps.InfoWindow({
                    content: `<div class="p-3"><h3 class="font-semibold">${place.name}</h3></div>`
                  })
                  marker.addListener('click', () => {
                    infoWindow.open(newMap, marker)
                  })
                }
              })
            }
          }
        })
      }, index * 200) // Stagger requests to avoid rate limiting
    })



    // Add global function for directions
    (window as any).getDirections = (placeId: string) => {
      if (!directionsServiceRef.current || !directionsRendererRef.current || !userLocation) return
      
      const request = {
        origin: userLocation,
        destination: { placeId: placeId },
        travelMode: google.maps.TravelMode.DRIVING
      }
      
      directionsServiceRef.current.route(request, (result, status) => {
        if (status === 'OK' && result) {
          directionsRendererRef.current?.setDirections(result)
        }
      })
    }

    // Add click listener for custom location search
    newMap.addListener('click', (event: google.maps.MapMouseEvent) => {
      if (event.latLng) {
        const clickedLocation = {
          lat: event.latLng.lat(),
          lng: event.latLng.lng()
        }
        
        // Add temporary marker
        const tempMarker = new google.maps.Marker({
          position: clickedLocation,
          map: newMap,
          title: 'Clicked Location',
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: "#ff4444",
            fillOpacity: 0.8,
            strokeColor: "#ffffff",
            strokeWeight: 2,
          }
        })
        
        // Remove marker after 3 seconds
        setTimeout(() => {
          tempMarker.setMap(null)
        }, 3000)
        
        // Reverse geocode to get address
        const geocoder = new google.maps.Geocoder()
        geocoder.geocode({ location: clickedLocation }, (results, status) => {
          if (status === 'OK' && results?.[0]) {
            const infoWindow = new google.maps.InfoWindow({
              content: `
                <div class="p-2">
                  <h3 class="font-medium text-sm mb-1">Location Details</h3>
                  <p class="text-xs text-gray-600">${results[0].formatted_address}</p>
                  <p class="text-xs mt-1">Lat: ${clickedLocation.lat.toFixed(6)}</p>
                  <p class="text-xs">Lng: ${clickedLocation.lng.toFixed(6)}</p>
                </div>
              `,
              position: clickedLocation
            })
            infoWindow.open(newMap)
            
            setTimeout(() => {
              infoWindow.close()
            }, 4000)
          }
        })
      }
    })

    setIsLoading(false)
  }, [mapType, userLocation])

  // Initialize the map
  useEffect(() => {
    const initializeMap = () => {
      if (typeof window === "undefined" || !window.google?.maps) {
        const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
        
        if (!googleMapsApiKey) {
          setError("Google Maps API key is not configured")
          setIsLoading(false)
          return
        }
        
        if (!document.getElementById("google-maps-script")) {
          const script = document.createElement("script")
          script.id = "google-maps-script"
          script.src = `https://maps.googleapis.com/maps/api/js?key=${googleMapsApiKey}&libraries=places,geometry`
          script.async = true
          script.defer = true
          script.onload = () => getUserLocation()
          script.onerror = () => {
            setError("Failed to load Google Maps")
            setIsLoading(false)
          }
          document.head.appendChild(script)
        }
      } else {
        getUserLocation()
      }
    }

    initializeMap()

    return () => {
      // Cleanup
      if (userMarkerRef.current) {
        userMarkerRef.current.setMap(null)
      }
      if (accuracyCircleRef.current) {
        accuracyCircleRef.current.setMap(null)
      }
      if (trafficLayer) {
        trafficLayer.setMap(null)
      }
      if (transitLayer) {
        transitLayer.setMap(null)
      }
      if (bikeLayer) {
        bikeLayer.setMap(null)
      }
      if (directionsRendererRef.current) {
        directionsRendererRef.current.setMap(null)
      }
      // Clean up global function
      delete (window as any).getDirections
    }
  }, [getUserLocation])

  // Center map on user location
  const centerOnUserLocation = useCallback(() => {
    if (!map || !userLocation) return
    
    map.setCenter(userLocation)
    map.setZoom(16)
  }, [map, userLocation])

  // Toggle map type
  const toggleMapType = useCallback(() => {
    if (!map) return
    
    const newMapType = map.getMapTypeId() === 'roadmap'
      ? 'satellite'
      : 'roadmap'
    
    map.setMapTypeId(newMapType)
    setMapType(newMapType)
  }, [map])



  // Toggle traffic layer
  const toggleTrafficLayer = useCallback(() => {
    if (!map) return
    
    if (showTraffic && trafficLayer) {
      trafficLayer.setMap(null)
      setTrafficLayer(null)
      setShowTraffic(false)
    } else {
      const newTrafficLayer = new google.maps.TrafficLayer()
      newTrafficLayer.setMap(map)
      setTrafficLayer(newTrafficLayer)
      setShowTraffic(true)
    }
  }, [map, showTraffic, trafficLayer])

  // Toggle transit layer
  const toggleTransitLayer = useCallback(() => {
    if (!map) return
    
    if (showTransit && transitLayer) {
      transitLayer.setMap(null)
      setTransitLayer(null)
      setShowTransit(false)
    } else {
      const newTransitLayer = new google.maps.TransitLayer()
      newTransitLayer.setMap(map)
      setTransitLayer(newTransitLayer)
      setShowTransit(true)
    }
  }, [map, showTransit, transitLayer])

  // Toggle biking layer
  const toggleBikingLayer = useCallback(() => {
    if (!map) return
    
    if (showBiking && bikeLayer) {
      bikeLayer.setMap(null)
      setBikeLayer(null)
      setShowBiking(false)
    } else {
      const newBikeLayer = new google.maps.BicyclingLayer()
      newBikeLayer.setMap(map)
      setBikeLayer(newBikeLayer)
      setShowBiking(true)
    }
  }, [map, showBiking, bikeLayer])

  // Handle search functionality
  const handleSearch = useCallback(() => {
    if (!map || !searchQuery.trim()) return
    
    setIsSearching(true)
    
    const service = new google.maps.places.PlacesService(map)
    const request = {
      query: searchQuery,
      fields: ['name', 'geometry', 'formatted_address', 'rating', 'photos']
    }
    
    service.textSearch(request, (results, status) => {
      setIsSearching(false)
      
      if (status === google.maps.places.PlacesServiceStatus.OK && results?.[0]) {
        const place = results[0]
        if (place.geometry?.location) {
          map.setCenter(place.geometry.location)
          map.setZoom(16)
          
          // Add search result marker
          const marker = new google.maps.Marker({
            position: place.geometry.location,
            map: map,
            title: place.name,
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 15,
              fillColor: "#10b981",
              fillOpacity: 1,
              strokeColor: "#ffffff",
              strokeWeight: 3,
            },
            animation: google.maps.Animation.BOUNCE
          })
          
          // Stop bouncing after 2 seconds
          setTimeout(() => {
            marker.setAnimation(null)
          }, 2000)
          
          // Show info window
          const infoWindow = new google.maps.InfoWindow({
            content: `
              <div class="p-3">
                <h3 class="font-semibold text-base mb-1">${place.name}</h3>
                <p class="text-sm text-gray-600 mb-2">${place.formatted_address}</p>
                ${place.rating ? `
                  <div class="flex items-center gap-1">
                    <span class="text-yellow-500">★</span>
                    <span class="text-sm">${place.rating}/5</span>
                  </div>
                ` : ''}
              </div>
            `
          })
          
          infoWindow.open(map, marker)
          setSearchQuery('')
        }
      }
    })
  }, [map, searchQuery])

  // Fetch weather data for current location
  const fetchWeatherData = useCallback(async (location: { lat: number; lng: number }) => {
    try {
      const response = await fetch(`/api/weather?lat=${location.lat}&lon=${location.lng}`)
      if (response.ok) {
        const data = await response.json()
        setWeatherData(data.current)
      }
    } catch (error) {
      console.error('Failed to fetch weather data:', error)
    }
  }, [])

  return (
    <div className={`relative w-full ${className}`} style={{ height }}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-10 rounded-lg">
          <div className="flex flex-col items-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
            <p className="text-sm font-medium">Getting your location...</p>
          </div>
        </div>
      )}
      
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-10 rounded-lg">
          <Card className="p-4 max-w-md">
            <div className="flex flex-col items-center text-center">
              <MapPin className="h-8 w-8 text-destructive mb-2" />
              <h3 className="text-lg font-medium mb-1">Location Error</h3>
              <p className="text-sm text-muted-foreground mb-4">{error}</p>
              <Button onClick={getUserLocation} size="sm">
                Try Again
              </Button>
            </div>
          </Card>
        </div>
      )}
      
      {/* Search bar */}
      <div className="absolute top-4 left-4 z-10 w-72">
        <div className="relative">
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search places..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            className="w-full px-4 py-2 pr-10 text-sm bg-background/90 backdrop-blur-sm border border-border rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <Button
            size="sm"
            variant="ghost"
            className="absolute right-1 top-1 h-6 w-6 p-0"
            onClick={handleSearch}
            disabled={isSearching}
          >
            {isSearching ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <MapPin className="h-3 w-3" />
            )}
          </Button>
        </div>
      </div>
      
      {/* Map container */}
      <div ref={mapRef} className="w-full h-full rounded-lg shadow-lg" />
      
      {/* Map controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="secondary" 
                size="icon" 
                className="h-9 w-9 bg-background/90 backdrop-blur-sm shadow-md"
                onClick={toggleMapType}
              >
                {mapType === 'roadmap' ? (
                  <Satellite className="h-4 w-4" />
                ) : (
                  <MapIcon className="h-4 w-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p>Toggle Map Type</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant={showTraffic ? "default" : "secondary"}
                size="icon" 
                className="h-9 w-9 bg-background/90 backdrop-blur-sm shadow-md"
                onClick={toggleTrafficLayer}
              >
                <Car className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p>Toggle Traffic</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant={showTransit ? "default" : "secondary"}
                size="icon" 
                className="h-9 w-9 bg-background/90 backdrop-blur-sm shadow-md"
                onClick={toggleTransitLayer}
              >
                <Bus className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p>Toggle Transit</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant={showBiking ? "default" : "secondary"}
                size="icon" 
                className="h-9 w-9 bg-background/90 backdrop-blur-sm shadow-md"
                onClick={toggleBikingLayer}
              >
                <Bike className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p>Toggle Biking</p>
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
                variant="default" 
                size="icon" 
                className="h-10 w-10 bg-primary text-primary-foreground shadow-lg"
                onClick={centerOnUserLocation}
                disabled={!userLocation}
              >
                <Navigation className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p>Center on My Location</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      
      {/* Location info */}
      {userLocation && (
        <div className="absolute bottom-4 left-4 z-10 max-w-xs">
          <Card className="p-3 bg-background/90 backdrop-blur-sm shadow-md">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium">Your Location</span>
            </div>
            <div className="text-xs text-muted-foreground">
              <p>Lat: {userLocation.lat.toFixed(6)}</p>
              <p>Lng: {userLocation.lng.toFixed(6)}</p>
              {locationAccuracy && (
                <p>Accuracy: ±{Math.round(locationAccuracy)}m</p>
              )}
            </div>
            {weatherData && (
              <div className="mt-2 p-2 bg-primary/10 rounded-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{Math.round(weatherData.main?.temp || 0)}°C</span>
                    <div className="text-xs">
                      <p className="capitalize">{weatherData.weather?.[0]?.description}</p>
                      <p>Feels like {Math.round(weatherData.main?.feels_like || 0)}°C</p>
                    </div>
                  </div>
                  {weatherData.weather?.[0]?.icon && (
                    <img 
                      src={`https://openweathermap.org/img/w/${weatherData.weather[0].icon}.png`}
                      alt="Weather icon"
                      className="w-8 h-8"
                    />
                  )}
                </div>
                <div className="flex justify-between text-xs mt-1">
                  <span>Humidity: {weatherData.main?.humidity}%</span>
                  <span>Wind: {Math.round(weatherData.wind?.speed || 0)} m/s</span>
                </div>
              </div>
            )}
            {nearbyPlaces.length > 0 && (
              <div className="mt-2 space-y-1">
                <Badge variant="outline" className="text-xs">
                  {nearbyPlaces.length} nearby places
                </Badge>
                <div className="flex flex-wrap gap-1">
                  {showTraffic && <Badge variant="secondary" className="text-xs">Traffic</Badge>}
                  {showTransit && <Badge variant="secondary" className="text-xs">Transit</Badge>}
                  {showBiking && <Badge variant="secondary" className="text-xs">Biking</Badge>}
                </div>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  )
}