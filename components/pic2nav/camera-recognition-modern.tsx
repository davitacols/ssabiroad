"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { Camera, Upload, X, MapPin, Loader2, Navigation, Menu, Search, Layers, Car, Bus, Bike, Building2, Users, Leaf, DollarSign, Shield, Landmark } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface Location {
  latitude: number
  longitude: number
}

interface RecognitionResult {
  success: boolean
  name?: string
  address?: string
  location?: Location
  confidence?: number
  error?: string
  analysis?: {
    architecture?: string
    buildingType?: string
    historicalPeriod?: string
    materials?: string[]
    condition?: string
    significance?: string
    surroundings?: string
    accessibility?: string
  }
  enhancedAnalysis?: {
    businessAnalysis?: {
      businessType: string
      operatingHours: string
      footTraffic: string
      accessibility: {
        wheelchairAccessible: boolean
        publicTransportAccess: string
        parkingAvailability: string
      }
    }
    environmentalAnalysis?: {
      airQuality: {
        rating: string
        index: number
      }
      noiseLevel: {
        rating: string
        decibels: number
      }
    }
    socialAnalysis?: {
      walkability: {
        score: number
      }
    }
    safetyAnalysis?: {
      crimeStatistics: {
        overallSafety: string
        trends: string
      }
    }
    economicAnalysis?: {
      propertyValues: {
        priceRange: string
        trend: string
      }
      employment: {
        unemploymentRate: number
      }
    }
    culturalAnalysis?: {
      communityCharacter: string
    }
  }
}

declare global {
  interface Window {
    google: any
    initMap: () => void
  }
}

