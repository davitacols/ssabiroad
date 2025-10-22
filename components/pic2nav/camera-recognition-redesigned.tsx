"use client"

import { useState, useRef, useCallback } from "react"
import { Camera, Upload, X, MapPin, Loader2, Star, Navigation, Share2, Bookmark, Copy, Eye, Zap, Clock, Wifi } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"

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
  rating?: number
  website?: string
  phoneNumber?: string
  category?: string
  photos?: string[]
  reviews?: Array<{author: string, rating: number, text: string}>
  nearbyPlaces?: Array<{name: string, type: string, distance: number}>
  weather?: any
  method?: string
}

export function CameraRecognitionRedesigned() {
  const [isProcessing, setIsProcessing] = useState(false)
  const [result, setResult] = useState<RecognitionResult | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [cameraActive, setCameraActive] = useState(false)
  const [processingStep, setProcessingStep] = useState("")
  const [processingProgress, setProcessingProgress] = useState(0)
  const [activeTab, setActiveTab] = useState("overview")
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { toast } = useToast()

  const processImage = useCallback(async (file: File) => {
    setIsProcessing(true)
    setResult(null)
    setProcessingProgress(0)

    try {
      const steps = [
        { step: "Analyzing image...", progress: 25 },
        { step: "Extracting location data...", progress: 50 },
        { step: "Identifying place...", progress: 75 },
        { step: "Gathering details...", progress: 100 }
      ]

      for (const { step, progress } of steps) {
        setProcessingStep(step)
        setProcessingProgress(progress)
        await new Promise(resolve => setTimeout(resolve, 400))
      }

      const formData = new FormData()
      formData.append("image", file)
      formData.append("analyzeLandmarks", "true")

      const response = await fetch('/api/location-recognition-v2', {
        method: "POST",
        body: formData,
      })

      if (!response.ok) throw new Error(`API error: ${response.status}`)

      const data = await response.json()
      setResult(data)
      
      if (data.success) {
        toast({
          title: "Location identified!",
          description: data.name || "Location found",
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
      setProcessingStep("")
      setProcessingProgress(0)
    }
  }, [toast])

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
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
      fileInputRef.current?.click()
    }
  }, [toast])

  const capturePhoto = useCallback(async () => {
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
          const file = new File([blob], `capture-${Date.now()}.jpg`, { type: "image/jpeg" })
          handleFileSelect(file)
          stopCamera()
        }
      }, "image/jpeg", 0.9)
    }
  }, [])

  const stopCamera = useCallback(() => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach(track => track.stop())
      videoRef.current.srcObject = null
      setCameraActive(false)
    }
  }, [])

  const handleFileSelect = useCallback((file: File) => {
    if (!file) return
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    processImage(file)
  }, [processImage])

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
    if (!result?.success) return
    
    const shareData = {
      title: result.name || "Location Found",
      text: `${result.name} - ${result.address}`,
      url: result.location ? 
        `https://www.google.com/maps/search/?api=1&query=${result.location.latitude},${result.location.longitude}` : 
        window.location.href
    }
    
    if (navigator.share) {
      try {
        await navigator.share(shareData)
      } catch {
        navigator.clipboard.writeText(`${shareData.title}\n${shareData.text}\n${shareData.url}`)
        toast({ title: "Copied to clipboard" })
      }
    } else {
      navigator.clipboard.writeText(`${shareData.title}\n${shareData.text}\n${shareData.url}`)
      toast({ title: "Copied to clipboard" })
    }
  }

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 px-4">
      {/* Camera Interface */}
      <Card className="overflow-hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur border-0 shadow-2xl">
        <CardContent className="p-0">
          <div className="relative bg-black" style={{ aspectRatio: '16/9', minHeight: '300px' }}>
            {/* Camera View */}
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              autoPlay
              playsInline
              muted
              style={{ display: cameraActive ? 'block' : 'none' }}
            />
            
            {/* Preview Image */}
            {previewUrl && !cameraActive && (
              <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
            )}
            
            {/* Processing Overlay */}
            {isProcessing && (
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600/90 to-purple-600/90 backdrop-blur flex items-center justify-center">
                <div className="text-center text-white p-8 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 max-w-sm">
                  <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4" />
                  <p className="text-lg font-semibold mb-2">AI Processing</p>
                  <p className="text-sm opacity-90 mb-4">{processingStep}</p>
                  <Progress value={processingProgress} className="w-full h-2" />
                </div>
              </div>
            )}
            
            {/* Camera Controls */}
            {cameraActive && !isProcessing && (
              <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex gap-4">
                <Button onClick={stopCamera} variant="outline" size="icon" className="rounded-full bg-white/90">
                  <X className="h-4 w-4" />
                </Button>
                <Button onClick={capturePhoto} size="lg" className="rounded-full w-16 h-16 bg-white border-4 border-white/60">
                  <div className="w-8 h-8 rounded-full bg-red-500" />
                </Button>
              </div>
            )}
            
            {/* Empty State */}
            {!cameraActive && !previewUrl && !isProcessing && (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900">
                <div className="text-center p-8">
                  <Camera className="h-16 w-16 mx-auto text-slate-400 mb-4" />
                  <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300 mb-2">AI Location Scanner</h3>
                  <p className="text-slate-500 mb-6">Capture or upload an image to identify locations instantly</p>
                  <div className="flex gap-3 justify-center">
                    <Button onClick={startCamera} className="bg-gradient-to-r from-blue-600 to-purple-600">
                      <Camera className="h-4 w-4 mr-2" />
                      Start Camera
                    </Button>
                    <Button onClick={() => fileInputRef.current?.click()} variant="outline">
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Photo
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Quick Actions Bar */}
          {!isProcessing && (
            <div className="p-4 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 border-t">
              <div className="flex flex-wrap gap-2 justify-center">
                <Button onClick={startCamera} variant="ghost" size="sm">
                  <Camera className="h-4 w-4 mr-2" />
                  Camera
                </Button>
                <Button onClick={() => fileInputRef.current?.click()} variant="ghost" size="sm">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload
                </Button>
                {result && (
                  <>
                    <Button onClick={shareLocation} variant="ghost" size="sm">
                      <Share2 className="h-4 w-4 mr-2" />
                      Share
                    </Button>
                    <Button onClick={reset} variant="ghost" size="sm">
                      <X className="h-4 w-4 mr-2" />
                      Reset
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results Display */}
      {result && (
        <Card className="bg-white/95 dark:bg-slate-900/95 backdrop-blur border-0 shadow-xl">
          <CardContent className="p-6">
            {result.success ? (
              <div className="space-y-6">
                {/* Header */}
                <div className="flex items-start gap-4">
                  <div className="h-14 w-14 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 flex items-center justify-center">
                    <MapPin className="h-7 w-7 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-2xl mb-2">{result.name || "Location Found"}</h3>
                    <p className="text-slate-600 dark:text-slate-300 mb-3">{result.address}</p>
                    <div className="flex flex-wrap gap-2">
                      {result.category && (
                        <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                          {result.category}
                        </Badge>
                      )}
                      {result.confidence && (
                        <Badge variant="outline" className="bg-green-50 text-green-700">
                          {Math.round(result.confidence * 100)}% confident
                        </Badge>
                      )}
                      {result.rating && (
                        <Badge variant="outline" className="bg-amber-50 text-amber-700">
                          ⭐ {result.rating}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={shareLocation} size="sm" variant="outline">
                      <Share2 className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline">
                      <Bookmark className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {result.location && (
                    <Button asChild className="h-auto p-4 bg-gradient-to-r from-emerald-600 to-teal-600">
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${result.location.latitude},${result.location.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Navigation className="h-5 w-5 mr-3" />
                        <div className="text-left">
                          <div className="font-semibold">Get Directions</div>
                          <div className="text-xs opacity-90">Open in Maps</div>
                        </div>
                      </a>
                    </Button>
                  )}
                  
                  {result.website && (
                    <Button asChild variant="outline" className="h-auto p-4">
                      <a href={result.website} target="_blank" rel="noopener noreferrer">
                        <Eye className="h-5 w-5 mr-3" />
                        <div className="text-left">
                          <div className="font-semibold">Visit Website</div>
                          <div className="text-xs opacity-70">Learn more</div>
                        </div>
                      </a>
                    </Button>
                  )}
                  
                  <Button
                    onClick={() => {
                      if (result.location) {
                        navigator.clipboard.writeText(`${result.location.latitude}, ${result.location.longitude}`)
                        toast({ title: "Coordinates copied" })
                      }
                    }}
                    variant="outline"
                    className="h-auto p-4"
                  >
                    <Copy className="h-5 w-5 mr-3" />
                    <div className="text-left">
                      <div className="font-semibold">Copy Location</div>
                      <div className="text-xs opacity-70">GPS coordinates</div>
                    </div>
                  </Button>
                </div>

                {/* Tabbed Content */}
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="details">Details</TabsTrigger>
                    <TabsTrigger value="nearby">Nearby</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="overview" className="space-y-4">
                    {/* Weather */}
                    {result.weather && (
                      <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 rounded-xl">
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          🌤️ Current Weather
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
                          <div className="text-center">
                            <div className="text-lg font-semibold">{result.weather.humidity}%</div>
                            <div className="text-xs text-slate-600">Humidity</div>
                          </div>
                          <div className="text-center">
                            <div className="text-sm font-semibold">{result.weather.timezone}</div>
                            <div className="text-xs text-slate-600">Timezone</div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* GPS Info */}
                    {result.location && (
                      <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                        <h4 className="font-semibold mb-3">GPS Coordinates</h4>
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
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="details" className="space-y-4">
                    {/* Photos */}
                    {result.photos && result.photos.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-3">Photos ({result.photos.length})</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {result.photos.slice(0, 8).map((photo, index) => (
                            <img
                              key={index}
                              src={photo}
                              alt={`Photo ${index + 1}`}
                              className="w-full h-20 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
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
                        <h4 className="font-semibold mb-3">Nearby Places</h4>
                        <div className="space-y-2">
                          {result.nearbyPlaces.map((place, index) => (
                            <div key={index} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                              <div>
                                <p className="font-medium">{place.name}</p>
                                <p className="text-sm text-slate-500 capitalize">{place.type}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-medium">{place.distance}m away</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            ) : (
              <div className="p-6 bg-red-50 dark:bg-red-950/30 rounded-xl border border-red-200 dark:border-red-800">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-xl bg-red-500 flex items-center justify-center">
                    <X className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-red-800 dark:text-red-200 mb-2">Recognition Failed</h3>
                    <p className="text-red-600 dark:text-red-300 mb-4">{result.error}</p>
                    <Button onClick={reset} variant="outline" size="sm">Try Again</Button>
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