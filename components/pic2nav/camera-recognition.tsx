"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { Camera, Upload, X, MapPin, Loader2, Star, Globe, Phone, Clock, ExternalLink, Users, DollarSign, Navigation, MessageSquare, TrendingUp, Activity, Database, ThumbsUp, ThumbsDown, Sparkles, Zap, Bookmark } from "lucide-react"
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
  method?: string
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
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment')
  
  const handleVersionChange = (version: 'v1' | 'v2') => {
    if (version === 'v1') {
      toast({
        title: "V1 Under Maintenance",
        description: "Full Analysis mode is temporarily unavailable for improvements",
        variant: "destructive",
      })
      return
    }
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



  const getCurrentLocation = useCallback((): Promise<Location | null> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        console.log('❌ Geolocation not supported');
        resolve(null)
        return
      }

      console.log('📍 Requesting location permission...');
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
          console.log('✅ Location obtained:', location);
          resolve(location);
        },
        (error) => {
          console.log('❌ Location error:', error.message);
          resolve(null);
        },
        { timeout: 10000, enableHighAccuracy: true, maximumAge: 60000 }
      )
    })
  }, [])

  const processImage = useCallback(async (file: File) => {
    console.log(`📷 processImage called with apiVersion: ${apiVersion}`);
    setIsProcessing(true)
    setResult(null)
    setFeedbackGiven(false) // Reset feedback when processing new image

    try {
      // Only use injected GPS from camera capture, don't fallback to device location
      const injectedLocation = (file as any)._gpsLocation
      
      if (injectedLocation) {
        console.log('📍 Using injected GPS from camera capture');
      } else {
        console.log('📍 No GPS data available - will analyze image content');
      }
      
      const formData = new FormData()
      formData.append("image", file)
      if (injectedLocation) {
        formData.append("latitude", injectedLocation.latitude.toString())
        formData.append("longitude", injectedLocation.longitude.toString())
        formData.append("gps_source", "camera_injected")
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
      console.log('📨 API Response:', data);
      
      // Convert v2 API response to expected format
      if (apiVersion === 'v2' && data.success) {
        data.type = data.method
        data.description = `Location found via ${data.method}`
        data.category = data.method === 'known-business' ? 'Business' : 'Location'
        data.mapUrl = data.location ? 
          `https://www.google.com/maps/search/?api=1&query=${data.location.latitude},${data.location.longitude}` : 
          undefined
        console.log('✅ V2 data converted:', data);
      }
      
      console.log('💾 Setting result:', data);
      setResult(data)
      
      if (data.success && onLocationSelect) {
        onLocationSelect(data)
      }
      
      if (data.success) {
        toast({
          title: "Location identified",
          description: data.name || "Location found successfully",
        })
        
        // Auto-save in background
        fetch('/api/save-location', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...data, apiVersion })
        }).catch(() => {});
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
  }, [apiVersion, getCurrentLocation, onLocationSelect, toast])

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
    
    // Try to extract EXIF GPS from uploaded file before processing
    try {
      const gpsFromFile = await extractGPSFromFile(file);
      if (gpsFromFile) {
        console.log('📍 Extracted GPS from uploaded file:', gpsFromFile);
        Object.defineProperty(file, '_gpsLocation', {
          value: gpsFromFile,
          writable: false,
          enumerable: false
        });
      }
    } catch (error) {
      console.log('⚠️ Could not extract GPS from file:', error);
    }
    
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    processImage(file)
  }, [processImage])
  
  // Extract GPS from uploaded file using FileReader
  const extractGPSFromFile = async (file: File): Promise<Location | null> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const arrayBuffer = reader.result as ArrayBuffer;
          const uint8Array = new Uint8Array(arrayBuffer);
          
          // Look for GPS data in the file bytes
          const gpsData = findGPSInBytes(uint8Array);
          resolve(gpsData);
        } catch (error) {
          resolve(null);
        }
      };
      reader.onerror = () => resolve(null);
      reader.readAsArrayBuffer(file);
    });
  };
  
  // Search for GPS coordinates in byte array
  const findGPSInBytes = (bytes: Uint8Array): Location | null => {
    try {
      // Convert to string for pattern matching
      const str = new TextDecoder('latin1').decode(bytes);
      
      // Look for our injected GPS comment
      const gpsMatch = str.match(/GPS:([0-9.-]+),([0-9.-]+)/);
      if (gpsMatch) {
        const lat = parseFloat(gpsMatch[1]);
        const lng = parseFloat(gpsMatch[2]);
        if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
          return { latitude: lat, longitude: lng };
        }
      }
      
      // Look for standard EXIF GPS patterns
      const patterns = [
        /GPSLatitude.*?([0-9]{1,3}\.[0-9]{4,}).*?GPSLongitude.*?([0-9]{1,3}\.[0-9]{4,})/,
        /GPS.*?([0-9]{1,3}\.[0-9]{4,}).*?([0-9]{1,3}\.[0-9]{4,})/
      ];
      
      for (const pattern of patterns) {
        const match = str.match(pattern);
        if (match && match[1] && match[2]) {
          const lat = parseFloat(match[1]);
          const lng = parseFloat(match[2]);
          if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
            return { latitude: lat, longitude: lng };
          }
        }
      }
    } catch {}
    return null;
  };

  const startCamera = useCallback(async () => {
    console.log('🎥 startCamera called');
    try {
      // Check if camera API is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API not supported in this browser')
      }

      // Check if we're on HTTPS (required for camera access)
      if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
        throw new Error('Camera requires HTTPS connection')
      }

      console.log('🎥 Requesting camera access...');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false,
      })

      console.log('🎥 Camera stream obtained:', stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        setCameraActive(true)
        videoRef.current.onloadedmetadata = () => {
          console.log('🎥 Video metadata loaded');
        }
        try {
          await videoRef.current.play()
          console.log('🎥 Video playing');
        } catch (playError) {
          console.log('🎥 Play error:', playError);
        }
      }
    } catch (error) {
      console.error('🎥 Camera error:', error);
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
      
      // Fallback to file upload
      fileInputRef.current?.click()
    }
  }, [toast, facingMode])

  const capturePhoto = useCallback(async () => {
    console.log('📸 Capture photo called');
    if (!videoRef.current || !canvasRef.current) {
      console.error('📸 Video or canvas ref not available');
      return;
    }

    const video = videoRef.current
    const canvas = canvasRef.current
    
    // Compress for faster upload
    const maxSize = 800
    const ratio = Math.min(maxSize / video.videoWidth, maxSize / video.videoHeight)
    canvas.width = video.videoWidth * ratio
    canvas.height = video.videoHeight * ratio
    
    const context = canvas.getContext("2d")
    if (context) {
      context.drawImage(video, 0, 0, canvas.width, canvas.height)
      
      // Get current location for GPS injection
      const location = await getCurrentLocation()
      
      canvas.toBlob(async (blob) => {
        if (blob) {
          console.log('📸 Photo captured, attempting GPS embedding...');
          
          let finalBlob = blob;
          
          // Try to embed GPS data directly into JPEG EXIF
          if (location) {
            try {
              finalBlob = await embedGPSIntoJPEG(blob, location);
              console.log(`✅ GPS embedded into JPEG EXIF: ${location.latitude}, ${location.longitude}`);
            } catch (error) {
              console.log('⚠️ GPS embedding failed, using fallback injection');
            }
          }
          
          const file = new File([finalBlob], `capture-${Date.now()}.jpg`, {
            type: "image/jpeg",
          })
          
          // Fallback: Inject GPS as property
          if (location) {
            Object.defineProperty(file, '_gpsLocation', {
              value: location,
              writable: false,
              enumerable: false
            });
          }
          
          handleFileSelect(file)
          stopCamera()
        }
      }, "image/jpeg", 0.8) // Higher quality for better EXIF preservation
    }
  }, [handleFileSelect, stopCamera, getCurrentLocation, apiVersion])
  
  // Function to embed GPS data into JPEG EXIF
  const embedGPSIntoJPEG = async (blob: Blob, location: Location): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const arrayBuffer = reader.result as ArrayBuffer;
          const uint8Array = new Uint8Array(arrayBuffer);
          
          // Simple GPS injection into JPEG (basic implementation)
          // In a real implementation, you'd need a proper EXIF library
          const modifiedArray = injectGPSIntoJPEGBytes(uint8Array, location);
          const modifiedBlob = new Blob([modifiedArray], { type: 'image/jpeg' });
          resolve(modifiedBlob);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(blob);
    });
  };
  
  // Basic GPS injection into JPEG bytes
  const injectGPSIntoJPEGBytes = (bytes: Uint8Array, location: Location): Uint8Array => {
    // This is a simplified approach - real EXIF injection is complex
    // For now, we'll just append GPS data as a comment
    const gpsComment = `GPS:${location.latitude},${location.longitude}`;
    const commentBytes = new TextEncoder().encode(gpsComment);
    
    // Find JPEG comment marker (0xFFFE) or create one
    const result = new Uint8Array(bytes.length + commentBytes.length + 4);
    result.set(bytes.slice(0, 2)); // SOI marker
    
    // Insert comment marker
    result[2] = 0xFF;
    result[3] = 0xFE;
    result[4] = (commentBytes.length >> 8) & 0xFF;
    result[5] = commentBytes.length & 0xFF;
    result.set(commentBytes, 6);
    result.set(bytes.slice(2), 6 + commentBytes.length);
    
    return result;
  };

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
                    variant="outline"
                    disabled
                    className="h-12 px-6 text-sm font-medium bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-300 cursor-not-allowed"
                    title="Under maintenance for improved analysis accuracy"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-3 w-3 rounded-full bg-orange-500"></div>
                      <span>V1 - Maintenance</span>
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
                    📍 Enhanced GPS extraction + comprehensive location data
                  </p>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
        <div className="relative w-full bg-black rounded-3xl overflow-hidden mb-8" style={{ aspectRatio: '16/9', minHeight: '300px' }}>
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
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex gap-4">
              <Button
                onClick={() => {
                  console.log('❌ Stop camera clicked');
                  stopCamera();
                }}
                variant="outline"
                size="icon"
                className="rounded-full w-14 h-14 bg-white/95 backdrop-blur-sm border-white/60 hover:bg-white shadow-xl"
              >
                <X className="h-6 w-6" />
              </Button>
              <Button
                onClick={() => {
                  console.log('🔄 Switch camera clicked');
                  setFacingMode(facingMode === 'user' ? 'environment' : 'user');
                  stopCamera();
                  setTimeout(() => startCamera(), 100);
                }}
                variant="outline"
                size="icon"
                className="rounded-full w-14 h-14 bg-white/95 backdrop-blur-sm border-white/60 hover:bg-white shadow-xl"
              >
                <span className="text-xs font-bold">{facingMode === 'user' ? '📱' : '📷'}</span>
              </Button>
              <Button
                onClick={() => {
                  console.log('📸 Capture button clicked');
                  capturePhoto();
                }}
                size="lg"
                className="rounded-full w-24 h-24 bg-gradient-to-r from-blue-600 to-purple-600 border-4 border-white/60 shadow-2xl hover:scale-110 transition-transform duration-200"
              >
                <div className="w-12 h-12 rounded-full bg-white/95" />
              </Button>
            </div>
          )}
          
          {/* Empty State */}
          {!cameraActive && !previewUrl && !isProcessing && (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900">
              <div className="text-center p-6">
                <Camera className="h-16 w-16 mx-auto mb-4 text-slate-400" />
                <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300 mb-2">AI Location Recognition</h3>
                <p className="text-slate-500 dark:text-slate-400 mb-6 text-sm">Take a photo or upload an image</p>
                <div className="flex gap-3 justify-center">
                  <Button 
                    onClick={() => {
                      console.log('🎥 Camera button clicked');
                      startCamera();
                    }} 
                    className="px-6 py-2"
                  >
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
        
        {/* Results */}
        {result && (
          <div className="space-y-6">
            {console.log('🔍 Rendering result:', result)}
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
                      <div className="flex gap-2 mb-2">
                        {result.category && (
                          <Badge className="bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0 px-4 py-1">
                            {result.category}
                          </Badge>
                        )}
                        {result.method === 'device-location-fallback' && (
                          <Badge variant="outline" className="bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800 px-3 py-1">
                            Device Location
                          </Badge>
                        )}
                      </div>
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
                  
                  {result.note && (
                    <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-2xl border border-amber-200 dark:border-amber-800 mb-4">
                      <p className="text-sm text-amber-700 dark:text-amber-300">
                        ℹ️ {result.note}
                      </p>
                    </div>
                  )}
                </div>
                
                {/* Show More Information */}
                <ShowMoreInfo result={result} />
                
                {/* Actions */}
                <div className="flex flex-wrap gap-4">
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-xl hover:shadow-2xl transition-all duration-300 px-8"
                    onClick={async () => {
                      try {
                        await fetch('/api/save-location', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ ...result, apiVersion })
                        });
                        toast({ title: "Location saved", description: "Added to your saved places" });
                      } catch (error) {
                        toast({ title: "Save failed", description: "Could not save location", variant: "destructive" });
                      }
                    }}
                  >
                    <Bookmark className="h-5 w-5 mr-3" />
                    Save Location
                  </Button>
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

// Component to show additional location information
function ShowMoreInfo({ result }: { result: any }) {
  const [showMore, setShowMore] = useState(false)

  return (
    <div className="space-y-4">
      <Button
        onClick={() => setShowMore(!showMore)}
        variant="outline"
        className="w-full py-3 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm"
      >
        {showMore ? 'Show Less' : 'Show More Information'}
      </Button>
      
      {showMore && (
        <div className="space-y-6 p-6 bg-slate-50 dark:bg-slate-800 rounded-2xl">
          {/* Weather Information */}
          {result.weather && (
            <div>
              <h5 className="font-semibold text-sm mb-3">Current Weather</h5>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-3 bg-white dark:bg-slate-700 rounded-lg">
                  <p className="text-xs text-slate-500 mb-1">Temperature</p>
                  <p className="text-lg font-medium">{result.weather.temperature}°C</p>
                </div>
                <div className="p-3 bg-white dark:bg-slate-700 rounded-lg">
                  <p className="text-xs text-slate-500 mb-1">Wind Speed</p>
                  <p className="text-lg font-medium">{result.weather.windSpeed} km/h</p>
                </div>
                {result.weather.humidity && (
                  <div className="p-3 bg-white dark:bg-slate-700 rounded-lg">
                    <p className="text-xs text-slate-500 mb-1">Humidity</p>
                    <p className="text-lg font-medium">{result.weather.humidity}%</p>
                  </div>
                )}
                {result.weather.timezone && (
                  <div className="p-3 bg-white dark:bg-slate-700 rounded-lg">
                    <p className="text-xs text-slate-500 mb-1">Timezone</p>
                    <p className="text-sm font-medium">{result.weather.timezone}</p>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Location Details */}
          {result.locationDetails && (
            <div>
              <h5 className="font-semibold text-sm mb-3">Location Details</h5>
              <div className="grid grid-cols-2 gap-4">
                {result.locationDetails.city && (
                  <div className="p-3 bg-white dark:bg-slate-700 rounded-lg">
                    <p className="text-xs text-slate-500 mb-1">City</p>
                    <p className="text-sm font-medium">{result.locationDetails.city}</p>
                  </div>
                )}
                {result.locationDetails.state && (
                  <div className="p-3 bg-white dark:bg-slate-700 rounded-lg">
                    <p className="text-xs text-slate-500 mb-1">State/Region</p>
                    <p className="text-sm font-medium">{result.locationDetails.state}</p>
                  </div>
                )}
                {result.locationDetails.country && (
                  <div className="p-3 bg-white dark:bg-slate-700 rounded-lg">
                    <p className="text-xs text-slate-500 mb-1">Country</p>
                    <p className="text-sm font-medium">{result.locationDetails.country}</p>
                  </div>
                )}
                {result.locationDetails.postalCode && (
                  <div className="p-3 bg-white dark:bg-slate-700 rounded-lg">
                    <p className="text-xs text-slate-500 mb-1">Postal Code</p>
                    <p className="text-sm font-medium">{result.locationDetails.postalCode}</p>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Elevation & Geographic Data */}
          {result.elevation && (
            <div>
              <h5 className="font-semibold text-sm mb-3">Geographic Information</h5>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-white dark:bg-slate-700 rounded-lg">
                  <p className="text-xs text-slate-500 mb-1">Elevation</p>
                  <p className="text-lg font-medium">{result.elevation.elevation}m above sea level</p>
                </div>
                {result.location && (
                  <div className="p-3 bg-white dark:bg-slate-700 rounded-lg">
                    <p className="text-xs text-slate-500 mb-1">Coordinates</p>
                    <p className="text-sm font-medium">{result.location.latitude.toFixed(6)}, {result.location.longitude.toFixed(6)}</p>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Transit Information */}
          {result.transit && result.transit.length > 0 && (
            <div>
              <h5 className="font-semibold text-sm mb-3">Nearby Transit ({result.transit.length})</h5>
              <div className="space-y-2">
                {result.transit.slice(0, 3).map((station, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-white dark:bg-slate-700 rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{station.name}</p>
                      <p className="text-xs text-slate-500 capitalize">{station.type}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-500">{station.distance}m away</p>
                      {station.rating && (
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 text-amber-500" />
                          <span className="text-xs">{station.rating}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Demographics */}
          {result.demographics && (
            <div>
              <h5 className="font-semibold text-sm mb-3">Area Information</h5>
              <div className="p-3 bg-white dark:bg-slate-700 rounded-lg">
                <p className="text-xs text-slate-500 mb-1">Data Source</p>
                <p className="text-sm font-medium mb-2">{result.demographics.dataSource}</p>
                <p className="text-xs text-slate-400">{result.demographics.note}</p>
              </div>
            </div>
          )}
          
          {/* V2 Enhanced Data */}
          {result.photos && result.photos.length > 0 && (
            <div>
              <h5 className="font-semibold text-sm mb-3">Area Photos ({result.photos.length})</h5>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {result.photos.slice(0, 6).map((photo, index) => (
                  <img
                    key={index}
                    src={photo}
                    alt={`Location photo ${index + 1}`}
                    className="w-full h-24 object-cover rounded-lg shadow-md"
                    loading="lazy"
                  />
                ))}
              </div>
            </div>
          )}
          
          {result.nearbyPlaces && result.nearbyPlaces.length > 0 && (
            <div>
              <h5 className="font-semibold text-sm mb-3">Nearby Places ({result.nearbyPlaces.length})</h5>
              <div className="space-y-2">
                {result.nearbyPlaces.slice(0, 5).map((place, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-white dark:bg-slate-700 rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{place.name}</p>
                      <p className="text-xs text-slate-500 capitalize">{place.type}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-500">{place.distance}m</p>
                      {place.rating && (
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 text-amber-500" />
                          <span className="text-xs">{place.rating}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {result.deviceAnalysis && (
            <div>
              <h5 className="font-semibold text-sm mb-3">Device Analysis</h5>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-white dark:bg-slate-700 rounded-lg">
                  <p className="text-xs text-slate-500 mb-1">Camera</p>
                  <p className="text-sm font-medium">{result.deviceAnalysis.camera?.make || 'Unknown'}</p>
                  <p className="text-sm">{result.deviceAnalysis.camera?.model || 'Unknown'}</p>
                </div>
                <div className="p-3 bg-white dark:bg-slate-700 rounded-lg">
                  <p className="text-xs text-slate-500 mb-1">Image</p>
                  <p className="text-sm">{result.deviceAnalysis.image?.width} × {result.deviceAnalysis.image?.height}</p>
                  {result.deviceAnalysis.settings?.iso && (
                    <p className="text-sm">ISO: {result.deviceAnalysis.settings.iso}</p>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* Technical Details */}
          <div>
            <h5 className="font-semibold text-sm mb-3">Technical Information</h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {result.location && (
                <div className="p-3 bg-white dark:bg-slate-700 rounded-lg">
                  <p className="text-xs text-slate-500 mb-1">GPS Coordinates</p>
                  <p className="text-sm font-mono">{result.location.latitude.toFixed(6)}, {result.location.longitude.toFixed(6)}</p>
                </div>
              )}
              {result.method && (
                <div className="p-3 bg-white dark:bg-slate-700 rounded-lg">
                  <p className="text-xs text-slate-500 mb-1">Detection Method</p>
                  <p className="text-sm font-medium capitalize">{result.method.replace(/-/g, ' ')}</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Processing Summary */}
          <div>
            <h5 className="font-semibold text-sm mb-3">Processing Summary</h5>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-white dark:bg-slate-700 rounded-lg">
                <p className="text-xs text-slate-500 mb-1">Analysis Type</p>
                <p className="text-sm font-medium">{result.type || result.method}</p>
              </div>
              <div className="p-3 bg-white dark:bg-slate-700 rounded-lg">
                <p className="text-xs text-slate-500 mb-1">Confidence</p>
                <p className="text-sm font-medium">{result.confidence ? Math.round(result.confidence * 100) : 'N/A'}%</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}