export function CameraRecognitionModern() {
  const [isProcessing, setIsProcessing] = useState(false)
  const [result, setResult] = useState<RecognitionResult | null>(null)
  const [cameraActive, setCameraActive] = useState(false)
  const [uploadHistory, setUploadHistory] = useState<Array<{url: string, name: string, timestamp: number, location?: Location}>>([])
  const [isStartingCamera, setIsStartingCamera] = useState(false)
  const [map, setMap] = useState<any>(null)
  const [markers, setMarkers] = useState<any[]>([])
  const [userLocation, setUserLocation] = useState<Location | null>(null)
  const [showSidebar, setShowSidebar] = useState(false)
  const [showSearchBar, setShowSearchBar] = useState(false)
  const [mapType, setMapType] = useState('roadmap')
  const [trafficLayer, setTrafficLayer] = useState<any>(null)
  const [transitLayer, setTransitLayer] = useState<any>(null)
  const [bikeLayer, setBikeLayer] = useState<any>(null)
  const [showTraffic, setShowTraffic] = useState(false)
  const [showTransit, setShowTransit] = useState(false)
  const [showBiking, setShowBiking] = useState(false)
  const [userMarker, setUserMarker] = useState<any>(null)
  const [accuracyCircle, setAccuracyCircle] = useState<any>(null)
  const [locationAccuracy, setLocationAccuracy] = useState<number | null>(null)
  const [nearbyPlaces, setNearbyPlaces] = useState<any[]>([])
  const [showLocationInfo, setShowLocationInfo] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mapRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const processImage = useCallback(async (file: File) => {
    setIsProcessing(true)
    setResult(null)

    try {
      const formData = new FormData()
      formData.append("image", file)
      
      const response = await fetch('/api/location-recognition-v2', {
        method: "POST",
        body: formData,
      })

      if (!response.ok) throw new Error(`API error: ${response.status}`)

      const data = await response.json()
      
      if (data.error && (data.error.includes('API error: 401') || data.error.includes('Authentication failed'))) {
        const friendlyError = {
          success: false,
          error: "Service temporarily unavailable. Please try again later or contact support if the issue persists."
        }
        setResult(friendlyError)
        toast({
          title: "Service Error",
          description: "Unable to process image at this time. Please try again.",
          variant: "destructive",
        })
        return
      }
      
      setResult(data)
      
      if (data.success) {
        toast({
          title: "Location identified",
          description: data.name || "Location found",
        })
      } else if (data.error && !data.error.includes('API error')) {
        toast({
          title: "Recognition failed",
          description: data.error,
          variant: "destructive",
        })
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Recognition failed"
      setResult({ success: false, error: errorMessage })
      toast({
        title: "Recognition failed",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }, [toast])

  const handleFileSelect = useCallback((file: File) => {
    if (!file) return
    
    const url = URL.createObjectURL(file)
    setUploadHistory(prev => [{ url, name: file.name, timestamp: Date.now() }, ...prev.slice(0, 4)])
    processImage(file)
  }, [processImage])

  const initializeMap = useCallback(() => {
    if (!mapRef.current || !window.google || !window.google.maps) return

    try {
      const center = userLocation ? { lat: userLocation.latitude, lng: userLocation.longitude } : { lat: 0, lng: 0 }
      
      const mapOptions = {
        zoom: userLocation ? 15 : 2,
        center: center,
        mapTypeId: mapType || 'roadmap',
        mapTypeControl: true,
        mapTypeControlOptions: {
          style: window.google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
          position: window.google.maps.ControlPosition.TOP_CENTER
        },
        fullscreenControl: true,
        fullscreenControlOptions: {
          position: window.google.maps.ControlPosition.RIGHT_TOP
        },
        streetViewControl: true,
        streetViewControlOptions: {
          position: window.google.maps.ControlPosition.RIGHT_TOP
        },
        zoomControl: true,
        zoomControlOptions: {
          position: window.google.maps.ControlPosition.RIGHT_CENTER
        },
        scaleControl: true,
        rotateControl: true,
        gestureHandling: 'greedy',
        clickableIcons: true,
        disableDoubleClickZoom: false,
        styles: [
          {
            featureType: "poi",
            elementType: "labels",
            stylers: [{ visibility: "on" }]
          },
          {
            featureType: "transit",
            elementType: "labels",
            stylers: [{ visibility: "on" }]
          }
        ]
      }

      const newMap = new window.google.maps.Map(mapRef.current, mapOptions)
      setMap(newMap)

      // Add click listener for map
      newMap.addListener('click', (e: any) => {
        if (e.placeId) {
          e.stop()
          const service = new window.google.maps.places.PlacesService(newMap)
          service.getDetails({ placeId: e.placeId }, (place: any, status: any) => {
            if (status === window.google.maps.places.PlacesServiceStatus.OK && place) {
              const infoWindow = new window.google.maps.InfoWindow({
                content: `
                  <div class="p-3">
                    <h3 class="font-bold text-base mb-2">${place.name}</h3>
                    <p class="text-sm text-gray-600 mb-2">${place.formatted_address || ''}</p>
                    ${place.rating ? `<p class="text-sm">★ ${place.rating} (${place.user_ratings_total || 0} reviews)</p>` : ''}
                  </div>
                `
              })
              infoWindow.setPosition(e.latLng)
              infoWindow.open(newMap)
            }
          })
        }
      })

      // Pan to user location when available
      if (userLocation) {
        newMap.panTo({ lat: userLocation.latitude, lng: userLocation.longitude })
        newMap.setZoom(15)
      }

      if (userLocation) {
        // Enhanced user location marker with animation
        const marker = new window.google.maps.Marker({
          position: { lat: userLocation.latitude, lng: userLocation.longitude },
          map: newMap,
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 12,
            fillColor: "#4285f4",
            fillOpacity: 1,
            strokeColor: "#ffffff",
            strokeWeight: 3,
          },
          title: "Your Current Location",
          zIndex: 1000,
        })
        setUserMarker(marker)

        // Add pulsing animation
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
          
          if (marker) {
            marker.setIcon({
              path: window.google.maps.SymbolPath.CIRCLE,
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
        
        // Fetch nearby places and update on map move
        const updateNearbyPlaces = () => {
          if (window.google?.maps?.places) {
            const service = new window.google.maps.places.PlacesService(newMap)
            const center = newMap.getCenter()
            service.nearbySearch(
              { location: center, radius: 1000, type: 'point_of_interest' },
              (results: any, status: any) => {
                if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
                  setNearbyPlaces(results.slice(0, 5))
                }
              }
            )
          }
        }
        
        updateNearbyPlaces()
        newMap.addListener('idle', updateNearbyPlaces)
      }
    } catch (error) {
      console.error('Map initialization error:', error)
    }
  }, [userLocation, mapType])

  const addLocationMarker = useCallback((location: Location, name: string, analysisData?: any) => {
    if (!map || !window.google || !window.google.maps) return

    try {
      // Enhanced marker with custom icon
      const marker = new window.google.maps.Marker({
        position: { lat: location.latitude, lng: location.longitude },
        map: map,
        title: name,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 15,
          fillColor: "#10b981",
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 3,
        },
        animation: window.google.maps.Animation.DROP
      })

      // Rich info window with analysis data
      const infoContent = `
        <div class="p-4 max-w-xs">
          <div class="flex items-center gap-2 mb-3">
            <div class="w-3 h-3 bg-green-500 rounded-full"></div>
            <h3 class="font-bold text-lg text-gray-900">${name}</h3>
          </div>
          ${analysisData ? `
            <div class="space-y-2 mb-4">
              ${analysisData.architecture ? `<p class="text-sm"><span class="font-medium text-gray-600">Architecture:</span> ${analysisData.architecture}</p>` : ''}
              ${analysisData.buildingType ? `<p class="text-sm"><span class="font-medium text-gray-600">Type:</span> ${analysisData.buildingType}</p>` : ''}
              ${analysisData.historicalPeriod ? `<p class="text-sm"><span class="font-medium text-gray-600">Period:</span> ${analysisData.historicalPeriod}</p>` : ''}
              ${analysisData.condition ? `<p class="text-sm"><span class="font-medium text-gray-600">Condition:</span> ${analysisData.condition}</p>` : ''}
            </div>
          ` : ''}
          <div class="text-xs text-gray-500 font-mono bg-gray-100 p-2 rounded">
            ${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}
          </div>
          <div class="mt-3 flex gap-2">
            <button onclick="window.open('https://www.google.com/maps/dir/?api=1&destination=${location.latitude},${location.longitude}', '_blank')" 
                    class="text-xs bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600">
              Directions
            </button>
            <button onclick="window.open('https://www.google.com/maps/@${location.latitude},${location.longitude},19z', '_blank')" 
                    class="text-xs bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600">
              Street View
            </button>
          </div>
        </div>
      `

      const infoWindow = new window.google.maps.InfoWindow({
        content: infoContent,
        maxWidth: 300
      })

      marker.addListener("click", () => {
        infoWindow.open(map, marker)
      })

      // Auto-open info window for detected locations
      setTimeout(() => {
        infoWindow.open(map, marker)
      }, 1000)

      setMarkers(prev => [...prev, marker])
    } catch (error) {
      console.error('Error adding marker:', error)
    }
  }, [map])

  const startCamera = useCallback(async () => {
    setIsStartingCamera(true)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false,
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        setCameraActive(true)
        await videoRef.current.play()
      }
    } catch (error) {
      toast({
        title: "Camera error",
        description: "Could not access camera",
        variant: "destructive",
      })
    } finally {
      setIsStartingCamera(false)
    }
  }, [toast])

  const stopCamera = useCallback(() => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach(track => track.stop())
      videoRef.current.srcObject = null
      setCameraActive(false)
    }
  }, [])

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    
    const context = canvas.getContext("2d")
    if (!context) return

    context.drawImage(video, 0, 0)
    
    canvas.toBlob((blob) => {
      if (!blob) return
      const file = new File([blob], `capture-${Date.now()}.jpg`, { type: "image/jpeg" })
      handleFileSelect(file)
      stopCamera()
    }, "image/jpeg", 0.95)
  }, [handleFileSelect, stopCamera])

  useEffect(() => {
    if (typeof window === 'undefined') return

    // Get user location immediately
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          }
          setUserLocation(location)
          setLocationAccuracy(position.coords.accuracy)
        },
        (error) => {
          console.log('Geolocation error:', error)
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      )
    }

    const loadGoogleMaps = () => {
      if (window.google && window.google.maps) {
        setTimeout(initializeMap, 100)
        return
      }

      const script = document.createElement('script')
      script.src = 'https://maps.googleapis.com/maps/api/js?key=AIzaSyBXLKbWmpZpE9wm7hEZ6PVEYR6y9ewR5ho&libraries=places,geometry'
      script.async = true
      script.defer = true
      script.onload = () => {
        setTimeout(initializeMap, 100)
      }
      script.onerror = () => {
        console.error('Failed to load Google Maps')
      }
      document.head.appendChild(script)
    }

    loadGoogleMaps()
  }, [initializeMap])



  useEffect(() => {
    if (result?.success && result.location) {
      addLocationMarker(result.location, result.name || 'Detected Location')
      setUploadHistory(prev => 
        prev.map((item, idx) => 
          idx === 0 ? { ...item, location: result.location } : item
        )
      )
    }
  }, [result, addLocationMarker])

  useEffect(() => {
    if (!showSearchBar || !searchInputRef.current || !map || !window.google?.maps?.places) return

    const input = searchInputRef.current
    const autocompleteInstance = new window.google.maps.places.Autocomplete(input, {
      fields: ['formatted_address', 'geometry', 'name', 'place_id', 'types', 'address_components']
    })

    autocompleteInstance.bindTo('bounds', map)

    const listener = autocompleteInstance.addListener('place_changed', () => {
      const place = autocompleteInstance.getPlace()
      
      if (!place.geometry?.location) {
        return
      }

      const latLng = place.geometry.location
      const location = {
        latitude: latLng.lat(),
        longitude: latLng.lng()
      }

      map.panTo(latLng)
      map.setZoom(17)
      addLocationMarker(location, place.name || place.formatted_address || 'Searched Location', null)
      
      // Fetch nearby places
      if (window.google?.maps?.places) {
        const service = new window.google.maps.places.PlacesService(map)
        service.nearbySearch(
          {
            location: latLng,
            radius: 500,
            type: 'point_of_interest'
          },
          (results: any, status: any) => {
            if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
              const placesWithDistance = results.slice(0, 10).map((p: any) => ({
                name: p.name,
                type: p.types?.[0]?.replace(/_/g, ' ') || 'Place',
                distance: p.geometry?.location ? 
                  Math.round(window.google.maps.geometry.spherical.computeDistanceBetween(latLng, p.geometry.location)) : null
              }))
              
              setResult({
                success: true,
                name: place.name || 'Searched Location',
                address: place.formatted_address,
                location: location,
                confidence: 1,
                nearbyPlaces: placesWithDistance
              })
            }
          }
        )
      }
      
      toast({
        title: "Location found",
        description: place.name || place.formatted_address,
      })
      
      setSearchQuery('')
      setShowSearchBar(false)
    })

    return () => {
      window.google.maps.event.removeListener(listener)
    }
  }, [showSearchBar, map])

  return (
    <div className="h-screen w-screen relative overflow-hidden">
      {/* Full Screen Map */}
      <div ref={mapRef} className="absolute inset-0 w-full h-full" />
      
      {/* Camera Overlay */}
      {cameraActive && (
        <div className="absolute inset-0 z-50 bg-black">
          <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline muted />
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-4">
            <button onClick={stopCamera} className="w-16 h-16 bg-white border-2 border-black text-black hover:bg-black hover:text-white flex items-center justify-center transition-all duration-200">
              <X className="w-6 h-6" />
            </button>
            <button onClick={capturePhoto} className="w-20 h-20 bg-black border-2 border-black text-white hover:bg-white hover:text-black flex items-center justify-center transition-all duration-200">
              <Camera className="w-8 h-8" />
            </button>
          </div>
        </div>
      )}

      {/* Mobile Header */}
      <div className="absolute top-4 left-4 right-4 z-40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-lg">
              <img src="/pic2nav.png" alt="Pic2Nav" className="w-6 h-6 object-contain" />
            </div>
            <button 
              onClick={() => setShowSidebar(!showSidebar)}
              className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-lg"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
          <button 
            onClick={() => setShowSearchBar(!showSearchBar)}
            className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-lg"
          >
            <Search className="w-5 h-5" />
          </button>
        </div>
        
        {/* Search Bar */}
        {showSearchBar && (
          <div className="mt-3 bg-white rounded-lg shadow-lg p-3">
            <input 
              ref={searchInputRef}
              type="text" 
              placeholder="Search places..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full outline-none text-gray-800 placeholder-gray-500"
              autoFocus
            />
          </div>
        )}
      </div>

      {/* Mobile Sidebar */}
      {showSidebar && (
        <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setShowSidebar(false)}>
          <div className="absolute left-0 top-0 bottom-0 w-80 max-w-[85vw] bg-white" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">Locations</h2>
                <button onClick={() => setShowSidebar(false)} className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="p-4 overflow-y-auto h-full">
              {uploadHistory.length === 0 ? (
                <div className="text-center py-12">
                  <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No locations yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {uploadHistory.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50" onClick={() => item.location && map?.panTo(item.location)}>
                      <img src={item.url} alt={item.name} className="w-12 h-12 object-cover rounded-lg" />
                      <div className="flex-1">
                        <p className="font-medium text-sm truncate">{item.name}</p>
                        <p className="text-xs text-gray-500">{new Date(item.timestamp).toLocaleTimeString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Map Controls */}
      <div className="absolute top-20 right-4 z-40 space-y-2">
        {userLocation && (
          <button 
            onClick={() => {
              map?.panTo({ lat: userLocation.latitude, lng: userLocation.longitude })
              map?.setZoom(16)
            }}
            className="w-10 h-10 bg-blue-500 text-white rounded-lg shadow-lg flex items-center justify-center"
          >
            <Navigation className="w-5 h-5" />
          </button>
        )}
        <button 
          onClick={() => {
            const newMapType = mapType === 'roadmap' ? 'satellite' : 'roadmap'
            setMapType(newMapType)
            map?.setMapTypeId(newMapType)
          }}
          className="w-10 h-10 bg-white rounded-lg shadow-lg flex items-center justify-center"
        >
          <Layers className="w-5 h-5" />
        </button>
      </div>

      {/* Action Buttons */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-40 flex gap-4">
        <button 
          onClick={startCamera}
          disabled={isStartingCamera}
          className="w-16 h-16 bg-blue-500 text-white rounded-full shadow-xl flex items-center justify-center disabled:opacity-50"
        >
          {isStartingCamera ? <Loader2 className="w-6 h-6 animate-spin" /> : <Camera className="w-6 h-6" />}
        </button>
        <button 
          onClick={() => fileInputRef.current?.click()}
          className="w-16 h-16 bg-black text-white rounded-full shadow-xl flex items-center justify-center"
        >
          <Upload className="w-6 h-6" />
        </button>
      </div>

      {/* Processing Overlay */}
      {isProcessing && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50">
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-8 text-center shadow-2xl border border-white/20 max-w-sm mx-6">
            <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-6"></div>
            <p className="text-xl font-bold text-gray-900 mb-2">Analyzing Image</p>
            <p className="text-gray-600 font-medium">Extracting location data with AI...</p>
          </div>
        </div>
      )}

      {/* Location Info Panel */}
      {showLocationInfo && userLocation && (
        <div className="absolute bottom-24 left-3 sm:left-6 z-40 w-[calc(100vw-24px)] sm:w-80 max-w-sm">
          <div className="bg-white/95 backdrop-blur-xl rounded-xl sm:rounded-2xl shadow-2xl border border-white/20 p-3 sm:p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold text-gray-900">Current Location</h3>
              <button 
                onClick={() => setShowLocationInfo(false)}
                className="w-8 h-8 bg-white border-2 border-black hover:bg-black hover:text-white flex items-center justify-center transition-all duration-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                <span className="font-medium text-gray-900">Live Location</span>
              </div>
              
              <div className="bg-gray-50 p-2 rounded-lg font-mono text-xs">
                <p>Lat: {userLocation.latitude.toFixed(6)}</p>
                <p>Lng: {userLocation.longitude.toFixed(6)}</p>
                {locationAccuracy && (
                  <p>Accuracy: ±{Math.round(locationAccuracy)}m</p>
                )}
              </div>
              
              {nearbyPlaces.length > 0 && (
                <div className="mt-3">
                  <h4 className="font-semibold text-gray-900 mb-2">Nearby Places</h4>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {nearbyPlaces.map((place, idx) => (
                      <div key={idx} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                           onClick={() => {
                             if (place.geometry?.location) {
                               map?.panTo(place.geometry.location)
                               map?.setZoom(17)
                             }
                           }}>
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-xs truncate">{place.name}</p>
                          {place.rating && (
                            <p className="text-xs text-gray-500">★ {place.rating}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex flex-wrap gap-1 mt-3">
                {showTraffic && <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">Traffic</span>}
                {showTransit && <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">Transit</span>}
                {showBiking && <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full">Biking</span>}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Result Card */}
      {result && (
        <div className="absolute bottom-32 left-4 right-4 z-40">
          <div className="bg-white rounded-xl shadow-xl max-h-[60vh] flex flex-col overflow-hidden">
            {result.success ? (
              <>
                <div className="bg-slate-900 text-white p-4 flex-shrink-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold mb-1">{result.name || "Unknown Location"}</h3>
                      {result.address && (
                        <p className="text-slate-300 text-sm">{result.address}</p>
                      )}
                    </div>
                    <button 
                      onClick={() => setResult(null)}
                      className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4">
                  <div className="space-y-3">
                    
                    {result.confidence && (
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">Confidence</span>
                          <span className="text-lg font-bold">{Math.round(result.confidence * 100)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full" 
                            style={{ width: `${result.confidence * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                    
                    {result.location && (
                      <div className="bg-gray-50 rounded-lg p-3">
                        <span className="text-sm font-medium block mb-1">Coordinates</span>
                        <p className="text-sm font-mono">
                          {result.location.latitude.toFixed(4)}, {result.location.longitude.toFixed(4)}
                        </p>
                      </div>
                    )}
                    
                    {result.nearbyPlaces && result.nearbyPlaces.length > 0 && (
                      <div className="bg-gray-50 rounded-lg p-3">
                        <h4 className="font-medium mb-2">Nearby Places</h4>
                        <div className="space-y-2">
                          {result.nearbyPlaces.slice(0, 3).map((place: any, idx: number) => (
                            <div key={idx} className="flex justify-between text-sm">
                              <span>{place.name}</span>
                              {place.distance && <span className="text-gray-500">{place.distance}m</span>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {result.location && (
                  <div className="p-4 border-t">
                    <button 
                      onClick={() => {
                        if (result.location) {
                          const { latitude, longitude } = result.location
                          const locationName = encodeURIComponent(result.name || 'Detected Location')
                          const googleMapsUrl = `https://www.google.com/maps/search/${locationName}/@${latitude},${longitude},17z`
                          window.open(googleMapsUrl, '_blank')
                        }
                      }}
                      className="w-full bg-blue-500 text-white font-medium py-3 rounded-lg flex items-center justify-center gap-2"
                    >
                      <MapPin className="w-4 h-4" />
                      Open in Maps
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center">
                {/* Error Header */}
                <div className="bg-gradient-to-r from-red-500 to-rose-600 text-white p-4">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                    <span className="text-xs font-medium opacity-90">Recognition Failed</span>
                  </div>
                  <h3 className="text-lg font-bold">Unable to Identify Location</h3>
                </div>
                
                <div className="p-4">
                  <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-red-100">
                    <X className="w-8 h-8 text-red-500" />
                  </div>
                  <p className="text-gray-600 text-sm leading-relaxed mb-6 max-w-xs mx-auto">{result.error}</p>
                  <button 
                    onClick={() => setResult(null)}
                    className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                    aria-label="Close and try again"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) handleFileSelect(file) }} />
      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}