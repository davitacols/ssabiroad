"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { Camera, Upload, X, MapPin, Loader2, Star, Globe, Phone, Clock, ExternalLink, Users, DollarSign, Navigation, MessageSquare, TrendingUp, Activity, Database } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

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
  photos?: string[]
  rating?: number
  website?: string
  phoneNumber?: string
  category?: string
  description?: string
  openingHours?: any
  placeId?: string
  reviews?: Array<{author: string, rating: number, text: string, time: string}>
  nearbyPlaces?: Array<{name: string, type: string, distance: number}>
  priceLevel?: number
  businessStatus?: string
  types?: string[]
  userRatingsTotal?: number
}

interface CameraRecognitionProps {
  onLocationSelect?: (location: RecognitionResult) => void
}

export function CameraRecognition({ onLocationSelect }: CameraRecognitionProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [result, setResult] = useState<RecognitionResult | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [cameraActive, setCameraActive] = useState(false)

  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { toast } = useToast()



  const handleFileSelect = useCallback((file: File) => {
    if (!file) return
    
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    processImage(file)
  }, [])

  const processImage = useCallback(async (file: File) => {
    setIsProcessing(true)
    setResult(null)

    try {
      // Get user location
      const location = await getCurrentLocation()
      
      const formData = new FormData()
      formData.append("image", file)
      if (location) {
        formData.append("latitude", location.latitude.toString())
        formData.append("longitude", location.longitude.toString())
      }

      const response = await fetch("/api/location-recognition", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      let data = await response.json()
      
      // Enhance with additional details if we have a place ID or location
      if (data.success && (data.placeId || data.location)) {
        try {
          const enhancedData = await fetchPlaceDetails(data.placeId, data.location, data.name)
          data = { ...data, ...enhancedData }
        } catch (error) {
          console.warn("Failed to fetch additional place details:", error)
        }
      }
      
      setResult(data)
      
      if (data.success && onLocationSelect) {
        onLocationSelect(data)
      }
      
      if (data.success) {
        toast({
          title: "Location identified",
          description: data.name || "Location found successfully",
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
  }, [onLocationSelect, toast])

  const getCurrentLocation = useCallback((): Promise<Location | null> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(null)
        return
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          })
        },
        () => resolve(null),
        { timeout: 5000, enableHighAccuracy: true }
      )
    })
  }, [])

  const fetchPlaceDetails = useCallback(async (placeId?: string, location?: Location, name?: string) => {
    try {
      // If we have a place ID, use Google Places API
      if (placeId) {
        const response = await fetch(`/api/place-details?placeId=${placeId}`)
        if (response.ok) {
          const data = await response.json()
          return {
            photos: data.photos || [],
            rating: data.rating,
            website: data.website,
            phoneNumber: data.phoneNumber,
            openingHours: data.openingHours,
            reviews: data.reviews || [],
            priceLevel: data.priceLevel,
            businessStatus: data.businessStatus,
            types: data.types || [],
            userRatingsTotal: data.userRatingsTotal,
          }
        }
      }
      
      // Get nearby places if we have location
      const additionalData: any = {}
      if (location) {
        try {
          const nearbyResponse = await fetch(`/api/nearby-places?lat=${location.latitude}&lng=${location.longitude}`)
          if (nearbyResponse.ok) {
            const nearbyData = await nearbyResponse.json()
            additionalData.nearbyPlaces = nearbyData.places || []
          }
        } catch (error) {
          console.warn("Failed to fetch nearby places:", error)
        }
      }
      
      // Fallback: search for photos by name and location
      if (name && location) {
        const searchQuery = encodeURIComponent(`${name} photos`)
        const response = await fetch(`/api/location-photos?q=${searchQuery}&lat=${location.latitude}&lng=${location.longitude}`)
        if (response.ok) {
          const data = await response.json()
          additionalData.photos = data.photos || []
        }
      }
      
      return additionalData
    } catch (error) {
      console.warn("Error fetching place details:", error)
      return {}
    }
  }, [])

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
        setCameraActive(true)
      }
    } catch (error) {
      toast({
        title: "Camera error",
        description: "Could not access camera",
        variant: "destructive",
      })
      fileInputRef.current?.click()
    }
  }, [toast])

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    
    const context = canvas.getContext("2d")
    if (context) {
      context.drawImage(video, 0, 0)
      
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], `capture-${Date.now()}.jpg`, {
            type: "image/jpeg",
          })
          handleFileSelect(file)
          stopCamera()
        }
      }, "image/jpeg", 0.9)
    }
  }, [handleFileSelect])

  const stopCamera = useCallback(() => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach(track => track.stop())
      videoRef.current.srcObject = null
      setCameraActive(false)
    }
  }, [])

  const reset = useCallback(() => {
    setResult(null)
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
    setIsProcessing(false)
    stopCamera()
  }, [previewUrl, stopCamera])

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="space-y-6">
        {/* Main Recognition Panel */}
        <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border-0 shadow-xl">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
                <Camera className="h-5 w-5 text-white" />
              </div>
              AI Location Recognition
            </CardTitle>
          </CardHeader>
          <CardContent>
        <div className="relative aspect-video bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 rounded-2xl overflow-hidden mb-6 shadow-inner border border-slate-200/50 dark:border-slate-700/50">
          {/* Camera View */}
          {cameraActive && (
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              autoPlay
              playsInline
              muted
            />
          )}
          
          {/* Preview Image */}
          {previewUrl && !cameraActive && (
            <img
              src={previewUrl}
              alt="Preview"
              className="w-full h-full object-cover"
            />
          )}
          
          {/* Processing Overlay */}
          {isProcessing && (
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/80 to-purple-600/80 backdrop-blur-sm flex items-center justify-center">
              <div className="text-center text-white p-6 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20">
                <div className="relative">
                  <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-white" />
                  <div className="absolute inset-0 h-12 w-12 mx-auto rounded-full bg-gradient-to-r from-blue-400 to-purple-400 animate-pulse opacity-30"></div>
                </div>
                <p className="text-lg font-medium">Analyzing image...</p>
                <p className="text-sm opacity-80 mt-1">AI is processing your photo</p>
              </div>
            </div>
          )}
          
          {/* Camera Controls */}
          {cameraActive && !isProcessing && (
            <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex gap-4">
              <Button
                onClick={stopCamera}
                variant="outline"
                size="icon"
                className="rounded-full bg-white/90 backdrop-blur-sm border-white/50 hover:bg-white shadow-lg"
              >
                <X className="h-4 w-4" />
              </Button>
              <Button
                onClick={capturePhoto}
                size="lg"
                className="rounded-full w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 border-4 border-white/50 shadow-2xl hover:scale-105 transition-transform duration-200"
              >
                <div className="w-10 h-10 rounded-full bg-white/90" />
              </Button>
            </div>
          )}
          
          {/* Empty State */}
          {!cameraActive && !previewUrl && !isProcessing && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center p-8">
                <div className="relative mb-6">
                  <div className="h-20 w-20 mx-auto rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center shadow-2xl">
                    <Camera className="h-10 w-10 text-white" />
                  </div>
                  <div className="absolute -inset-2 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 opacity-20 animate-pulse"></div>
                </div>
                <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300 mb-2">AI Location Recognition</h3>
                <p className="text-slate-500 dark:text-slate-400 mb-6">Take a photo or upload an image to identify locations</p>
                <div className="flex gap-3 justify-center">
                  <Button onClick={startCamera} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300">
                    <Camera className="h-4 w-4 mr-2" />
                    Use Camera
                  </Button>
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    variant="outline"
                    className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border-slate-200 dark:border-slate-700 hover:bg-white/80 dark:hover:bg-slate-800/80 shadow-lg"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Image
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Results */}
        {result && (
          <div className="space-y-4">
            {result.success ? (
              <div className="space-y-4">
                {/* Main Info */}
                <div className="p-6 bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-lg">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg">
                      <MapPin className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-xl bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                        {result.name || "Location Found"}
                      </h3>
                      {result.category && (
                        <Badge className="mt-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0">
                          {result.category}
                        </Badge>
                      )}
                    </div>
                    {result.confidence && (
                      <Badge variant="outline" className="bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800">
                        {Math.round(result.confidence * 100)}% confident
                      </Badge>
                    )}
                  </div>
                  
                  {result.address && (
                    <p className="text-sm text-slate-600 dark:text-slate-300 mb-3">
                      {result.address}
                    </p>
                  )}
                  
                  {result.description && (
                    <p className="text-sm text-slate-700 dark:text-slate-300 mb-3">
                      {result.description}
                    </p>
                  )}
                  
                  {/* Quick Info Grid */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {result.rating && (
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-amber-500" />
                        <span>{result.rating}/5 ({result.userRatingsTotal || 0})</span>
                      </div>
                    )}
                    {result.priceLevel && (
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4 text-green-500" />
                        <span>{'$'.repeat(result.priceLevel)}</span>
                      </div>
                    )}
                    {result.phoneNumber && (
                      <a href={`tel:${result.phoneNumber}`} className="flex items-center gap-1 text-teal-600 hover:underline">
                        <Phone className="h-4 w-4" />
                        <span className="truncate">{result.phoneNumber}</span>
                      </a>
                    )}
                    {result.website && (
                      <a href={result.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-teal-600 hover:underline">
                        <Globe className="h-4 w-4" />
                        <span className="truncate">Website</span>
                      </a>
                    )}
                    {result.openingHours !== undefined && (
                      <div className="flex items-center gap-1">
                        <Clock className={`h-4 w-4 ${result.openingHours ? 'text-green-500' : 'text-red-500'}`} />
                        <span>{result.openingHours ? 'Open now' : 'Closed'}</span>
                      </div>
                    )}
                    {result.businessStatus && (
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4 text-blue-500" />
                        <span className="capitalize">{result.businessStatus.replace('_', ' ')}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Types/Categories */}
                {result.types && result.types.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {result.types.slice(0, 4).map((type, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {type.replace(/_/g, ' ')}
                      </Badge>
                    ))}
                  </div>
                )}
                
                {/* Show More Information */}
                <ShowMoreInfo result={result} />
                
                {/* Reviews */}
                {result.reviews && result.reviews.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      Recent Reviews
                    </h4>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {result.reviews.slice(0, 3).map((review, index) => (
                        <div key={index} className="p-2 bg-slate-50 dark:bg-slate-800 rounded text-xs">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{review.author}</span>
                            <div className="flex items-center">
                              <Star className="h-3 w-3 text-amber-500" />
                              <span>{review.rating}</span>
                            </div>
                          </div>
                          <p className="text-slate-600 dark:text-slate-300 line-clamp-2">{review.text}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Nearby Places */}
                {result.nearbyPlaces && result.nearbyPlaces.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm flex items-center gap-2">
                      <Navigation className="h-4 w-4" />
                      Nearby Places
                    </h4>
                    <div className="grid grid-cols-1 gap-1">
                      {result.nearbyPlaces.slice(0, 3).map((place, index) => (
                        <div key={index} className="flex justify-between items-center p-2 bg-slate-50 dark:bg-slate-800 rounded text-xs">
                          <div>
                            <span className="font-medium">{place.name}</span>
                            <span className="text-slate-500 ml-2">({place.type})</span>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {place.distance}m
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Actions */}
                <div className="flex flex-wrap gap-3 mt-6">
                  {result.location && (
                    <Button
                      size="sm"
                      className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-lg hover:shadow-xl transition-all duration-300"
                      asChild
                    >
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${result.location.latitude},${result.location.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Navigation className="h-4 w-4 mr-2" />
                        Get Directions
                      </a>
                    </Button>
                  )}
                  {result.placeId && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border-slate-200 dark:border-slate-700 hover:bg-white/80 dark:hover:bg-slate-800/80 shadow-lg"
                      asChild
                    >
                      <a
                        href={`https://www.google.com/maps/place/?q=place_id:${result.placeId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View Details
                      </a>
                    </Button>
                  )}
                  {result.phoneNumber && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border-slate-200 dark:border-slate-700 hover:bg-white/80 dark:hover:bg-slate-800/80 shadow-lg"
                      asChild
                    >
                      <a href={`tel:${result.phoneNumber}`}>
                        <Phone className="h-4 w-4 mr-2" />
                        Call Now
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-6 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/50 dark:to-red-900/30 rounded-2xl border border-red-200/50 dark:border-red-800/50">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-red-500 flex items-center justify-center">
                    <X className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-red-800 dark:text-red-200">Recognition Failed</h3>
                    <p className="text-sm text-red-600 dark:text-red-300 mt-1">
                      {result.error || "Could not identify location"}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Reset Button */}
        {(previewUrl || result || cameraActive) && (
          <Button
            onClick={reset}
            variant="outline"
            className="w-full mt-6 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border-slate-200 dark:border-slate-700 hover:bg-white/80 dark:hover:bg-slate-800/80 shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <X className="h-4 w-4 mr-2" />
            Start Over
          </Button>
        )}
        
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handleFileSelect(file)
          }}
        />
        
        <canvas ref={canvasRef} className="hidden" />
          </CardContent>
        </Card>


      </div>
    </div>
  )
}

// Component to show additional location information
function ShowMoreInfo({ result }: { result: any }) {
  const [showMore, setShowMore] = useState(false)

  return (
    <div className="space-y-3">
      <Button
        onClick={() => setShowMore(!showMore)}
        variant="outline"
        className="w-full"
      >
        {showMore ? 'Show Less' : 'Show More Information'}
      </Button>
      
      {showMore && (
        <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
          {/* Coordinates */}
          {result.location && (
            <div>
              <h5 className="font-medium text-sm mb-1">Coordinates</h5>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Latitude: {result.location.latitude.toFixed(6)}<br/>
                Longitude: {result.location.longitude.toFixed(6)}
              </p>
            </div>
          )}
          
          {/* Processing Details */}
          <div>
            <h5 className="font-medium text-sm mb-1">Recognition Details</h5>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Method: {result.type}<br/>
              Confidence: {result.confidence ? Math.round(result.confidence * 100) : 'N/A'}%<br/>
              Processing Time: {result.processingTime || 'N/A'}ms
            </p>
          </div>
          
          {/* Additional Info */}
          {result.geoData && (
            <div>
              <h5 className="font-medium text-sm mb-1">Geographic Data</h5>
              <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1">
                {result.geoData.country && <p>Country: {result.geoData.country}</p>}
                {result.geoData.administrativeArea && <p>State: {result.geoData.administrativeArea}</p>}
                {result.geoData.locality && <p>City: {result.geoData.locality}</p>}
                {result.geoData.postalCode && <p>Postal Code: {result.geoData.postalCode}</p>}
                {result.geoData.elevation && <p>Elevation: {result.geoData.elevation}m</p>}
              </div>
            </div>
          )}
          
          {/* Environmental Data */}
          {(result.weatherConditions || result.airQuality) && (
            <div>
              <h5 className="font-medium text-sm mb-1">Environmental</h5>
              <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1">
                {result.weatherConditions && <p>Weather: {result.weatherConditions}</p>}
                {result.airQuality && <p>Air Quality: {result.airQuality}</p>}
                {result.timeOfDay && <p>Time of Day: {result.timeOfDay}</p>}
              </div>
            </div>
          )}
          
          {/* Nearby Places List */}
          {result.nearbyPlaces && result.nearbyPlaces.length > 0 && (
            <div>
              <h5 className="font-medium text-sm mb-1">Nearby Places</h5>
              <div className="space-y-1">
                {result.nearbyPlaces.slice(0, 5).map((place: any, index: number) => (
                  <div key={index} className="flex justify-between text-xs">
                    <span className="text-slate-700 dark:text-slate-300">{place.name}</span>
                    <span className="text-slate-500">{Math.round(place.distance)}m</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}