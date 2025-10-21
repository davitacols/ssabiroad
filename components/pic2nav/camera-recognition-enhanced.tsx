"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { Camera, Upload, X, MapPin, Loader2, Star, Globe, Phone, Clock, ExternalLink, Users, DollarSign, Navigation, MessageSquare, TrendingUp, Activity, Database, ThumbsUp, ThumbsDown, Sparkles, Zap, Bookmark, Share2, Copy, Download, Eye, Map, Compass, Calendar, Timer, Wifi, Signal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import Link from "next/link"

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
  method?: string
  weather?: any
  locationDetails?: any
  elevation?: any
  transit?: any[]
  demographics?: any
}

interface CameraRecognitionProps {
  onLocationSelect?: (location: RecognitionResult) => void
}

export function CameraRecognitionEnhanced({ onLocationSelect }: CameraRecognitionProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [result, setResult] = useState<RecognitionResult | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [cameraActive, setCameraActive] = useState(false)
  const [processingStep, setProcessingStep] = useState("")
  const [processingProgress, setProcessingProgress] = useState(0)
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment')
  const [activeTab, setActiveTab] = useState("overview")
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { toast } = useToast()

  const getCurrentLocation = useCallback((): Promise<Location | null> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(null)
        return
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          }
          resolve(location)
        },
        (error) => {
          resolve(null)
        },
        { timeout: 10000, enableHighAccuracy: true, maximumAge: 60000 }
      )
    })
  }, [])

  const processImage = useCallback(async (file: File) => {
    setIsProcessing(true)
    setResult(null)
    setProcessingProgress(0)
    setProcessingStep("Preparing image...")

    try {
      // Simulate processing steps with progress
      const steps = [
        { step: "Analyzing image metadata...", progress: 20 },
        { step: "Extracting GPS coordinates...", progress: 40 },
        { step: "Identifying location...", progress: 60 },
        { step: "Gathering place details...", progress: 80 },
        { step: "Finalizing results...", progress: 100 }
      ]

      for (const { step, progress } of steps) {
        setProcessingStep(step)
        setProcessingProgress(progress)
        await new Promise(resolve => setTimeout(resolve, 500))
      }

      const injectedLocation = (file as any)._gpsLocation
      
      const formData = new FormData()
      formData.append("image", file)
      formData.append("analyzeLandmarks", "true")
      if (injectedLocation) {
        formData.append("latitude", injectedLocation.latitude.toString())
        formData.append("longitude", injectedLocation.longitude.toString())
        formData.append("gps_source", "camera_injected")
      }

      const response = await fetch('/api/location-recognition-v2', {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      let data = await response.json()
      
      // Enhance data with additional properties
      if (data.success) {
        data.type = data.method
        data.description = `Location found via ${data.method}`
        data.category = data.method === 'known-business' ? 'Business' : 'Location'
        data.mapUrl = data.location ? 
          `https://www.google.com/maps/search/?api=1&query=${data.location.latitude},${data.location.longitude}` : 
          undefined
        data.timestamp = new Date().toISOString()
      }
      
      setResult(data)
      
      if (data.success && onLocationSelect) {
        onLocationSelect(data)
      }
      
      if (data.success) {
        toast({
          title: "Location identified successfully!",
          description: data.name || "Location found",
        })
        
        // Auto-save in background
        fetch('/api/save-location', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...data, apiVersion: 'v2' })
        }).catch(() => {})
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Recognition failed"
      setResult({ success: false, error: errorMessage, method: "error" })
      toast({
        title: "Recognition failed",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
      setProcessingStep("")
      setProcessingProgress(0)
    }
  }, [getCurrentLocation, onLocationSelect, toast])

  const stopCamera = useCallback(() => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach(track => track.stop())
      videoRef.current.srcObject = null
      setCameraActive(false)
    }
  }, [])

  const handleFileSelect = useCallback(async (file: File) => {
    if (!file) return
    
    try {
      const gpsFromFile = await extractGPSFromFile(file)
      if (gpsFromFile) {
        Object.defineProperty(file, '_gpsLocation', {
          value: gpsFromFile,
          writable: false,
          enumerable: false
        })
      }
    } catch (error) {
      console.log('Could not extract GPS from file:', error)
    }
    
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    processImage(file)
  }, [processImage])
  
  const extractGPSFromFile = async (file: File): Promise<Location | null> => {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = () => {
        try {
          const arrayBuffer = reader.result as ArrayBuffer
          const uint8Array = new Uint8Array(arrayBuffer)
          const gpsData = findGPSInBytes(uint8Array)
          resolve(gpsData)
        } catch (error) {
          resolve(null)
        }
      }
      reader.onerror = () => resolve(null)
      reader.readAsArrayBuffer(file)
    })
  }
  
  const findGPSInBytes = (bytes: Uint8Array): Location | null => {
    const str = new TextDecoder('latin1').decode(bytes)
    const gpsMatch = str.match(/GPS:([0-9.-]+),([0-9.-]+)/)
    if (gpsMatch) {
      const lat = parseFloat(gpsMatch[1])
      const lng = parseFloat(gpsMatch[2])
      if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        return { latitude: lat, longitude: lng }
      }
    }
    return null
  }

  const startCamera = useCallback(async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API not supported in this browser')
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false,
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        setCameraActive(true)
        await videoRef.current.play()
      }
    } catch (error) {
      let errorMessage = "Could not access camera"
      
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          errorMessage = "Camera permission denied. Please allow camera access and try again."
        } else if (error.name === 'NotFoundError') {
          errorMessage = "No camera found. Please connect a camera and try again."
        } else if (error.name === 'NotReadableError') {
          errorMessage = "Camera is being used by another application. Please close other apps and try again."
        } else {
          errorMessage = error.message
        }
      }
      
      toast({
        title: "Camera error",
        description: errorMessage,
        variant: "destructive",
      })
      
      fileInputRef.current?.click()
    }
  }, [toast, facingMode])

  const capturePhoto = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    
    const maxSize = 800
    const ratio = Math.min(maxSize / video.videoWidth, maxSize / video.videoHeight)
    canvas.width = video.videoWidth * ratio
    canvas.height = video.videoHeight * ratio
    
    const context = canvas.getContext("2d")
    if (context) {
      context.drawImage(video, 0, 0, canvas.width, canvas.height)
      
      const location = await getCurrentLocation()
      
      canvas.toBlob(async (blob) => {
        if (blob && location) {
          const gpsBlob = await injectGPSDirectly(blob, location)
          const file = new File([gpsBlob], `capture-${Date.now()}.jpg`, { type: "image/jpeg" })
          
          Object.defineProperty(file, '_gpsLocation', {
            value: location,
            writable: false,
            enumerable: false
          })
          
          handleFileSelect(file)
          stopCamera()
        }
      }, "image/jpeg", 1.0)
    }
  }, [handleFileSelect, stopCamera, getCurrentLocation])
  
  const injectGPSDirectly = async (blob: Blob, location: Location): Promise<Blob> => {
    const buffer = await blob.arrayBuffer()
    const bytes = new Uint8Array(buffer)
    
    const gpsData = `GPS:${location.latitude},${location.longitude}`
    const gpsBytes = new TextEncoder().encode(gpsData)
    
    const result = new Uint8Array(bytes.length + gpsBytes.length + 4)
    result.set(bytes.slice(0, 2))
    result[2] = 0xFF; result[3] = 0xFE
    result[4] = (gpsBytes.length >> 8) & 0xFF
    result[5] = gpsBytes.length & 0xFF
    result.set(gpsBytes, 6)
    result.set(bytes.slice(2), 6 + gpsBytes.length)
    
    return new Blob([result], { type: 'image/jpeg' })
  }

  const reset = useCallback(() => {
    setResult(null)
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
    setIsProcessing(false)
    setActiveTab("overview")
    stopCamera()
  }, [previewUrl, stopCamera])

  const shareLocation = async () => {
    if (!result || !result.success) return
    
    const shareData = {
      title: result.name || "Location Found",
      text: `Check out this location: ${result.name || "Unknown"} at ${result.address || "Unknown address"}`,
      url: result.mapUrl || window.location.href
    }
    
    if (navigator.share) {
      try {
        await navigator.share(shareData)
      } catch (error) {
        // Fallback to clipboard
        navigator.clipboard.writeText(`${shareData.title}\n${shareData.text}\n${shareData.url}`)
        toast({ title: "Copied to clipboard", description: "Location details copied" })
      }
    } else {
      navigator.clipboard.writeText(`${shareData.title}\n${shareData.text}\n${shareData.url}`)
      toast({ title: "Copied to clipboard", description: "Location details copied" })
    }
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-4 sm:space-y-6 px-4 sm:px-0">
      {/* Camera Interface */}
      <Card className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm border border-white/20 dark:border-slate-700/20 shadow-xl">
        <CardContent className="p-4 sm:p-6">
          <div className="relative w-full bg-black rounded-xl sm:rounded-2xl overflow-hidden mb-4 sm:mb-6" style={{ aspectRatio: '16/9', minHeight: '250px' }}>
            {/* Camera View */}
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              autoPlay
              playsInline
              muted
              style={{ 
                display: cameraActive ? 'block' : 'none',
                transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' 
              }}
            />
            
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
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600/95 to-purple-600/95 backdrop-blur-md flex items-center justify-center">
                <div className="text-center text-white p-8 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl max-w-md">
                  <div className="relative mb-6">
                    <Loader2 className="h-16 w-16 animate-spin mx-auto text-white" />
                    <div className="absolute inset-0 h-16 w-16 mx-auto rounded-full bg-gradient-to-r from-blue-400 to-purple-400 animate-ping opacity-20"></div>
                  </div>
                  <p className="text-xl font-semibold mb-4">AI Processing...</p>
                  <p className="text-sm opacity-90 mb-4">{processingStep}</p>
                  <Progress value={processingProgress} className="w-full h-2 bg-white/20" />
                  <p className="text-xs mt-2 opacity-75">{processingProgress}% complete</p>
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
                  className="rounded-full w-12 h-12 bg-white/90 backdrop-blur-sm border-white/60 hover:bg-white shadow-lg"
                >
                  <X className="h-5 w-5" />
                </Button>
                <Button
                  onClick={() => {
                    setFacingMode(facingMode === 'user' ? 'environment' : 'user')
                    stopCamera()
                    setTimeout(() => startCamera(), 100)
                  }}
                  variant="outline"
                  size="icon"
                  className="rounded-full w-12 h-12 bg-white/90 backdrop-blur-sm border-white/60 hover:bg-white shadow-lg"
                >
                  <span className="text-sm">{facingMode === 'user' ? '📱' : '📷'}</span>
                </Button>
                <Button
                  onClick={capturePhoto}
                  size="lg"
                  className="rounded-full w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 border-4 border-white/60 shadow-2xl hover:scale-110 transition-transform duration-200"
                >
                  <div className="w-10 h-10 rounded-full bg-white/95" />
                </Button>
              </div>
            )}
            
            {/* Empty State */}
            {!cameraActive && !previewUrl && !isProcessing && (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900">
                <div className="text-center p-6">
                  <div className="relative mb-6">
                    <Camera className="h-16 w-16 mx-auto text-slate-400" />
                    <div className="absolute -inset-2 rounded-full bg-gradient-to-r from-blue-400 to-purple-400 opacity-20 animate-pulse"></div>
                  </div>
                  <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300 mb-2">AI Location Recognition</h3>
                  <p className="text-slate-500 dark:text-slate-400 mb-6 text-sm">Take a photo or upload an image to identify locations</p>
                  <div className="flex gap-3 justify-center">
                    <Button onClick={startCamera} className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600">
                      <Camera className="h-4 w-4 mr-2" />
                      Use Camera
                    </Button>
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      variant="outline"
                      className="px-6 py-2"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Image
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Quick Actions */}
          {!isProcessing && (
            <div className="flex flex-wrap gap-2 sm:gap-3 justify-center">
              <Button onClick={startCamera} variant="outline" size="sm">
                <Camera className="h-4 w-4 mr-2" />
                Camera
              </Button>
              <Button onClick={() => fileInputRef.current?.click()} variant="outline" size="sm">
                <Upload className="h-4 w-4 mr-2" />
                Upload
              </Button>
              {result && (
                <>
                  <Button onClick={shareLocation} variant="outline" size="sm">
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                  <Button onClick={reset} variant="outline" size="sm">
                    <X className="h-4 w-4 mr-2" />
                    Reset
                  </Button>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Enhanced Results Display */}
      {result && (
        <Card className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm border border-white/20 dark:border-slate-700/20 shadow-xl">
          <CardContent className="p-4 sm:p-6">
            {result.success ? (
              <div className="space-y-6">
                {/* Header with main info */}
                <div className="flex items-start gap-4">
                  <div className="h-16 w-16 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg">
                    <MapPin className="h-8 w-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-2xl text-slate-900 dark:text-white mb-2">
                      {result.name || "Location Found"}
                    </h3>
                    <p className="text-slate-600 dark:text-slate-300 mb-3">
                      {result.address}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {result.category && (
                        <Badge className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                          {result.category}
                        </Badge>
                      )}
                      {result.confidence && (
                        <Badge variant="outline" className="bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300">
                          {Math.round(result.confidence * 100)}% confident
                        </Badge>
                      )}
                      {result.rating && (
                        <Badge variant="outline" className="bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
                          ⭐ {result.rating}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={shareLocation} size="sm" variant="outline">
                      <Share2 className="h-4 w-4" />
                    </Button>
                    <Button
                      onClick={async () => {
                        try {
                          await fetch('/api/save-location', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(result)
                          })
                          toast({ title: "Location saved", description: "Added to your saved places" })
                        } catch (error) {
                          toast({ title: "Save failed", description: "Could not save location", variant: "destructive" })
                        }
                      }}
                      size="sm"
                      variant="outline"
                    >
                      <Bookmark className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Tabbed Content */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="details">Details</TabsTrigger>
                    <TabsTrigger value="nearby">Nearby</TabsTrigger>
                    <TabsTrigger value="technical">Technical</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="overview" className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                      {/* Quick Actions */}
                      {result.location && (
                        <Button asChild className="h-auto p-4 bg-gradient-to-r from-emerald-600 to-teal-600">
                          <a
                            href={`https://www.google.com/maps/dir/?api=1&destination=${result.location.latitude},${result.location.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <div className="flex items-center gap-3">
                              <Navigation className="h-5 w-5" />
                              <div className="text-left">
                                <div className="font-semibold">Get Directions</div>
                                <div className="text-xs opacity-90">Open in Maps</div>
                              </div>
                            </div>
                          </a>
                        </Button>
                      )}
                      
                      {result.phoneNumber && (
                        <Button asChild variant="outline" className="h-auto p-4">
                          <a href={`tel:${result.phoneNumber}`}>
                            <div className="flex items-center gap-3">
                              <Phone className="h-5 w-5" />
                              <div className="text-left">
                                <div className="font-semibold">Call Now</div>
                                <div className="text-xs opacity-70">{result.phoneNumber}</div>
                              </div>
                            </div>
                          </a>
                        </Button>
                      )}
                      
                      {result.website && (
                        <Button asChild variant="outline" className="h-auto p-4">
                          <a href={result.website} target="_blank" rel="noopener noreferrer">
                            <div className="flex items-center gap-3">
                              <Globe className="h-5 w-5" />
                              <div className="text-left">
                                <div className="font-semibold">Visit Website</div>
                                <div className="text-xs opacity-70">Learn more</div>
                              </div>
                            </div>
                          </a>
                        </Button>
                      )}
                    </div>

                    {/* Weather Info */}
                    {result.weather && (
                      <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 rounded-xl border border-blue-200 dark:border-blue-800">
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <span className="text-2xl">🌤️</span>
                          Current Weather
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">{result.weather.temperature}°C</div>
                            <div className="text-xs text-slate-600">Temperature</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-semibold">{result.weather.windSpeed} km/h</div>
                            <div className="text-xs text-slate-600">Wind Speed</div>
                          </div>
                          {result.weather.humidity && (
                            <div className="text-center">
                              <div className="text-lg font-semibold">{result.weather.humidity}%</div>
                              <div className="text-xs text-slate-600">Humidity</div>
                            </div>
                          )}
                          {result.weather.timezone && (
                            <div className="text-center">
                              <div className="text-sm font-semibold">{result.weather.timezone}</div>
                              <div className="text-xs text-slate-600">Timezone</div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="details" className="space-y-4">
                    {/* Location Details */}
                    {result.locationDetails && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {Object.entries(result.locationDetails).map(([key, value]) => (
                          <div key={key} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                            <div className="text-xs text-slate-500 mb-1 capitalize">{key.replace(/([A-Z])/g, ' $1')}</div>
                            <div className="font-medium">{value as string}</div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Photos */}
                    {result.photos && result.photos.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-3">Photos ({result.photos.length})</h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                          {result.photos.slice(0, 8).map((photo, index) => (
                            <img
                              key={index}
                              src={photo}
                              alt={`Location photo ${index + 1}`}
                              className="w-full h-24 object-cover rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer"
                              loading="lazy"
                              onClick={() => window.open(photo, '_blank')}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Reviews */}
                    {result.reviews && result.reviews.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-3">Recent Reviews</h4>
                        <div className="space-y-3">
                          {result.reviews.slice(0, 3).map((review, index) => (
                            <div key={index} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                              <div className="flex items-center gap-2 mb-2">
                                <div className="font-medium">{review.author}</div>
                                <div className="flex">
                                  {Array.from({ length: 5 }).map((_, i) => (
                                    <Star key={i} className={`h-4 w-4 ${i < review.rating ? 'text-amber-400 fill-current' : 'text-slate-300'}`} />
                                  ))}
                                </div>
                                <div className="text-xs text-slate-500">{review.time}</div>
                              </div>
                              <p className="text-sm text-slate-600 dark:text-slate-300">{review.text}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="nearby" className="space-y-4">
                    {/* Nearby Places */}
                    {result.nearbyPlaces && result.nearbyPlaces.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-3">Nearby Places ({result.nearbyPlaces.length})</h4>
                        <div className="space-y-2">
                          {result.nearbyPlaces.map((place, index) => (
                            <div key={index} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                              <div>
                                <p className="font-medium">{place.name}</p>
                                <p className="text-sm text-slate-500 capitalize">{place.type}</p>
                                {place.address && <p className="text-xs text-slate-400">{place.address}</p>}
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-medium">{place.distance}m away</p>
                                {place.rating && (
                                  <div className="flex items-center gap-1">
                                    <Star className="h-3 w-3 text-amber-500 fill-current" />
                                    <span className="text-xs">{place.rating}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Transit */}
                    {result.transit && result.transit.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-3">Public Transit</h4>
                        <div className="space-y-2">
                          {result.transit.map((station, index) => (
                            <div key={index} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                              <div>
                                <p className="font-medium">{station.name}</p>
                                <p className="text-sm text-slate-500 capitalize">{station.type}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm">{station.distance}m</p>
                                {station.rating && (
                                  <div className="flex items-center gap-1">
                                    <Star className="h-3 w-3 text-amber-500 fill-current" />
                                    <span className="text-xs">{station.rating}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="technical" className="space-y-4">
                    {/* GPS Coordinates */}
                    {result.location && (
                      <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <Compass className="h-5 w-5" />
                          GPS Coordinates
                        </h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="text-xs text-slate-500 mb-1">Latitude</div>
                            <div className="font-mono text-sm">{result.location.latitude.toFixed(6)}</div>
                          </div>
                          <div>
                            <div className="text-xs text-slate-500 mb-1">Longitude</div>
                            <div className="font-mono text-sm">{result.location.longitude.toFixed(6)}</div>
                          </div>
                        </div>
                        <Button
                          onClick={() => {
                            navigator.clipboard.writeText(`${result.location!.latitude}, ${result.location!.longitude}`)
                            toast({ title: "Coordinates copied", description: "GPS coordinates copied to clipboard" })
                          }}
                          variant="outline"
                          size="sm"
                          className="mt-3"
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          Copy Coordinates
                        </Button>
                      </div>
                    )}

                    {/* Detection Method */}
                    <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                      <h4 className="font-semibold mb-3">Detection Information</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-xs text-slate-500 mb-1">Method</div>
                          <div className="font-medium capitalize">{result.method?.replace(/-/g, ' ')}</div>
                        </div>
                        <div>
                          <div className="text-xs text-slate-500 mb-1">Confidence</div>
                          <div className="font-medium">{result.confidence ? Math.round(result.confidence * 100) : 'N/A'}%</div>
                        </div>
                        {result.timestamp && (
                          <div className="col-span-2">
                            <div className="text-xs text-slate-500 mb-1">Processed At</div>
                            <div className="font-medium">{new Date(result.timestamp).toLocaleString()}</div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Elevation */}
                    {result.elevation && (
                      <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <h4 className="font-semibold mb-3">Elevation Data</h4>
                        <div className="text-lg font-bold text-blue-600">{result.elevation.elevation}m</div>
                        <div className="text-sm text-slate-500">above sea level</div>
                      </div>
                    )}

                    {/* Device Analysis */}
                    {result.deviceAnalysis && (
                      <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <h4 className="font-semibold mb-3">Device Information</h4>
                        <div className="grid grid-cols-2 gap-4">
                          {result.deviceAnalysis.camera && (
                            <div>
                              <div className="text-xs text-slate-500 mb-1">Camera</div>
                              <div className="font-medium">{result.deviceAnalysis.camera.make} {result.deviceAnalysis.camera.model}</div>
                            </div>
                          )}
                          {result.deviceAnalysis.image && (
                            <div>
                              <div className="text-xs text-slate-500 mb-1">Image Size</div>
                              <div className="font-medium">{result.deviceAnalysis.image.width} × {result.deviceAnalysis.image.height}</div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            ) : (
              <div className="p-6 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/50 dark:to-red-900/30 rounded-2xl border border-red-200/50 dark:border-red-800/50">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-xl bg-red-500 flex items-center justify-center">
                    <X className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-red-800 dark:text-red-200 text-lg mb-2">
                      Recognition Failed
                    </h3>
                    <p className="text-red-600 dark:text-red-300 mb-4">
                      {result.error || "Could not identify location from the image"}
                    </p>
                    <Button onClick={reset} variant="outline" size="sm">
                      Try Again
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
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
    </div>
  )
}