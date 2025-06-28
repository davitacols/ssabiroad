"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { Camera, Upload, X, MapPin, Loader2, Star, Globe, Phone, Clock, ExternalLink, Users, DollarSign, Navigation, MessageSquare, TrendingUp, Activity, Database, ThumbsUp, ThumbsDown, Sparkles, Zap } from "lucide-react"
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
  nearbyPlaces?: Array<{name: string, type: string, distance: number, rating?: number, address?: string}>
  priceLevel?: number
  businessStatus?: string
  types?: string[]
  userRatingsTotal?: number
  deviceAnalysis?: any
}

interface CameraRecognitionProps {
  onLocationSelect?: (location: RecognitionResult) => void
}

export function CameraRecognition({ onLocationSelect }: CameraRecognitionProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [result, setResult] = useState<RecognitionResult | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [cameraActive, setCameraActive] = useState(false)
  const [feedbackGiven, setFeedbackGiven] = useState(false)
  const [apiVersion, setApiVersion] = useState<'v1' | 'v2'>('v2')
  
  const handleVersionChange = (version: 'v1' | 'v2') => {
    console.log(`🔄 Changing API version from ${apiVersion} to ${version}`);
    setApiVersion(version)
    setResult(null)
    setFeedbackGiven(false)
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
    console.log(`✅ API version changed to: ${version}`);
  }

  
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

  const processImage = async (file: File) => {
    console.log(`📷 processImage called with apiVersion: ${apiVersion}`);
    setIsProcessing(true)
    setResult(null)
    setFeedbackGiven(false) // Reset feedback when processing new image

    try {
      // Get user location
      const location = await getCurrentLocation()
      
      const formData = new FormData()
      formData.append("image", file)
      if (location) {
        formData.append("latitude", location.latitude.toString())
        formData.append("longitude", location.longitude.toString())
      }

      const apiEndpoint = apiVersion === 'v1' ? '/api/location-recognition' : '/api/location-recognition-v2';
      console.log(`🔧 CURRENT API VERSION: ${apiVersion}`);
      console.log(`🔧 ENDPOINT: ${apiEndpoint}`);
      console.log(`🔧 TIMESTAMP: ${new Date().toISOString()}`);
      
      const response = await fetch(apiEndpoint, {
        method: "POST",
        body: formData,
        headers: {
          'X-API-Version': apiVersion // Add header to track version
        }
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      let data = await response.json()
      
      // Convert v2 API response to expected format
      if (apiVersion === 'v2' && data.success) {
        data.type = data.method
        data.description = `Location found via ${data.method}`
        data.category = data.method === 'known-business' ? 'Business' : 'Location'
        data.mapUrl = data.location ? 
          `https://www.google.com/maps/search/?api=1&query=${data.location.latitude},${data.location.longitude}` : 
          undefined
      }
      
      // V1 API already has the expected format, no conversion needed
      
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
      const versionContext = apiVersion === 'v2' 
        ? 'GPS extraction failed' 
        : 'Image analysis failed'
      
      setResult({ success: false, error: errorMessage, method: `${apiVersion}-error` })
      toast({
        title: `${versionContext} (${apiVersion.toUpperCase()})`,
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

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
    setFeedbackGiven(false)
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
    setIsProcessing(false)
    stopCamera()
  }, [previewUrl, stopCamera])

  // Helper function for error messages
  const getErrorMessage = (error: string | undefined, method: string | undefined, version: 'v1' | 'v2') => {
    if (version === 'v2') {
      if (method === 'no-exif-gps') {
        return 'This image does not contain GPS coordinates in its metadata. Use V1 for text and business analysis.';
      }
      return error || 'Failed to extract GPS data from image metadata.';
    } else {
      if (method === 'no-text') {
        return 'No readable text found in the image. Try a clearer photo with visible text or signage.';
      }
      if (method === 'no-business') {
        return 'Could not identify any business names in the image. Make sure business signs are clearly visible.';
      }
      if (method === 'no-results') {
        return 'Business detected but location not found. The business may not be in our database or web search results.';
      }
      return error || 'Could not identify location from the image.';
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto">
      <div className="space-y-8">
        {/* Main Recognition Panel */}
        <Card key={`api-${apiVersion}`} className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl border border-white/30 dark:border-slate-700/30 shadow-2xl shadow-blue-500/10">
          <CardHeader className="pb-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <CardTitle className="flex items-center gap-4 text-2xl font-bold">
                <div className="relative">
                  <div className="h-14 w-14 rounded-3xl bg-gradient-to-br from-blue-600 via-purple-600 to-cyan-500 flex items-center justify-center shadow-xl">
                    <Camera className="h-7 w-7 text-white" />
                  </div>
                  <div className="absolute -inset-2 rounded-3xl bg-gradient-to-br from-blue-600 via-purple-600 to-cyan-500 opacity-20 blur-lg animate-pulse"></div>
                </div>
                <div>
                  <h1 className="bg-gradient-to-r from-slate-900 via-blue-800 to-purple-800 dark:from-white dark:via-blue-200 dark:to-purple-200 bg-clip-text text-transparent">
                    AI Location Recognition
                  </h1>
                  <p className="text-sm font-normal text-slate-600 dark:text-slate-400 mt-1 flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    Powered by advanced computer vision
                  </p>
                </div>
              </CardTitle>
              
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <Zap className="h-4 w-4 text-amber-500" />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Analysis Mode</span>
                </div>
                <div className="flex gap-3">
                  <Button
                    size="sm"
                    variant={apiVersion === 'v1' ? 'default' : 'outline'}
                    onClick={() => handleVersionChange('v1')}
                    className={`h-12 px-6 text-sm font-medium transition-all duration-300 ${
                      apiVersion === 'v1' 
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-xl shadow-blue-500/30 scale-105' 
                        : 'bg-white/60 dark:bg-slate-800/60 hover:bg-white/90 dark:hover:bg-slate-800/90 border-slate-200 dark:border-slate-700 hover:shadow-lg'
                    }`}
                    title="Comprehensive analysis: logos, text, scene, business recognition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse"></div>
                      <span>Full Analysis</span>
                    </div>
                  </Button>
                  <Button
                    size="sm"
                    variant={apiVersion === 'v2' ? 'default' : 'outline'}
                    onClick={() => handleVersionChange('v2')}
                    className={`h-12 px-6 text-sm font-medium transition-all duration-300 ${
                      apiVersion === 'v2' 
                        ? 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white shadow-xl shadow-cyan-500/30 scale-105' 
                        : 'bg-white/60 dark:bg-slate-800/60 hover:bg-white/90 dark:hover:bg-slate-800/90 border-slate-200 dark:border-slate-700 hover:shadow-lg'
                    }`}
                    title="GPS coordinates with comprehensive location data"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-3 w-3 rounded-full bg-blue-500 animate-pulse"></div>
                      <span>GPS Enhanced</span>
                    </div>
                  </Button>
                </div>
                <div className="text-center">
                  <p className="text-xs text-slate-500 dark:text-slate-400 bg-slate-100/50 dark:bg-slate-800/50 px-3 py-2 rounded-full">
                    {apiVersion === 'v1' 
                      ? '🔍 Analyzes text, logos, scene & businesses' 
                      : '📍 GPS + nearby places, photos & device data'
                    }
                  </p>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
        <div className="relative aspect-video bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 rounded-3xl overflow-hidden mb-8 shadow-inner border border-slate-200/50 dark:border-slate-700/50">
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
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/90 to-purple-600/90 backdrop-blur-md flex items-center justify-center">
              <div className="text-center text-white p-8 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl">
                <div className="relative mb-6">
                  <Loader2 className="h-16 w-16 animate-spin mx-auto text-white" />
                  <div className="absolute inset-0 h-16 w-16 mx-auto rounded-full bg-gradient-to-r from-blue-400 to-purple-400 animate-ping opacity-20"></div>
                </div>
                <p className="text-xl font-semibold mb-2">
                  {apiVersion === 'v2' ? 'Extracting GPS data...' : 'Analyzing image...'}
                </p>
                <p className="text-sm opacity-90">
                  {apiVersion === 'v2' 
                    ? 'Reading GPS coordinates and enriching with location data' 
                    : 'AI analyzing text, logos, and business information'
                  }
                </p>
              </div>
            </div>
          )}
          
          {/* Camera Controls */}
          {cameraActive && !isProcessing && (
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex gap-6">
              <Button
                onClick={stopCamera}
                variant="outline"
                size="icon"
                className="rounded-full w-14 h-14 bg-white/95 backdrop-blur-sm border-white/60 hover:bg-white shadow-xl"
              >
                <X className="h-6 w-6" />
              </Button>
              <Button
                onClick={capturePhoto}
                size="lg"
                className="rounded-full w-24 h-24 bg-gradient-to-r from-blue-600 to-purple-600 border-4 border-white/60 shadow-2xl hover:scale-110 transition-transform duration-200"
              >
                <div className="w-12 h-12 rounded-full bg-white/95" />
              </Button>
            </div>
          )}
          
          {/* Empty State */}
          {!cameraActive && !previewUrl && !isProcessing && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center p-10">
                <div className="relative mb-8">
                  <div className="h-24 w-24 mx-auto rounded-3xl bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center shadow-2xl">
                    <Camera className="h-12 w-12 text-white" />
                  </div>
                  <div className="absolute -inset-3 rounded-3xl bg-gradient-to-r from-blue-600 to-purple-600 opacity-20 animate-pulse blur-lg"></div>
                </div>
                <h3 className="text-2xl font-bold text-slate-700 dark:text-slate-300 mb-3">AI Location Recognition</h3>
                <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-md mx-auto">Take a photo or upload an image to identify locations with advanced AI technology</p>
                <div className="flex gap-4 justify-center">
                  <Button onClick={startCamera} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-xl hover:shadow-2xl transition-all duration-300 px-8 py-3">
                    <Camera className="h-5 w-5 mr-3" />
                    Use Camera
                  </Button>
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    variant="outline"
                    className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border-slate-200 dark:border-slate-700 hover:bg-white/90 dark:hover:bg-slate-800/90 shadow-lg hover:shadow-xl transition-all duration-300 px-8 py-3"
                  >
                    <Upload className="h-5 w-5 mr-3" />
                    Upload Image
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Results */}
        {result && (
          <div className="space-y-6">
            {result.success ? (
              <div className="space-y-6">
                {/* Main Info */}
                <div className="p-8 bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 rounded-3xl border border-slate-200/50 dark:border-slate-700/50 shadow-xl">
                  <div className="flex items-start gap-6 mb-6">
                    <div className="h-16 w-16 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 flex items-center justify-center shadow-xl">
                      <MapPin className="h-8 w-8 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-2xl bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent mb-2">
                        {result.name || "Location Found"}
                      </h3>
                      {result.category && (
                        <Badge className="bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0 px-4 py-1">
                          {result.category}
                        </Badge>
                      )}
                    </div>
                    {result.confidence && (
                      <Badge variant="outline" className="bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800 px-4 py-2">
                        {Math.round(result.confidence * 100)}% confident
                      </Badge>
                    )}
                  </div>
                  
                  {result.address && (
                    <p className="text-slate-600 dark:text-slate-300 mb-4 text-lg">
                      {result.address}
                    </p>
                  )}
                  
                  {result.description && (
                    <p className="text-slate-700 dark:text-slate-300 mb-6">
                      {result.description}
                    </p>
                  )}
                </div>
                
                {/* V2 Enhanced Data */}
                {apiVersion === 'v2' && result.success && (
                  <div className="space-y-6">
                    {/* Location Photos */}
                    {result.photos && result.photos.length > 0 && (
                      <div className="p-6 bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-950/30 dark:to-rose-950/30 rounded-2xl">
                        <h4 className="font-semibold text-lg flex items-center gap-3 mb-4">
                          <Camera className="h-5 w-5 text-pink-600" />
                          Area Photos ({result.photos.length})
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          {result.photos.slice(0, 6).map((photo, index) => (
                            <img
                              key={index}
                              src={photo}
                              alt={`Location photo ${index + 1}`}
                              className="w-full h-32 object-cover rounded-xl shadow-lg"
                              loading="lazy"
                            />
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Nearby Places */}
                    {result.nearbyPlaces && result.nearbyPlaces.length > 0 && (
                      <div className="p-6 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 rounded-2xl">
                        <h4 className="font-semibold text-lg flex items-center gap-3 mb-4">
                          <MapPin className="h-5 w-5 text-blue-600" />
                          Nearby Places ({result.nearbyPlaces.length})
                        </h4>
                        <div className="grid gap-3">
                          {result.nearbyPlaces.slice(0, 8).map((place, index) => (
                            <div key={index} className="p-4 bg-white/70 dark:bg-slate-800/70 rounded-xl">
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <h5 className="font-semibold">{place.name}</h5>
                                  <p className="text-sm text-slate-600 dark:text-slate-400 capitalize">{place.type}</p>
                                  {place.address && (
                                    <p className="text-xs text-slate-500 mt-1">{place.address}</p>
                                  )}
                                </div>
                                <div className="text-right">
                                  <Badge variant="outline" className="mb-2">
                                    {place.distance}m
                                  </Badge>
                                  {place.rating && place.rating > 0 && (
                                    <div className="flex items-center gap-1">
                                      <Star className="h-3 w-3 text-amber-500" />
                                      <span className="text-sm">{place.rating}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Device Analysis */}
                    {result.deviceAnalysis && (
                      <div className="p-6 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/30 dark:to-indigo-950/30 rounded-2xl">
                        <h4 className="font-semibold text-lg flex items-center gap-3 mb-4">
                          <Phone className="h-5 w-5 text-purple-600" />
                          Device Analysis
                        </h4>
                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="p-4 bg-white/70 dark:bg-slate-800/70 rounded-xl">
                            <h5 className="font-semibold mb-3">Camera</h5>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-slate-600 dark:text-slate-400">Make:</span>
                                <span className="font-medium">{result.deviceAnalysis.camera?.make || 'Unknown'}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-600 dark:text-slate-400">Model:</span>
                                <span className="font-medium">{result.deviceAnalysis.camera?.model || 'Unknown'}</span>
                              </div>
                            </div>
                          </div>
                          <div className="p-4 bg-white/70 dark:bg-slate-800/70 rounded-xl">
                            <h5 className="font-semibold mb-3">Image</h5>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-slate-600 dark:text-slate-400">Size:</span>
                                <span className="font-medium">{result.deviceAnalysis.image?.width} × {result.deviceAnalysis.image?.height}</span>
                              </div>
                              {result.deviceAnalysis.settings?.iso && (
                                <div className="flex justify-between">
                                  <span className="text-slate-600 dark:text-slate-400">ISO:</span>
                                  <span className="font-medium">{result.deviceAnalysis.settings.iso}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Actions */}
                <div className="flex flex-wrap gap-4">
                  {result.location && (
                    <Button
                      size="lg"
                      className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-xl hover:shadow-2xl transition-all duration-300 px-8"
                      asChild
                    >
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${result.location.latitude},${result.location.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Navigation className="h-5 w-5 mr-3" />
                        Get Directions
                      </a>
                    </Button>
                  )}
                  {result.phoneNumber && (
                    <Button
                      size="lg"
                      variant="outline"
                      className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border-slate-200 dark:border-slate-700 hover:bg-white/90 dark:hover:bg-slate-800/90 shadow-lg hover:shadow-xl transition-all duration-300 px-8"
                      asChild
                    >
                      <a href={`tel:${result.phoneNumber}`}>
                        <Phone className="h-5 w-5 mr-3" />
                        Call Now
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-8 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/50 dark:to-red-900/30 rounded-3xl border border-red-200/50 dark:border-red-800/50 shadow-xl">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-red-500 flex items-center justify-center">
                    <X className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-red-800 dark:text-red-200 text-lg mb-2">
                      {apiVersion === 'v2' ? 'No GPS Data Found' : 'Recognition Failed'}
                    </h3>
                    <p className="text-red-600 dark:text-red-300 mb-4">
                      {getErrorMessage(result.error, result.method, apiVersion)}
                    </p>
                    {apiVersion === 'v2' && result.method === 'no-exif-gps' && (
                      <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-2xl border border-blue-200 dark:border-blue-800">
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                          💡 <strong>Tip:</strong> Try V1 (Full Analysis) for images without GPS data
                        </p>
                      </div>
                    )}
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
            className="w-full py-4 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border-slate-200 dark:border-slate-700 hover:bg-white/90 dark:hover:bg-slate-800/90 shadow-lg hover:shadow-xl transition-all duration-300 text-lg"
          >
            <X className="h-5 w-5 mr-3" />
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