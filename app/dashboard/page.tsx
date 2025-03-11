"use client"

import { useState, useEffect, useRef } from "react"
import {
  Camera,
  MapPin,
  ChevronDown,
  Map,
  ImageIcon,
  X,
  Navigation,
  Upload,
  User,
  LogOut,
  Settings,
  AlertCircle,
  Layers,
  History,
  Search,
  Compass,
  Sparkles,
  Bookmark,
  Clock,
  Loader2,
  Database,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

// Sidebar Provider and Components
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"

// Location Recognition API Types
interface Location {
  latitude: number
  longitude: number
}

interface LocationRecognitionResponse {
  success: boolean
  type: string
  name?: string
  address?: string
  location?: Location
  description?: string
  confidence?: number
  category?: string
  error?: string
  mapUrl?: string
  id?: string
  photos?: string[]
  rating?: number
  openingHours?: string
  formattedAddress?: string
  placeId?: string
}

// Camera Recognition Component with API Integration
const CameraRecognition = () => {
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [recognitionResult, setRecognitionResult] = useState<LocationRecognitionResponse | null>(null)
  const [error, setError] = useState(null)
  const [recentLocations, setRecentLocations] = useState<LocationRecognitionResponse[]>([])
  const fileInputRef = useRef(null)
  const [saveToDb, setSaveToDb] = useState(true)

  // Load recent locations from localStorage on component mount
  useEffect(() => {
    const storedLocations = localStorage.getItem("recentLocations")
    if (storedLocations) {
      try {
        setRecentLocations(JSON.parse(storedLocations))
      } catch (e) {
        console.error("Failed to parse stored locations", e)
      }
    }
  }, [])

  // Save recent locations to localStorage when they change
  useEffect(() => {
    if (recentLocations.length > 0) {
      localStorage.setItem("recentLocations", JSON.stringify(recentLocations))
    }
  }, [recentLocations])

  const handleFileChange = (e) => {
    setError(null)
    setRecognitionResult(null)

    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0]
      setSelectedFile(file)

      // Create preview URL
      const fileUrl = URL.createObjectURL(file)
      setPreviewUrl(fileUrl)

      // Start processing
      handleImageRecognition(file)
    }
  }

  const handleImageRecognition = async (file) => {
    try {
      setIsProcessing(true)
      setProgress(0)
      setError(null)

      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 5
        })
      }, 150)

      const formData = new FormData()
      formData.append("image", file)
      formData.append("saveToDb", saveToDb.toString())

      if (navigator.geolocation) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 5000,
              maximumAge: 0,
            })
          })

          formData.append("lat", position.coords.latitude.toString())
          formData.append("lng", position.coords.longitude.toString())
        } catch (err) {
          console.log("Geolocation error:", err)
        }
      }

      const response = await fetch("/api/location-recognition", {
        method: "POST",
        body: formData,
      })

      clearInterval(progressInterval)
      setProgress(100)

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const result = await response.json()
      console.log("Recognition result:", result) // Add logging

      if (!result) {
        throw new Error("No response from recognition API")
      }

      // Even if success is false, we might have useful information
      if (result.error) {
        console.warn("Recognition warning:", result.error)
      }

      // Add to recent locations if we have a name, even if success is false
      if (result.name) {
        setRecentLocations((prev) => {
          const newLocation = {
            name: result.name || "Unknown Location",
            address: result.address || "No Address",
            confidence: result.confidence || 0,
            category: result.type || "Unknown",
            date: new Date().toLocaleDateString(),
            mapUrl: result.mapUrl,
            location: result.location,
            photos: result.photos,
            rating: result.rating,
            openingHours: result.openingHours,
            formattedAddress: result.formattedAddress,
            placeId: result.placeId,
          }

          // Add to the beginning and limit to 5 items
          const updated = [
            newLocation,
            ...prev.filter((loc) => loc.name !== newLocation.name || loc.address !== newLocation.address),
          ].slice(0, 5)

          // Save to localStorage
          localStorage.setItem("recentLocations", JSON.stringify(updated))
          return updated
        })
      }

      setIsProcessing(false)
      setRecognitionResult(result)
    } catch (err) {
      console.error("Recognition failed:", err)
      setIsProcessing(false)
      setError(err instanceof Error ? err.message : "Recognition failed")
    }
  }

  const handleCameraCapture = () => {
    // In a real implementation, this would access the device camera
    // For now, we'll just trigger the file input
    fileInputRef.current?.click()
  }

  const handleReset = () => {
    setRecognitionResult(null)
    setPreviewUrl(null)
    setSelectedFile(null)
    setIsProcessing(false)
    setError(null)
  }

  const handleRecentLocationSelect = (location) => {
    setRecognitionResult(location)
    setPreviewUrl(null)
    setSelectedFile(null)
    setIsProcessing(false)
    setError(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1">
          <div className="relative h-[400px] bg-muted rounded-lg overflow-hidden border border-border flex items-center justify-center">
            {previewUrl && !isProcessing && !recognitionResult && (
              <img
                src={previewUrl || "/placeholder.svg"}
                alt="Preview"
                className="absolute inset-0 w-full h-full object-cover"
              />
            )}

            {isProcessing && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm z-10">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                >
                  <Loader2 className="w-12 h-12 text-primary" />
                </motion.div>
                <div className="text-sm font-medium mt-4 mb-2">Analyzing image...</div>
                <Progress value={progress} className="w-48 h-2" />
              </div>
            )}

            {recognitionResult && (
              <div className="absolute inset-0 flex flex-col p-4 overflow-auto">
                {recognitionResult.success ? (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-background/90 backdrop-blur-sm p-6 rounded-lg border border-border"
                  >
                    <div className="flex items-center gap-2 mb-4">
                      <MapPin className="h-5 w-5 text-primary" />
                      <h3 className="font-medium text-xl">{recognitionResult.name || "Unknown Location"}</h3>

                      {recognitionResult.confidence && (
                        <Badge variant={recognitionResult.confidence > 0.8 ? "default" : "outline"} className="ml-auto">
                          {Math.round(recognitionResult.confidence * 100)}% confidence
                        </Badge>
                      )}
                    </div>

                    {recognitionResult.confidence && recognitionResult.confidence < 0.7 && (
                      <div className="mb-4 text-sm bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 p-2 rounded-md flex items-start">
                        <AlertCircle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                        <span>Location may not be accurate. Please verify the details.</span>
                      </div>
                    )}

                    {recognitionResult.address && (
                      <p className="text-sm text-muted-foreground mb-3">{recognitionResult.address}</p>
                    )}

                    {recognitionResult.type && (
                      <Badge variant="outline" className="mb-4">
                        {recognitionResult.type}
                      </Badge>
                    )}

                    {recognitionResult.category && recognitionResult.type !== recognitionResult.category && (
                      <Badge variant="secondary" className="ml-2 mb-4">
                        {recognitionResult.category}
                      </Badge>
                    )}

                    {recognitionResult.description && <p className="text-sm mb-4">{recognitionResult.description}</p>}

                    {/* Display photos if available */}
                    {recognitionResult.photos && recognitionResult.photos.length > 0 && (
                      <div className="mb-4">
                        <p className="text-sm font-medium mb-2">Photos:</p>
                        <div className="flex gap-2 overflow-x-auto pb-2">
                          {recognitionResult.photos.map((photo, index) => (
                            <img
                              key={index}
                              src={photo || "/placeholder.svg"}
                              alt={`${recognitionResult.name} photo ${index + 1}`}
                              className="h-20 w-auto rounded-md object-cover"
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Display rating if available */}
                    {recognitionResult.rating && (
                      <div className="flex items-center mb-4">
                        <p className="text-sm font-medium mr-2">Rating:</p>
                        <div className="flex items-center">
                          <span className="text-amber-500 mr-1">{recognitionResult.rating}</span>
                          <div className="flex">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <svg
                                key={star}
                                className={`w-4 h-4 ${
                                  star <= Math.round(recognitionResult.rating)
                                    ? "text-amber-500 fill-amber-500"
                                    : "text-gray-300 fill-gray-300"
                                }`}
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                              >
                                <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                              </svg>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex justify-between mt-4">
                      {recognitionResult.mapUrl && (
                        <Button variant="outline" size="lg" asChild>
                          <a href={recognitionResult.mapUrl} target="_blank" rel="noopener noreferrer">
                            <Map className="w-4 h-4 mr-2" />
                            View on Map
                          </a>
                        </Button>
                      )}
                      {recognitionResult.location && (
                        <Button variant="default" size="lg">
                          <Navigation className="w-4 h-4 mr-2" />
                          Navigate
                        </Button>
                      )}
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-background/90 backdrop-blur-sm p-6 rounded-lg border border-border"
                  >
                    <div className="flex items-center gap-2 mb-4">
                      <AlertCircle className="h-5 w-5 text-destructive" />
                      <h3 className="font-medium text-xl">Recognition Failed</h3>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      {recognitionResult.error || "Could not identify the location in this image."}
                    </p>
                    <Button variant="outline" size="lg" className="w-full" onClick={handleReset}>
                      <ImageIcon className="w-4 h-4 mr-2" />
                      Try Again
                    </Button>
                  </motion.div>
                )}
              </div>
            )}

            {!previewUrl && !isProcessing && !recognitionResult && (
              <div className="flex flex-col items-center justify-center text-center p-6">
                <motion.div
                  initial={{ scale: 0.9, opacity: 0.5 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{
                    duration: 0.5,
                    repeat: Number.POSITIVE_INFINITY,
                    repeatType: "reverse",
                  }}
                >
                  <Camera className="w-20 h-20 mb-6 text-primary/70" />
                </motion.div>
                <h2 className="text-2xl font-bold mb-2">Identify Any Location</h2>
                <p className="text-muted-foreground mb-6 max-w-md">
                  Upload a photo or use your camera to instantly recognize landmarks, businesses, and navigate to them
                </p>
                <div className="flex gap-4">
                  <Button size="lg" onClick={() => fileInputRef.current?.click()}>
                    <Upload className="mr-2 h-5 w-5" />
                    Upload Image
                  </Button>
                  <Button size="lg" variant="outline" onClick={handleCameraCapture}>
                    <Camera className="mr-2 h-5 w-5" />
                    Use Camera
                  </Button>
                </div>
              </div>
            )}

            {error && !isProcessing && (
              <div className="absolute bottom-4 left-4 right-4 bg-destructive/10 text-destructive p-3 rounded">
                {error}
              </div>
            )}
          </div>

          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />

          <div className="flex justify-between items-center mt-4">
            {(previewUrl || recognitionResult) && (
              <Button variant="outline" onClick={handleReset}>
                <X className="mr-2 h-4 w-4" />
                Start Over
              </Button>
            )}

            <div className="flex items-center space-x-2 ml-auto">
              <Switch id="save-to-db" checked={saveToDb} onCheckedChange={setSaveToDb} />
              <Label htmlFor="save-to-db">Save to database</Label>
            </div>
          </div>
        </div>

        {/* Recent Locations Panel */}
        <div className="w-full md:w-80 shrink-0">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <Clock className="mr-2 h-4 w-4" />
                Recent Locations
              </CardTitle>
              <CardDescription>Your recently identified places</CardDescription>
            </CardHeader>
            <CardContent>
              {recentLocations.length > 0 ? (
                <div className="space-y-3">
                  {recentLocations.map((location, index) => (
                    <div
                      key={index}
                      className="p-3 rounded-md border border-border hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => handleRecentLocationSelect(location)}
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-sm">{location.name}</h4>
                        {location.confidence && (
                          <Badge variant="outline" className="text-xs">
                            {Math.round(location.confidence * 100)}%
                          </Badge>
                        )}
                      </div>
                      {location.address && (
                        <p className="text-xs text-muted-foreground mt-1 truncate">{location.address}</p>
                      )}
                      <div className="flex items-center mt-2">
                        <Badge variant="secondary" className="text-xs">
                          {location.category || location.type || "Unknown"}
                        </Badge>
                        <span className="text-xs text-muted-foreground ml-auto">
                          {location.date || new Date().toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <History className="h-10 w-10 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">No recent locations</p>
                  <p className="text-xs text-muted-foreground mt-1">Identified locations will appear here</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* How It Works Section */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>How It Works</CardTitle>
          <CardDescription>Three simple steps to navigate to any place using just a photo</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 relative">
                <Camera className="h-6 w-6 text-primary" />
                <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm flex items-center justify-center font-medium">
                  1
                </div>
              </div>
              <h3 className="text-lg font-medium mb-2">Upload or Take a Photo</h3>
              <p className="text-muted-foreground">
                Capture or select an image of any landmark, building, or location you want to visit
              </p>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 relative">
                <Sparkles className="h-6 w-6 text-primary" />
                <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm flex items-center justify-center font-medium">
                  2
                </div>
              </div>
              <h3 className="text-lg font-medium mb-2">AI Identifies the Location</h3>
              <p className="text-muted-foreground">
                Our technology recognizes the place in your image and provides details about it
              </p>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 relative">
                <Compass className="h-6 w-6 text-primary" />
                <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm flex items-center justify-center font-medium">
                  3
                </div>
              </div>
              <h3 className="text-lg font-medium mb-2">Get Navigation Directions</h3>
              <p className="text-muted-foreground">
                Navigate to the identified location with precise turn-by-turn directions
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Location Recognition Dialog with API Integration
const LocationRecognitionDialog = ({ open, onOpenChange }) => {
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [recognitionResult, setRecognitionResult] = useState(null)
  const [error, setError] = useState(null)
  const fileInputRef = useRef(null)
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const [isCameraActive, setIsCameraActive] = useState(false)
  const streamRef = useRef(null)

  useEffect(() => {
    // Clean up camera stream when dialog closes
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
        streamRef.current = null
      }
    }
  }, [])

  const handleFileChange = (e) => {
    setError(null)
    setRecognitionResult(null)

    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0]
      setSelectedFile(file)

      // Create preview URL
      const fileUrl = URL.createObjectURL(file)
      setPreviewUrl(fileUrl)

      // Process the image if not using camera
      if (!isCameraActive) {
        handleImageRecognition(file)
      }
    }
  }

  const startCamera = async () => {
    try {
      setIsCameraActive(true)
      setError(null)
      setRecognitionResult(null)
      setPreviewUrl(null)

      if (!videoRef.current) return

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      })

      videoRef.current.srcObject = stream
      streamRef.current = stream
    } catch (err) {
      console.error("Camera access error:", err)
      setError("Could not access camera")
      setIsCameraActive(false)
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    setIsCameraActive(false)
  }

  const captureImage = () => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    // Draw video frame to canvas
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    // Convert canvas to blob
    canvas.toBlob(
      async (blob) => {
        if (!blob) return

        const file = new File([blob], "camera-capture.jpg", { type: "image/jpeg" })
        setSelectedFile(file)

        // Create preview URL
        const fileUrl = URL.createObjectURL(blob)
        setPreviewUrl(fileUrl)

        // Stop camera
        stopCamera()

        // Process the image
        await handleImageRecognition(file)
      },
      "image/jpeg",
      0.95,
    )
  }

  const handleImageRecognition = async (file) => {
    try {
      setIsProcessing(true)
      setProgress(0)
      setError(null)

      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 5
        })
      }, 150)

      // Create form data for API request
      const formData = new FormData()
      formData.append("image", file)

      // Get current location if available
      if (navigator.geolocation) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 5000,
              maximumAge: 0,
            })
          })

          formData.append("lat", position.coords.latitude.toString())
          formData.append("lng", position.coords.longitude.toString())
        } catch (err) {
          console.log("Geolocation error:", err)
          // Continue without location
        }
      }

      // Call the API
      const response = await fetch("/api/location-recognition", {
        method: "POST",
        body: formData,
      })

      clearInterval(progressInterval)
      setProgress(100)

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const result = await response.json()

      setIsProcessing(false)
      setRecognitionResult(result)
    } catch (err) {
      console.error("Recognition failed:", err)
      setIsProcessing(false)
      setError(err instanceof Error ? err.message : "Recognition failed")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Identify Any Location</h3>
            <Badge variant="outline">AI Powered</Badge>
          </div>

          <p className="text-sm text-muted-foreground">
            Upload an image or use your camera to instantly identify landmarks, businesses, streets, and more.
          </p>

          <div className="relative h-72 bg-muted rounded-lg overflow-hidden border border-border">
            {/* Preview image */}
            {previewUrl && !isProcessing && !recognitionResult && (
              <img
                src={previewUrl || "/placeholder.svg"}
                alt="Preview"
                className="absolute inset-0 w-full h-full object-cover"
              />
            )}

            {/* Camera view */}
            {isCameraActive && (
              <>
                <video ref={videoRef} autoPlay playsInline className="absolute inset-0 w-full h-full object-cover" />
                <canvas ref={canvasRef} className="hidden" />
                <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                  <Button className="bg-primary/90 hover:bg-primary" onClick={captureImage}>
                    <Camera className="mr-2 h-4 w-4" />
                    Capture Photo
                  </Button>
                </div>
              </>
            )}

            {/* Processing indicator */}
            {isProcessing && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm z-10">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                >
                  <Loader2 className="w-12 h-12 text-primary" />
                </motion.div>
                <div className="text-sm font-medium mt-4 mb-2">Analyzing image...</div>
                <Progress value={progress} className="w-48 h-2" />
              </div>
            )}

            {/* Recognition results */}
            {recognitionResult && (
              <div className="absolute inset-0 flex flex-col p-4 overflow-auto">
                {recognitionResult.success ? (
                  <div className="bg-background/90 backdrop-blur-sm p-4 rounded-lg border border-border">
                    <div className="flex items-center gap-2 mb-3">
                      <MapPin className="h-5 w-5 text-primary" />
                      <h3 className="font-medium text-lg">{recognitionResult.name || "Unknown Location"}</h3>
                    </div>
                    {recognitionResult.address && (
                      <p className="text-sm text-muted-foreground mb-2">{recognitionResult.address}</p>
                    )}
                    {recognitionResult.category && (
                      <Badge variant="outline" className="mb-3">
                        {recognitionResult.category}
                      </Badge>
                    )}
                    {recognitionResult.description && <p className="text-sm mb-3">{recognitionResult.description}</p>}
                    <div className="flex justify-between mt-3">
                      <Button variant="outline" size="sm" asChild>
                        <a href={recognitionResult.mapUrl} target="_blank" rel="noopener noreferrer">
                          <Map className="w-4 h-4 mr-1" />
                          View on Map
                        </a>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setRecognitionResult(null)
                          setPreviewUrl(null)
                          setSelectedFile(null)
                        }}
                      >
                        <ImageIcon className="w-4 h-4 mr-1" />
                        New Scan
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-background/90 backdrop-blur-sm p-4 rounded-lg border border-border">
                    <div className="flex items-center gap-2 mb-3">
                      <AlertCircle className="h-5 w-5 text-destructive" />
                      <h3 className="font-medium">Recognition Failed</h3>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      {recognitionResult.error || "Could not identify the location in this image."}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => {
                        setRecognitionResult(null)
                        setPreviewUrl(null)
                        setSelectedFile(null)
                      }}
                    >
                      <ImageIcon className="w-4 h-4 mr-1" />
                      Try Again
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Default state */}
            {!previewUrl && !isCameraActive && !isProcessing && !recognitionResult && (
              <div className="flex flex-col items-center justify-center h-full p-4">
                <Camera className="h-16 w-16 mb-4 text-primary/70" />
                <p className="text-base mb-2 text-center">Capture or upload an image</p>
                <p className="text-sm text-muted-foreground text-center">
                  Works with landmarks, storefronts, street signs, and more
                </p>
              </div>
            )}

            {/* Error message */}
            {error && !isProcessing && (
              <div className="absolute bottom-2 left-2 right-2 bg-destructive/10 text-destructive text-xs p-2 rounded">
                {error}
              </div>
            )}
          </div>

          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />

          <div className="grid grid-cols-2 gap-4">
            {isCameraActive ? (
              <Button onClick={stopCamera} variant="outline" className="w-full">
                <X className="mr-2 h-4 w-4" />
                Cancel Camera
              </Button>
            ) : (
              <Button onClick={startCamera} disabled={isProcessing} className="w-full" variant="secondary">
                <Camera className="mr-2 h-4 w-4" />
                Use Camera
              </Button>
            )}

            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing || isCameraActive}
              className="w-full"
            >
              <ImageIcon className="mr-2 h-4 w-4" />
              Upload Image
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Main Dashboard Component
export default function Dashboard() {
  const [showLocationRecognitionDialog, setShowLocationRecognitionDialog] = useState(false)
  const [activeTab, setActiveTab] = useState("recognition")
  const [isDarkMode, setIsDarkMode] = useState(false)

  const [user, setUser] = useState({ username: "John Doe", plan: "Free" })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const router = useRouter()

  // Add this effect to handle dark mode toggle
  useEffect(() => {
    // Check if user preference is stored in localStorage
    const storedTheme = localStorage.getItem("theme")
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches

    // Set initial state based on localStorage or system preference
    if (storedTheme === "dark" || (!storedTheme && prefersDark)) {
      setIsDarkMode(true)
      document.documentElement.classList.add("dark")
    } else {
      setIsDarkMode(false)
      document.documentElement.classList.remove("dark")
    }

    // Simulate loading state
    setTimeout(() => {
      setLoading(false)
    }, 1000)
  }, [])

  // Function to toggle dark mode
  const toggleDarkMode = () => {
    const newMode = !isDarkMode
    setIsDarkMode(newMode)

    if (newMode) {
      document.documentElement.classList.add("dark")
      localStorage.setItem("theme", "dark")
    } else {
      document.documentElement.classList.remove("dark")
      localStorage.setItem("theme", "light")
    }
  }

  useEffect(() => {
    // Responsive sidebar handling
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setSidebarOpen(false)
      } else {
        setSidebarOpen(true)
      }
    }

    // Set initial state
    handleResize()

    // Add event listener
    window.addEventListener("resize", handleResize)

    // Cleanup
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // Handle logout
  const handleLogout = async () => {
    try {
      // Remove authentication token
      localStorage.removeItem("token")

      // Redirect to login page
      router.push("/")
    } catch (error) {
      console.error("Error during logout:", error)
    }
  }

  // Loading state
  if (loading) {
    return <DashboardSkeleton />
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Error Loading Dashboard</CardTitle>
            <CardDescription>We encountered an issue while loading your data</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{error}</p>
          </CardContent>
          <CardFooter>
            <Button onClick={() => window.location.reload()} className="w-full">
              Try Again
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <SidebarProvider defaultOpen={sidebarOpen}>
      <div className="flex min-h-screen bg-background">
        {/* Sidebar */}
        <Sidebar className="border-r border-border">
          <SidebarHeader>
            <div className="flex items-center px-2 py-3">
              <div className="w-8 h-8 bg-gradient-to-r from-primary to-purple-600 rounded-lg flex items-center justify-center mr-2">
                <MapPin className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-semibold">SabiRoad</span>
            </div>
          </SidebarHeader>

          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Navigation</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={activeTab === "recognition"}
                      onClick={() => setActiveTab("recognition")}
                    >
                      <button>
                        <Camera className="h-4 w-4" />
                        <span>Image Recognition</span>
                      </button>
                    </SidebarMenuButton>
                  </SidebarMenuItem>

                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={activeTab === "locations"}
                      onClick={() => setActiveTab("locations")}
                    >
                      <button>
                        <MapPin className="h-4 w-4" />
                        <span>Saved Locations</span>
                      </button>
                    </SidebarMenuButton>
                  </SidebarMenuItem>

                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={activeTab === "map"} onClick={() => setActiveTab("map")}>
                      <button>
                        <Map className="h-4 w-4" />
                        <span>Map View</span>
                      </button>
                    </SidebarMenuButton>
                  </SidebarMenuItem>

                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={activeTab === "search"} onClick={() => setActiveTab("search")}>
                      <button>
                        <Search className="h-4 w-4" />
                        <span>Search</span>
                      </button>
                    </SidebarMenuButton>
                  </SidebarMenuItem>

                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={activeTab === "bookmarks"}
                      onClick={() => setActiveTab("bookmarks")}
                    >
                      <button>
                        <Bookmark className="h-4 w-4" />
                        <span>Bookmarks</span>
                      </button>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter>
            <div className="p-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="w-full justify-start px-2">
                    <Avatar className="h-8 w-8 mr-2 border-2 border-primary/20">
                      <AvatarFallback className="bg-primary/10 text-primary">{user?.username?.[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col items-start text-sm">
                      <span className="font-medium">{user?.username}</span>
                      <span className="text-xs text-muted-foreground">{user?.plan} Plan</span>
                    </div>
                    <ChevronDown className="ml-auto h-4 w-4 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </SidebarFooter>
        </Sidebar>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-h-screen max-h-screen overflow-hidden">
          {/* Header */}
          <header className="border-b border-border h-16 flex items-center justify-between px-4 sm:px-6 bg-background">
            <div className="flex items-center">
              <SidebarTrigger className="mr-4" />
              <h1 className="text-xl font-bold">Image-Based Navigation</h1>
            </div>

            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="icon" onClick={toggleDarkMode}>
                {isDarkMode ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="lucide lucide-sun"
                  >
                    <circle cx="12" cy="12" r="4" />
                    <path d="M12 2v2" />
                    <path d="M12 20v2" />
                    <path d="m4.93 4.93 1.41 1.41" />
                    <path d="m17.66 17.66 1.41 1.41" />
                    <path d="M2 12h2" />
                    <path d="M20 12h2" />
                    <path d="m6.34 17.66-1.41 1.41" />
                    <path d="m19.07 4.93-1.41 1.41" />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="lucide lucide-moon"
                  >
                    <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
                  </svg>
                )}
              </Button>

              <Button variant="outline" size="sm" onClick={() => setShowLocationRecognitionDialog(true)}>
                <Camera className="h-4 w-4 mr-2" />
                Quick Scan
              </Button>
            </div>
          </header>

          {/* Main Dashboard Content */}
          <main className="flex-1 p-4 sm:p-6 overflow-auto">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="recognition">
                  <Camera className="h-4 w-4 mr-2" />
                  Recognition
                </TabsTrigger>
                <TabsTrigger value="locations">
                  <MapPin className="h-4 w-4 mr-2" />
                  Locations
                </TabsTrigger>
                <TabsTrigger value="map">
                  <Map className="h-4 w-4 mr-2" />
                  Map
                </TabsTrigger>
                <TabsTrigger value="search">
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </TabsTrigger>
              </TabsList>

              <TabsContent value="recognition" className="mt-0">
                <CameraRecognition />
              </TabsContent>

              <TabsContent value="locations" className="mt-0">
                <div className="grid gap-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold">Saved Locations</h2>
                    <Input
                      placeholder="Search locations..."
                      className="max-w-xs"
                      prefix={<Search className="h-4 w-4 text-muted-foreground" />}
                    />
                  </div>

                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    <Card className="bg-muted/40">
                      <CardHeader className="pb-2">
                        <CardTitle>Connect to Database</CardTitle>
                        <CardDescription>View your saved locations from the database</CardDescription>
                      </CardHeader>
                      <CardContent className="flex flex-col items-center justify-center py-6">
                        <Database className="h-12 w-12 text-primary/70 mb-4" />
                        <p className="text-center text-sm text-muted-foreground mb-4">
                          Connect to your database to view and manage your saved locations
                        </p>
                        <Button>
                          <Layers className="h-4 w-4 mr-2" />
                          Connect Database
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="map" className="mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle>Map View</CardTitle>
                    <CardDescription>View all your identified locations on a map</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[500px] flex items-center justify-center bg-muted/40">
                    <div className="text-center">
                      <Map className="h-16 w-16 text-primary/70 mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">Map Coming Soon</h3>
                      <p className="text-sm text-muted-foreground max-w-md">
                        We're working on integrating an interactive map to visualize all your identified locations.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="search" className="mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle>Search Locations</CardTitle>
                    <CardDescription>Search for locations by name, address, or category</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-4 mb-6">
                      <Input placeholder="Search for a location..." className="flex-1" />
                      <Button>
                        <Search className="h-4 w-4 mr-2" />
                        Search
                      </Button>
                    </div>

                    <div className="flex items-center justify-center py-12 bg-muted/40 rounded-lg">
                      <div className="text-center">
                        <Search className="h-16 w-16 text-primary/70 mx-auto mb-4" />
                        <h3 className="text-lg font-medium mb-2">No Search Results</h3>
                        <p className="text-sm text-muted-foreground max-w-md">
                          Try searching for a location by name, address, or category
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </main>

          {/* Footer */}
          <footer className="border-t border-border p-4 text-center text-xs text-muted-foreground">
            <div className="flex items-center justify-center gap-1">
              <span>© 2025 SabiRoad, Inc.</span>
              <Separator orientation="vertical" className="h-3 mx-2" />
              <a href="#" className="hover:underline">
                Terms
              </a>
              <Separator orientation="vertical" className="h-3 mx-2" />
              <a href="#" className="hover:underline">
                Privacy
              </a>
            </div>
          </footer>
        </div>
      </div>

      {/* Location Recognition Dialog */}
      <LocationRecognitionDialog open={showLocationRecognitionDialog} onOpenChange={setShowLocationRecognitionDialog} />
    </SidebarProvider>
  )
}

const DashboardSkeleton = () => (
  <div className="flex min-h-screen bg-background">
    {/* Sidebar Skeleton */}
    <aside className="w-64 border-r border-border hidden md:block">
      <div className="p-4">
        <div className="h-8 bg-muted rounded-md mb-4"></div>
        <div className="h-6 bg-muted rounded-md mb-2"></div>
        <div className="h-6 bg-muted rounded-md mb-2"></div>
        <div className="h-6 bg-muted rounded-md mb-2"></div>
      </div>
    </aside>

    {/* Main Content Skeleton */}
    <div className="flex-1 flex flex-col">
      {/* Header Skeleton */}
      <header className="h-16 border-b border-border p-4 flex justify-between items-center">
        <div className="h-8 bg-muted rounded-md w-48"></div>
        <div className="h-8 bg-muted rounded-md w-24"></div>
      </header>

      {/* Main Area Skeleton */}
      <main className="flex-1 p-4 space-y-4">
        <div className="h-8 bg-muted rounded-md w-64 mb-6"></div>
        <div className="h-[400px] bg-muted rounded-md mb-6"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="h-32 bg-muted rounded-md"></div>
          <div className="h-32 bg-muted rounded-md"></div>
          <div className="h-32 bg-muted rounded-md"></div>
        </div>
      </main>

      {/* Footer Skeleton */}
      <footer className="h-12 border-t border-border p-4">
        <div className="h-4 bg-muted rounded-md w-32 mx-auto"></div>
      </footer>
    </div>
  </div>
)

