"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { MapPin, Navigation, Layers, Search, Loader2, Info } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useGoogleMapsScript } from "@/hooks/use-google-maps-script"

// Helper function to calculate distance in meters
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371 // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1)
  const dLon = deg2rad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const distance = R * c * 1000 // Distance in meters
  return distance
}

const deg2rad = (deg) => {
  return deg * (Math.PI / 180)
}

// Nearby Places Component
function NearbyPlaces({ latitude, longitude, onSelectLocation }) {
  const [places, setPlaces] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!latitude || !longitude) return

    const fetchNearbyPlaces = async () => {
      setLoading(true)
      setError(null)

      try {
        // Use Google Places API to fetch nearby places
        if (window.google && window.google.maps && window.google.maps.places) {
          const service = new window.google.maps.places.PlacesService(document.createElement("div"))

          service.nearbySearch(
            {
              location: { lat: latitude, lng: longitude },
              radius: 1000, // 1km radius
              type: ["restaurant", "cafe", "store", "tourist_attraction", "point_of_interest"],
            },
            (results, status) => {
              if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
                // Format results
                const formattedPlaces = results.map((place) => ({
                  id: place.place_id,
                  name: place.name,
                  address: place.vicinity,
                  location: {
                    latitude: place.geometry.location.lat(),
                    longitude: place.geometry.location.lng(),
                  },
                  rating: place.rating,
                  photos: place.photos ? [place.photos[0].getUrl({ maxWidth: 400 })] : [],
                  category: place.types?.[0] || "place",
                  distance: calculateDistance(
                    latitude,
                    longitude,
                    place.geometry.location.lat(),
                    place.geometry.location.lng(),
                  ),
                }))

                // Sort by distance
                formattedPlaces.sort((a, b) => a.distance - b.distance)

                setPlaces(formattedPlaces)
              } else {
                setError("No places found nearby")
              }
              setLoading(false)
            },
          )
        } else {
          // Fallback if Google Places API is not available
          setError("Google Places API not available")
          setLoading(false)
        }
      } catch (err) {
        console.error("Error fetching nearby places:", err)
        setError("Failed to fetch nearby places")
        setLoading(false)
      }
    }

    fetchNearbyPlaces()
  }, [latitude, longitude])

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 rounded-md">
        <p>{error}</p>
      </div>
    )
  }

  if (places.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <Info className="h-12 w-12 text-slate-300 mb-4" />
        <p className="text-slate-600 dark:text-slate-300">No places found nearby</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium">Places within 1km</h3>
      {places.map((place) => (
        <div
          key={place.id}
          className="p-3 rounded-md border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer"
          onClick={() => onSelectLocation(place)}
        >
          <div className="flex gap-3">
            {place.photos && place.photos.length > 0 ? (
              <img
                src={place.photos[0] || "/placeholder.svg"}
                alt={place.name}
                className="w-16 h-16 object-cover rounded-md flex-shrink-0"
              />
            ) : (
              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-md flex items-center justify-center flex-shrink-0">
                <MapPin className="h-6 w-6 text-slate-300" />
              </div>
            )}
            <div className="flex-1">
              <h4 className="font-medium text-sm">{place.name}</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">{place.address}</p>
              <div className="flex items-center justify-between mt-1">
                <div className="flex items-center gap-1">
                  {place.rating && (
                    <>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="w-3 h-3 text-yellow-500"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="text-xs">{place.rating.toFixed(1)}</span>
                    </>
                  )}
                </div>
                <Badge variant="outline" className="text-xs">
                  {Math.round(place.distance)}m
                </Badge>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export function MapView({ selectedLocation }) {
  const [mapLoaded, setMapLoaded] = useState(false)
  const [locations, setLocations] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [activeMapLayer, setActiveMapLayer] = useState("standard")
  const [showPoints, setShowPoints] = useState(true)
  const [showRoutes, setShowRoutes] = useState(false)
  const [mapCenter, setMapCenter] = useState({ lat: 40.7128, lng: -74.006 }) // Default to NYC
  const [mapZoom, setMapZoom] = useState(13)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [selectedLocationDetails, setSelectedLocationDetails] = useState(null)

  const mapRef = useRef(null)
  const googleMapRef = useRef(null)
  const markersRef = useRef([])

  // Load Google Maps script
  const { isLoaded, loadError } = useGoogleMapsScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    libraries: ["places"],
  })

  // Load saved locations
  useEffect(() => {
    // Simulate loading locations from storage or API
    setTimeout(() => {
      const recentLocations = localStorage.getItem("recentLocations")
      const bookmarks = localStorage.getItem("bookmarks")

      let allLocations = []

      if (recentLocations) {
        try {
          const parsed = JSON.parse(recentLocations)
          allLocations = [...allLocations, ...parsed.map((loc) => ({ ...loc, type: "recent" }))]
        } catch (e) {
          console.error("Failed to parse recent locations", e)
        }
      }

      if (bookmarks) {
        try {
          const parsed = JSON.parse(bookmarks)
          allLocations = [...allLocations, ...parsed.map((loc) => ({ ...loc, type: "bookmark" }))]
        } catch (e) {
          console.error("Failed to parse bookmarks", e)
        }
      }

      // Filter out locations without coordinates
      allLocations = allLocations.filter(
        (loc) =>
          loc.location && typeof loc.location.latitude === "number" && typeof loc.location.longitude === "number",
      )

      setLocations(allLocations)
      setMapLoaded(true)
    }, 1000)
  }, [])

  // Initialize Google Map
  const initializeMap = useCallback(() => {
    if (!isLoaded || !mapRef.current) return

    const mapOptions = {
      center: mapCenter,
      zoom: mapZoom,
      mapTypeId: activeMapLayer === "satellite" ? "satellite" : "roadmap",
      mapTypeControl: false,
      fullscreenControl: false,
      streetViewControl: false,
      zoomControl: true,
      zoomControlOptions: {
        position: window.google.maps.ControlPosition.RIGHT_TOP,
      },
      styles: [
        {
          featureType: "poi",
          elementType: "labels",
          stylers: [{ visibility: "off" }],
        },
      ],
    }

    googleMapRef.current = new window.google.maps.Map(mapRef.current, mapOptions)

    // Add markers
    updateMapMarkers()
  }, [isLoaded, mapCenter, mapZoom, activeMapLayer])

  // Update map markers
  const updateMapMarkers = useCallback(() => {
    if (!isLoaded || !googleMapRef.current) return

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.setMap(null))
    markersRef.current = []

    if (!showPoints) return

    // Add markers for all locations
    locations.forEach((location) => {
      if (!location.location) return

      const marker = new window.google.maps.Marker({
        position: {
          lat: location.location.latitude,
          lng: location.location.longitude,
        },
        map: googleMapRef.current,
        title: location.name,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          fillColor: location.type === "bookmark" ? "#0ea5e9" : "#14b8a6",
          fillOpacity: 1,
          strokeWeight: 2,
          strokeColor: "#ffffff",
          scale: 8,
        },
      })

      // Add info window
      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div style="padding: 8px; max-width: 200px;">
            <h3 style="font-weight: 500; font-size: 14px; margin-bottom: 4px;">${location.name}</h3>
            <p style="font-size: 12px; color: #64748b; margin: 0;">${location.address || ""}</p>
          </div>
        `,
      })

      marker.addListener("click", () => {
        infoWindow.open(googleMapRef.current, marker)
        setSelectedLocationDetails(location)
      })

      markersRef.current.push(marker)
    })

    // Add selected location marker if not already in locations
    if (selectedLocation && selectedLocation.location) {
      const isAlreadyInLocations = locations.some(
        (loc) =>
          loc.location &&
          loc.location.latitude === selectedLocation.location.latitude &&
          loc.location.longitude === selectedLocation.location.longitude,
      )

      if (!isAlreadyInLocations) {
        const marker = new window.google.maps.Marker({
          position: {
            lat: selectedLocation.location.latitude,
            lng: selectedLocation.location.longitude,
          },
          map: googleMapRef.current,
          title: selectedLocation.name,
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            fillColor: "#ef4444",
            fillOpacity: 1,
            strokeWeight: 2,
            strokeColor: "#ffffff",
            scale: 8,
          },
          zIndex: 1000, // Make sure it's on top
        })

        // Add info window
        const infoWindow = new window.google.maps.InfoWindow({
          content: `
            <div style="padding: 8px; max-width: 200px;">
              <h3 style="font-weight: 500; font-size: 14px; margin-bottom: 4px;">${selectedLocation.name}</h3>
              <p style="font-size: 12px; color: #64748b; margin: 0;">${selectedLocation.address || ""}</p>
            </div>
          `,
        })

        marker.addListener("click", () => {
          infoWindow.open(googleMapRef.current, marker)
        })

        markersRef.current.push(marker)
      }
    }
  }, [isLoaded, locations, selectedLocation, showPoints])

  // Update map when center or zoom changes
  useEffect(() => {
    if (googleMapRef.current) {
      googleMapRef.current.setCenter(mapCenter)
      googleMapRef.current.setZoom(mapZoom)
    }
  }, [mapCenter, mapZoom])

  // Update map type when layer changes
  useEffect(() => {
    if (googleMapRef.current) {
      googleMapRef.current.setMapTypeId(activeMapLayer === "satellite" ? "satellite" : "roadmap")
    }
  }, [activeMapLayer])

  // Initialize map when script is loaded
  useEffect(() => {
    if (isLoaded && mapRef.current && !googleMapRef.current) {
      initializeMap()
    }
  }, [isLoaded, initializeMap])

  // Update map center when selected location changes
  useEffect(() => {
    if (selectedLocation && selectedLocation.location) {
      setMapCenter({
        lat: selectedLocation.location.latitude,
        lng: selectedLocation.location.longitude,
      })
      setMapZoom(15) // Zoom in when a location is selected
      setSelectedLocationDetails(selectedLocation)
    }
  }, [selectedLocation])

  // Update markers when dependencies change
  useEffect(() => {
    updateMapMarkers()
  }, [updateMapMarkers])

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault()
    if (!searchTerm.trim()) return

    setIsSearching(true)

    // Use Google Places API to search
    if (isLoaded && window.google && window.google.maps && window.google.maps.places) {
      const placesService = new window.google.maps.places.PlacesService(googleMapRef.current)

      placesService.textSearch({ query: searchTerm }, (results, status) => {
        setIsSearching(false)

        if (status === window.google.maps.places.PlacesServiceStatus.OK && results && results.length > 0) {
          // Format results to match our location structure
          const formattedResults = results.map((place) => ({
            id: place.place_id,
            name: place.name,
            address: place.formatted_address,
            location: {
              latitude: place.geometry.location.lat(),
              longitude: place.geometry.location.lng(),
            },
            type: "search",
            rating: place.rating,
            photos: place.photos ? [place.photos[0].getUrl()] : [],
            category: place.types?.[0] || "place",
          }))

          // Add to locations
          setLocations((prev) => [...formattedResults, ...prev])

          // Center map on first result
          setMapCenter({
            lat: formattedResults[0].location.latitude,
            lng: formattedResults[0].location.longitude,
          })
          setMapZoom(15)

          // Set as selected location
          setSelectedLocationDetails(formattedResults[0])
        }
      })
    } else {
      // Fallback if Google Places is not available
      setTimeout(() => {
        setIsSearching(false)
      }, 1000)
    }
  }

  // Handle location click
  const handleLocationClick = (location) => {
    if (location.location) {
      setMapCenter({
        lat: location.location.latitude,
        lng: location.location.longitude,
      })
      setMapZoom(15)
      setSelectedLocationDetails(location)
    }
  }

  // Handle view details click
  const handleViewDetails = () => {
    setDetailsOpen(true)
  }

  // Get directions
  const handleGetDirections = () => {
    if (selectedLocationDetails && selectedLocationDetails.location) {
      const lat = selectedLocationDetails.location.latitude
      const lng = selectedLocationDetails.location.longitude
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, "_blank")
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-[calc(100vh-250px)] min-h-[500px]">
      {/* Sidebar */}
      <Card className="lg:col-span-1 border border-slate-200 dark:border-slate-700 shadow-md rounded-xl overflow-hidden">
        <CardContent className="p-4">
          <form onSubmit={handleSearch} className="flex gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                type="text"
                placeholder="Search on map..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button type="submit" disabled={isSearching || !isLoaded}>
              {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            </Button>
          </form>

          <div className="space-y-2 mb-4">
            <h3 className="text-sm font-medium">Map Layers</h3>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={activeMapLayer === "satellite" ? "default" : "outline"}
                size="sm"
                className="flex items-center gap-1"
                onClick={() => setActiveMapLayer("satellite")}
              >
                <Layers className="h-3.5 w-3.5" />
                <span>Satellite</span>
              </Button>
              <Button
                variant={activeMapLayer === "standard" ? "default" : "outline"}
                size="sm"
                className="flex items-center gap-1"
                onClick={() => setActiveMapLayer("standard")}
              >
                <Layers className="h-3.5 w-3.5" />
                <span>Standard</span>
              </Button>
              <Button
                variant={showPoints ? "default" : "outline"}
                size="sm"
                className="flex items-center gap-1"
                onClick={() => setShowPoints(!showPoints)}
              >
                <MapPin className="h-3.5 w-3.5" />
                <span>Points</span>
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">Locations</h3>
              <Badge variant="outline">{locations.length}</Badge>
            </div>

            {!mapLoaded ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-teal-500" />
              </div>
            ) : locations.length > 0 ? (
              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                {locations.map((location, index) => (
                  <div
                    key={index}
                    className="p-2 rounded-md border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer"
                    onClick={() => handleLocationClick(location)}
                  >
                    <div className="flex items-start gap-2">
                      <MapPin
                        className={`h-4 w-4 mt-0.5 flex-shrink-0 ${
                          location.type === "bookmark"
                            ? "text-sky-500"
                            : location.type === "search"
                              ? "text-amber-500"
                              : "text-teal-500"
                        }`}
                      />
                      <div>
                        <p className="text-sm font-medium">{location.name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{location.address}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-slate-500 dark:text-slate-400">No locations found</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Map */}
      <div className="lg:col-span-3 bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden relative">
        {!isLoaded ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="h-10 w-10 animate-spin text-teal-500 mx-auto mb-4" />
              <p className="text-slate-600 dark:text-slate-300">Loading map...</p>
            </div>
          </div>
        ) : loadError ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center max-w-md p-4">
              <div className="bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300 p-3 rounded-md mb-4">
                <p>Failed to load Google Maps. Please check your API key and try again.</p>
              </div>
              <Button onClick={() => window.location.reload()}>Reload Page</Button>
            </div>
          </div>
        ) : (
          <div className="h-full w-full" ref={mapRef}></div>
        )}
      </div>

      {/* Map Info - Floating panel for selected location */}
      {mapLoaded && selectedLocationDetails && (
        <div className="absolute bottom-4 left-4 right-4 lg:left-auto lg:right-4 lg:w-80 z-[1000] bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-4">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center flex-shrink-0">
              <MapPin className="h-5 w-5 text-teal-600 dark:text-teal-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium">{selectedLocationDetails.name}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">{selectedLocationDetails.address}</p>
              {selectedLocationDetails.location && (
                <p className="text-xs mt-1 text-slate-400">
                  {selectedLocationDetails.location.latitude.toFixed(6)},{" "}
                  {selectedLocationDetails.location.longitude.toFixed(6)}
                </p>
              )}
              <div className="flex gap-2 mt-3">
                <Button size="sm" variant="outline" className="flex-1" onClick={handleGetDirections}>
                  <Navigation className="h-4 w-4 mr-1" /> Directions
                </Button>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button size="sm" variant="default" className="flex-1" onClick={handleViewDetails}>
                        View Details
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>View full location details</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Location Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-teal-500" />
              {selectedLocationDetails?.name || "Location Details"}
            </DialogTitle>
            <DialogDescription>
              {selectedLocationDetails?.address || "Detailed information about this location"}
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="map">Map</TabsTrigger>
              <TabsTrigger value="nearby">Nearby</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="mt-4">
              <ScrollArea className="h-[400px] pr-4">
                {selectedLocationDetails ? (
                  <div className="space-y-4">
                    {/* Location Image */}
                    {selectedLocationDetails.photos && selectedLocationDetails.photos.length > 0 ? (
                      <div className="w-full h-48 rounded-md overflow-hidden">
                        <img
                          src={selectedLocationDetails.photos[0] || "/placeholder.svg"}
                          alt={selectedLocationDetails.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-full h-48 bg-slate-100 dark:bg-slate-700 rounded-md flex items-center justify-center">
                        <MapPin className="h-12 w-12 text-slate-300 dark:text-slate-500" />
                      </div>
                    )}

                    {/* Basic Info */}
                    <div className="space-y-2">
                      <h3 className="text-lg font-medium">Basic Information</h3>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-md">
                          <p className="text-xs text-slate-500 dark:text-slate-400">Name</p>
                          <p className="text-sm font-medium">{selectedLocationDetails.name}</p>
                        </div>
                        <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-md">
                          <p className="text-xs text-slate-500 dark:text-slate-400">Category</p>
                          <p className="text-sm font-medium">{selectedLocationDetails.category || "Unknown"}</p>
                        </div>
                        {selectedLocationDetails.rating && (
                          <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-md">
                            <p className="text-xs text-slate-500 dark:text-slate-400">Rating</p>
                            <div className="flex items-center gap-1">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="currentColor"
                                className="w-4 h-4 text-yellow-500"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              <span className="text-sm font-medium">{selectedLocationDetails.rating.toFixed(1)}</span>
                              </div>
                          </div>
                        )}
                        <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-md">
                          <p className="text-xs text-slate-500 dark:text-slate-400">Address</p>
                          <p className="text-sm font-medium">{selectedLocationDetails.address || "No address"}</p>
                        </div>
                      </div>
                    </div>

                    {/* GPS Coordinates */}
                    <div className="space-y-2">
                      <h3 className="text-lg font-medium">GPS Coordinates</h3>
                      {selectedLocationDetails.location ? (
                        <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-md">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <p className="text-xs text-slate-500 dark:text-slate-400">Latitude</p>
                              <p className="text-sm font-medium">
                                {selectedLocationDetails.location.latitude.toFixed(6)}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-500 dark:text-slate-400">Longitude</p>
                              <p className="text-sm font-medium">
                                {selectedLocationDetails.location.longitude.toFixed(6)}
                              </p>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full mt-2"
                            onClick={() => {
                              navigator.clipboard.writeText(
                                `${selectedLocationDetails.location.latitude.toFixed(6)}, ${selectedLocationDetails.location.longitude.toFixed(6)}`
                              )
                            }}
                          >
                            Copy Coordinates
                          </Button>
                        </div>
                      ) : (
                        <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-md">
                          <p className="text-sm text-slate-500">No coordinates available</p>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="space-y-2">
                      <h3 className="text-lg font-medium">Actions</h3>
                      <div className="flex flex-col gap-2">
                        <Button
                          className="w-full flex items-center gap-2"
                          onClick={handleGetDirections}
                        >
                          <Navigation className="h-4 w-4" />
                          Get Directions
                        </Button>
                        <Button
                          variant="outline"
                          className="w-full flex items-center gap-2"
                          onClick={() => {
                            // Add to bookmarks
                            const existingBookmarks = JSON.parse(localStorage.getItem("bookmarks") || "[]")
                            const isAlreadyBookmarked = existingBookmarks.some(
                              (bookmark) => bookmark.id === selectedLocationDetails.id
                            )

                            if (!isAlreadyBookmarked) {
                              const updatedBookmarks = [
                                ...existingBookmarks,
                                { ...selectedLocationDetails, type: "bookmark" },
                              ]
                              localStorage.setItem("bookmarks", JSON.stringify(updatedBookmarks))
                            }
                          }}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="h-4 w-4"
                          >
                            <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
                          </svg>
                          Add to Bookmarks
                        </Button>
                        <Button
                          variant="outline"
                          className="w-full flex items-center gap-2"
                          onClick={() => {
                            // Share location
                            if (navigator.share) {
                              navigator.share({
                                title: selectedLocationDetails.name,
                                text: `Check out ${selectedLocationDetails.name}`,
                                url: `https://www.google.com/maps/search/?api=1&query=${selectedLocationDetails.location.latitude},${selectedLocationDetails.location.longitude}`,
                              })
                            } else {
                              // Fallback
                              navigator.clipboard.writeText(
                                `${selectedLocationDetails.name}: https://www.google.com/maps/search/?api=1&query=${selectedLocationDetails.location.latitude},${selectedLocationDetails.location.longitude}`
                              )
                              alert("Link copied to clipboard!")
                            }
                          }}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="h-4 w-4"
                          >
                            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                            <polyline points="16 6 12 2 8 6" />
                            <line x1="12" y1="2" x2="12" y2="15" />
                          </svg>
                          Share Location
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-slate-500">No location selected</p>
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="map" className="mt-4">
              {selectedLocationDetails && (
                <div className="h-[400px] rounded-md overflow-hidden bg-slate-100 dark:bg-slate-700">
                  {isLoaded ? (
                    <iframe
                      title="Location Map"
                      width="100%"
                      height="100%"
                      frameBorder="0"
                      src={`https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&q=${selectedLocationDetails.location.latitude},${selectedLocationDetails.location.longitude}&zoom=16`}
                      allowFullScreen
                    ></iframe>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
                    </div>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="nearby" className="mt-4">
              <ScrollArea className="h-[400px] pr-4">
                {selectedLocationDetails && selectedLocationDetails.location ? (
                  <NearbyPlaces
                    latitude={selectedLocationDetails.location.latitude}
                    longitude={selectedLocationDetails.location.longitude}
                    onSelectLocation={(place) => {
                      setSelectedLocationDetails(place)
                      setMapCenter({
                        lat: place.location.latitude,
                        lng: place.location.longitude,
                      })
                      setMapZoom(15)
                    }}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-slate-500">No location selected</p>
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  )
}