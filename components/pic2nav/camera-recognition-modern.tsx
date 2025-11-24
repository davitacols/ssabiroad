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
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mapRef = useRef<HTMLDivElement>(null)
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
      const mapOptions = {
        zoom: 15,
        center: userLocation || { lat: 40.7128, lng: -74.0060 },
        mapTypeId: mapType || 'roadmap',
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

      const newMap = new window.google.maps.Map(mapRef.current, mapOptions)
      setMap(newMap)

      if (userLocation) {
        // Enhanced user location marker with animation
        const marker = new window.google.maps.Marker({
          position: userLocation,
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
        position: location,
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

    const loadGoogleMaps = () => {
      if (window.google && window.google.maps) {
        setTimeout(initializeMap, 100)
        return
      }

      const script = document.createElement('script')
      script.src = 'https://maps.googleapis.com/maps/api/js?key=AIzaSyBXLKbWmpZpE9wm7hEZ6PVEYR6y9ewR5ho&libraries=places'
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

    // Get high-accuracy location
    if (navigator.geolocation) {
      const options = {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      }
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          }
          setUserLocation(location)
          setLocationAccuracy(position.coords.accuracy)
          
          // Add accuracy circle if available
          if (map && position.coords.accuracy < 1000) {
            const circle = new window.google.maps.Circle({
              strokeColor: "#4285f4",
              strokeOpacity: 0.3,
              strokeWeight: 1,
              fillColor: "#4285f4",
              fillOpacity: 0.1,
              map: map,
              center: location,
              radius: position.coords.accuracy,
            })
            setAccuracyCircle(circle)
          }
          
          // Search for nearby places
          if (map) {
            const service = new window.google.maps.places.PlacesService(map)
            const request = {
              location: location,
              radius: 1000,
              type: 'point_of_interest'
            }
            
            service.nearbySearch(request, (results: any, status: any) => {
              if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
                setNearbyPlaces(results.slice(0, 5))
              }
            })
          }
        },
        (error) => {
          console.log('Geolocation error:', error)
          // Use default location if geolocation fails
          setUserLocation({ latitude: 40.7128, longitude: -74.0060 })
        },
        options
      )
    }
  }, [])



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

      {/* Logo and Search Bar */}
      <div className="absolute top-3 sm:top-6 left-3 sm:left-6 right-3 sm:right-6 z-40">
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Logo */}
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white border-2 border-black flex items-center justify-center">
            <img src="/pic2nav.png" alt="Pic2Nav" className="w-8 h-8 sm:w-10 sm:h-10 object-contain" />
          </div>
          
          {/* Search Toggle Button */}
          <button 
            onClick={() => setShowSearchBar(!showSearchBar)}
            className="w-10 h-10 sm:w-12 sm:h-12 bg-white border-2 border-black text-black hover:bg-black hover:text-white flex items-center justify-center transition-all duration-200"
          >
            <Search className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          
          {/* Collapsible Search Bar */}
          {showSearchBar && (
            <div className="flex-1 bg-white/95 backdrop-blur-xl rounded-xl sm:rounded-2xl shadow-2xl border border-white/20 flex items-center px-3 sm:px-5 py-3 sm:py-4">
              <button onClick={() => setShowSidebar(!showSidebar)} className="mr-2 sm:mr-4 w-8 h-8 sm:w-10 sm:h-10 bg-white border-2 border-black text-black hover:bg-black hover:text-white flex items-center justify-center transition-all duration-200">
                <Menu className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              <input 
                type="text" 
                placeholder="Search locations..." 
                className="flex-1 outline-none text-gray-800 bg-transparent placeholder-gray-500 font-medium text-sm sm:text-base"
                autoFocus
              />
              <button 
                onClick={() => setShowSearchBar(false)}
                className="ml-2 sm:ml-4 w-6 h-6 sm:w-8 sm:h-8 bg-white border-2 border-black text-black hover:bg-black hover:text-white flex items-center justify-center transition-all duration-200"
              >
                <X className="w-3 h-3 sm:w-4 sm:h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Floating Sidebar */}
      {showSidebar && (
        <div className="absolute top-20 sm:top-32 left-3 sm:left-6 w-[calc(100vw-24px)] sm:w-80 max-h-[calc(100vh-100px)] sm:max-h-[calc(100vh-160px)] bg-white/95 backdrop-blur-xl rounded-xl sm:rounded-2xl shadow-2xl border border-white/20 z-50 overflow-hidden">
          <div className="p-3 sm:p-5 border-b border-gray-200/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-3">
                <img src="/pic2nav.png" alt="Pic2Nav" className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg" />
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">Locations</h2>
              </div>
              <button onClick={() => setShowSidebar(false)} className="w-8 h-8 sm:w-10 sm:h-10 bg-white border-2 border-black text-black hover:bg-black hover:text-white flex items-center justify-center transition-all duration-200">
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>
          <div className="p-3 sm:p-5 space-y-2 sm:space-y-3 overflow-y-auto max-h-80 sm:max-h-96">
            {uploadHistory.length === 0 ? (
              <div className="text-center py-8 sm:py-12">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <MapPin className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
                </div>
                <p className="text-gray-500 font-medium text-sm sm:text-base">No locations discovered yet</p>
                <p className="text-gray-400 text-xs sm:text-sm mt-1">Upload an image to get started</p>
              </div>
            ) : (
              uploadHistory.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg sm:rounded-xl hover:bg-gray-50 cursor-pointer transition-all duration-200 border border-gray-100 hover:border-gray-200 hover:shadow-md" onClick={() => item.location && map?.panTo(item.location)}>
                  <img src={item.url} alt={item.name} className="w-12 h-12 sm:w-14 sm:h-14 object-cover rounded-lg sm:rounded-xl shadow-sm" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate text-gray-900 text-sm sm:text-base">{item.name}</p>
                    <p className="text-gray-500 text-xs sm:text-sm font-medium">{new Date(item.timestamp).toLocaleTimeString()}</p>
                    {item.location && (
                      <div className="flex items-center gap-1 mt-1 sm:mt-2 bg-emerald-50 px-2 py-1 rounded-md sm:rounded-lg w-fit">
                        <MapPin className="w-2 h-2 sm:w-3 sm:h-3 text-emerald-600" />
                        <span className="text-emerald-700 text-xs font-semibold">Located</span>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Floating Map Controls */}
      <div className="absolute top-20 sm:top-32 right-3 sm:right-6 z-40 space-y-1 sm:space-y-2">
        <button 
          onClick={() => {
            const newMapType = mapType === 'roadmap' ? 'satellite' : 'roadmap'
            setMapType(newMapType)
            map?.setMapTypeId(newMapType)
          }}
          className="w-10 h-10 sm:w-12 sm:h-12 bg-white border-2 border-black text-black hover:bg-black hover:text-white flex items-center justify-center transition-all duration-200"
          title={`Switch to ${mapType === 'roadmap' ? 'Satellite' : 'Road'} View`}
        >
          <Layers className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
        
        <button 
          onClick={() => {
            if (showTraffic && trafficLayer) {
              trafficLayer.setMap(null)
              setTrafficLayer(null)
              setShowTraffic(false)
            } else {
              const newTrafficLayer = new window.google.maps.TrafficLayer()
              newTrafficLayer.setMap(map)
              setTrafficLayer(newTrafficLayer)
              setShowTraffic(true)
            }
          }}
          className={`w-10 h-10 sm:w-12 sm:h-12 border-2 border-black hover:bg-black hover:text-white flex items-center justify-center transition-all duration-200 ${
            showTraffic ? 'bg-red-500 text-white' : 'bg-white text-black'
          }`}
          title="Toggle Traffic"
        >
          <Car className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
        
        <button 
          onClick={() => {
            if (showTransit && transitLayer) {
              transitLayer.setMap(null)
              setTransitLayer(null)
              setShowTransit(false)
            } else {
              const newTransitLayer = new window.google.maps.TransitLayer()
              newTransitLayer.setMap(map)
              setTransitLayer(newTransitLayer)
              setShowTransit(true)
            }
          }}
          className={`w-10 h-10 sm:w-12 sm:h-12 border-2 border-black hover:bg-black hover:text-white flex items-center justify-center transition-all duration-200 ${
            showTransit ? 'bg-green-500 text-white' : 'bg-white text-black'
          }`}
          title="Toggle Transit"
        >
          <Bus className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
        
        <button 
          onClick={() => {
            if (showBiking && bikeLayer) {
              bikeLayer.setMap(null)
              setBikeLayer(null)
              setShowBiking(false)
            } else {
              const newBikeLayer = new window.google.maps.BicyclingLayer()
              newBikeLayer.setMap(map)
              setBikeLayer(newBikeLayer)
              setShowBiking(true)
            }
          }}
          className={`w-10 h-10 sm:w-12 sm:h-12 border-2 border-black hover:bg-black hover:text-white flex items-center justify-center transition-all duration-200 ${
            showBiking ? 'bg-orange-500 text-white' : 'bg-white text-black'
          }`}
          title="Toggle Biking"
        >
          <Bike className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
        
        {userLocation && (
          <button 
            onClick={() => {
              map?.panTo(userLocation)
              map?.setZoom(16)
            }}
            className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-500 border-2 border-black text-white hover:bg-black hover:text-white flex items-center justify-center transition-all duration-200"
            title="Center on My Location"
          >
            <Navigation className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        )}
        
        <button 
          onClick={() => setShowLocationInfo(!showLocationInfo)}
          className={`w-10 h-10 sm:w-12 sm:h-12 border-2 border-black hover:bg-black hover:text-white flex items-center justify-center transition-all duration-200 ${
            showLocationInfo ? 'bg-purple-500 text-white' : 'bg-white text-black'
          }`}
          title="Location Info"
        >
          <MapPin className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      </div>

      {/* Floating Action Buttons */}
      <div className="absolute bottom-4 sm:bottom-8 left-1/2 -translate-x-1/2 z-40">
        <div className="flex items-center gap-2 sm:gap-3">
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="w-14 h-14 sm:w-16 sm:h-16 bg-white border-2 border-black hover:bg-black hover:text-white flex items-center justify-center transition-all duration-200 text-black hover:text-white"
          >
            <Upload className="w-6 h-6 sm:w-7 sm:h-7" />
          </button>
          
          <button 
            onClick={startCamera} 
            disabled={isStartingCamera}
            className="w-14 h-14 sm:w-16 sm:h-16 bg-black border-2 border-black text-white hover:bg-white hover:text-black flex items-center justify-center transition-all duration-200 disabled:opacity-50"
          >
            {isStartingCamera ? <Loader2 className="w-6 h-6 sm:w-7 sm:h-7 animate-spin" /> : <Camera className="w-6 h-6 sm:w-7 sm:h-7" />}
          </button>
        </div>
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
        <div className="absolute bottom-24 left-6 z-40 w-80">
          <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-4">
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
      
      {/* Modern Result Card */}
      {result && (
        <div className="absolute top-8 left-4 right-4 z-40 transition-all duration-300">
          <div className="bg-white/90 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/20 max-w-2xl mx-auto max-h-[85vh] flex flex-col overflow-hidden">
            {result.success ? (
              <>
                {/* Success Header */}
                <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-8 flex-shrink-0 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10"></div>
                  <div className="relative flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                          <MapPin className="w-4 h-4 text-blue-400" />
                        </div>
                        <span className="text-xs font-medium text-blue-300">LOCATION IDENTIFIED</span>
                      </div>
                      <h3 className="text-3xl font-bold mb-3 tracking-tight">{result.name || "Unknown Location"}</h3>
                      {result.address && (
                        <p className="text-slate-300 text-sm leading-relaxed">{result.address}</p>
                      )}
                    </div>
                    <button 
                      onClick={() => setResult(null)}
                      className="w-10 h-10 bg-white/5 hover:bg-white/10 rounded-full flex items-center justify-center transition-all backdrop-blur-sm"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                
                <div className="flex-1 overflow-y-auto">
                  <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 backdrop-blur-sm px-4 py-2.5 border-b border-amber-200/50">
                    <p className="text-xs text-amber-900 font-medium">⚠️ Estimated data - not real-time</p>
                  </div>
                  <Tabs defaultValue="overview" className="w-full">
                    <TabsList className="grid w-full grid-cols-4 bg-slate-50/50 backdrop-blur-sm border-b border-slate-200/50 p-1">
                      <TabsTrigger value="overview" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Overview</TabsTrigger>
                      <TabsTrigger value="business" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Business</TabsTrigger>
                      <TabsTrigger value="area" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Area</TabsTrigger>
                      <TabsTrigger value="insights" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Insights</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="overview" className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      {result.confidence && (
                        <div className="relative bg-gradient-to-br from-white to-slate-50 rounded-2xl p-5 shadow-lg border border-slate-200/50">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-slate-600 text-xs font-semibold uppercase tracking-wider">Confidence</span>
                            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">{Math.round(result.confidence * 100)}%</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                            <div 
                              className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 h-3 rounded-full transition-all duration-700 shadow-lg" 
                              style={{ width: `${result.confidence * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      )}
                      
                      {result.location && (
                        <div className="relative bg-gradient-to-br from-white to-slate-50 rounded-2xl p-5 shadow-lg border border-slate-200/50">
                          <span className="text-slate-600 text-xs font-semibold uppercase tracking-wider block mb-3">Coordinates</span>
                          <p className="text-slate-900 text-sm font-mono font-semibold">
                            {result.location.latitude.toFixed(4)}, {result.location.longitude.toFixed(4)}
                          </p>
                        </div>
                      )}
                    </div>
                    
                    {result.analysis && (
                      <div className="relative bg-gradient-to-br from-white to-slate-50 rounded-2xl p-5 shadow-lg border border-slate-200/50">
                        <h4 className="text-slate-900 font-bold text-base mb-4 tracking-tight">Building Analysis</h4>
                        <div className="space-y-2.5">
                          {[
                            { key: 'architecture', label: 'Architecture', value: result.analysis.architecture },
                            { key: 'buildingType', label: 'Building Type', value: result.analysis.buildingType },
                            { key: 'historicalPeriod', label: 'Period', value: result.analysis.historicalPeriod },
                            { key: 'condition', label: 'Condition', value: result.analysis.condition }
                          ].filter(item => item.value).map((item) => (
                            <div key={item.key} className="flex items-center justify-between py-2.5">
                              <span className="text-gray-500 text-xs font-medium uppercase tracking-wide">{item.label}</span>
                              <span className="text-gray-900 text-sm font-semibold">{item.value}</span>
                            </div>
                          ))}
                          
                          {result.analysis.materials && result.analysis.materials.length > 0 && (
                            <div className="pt-3 border-t border-gray-100">
                              <span className="text-gray-500 text-xs font-medium uppercase tracking-wide block mb-2">Materials</span>
                              <div className="flex flex-wrap gap-2">
                                {result.analysis.materials.map((material, idx) => (
                                  <span key={idx} className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-medium">
                                    {material}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {result.analysis.significance && (
                            <div className="pt-3 border-t border-gray-100">
                              <span className="text-gray-500 text-xs font-medium uppercase tracking-wide block mb-2">Significance</span>
                              <p className="text-gray-700 text-sm leading-relaxed">{result.analysis.significance}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    </TabsContent>
                    
                    <TabsContent value="business" className="p-6 space-y-4">
                      {result.nearbyPlaces && result.nearbyPlaces.length > 0 ? (
                        <div className="relative bg-gradient-to-br from-white to-slate-50 rounded-2xl p-5 shadow-lg border border-slate-200/50">
                          <h4 className="text-slate-900 font-bold text-base mb-4 tracking-tight">Nearby Places</h4>
                          <div className="space-y-3">
                            {result.nearbyPlaces.slice(0, 5).map((place: any, idx: number) => (
                              <div key={idx} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                                <div>
                                  <p className="font-semibold text-sm text-slate-900">{place.name}</p>
                                  <p className="text-xs text-slate-500">{place.type}</p>
                                </div>
                                {place.distance && <span className="text-xs text-slate-600">{place.distance}m</span>}
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <p className="text-slate-500 text-sm">No nearby places data available</p>
                        </div>
                      )}
                    </TabsContent>
                    
                    <TabsContent value="area" className="p-6 space-y-4">
                      <div className="text-center py-8">
                        <p className="text-slate-500 text-sm">No environmental data available</p>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="insights" className="p-6 space-y-4">
                      <div className="text-center py-8">
                        <p className="text-slate-500 text-sm">No additional insights available</p>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
                
                {result.location && (
                  <div className="p-6 bg-gradient-to-br from-slate-50 to-white border-t border-slate-200/50 flex-shrink-0">
                    <button 
                      onClick={() => {
                        if (result.location) {
                          const { latitude, longitude } = result.location
                          const locationName = encodeURIComponent(result.name || 'Detected Location')
                          const googleMapsUrl = `https://www.google.com/maps/search/${locationName}/@${latitude},${longitude},17z`
                          window.open(googleMapsUrl, '_blank')
                        }
                      }}
                      className="w-full bg-gradient-to-r from-slate-900 to-slate-800 hover:from-slate-800 hover:to-slate-700 text-white font-bold py-4 px-6 rounded-2xl transition-all duration-200 flex items-center justify-center gap-3 shadow-xl hover:shadow-2xl hover:scale-[1.02] active:scale-95"
                    >
                      <MapPin className="w-5 h-5" />
                      Open in Google Maps
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
                
                <div className="p-6">
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

      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) handleFileSelect(file) }} />
      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}