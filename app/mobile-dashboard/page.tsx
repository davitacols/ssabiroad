"use client"

import { useState, useEffect, useRef } from "react"
import { Camera, MapPin, Search, Heart, User, X, Navigation, Upload, Settings, LogOut, AlertCircle, Clock, Loader2, Database, Trash2, Info, Plus, Sun, Moon, Image, Map } from 'lucide-react'
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from "@react-google-maps/api"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { toast } from "@/components/ui/use-toast"
import { useIsMobile } from "@/hooks/use-mobile"

// Import the new components
import { LocationSuggestions } from "@/components/location-suggestions"
import { ImageCaptionGenerator } from "@/components/image-caption-generator"
import { AIContentGenerator } from "@/components/ai-content-generator"

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
  phoneNumber?: string
  website?: string
  buildingType?: string
  historicalInfo?: string
  materialType?: string
  weatherConditions?: string
  airQuality?: string
  urbanDensity?: string
  vegetationDensity?: string
  crowdDensity?: string
  timeOfDay?: string
  significantColors?: string[]
  waterProximity?: string
  geoData?: {
    country?: string
    countryCode?: string
    administrativeArea?: string
    locality?: string
    subLocality?: string
    postalCode?: string
    streetName?: string
    streetNumber?: string
    formattedAddress?: string
    timezone?: string
    elevation?: number
  }
  nearbyPlaces?: {
    name: string
    type: string
    distance: number
    location: Location
  }[]
}

// Define a type for saved locations
interface SavedLocation extends LocationRecognitionResponse {
  id: string
  createdAt: string
  isBookmarked?: boolean
}

// Define a type for bookmarks
interface Bookmark {
  id: string
  locationId: string
  name: string
  address: string
  category: string
  createdAt: string
}

// Camera Recognition Component with API Integration
const MobileCameraRecognition = () => {
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [recognitionResult, setRecognitionResult] = useState<LocationRecognitionResponse | null>(null)
  const [error, setError] = useState(null)
  const [recentLocations, setRecentLocations] = useState<LocationRecognitionResponse[]>([])
  const fileInputRef = useRef(null)
  const [saveToDb, setSaveToDb] = useState(true)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [cameraActive, setCameraActive] = useState(false)
  const isMobile = useIsMobile()

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
      console.log("Recognition result:", result)

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

  const handleCameraCapture = async () => {
    try {
      if (!cameraActive) {
        // Start the camera
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "environment", // Use back camera if available
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
          audio: false,
        })

        // Set the stream to the video element
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.play()
          setCameraActive(true)
        }
      } else {
        // Capture the current frame
        if (videoRef.current && canvasRef.current) {
          const video = videoRef.current
          const canvas = canvasRef.current

          // Set canvas dimensions to match video
          canvas.width = video.videoWidth
          canvas.height = video.videoHeight

          // Draw the current video frame to the canvas
          const context = canvas.getContext("2d")
          if (context) {
            context.drawImage(video, 0, 0, canvas.width, canvas.height)

            // Convert the canvas to a Blob
            canvas.toBlob(
              async (blob) => {
                if (blob) {
                  // Create a File object from the Blob
                  const file = new File([blob], `camera-capture-${Date.now()}.jpg`, {
                    type: "image/jpeg",
                    lastModified: Date.now(),
                  })

                  // Process the file
                  setSelectedFile(file)
                  const fileUrl = URL.createObjectURL(file)
                  setPreviewUrl(fileUrl)
                  await handleImageRecognition(file)

                  // Stop the camera
                  stopCamera()
                }
              },
              "image/jpeg",
              0.8,
            ) // JPEG at 80% quality
          }
        }
      }
    } catch (error) {
      console.error("Error accessing camera:", error)
      toast({
        title: "Camera Error",
        description: "Could not access the camera. Please check permissions.",
        variant: "destructive",
      })

      // Fall back to file input if camera fails
      fileInputRef.current?.click()
    }
  }

  // Helper function to stop the camera
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      const tracks = stream.getTracks()

      tracks.forEach((track) => {
        track.stop()
      })

      videoRef.current.srcObject = null
      setCameraActive(false)
    }
  }

  const handleReset = () => {
    setRecognitionResult(null)
    setPreviewUrl(null)
    setSelectedFile(null)
    setIsProcessing(false)
    setError(null)
    stopCamera()
  }

  const handleRecentLocationSelect = (location) => {
    setRecognitionResult(location)
    setPreviewUrl(null)
    setSelectedFile(null)
    setIsProcessing(false)
    setError(null)
  }

  return (
    <div className="space-y-4">
      <div className="relative h-[60vh] bg-muted rounded-lg overflow-hidden border border-border flex items-center justify-center">
        {/* Camera video feed */}
        <video
          ref={videoRef}
          className={`absolute inset-0 w-full h-full object-cover ${cameraActive ? "block" : "hidden"}`}
          autoPlay
          playsInline
          muted
        />
        <canvas ref={canvasRef} className="hidden" />

        {previewUrl && !isProcessing && !recognitionResult && (
          <motion.img
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            src={previewUrl || "/placeholder.svg"}
            alt="Preview"
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}

        {isProcessing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm z-10"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
            >
              <Loader2 className="w-12 h-12 text-primary" />
            </motion.div>
            <div className="text-sm font-medium mt-4 mb-2">Analyzing image...</div>
            <Progress value={progress} className="w-48 h-2" />
          </motion.div>
        )}

        {recognitionResult && (
          <div className="absolute inset-0 flex flex-col p-4 overflow-auto">
            {recognitionResult.success ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-background/90 backdrop-blur-sm p-4 rounded-lg border border-border"
              >
                <div className="flex items-center gap-2 mb-3">
                  <MapPin className="h-5 w-5 text-primary" />
                  <h3 className="font-medium text-lg">{recognitionResult.name || "Unknown Location"}</h3>
                </div>

                {recognitionResult.confidence && (
                  <Badge variant={recognitionResult.confidence > 0.8 ? "default" : "outline"} className="mb-3">
                    {Math.round(recognitionResult.confidence * 100)}% confidence
                  </Badge>
                )}

                {recognitionResult.confidence && recognitionResult.confidence < 0.7 && (
                  <div className="mb-3 text-sm bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 p-2 rounded-md flex items-start">
                    <AlertCircle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Location may not be accurate. Please verify the details.</span>
                  </div>
                )}

                {recognitionResult.address && (
                  <p className="text-sm text-muted-foreground mb-3">{recognitionResult.address}</p>
                )}

                <div className="flex flex-wrap gap-2 mb-3">
                  {recognitionResult.type && <Badge variant="outline">{recognitionResult.type}</Badge>}

                  {recognitionResult.category && recognitionResult.type !== recognitionResult.category && (
                    <Badge variant="secondary">{recognitionResult.category}</Badge>
                  )}
                </div>

                {recognitionResult.description && <p className="text-sm mb-3">{recognitionResult.description}</p>}

                {/* Display photos if available */}
                {recognitionResult.photos && recognitionResult.photos.length > 0 && (
                  <div className="mb-3">
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      {recognitionResult.photos.map((photo, index) => (
                        <motion.img
                          key={index}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.1 }}
                          src={photo || "/placeholder.svg"}
                          alt={`${recognitionResult.name} photo ${index + 1}`}
                          className="h-20 w-auto rounded-md object-cover"
                        />
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-between mt-3">
                  {recognitionResult.mapUrl && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={recognitionResult.mapUrl} target="_blank" rel="noopener noreferrer">
                        <MapPin className="w-4 h-4 mr-2" />
                        View on Map
                      </a>
                    </Button>
                  )}
                  {recognitionResult.location && (
                    <Button variant="default" size="sm">
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
                className="bg-background/90 backdrop-blur-sm p-4 rounded-lg border border-border"
              >
                <div className="flex items-center gap-2 mb-4">
                  <AlertCircle className="h-5 w-5 text-destructive" />
                  <h3 className="font-medium text-lg">Recognition Failed</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  {recognitionResult.error || "Could not identify the location in this image."}
                </p>
                <Button variant="outline" size="sm" className="w-full" onClick={handleReset}>
                  <Image className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
              </motion.div>
            )}
          </div>
        )}

        {!previewUrl && !isProcessing && !recognitionResult && !cameraActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center text-center p-6"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0.5 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                duration: 0.5,
                repeat: Number.POSITIVE_INFINITY,
                repeatType: "reverse",
              }}
            >
              <Camera className="w-16 h-16 mb-4 text-primary/70" />
            </motion.div>
            <h2 className="text-xl font-bold mb-2">Identify Any Location</h2>
            <p className="text-muted-foreground mb-6 text-sm">
              Upload a photo or use your camera to instantly recognize places
            </p>
          </motion.div>
        )}

        {error && !isProcessing && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute bottom-4 left-4 right-4 bg-destructive/10 text-destructive p-3 rounded"
          >
            {error}
          </motion.div>
        )}
      </div>

      <div className="flex gap-2 justify-center">
        <Button size="lg" onClick={handleCameraCapture} className="flex-1">
          <Camera className="mr-2 h-5 w-5" />
          {cameraActive ? "Capture" : "Camera"}
        </Button>
        <Button size="lg" variant="outline" onClick={() => fileInputRef.current?.click()} className="flex-1">
          <Upload className="mr-2 h-5 w-5" />
          Upload
        </Button>
      </div>

      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />

      {(previewUrl || recognitionResult || cameraActive) && (
        <Button variant="outline" onClick={handleReset} className="w-full mt-2">
          <X className="mr-2 h-4 w-4" />
          Start Over
        </Button>
      )}

      {/* Recent Locations */}
      {recentLocations.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-medium mb-3 flex items-center">
            <Clock className="mr-2 h-4 w-4" />
            Recent Locations
          </h3>
          <div className="space-y-2">
            {recentLocations.slice(0, 3).map((location, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="p-3 rounded-md border border-border/50 hover:bg-muted/50 cursor-pointer transition-colors"
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
                {location.address && <p className="text-xs text-muted-foreground mt-1 truncate">{location.address}</p>}
                <div className="flex items-center mt-2">
                  <Badge variant="secondary" className="text-xs">
                    {location.category || location.type || "Unknown"}
                  </Badge>
                  <span className="text-xs text-muted-foreground ml-auto">
                    {location.date || new Date().toLocaleDateString()}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center space-x-2 mt-4">
        <Switch id="save-to-db" checked={saveToDb} onCheckedChange={setSaveToDb} />
        <Label htmlFor="save-to-db">Save to database</Label>
      </div>
    </div>
  )
}

// Mobile Locations Feature
const MobileLocationsFeature = () => {
  const [locations, setLocations] = useState<SavedLocation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedLocation, setSelectedLocation] = useState<SavedLocation | null>(null)
  const [showLocationDetails, setShowLocationDetails] = useState(false)
  const [searchQuery, setSearchQuery] = useState<string>("")

  // Fetch locations from the API
  const fetchLocations = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch("/api/location-recognition?operation=all")

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()

      if (data.success && data.locations) {
        // Transform the data to match our SavedLocation type
        const transformedLocations = data.locations.map((loc: any) => ({
          ...loc,
          createdAt: new Date(loc.createdAt).toISOString(),
          isBookmarked: false, // We'll update this later
        }))

        // Fetch bookmarks to mark bookmarked locations
        const bookmarksResponse = await fetch("/api/bookmarks")
        if (bookmarksResponse.ok) {
          const bookmarksData = await bookmarksResponse.json()
          if (bookmarksData.success && bookmarksData.bookmarks) {
            const bookmarkedLocationIds = bookmarksData.bookmarks.map((b: Bookmark) => b.locationId)

            // Mark bookmarked locations
            transformedLocations.forEach((loc: SavedLocation) => {
              loc.isBookmarked = bookmarkedLocationIds.includes(loc.id)
            })
          }
        }

        setLocations(transformedLocations)
      } else {
        setLocations([])
      }
    } catch (err) {
      console.error("Failed to fetch locations:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch locations")
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch locations on component mount
  useEffect(() => {
    fetchLocations()
  }, [])

  // Handle location deletion
  const handleDeleteLocation = async (id: string) => {
    try {
      const response = await fetch(`/api/location-recognition/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      // Remove the location from the state
      setLocations(locations.filter((loc) => loc.id !== id))
      toast({
        title: "Location deleted",
        description: "The location has been successfully deleted.",
      })
    } catch (err) {
      console.error("Failed to delete location:", err)
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to delete location",
        variant: "destructive",
      })
    }
  }

  // Handle bookmark toggle
  const handleToggleBookmark = async (location: SavedLocation) => {
    try {
      if (location.isBookmarked) {
        // Remove bookmark
        const response = await fetch(`/api/bookmarks/${location.id}`, {
          method: "DELETE",
        })

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`)
        }

        // Update state
        setLocations(locations.map((loc) => (loc.id === location.id ? { ...loc, isBookmarked: false } : loc)))

        toast({
          title: "Bookmark removed",
          description: `${location.name} has been removed from bookmarks.`,
        })
      } else {
        // Add bookmark
        const response = await fetch("/api/bookmarks", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            locationId: location.id,
            name: location.name,
            address: location.address,
            category: location.category || "Unknown",
            mapUrl: location.mapUrl,
            imageUrl: location.imageUrl,
            latitude: location.latitude,
            longitude: location.longitude,
            confidence: location.confidence,
            createdAt: location.createdAt,
            updatedAt: location.updatedAt,
            description: location.description,
          }),
        })

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`)
        }

        // Update state
        setLocations(locations.map((loc) => (loc.id === location.id ? { ...loc, isBookmarked: true } : loc)))

        toast({
          title: "Bookmark added",
          description: `${location.name} has been added to bookmarks.`,
        })
      }
    } catch (err) {
      console.error("Failed to toggle bookmark:", err)
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to update bookmark",
        variant: "destructive",
      })
    }
  }

  // View location details
  const handleViewDetails = (location: SavedLocation) => {
    setSelectedLocation(location)
    setShowLocationDetails(true)
  }

  // Filter locations
  const filteredLocations = locations.filter((loc) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        loc.name?.toLowerCase().includes(query) ||
        false ||
        loc.address?.toLowerCase().includes(query) ||
        false ||
        loc.description?.toLowerCase().includes(query) ||
        false
      )
    }
    return true
  })

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3">
        <Input
          placeholder="Search locations..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full"
        />

        <Button variant="outline" onClick={fetchLocations} className="w-full">
          <Loader2 className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : "hidden"}`} />
          Refresh Locations
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : error ? (
        <Card>
          <CardContent className="py-10">
            <div className="flex flex-col items-center justify-center text-center">
              <AlertCircle className="h-10 w-10 text-destructive mb-4" />
              <h3 className="text-lg font-medium mb-2">Error Loading Locations</h3>
              <p className="text-muted-foreground">{error}</p>
              <Button onClick={fetchLocations} className="mt-4">
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : filteredLocations.length === 0 ? (
        <Card>
          <CardContent className="py-10">
            <div className="flex flex-col items-center justify-center text-center">
              <Database className="h-10 w-10 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No Locations Found</h3>
              <p className="text-muted-foreground">
                {searchQuery
                  ? "No locations match your search criteria. Try adjusting your search."
                  : "You haven't saved any locations yet. Use the camera recognition feature to identify and save locations."}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {filteredLocations.map((location, index) => (
              <motion.div
                key={location.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ delay: index * 0.03 }}
              >
                <Card className="overflow-hidden">
                  <CardContent className="p-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">{location.name || "Unknown"}</h3>
                        <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                          {location.address || "No address"}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {location.category || "Unknown"}
                          </Badge>
                          {location.confidence && (
                            <span className="text-xs text-muted-foreground">
                              {Math.round(location.confidence * 100)}%
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleToggleBookmark(location)}
                          title={location.isBookmarked ? "Remove bookmark" : "Add bookmark"}
                          className="h-8 w-8"
                        >
                          {location.isBookmarked ? (
                            <Heart className="h-4 w-4 fill-primary text-primary" />
                          ) : (
                            <Heart className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleViewDetails(location)}
                          title="View details"
                          className="h-8 w-8"
                        >
                          <Info className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteLocation(location.id)}
                          title="Delete location"
                          className="h-8 w-8"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Location Details Dialog */}
      <Dialog open={showLocationDetails} onOpenChange={setShowLocationDetails}>
        <DialogContent className="max-w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          {selectedLocation && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-lg">
                  {selectedLocation.name || "Unknown Location"}
                </DialogTitle>
                <DialogDescription>{selectedLocation.address || "No address available"}</DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                {selectedLocation.photos && selectedLocation.photos.length > 0 ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="rounded-lg overflow-hidden border h-48"
                  >
                    <img
                      src={selectedLocation.photos[0] || "/placeholder.svg"}
                      alt={selectedLocation.name}
                      className="w-full h-full object-cover"
                    />
                  </motion.div>
                ) : (
                  <div className="rounded-lg overflow-hidden border h-48 bg-muted flex items-center justify-center">
                    <Image className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}

                {selectedLocation.location && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="rounded-lg overflow-hidden border h-48"
                  >
                    <iframe
                      width="100%"
                      height="100%"
                      frameBorder="0"
                      src={`https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&q=${selectedLocation.location.latitude},${selectedLocation.location.longitude}&zoom=15`}
                      allowFullScreen
                    ></iframe>
                  </motion.div>
                )}

                <div>
                  <h4 className="text-sm font-medium mb-1">Category</h4>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">{selectedLocation.category || "Unknown"}</Badge>
                    {selectedLocation.buildingType && <Badge variant="outline">{selectedLocation.buildingType}</Badge>}
                  </div>
                </div>

                {selectedLocation.description && (
                  <div>
                    <h4 className="text-sm font-medium mb-1">Description</h4>
                    <p className="text-sm text-muted-foreground">{selectedLocation.description}</p>
                  </div>
                )}

                {selectedLocation.location && (
                  <div>
                    <h4 className="text-sm font-medium mb-1">Coordinates</h4>
                    <p className="text-sm text-muted-foreground">
                      {selectedLocation.location.latitude.toFixed(6)}, {selectedLocation.location.longitude.toFixed(6)}
                    </p>
                  </div>
                )}
              </div>

              <DialogFooter className="flex justify-between">
                <Button variant="outline" onClick={() => handleToggleBookmark(selectedLocation)}>
                  {selectedLocation.isBookmarked ? (
                    <>
                      <Heart className="mr-2 h-4 w-4 fill-primary text-primary" />
                      Remove Bookmark
                    </>
                  ) : (
                    <>
                      <Heart className="mr-2 h-4 w-4" />
                      Add Bookmark
                    </>
                  )}
                </Button>

                {selectedLocation.mapUrl && (
                  <Button asChild>
                    <a href={selectedLocation.mapUrl} target="_blank" rel="noopener noreferrer">
                      <MapPin className="mr-2 h-4 w-4" />
                      View on Map
                    </a>
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Mobile Map Feature
const MobileMapFeature = () => {
  const [locations, setLocations] = useState<SavedLocation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedLocation, setSelectedLocation] = useState<SavedLocation | null>(null)
  const [showInfoWindow, setShowInfoWindow] = useState(false)
  const [mapCenter, setMapCenter] = useState<Location>({ latitude: 0, longitude: 0 })
  const [userLocation, setUserLocation] = useState<Location | null>(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [mapZoom, setMapZoom] = useState(12)

  // Load Google Maps API
  const { isLoaded: isGoogleMapsLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
  })

  // Get user's current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLoc = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          }
          setUserLocation(userLoc)
          setMapCenter(userLoc)
        },
        (error) => {
          console.error("Error getting user location:", error)
          // Default to a central location if user location is not available
          setMapCenter({ latitude: 40.7128, longitude: -74.006 }) // New York
        },
      )
    } else {
      // Default to a central location if geolocation is not supported
      setMapCenter({ latitude: 40.7128, longitude: -74.006 }) // New York
    }
  }, [])

  // Fetch locations from the API
  const fetchLocations = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch("/api/location-recognition?operation=all")

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()

      if (data.success && data.locations) {
        // Transform the data to match our SavedLocation type
        const transformedLocations = data.locations
          .filter((loc: any) => loc.latitude && loc.longitude) // Only include locations with coordinates
          .map((loc: any) => ({
            ...loc,
            createdAt: new Date(loc.createdAt).toISOString(),
            location: {
              latitude: loc.latitude,
              longitude: loc.longitude,
            },
          }))

        setLocations(transformedLocations)
      } else {
        setLocations([])
      }
    } catch (err) {
      console.error("Failed to fetch locations:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch locations")
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch locations on component mount
  useEffect(() => {
    fetchLocations()
  }, [])

  // Handle marker click
  const handleMarkerClick = (location: SavedLocation) => {
    setSelectedLocation(location)
    setShowInfoWindow(true)

    // Center map on the selected location
    if (location.location) {
      setMapCenter(location.location)
      setMapZoom(15) // Zoom in when selecting a location
    }
  }

  // Close info window
  const handleInfoWindowClose = () => {
    setShowInfoWindow(false)
  }

  // Navigate to location
  const handleNavigate = (location: SavedLocation) => {
    if (location.location) {
      setMapCenter(location.location)
      setMapZoom(15) // Zoom in when navigating to a location
    }
  }

  // Get marker color based on category
  const getMarkerColor = (category: string | undefined) => {
    switch (category) {
      case "Landmark":
        return "blue"
      case "Business":
        return "green"
      case "Point of Interest":
        return "purple"
      default:
        return "red"
    }
  }

  return (
    <div className="space-y-4">
      <Button onClick={fetchLocations} variant="outline" className="w-full">
        <Loader2 className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : "hidden"}`} />
        Refresh Map
      </Button>

      {!isGoogleMapsLoaded ? (
        <Card className="h-[60vh] flex items-center justify-center border border-border/40 shadow-sm">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
            <h3 className="text-lg font-medium">Loading Google Maps</h3>
            <p className="text-muted-foreground">Please wait while we load the map...</p>
          </div>
        </Card>
      ) : error ? (
        <Card className="h-[60vh] flex items-center justify-center border border-border/40 shadow-sm">
          <div className="text-center">
            <AlertCircle className="h-10 w-10 text-destructive mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Error Loading Map</h3>
            <p className="text-muted-foreground">{error}</p>
            <Button onClick={fetchLocations} className="mt-4">
              Try Again
            </Button>
          </div>
        </Card>
      ) : (
        <Card className="h-[60vh] overflow-hidden border border-border/40 shadow-sm">
          {isGoogleMapsLoaded ? (
            <GoogleMap
              mapContainerStyle={{ width: "100%", height: "100%" }}
              center={{ lat: mapCenter.latitude, lng: mapCenter.longitude }}
              zoom={mapZoom}
              onLoad={() => setMapLoaded(true)}
              options={{
                mapTypeControl: false,
                streetViewControl: false,
                fullscreenControl: false,
                zoomControl: true,
                mapTypeId: "roadmap",
              }}
            >
              {/* User location marker */}
              {userLocation && (
                <Marker
                  position={{ lat: userLocation.latitude, lng: userLocation.longitude }}
                  icon={{
                    path: (window as any).google.maps.SymbolPath.CIRCLE,
                    scale: 8,
                    fillColor: "#4285F4",
                    fillOpacity: 1,
                    strokeColor: "#FFFFFF",
                    strokeWeight: 2,
                  }}
                  title="Your Location"
                />
              )}

              {/* Location markers */}
              {locations.map(
                (location) =>
                  location.location && (
                    <Marker
                      key={location.id}
                      position={{ lat: location.location.latitude, lng: location.location.longitude }}
                      onClick={() => handleMarkerClick(location)}
                      animation={(window as any).google.maps.Animation.DROP}
                      icon={{
                        url: `https://maps.google.com/mapfiles/ms/icons/${getMarkerColor(location.category)}-dot.png`,
                      }}
                    />
                  ),
              )}

              {/* Info window for selected location */}
              {selectedLocation && selectedLocation.location && showInfoWindow && (
                <InfoWindow
                  position={{ lat: selectedLocation.location.latitude, lng: selectedLocation.location.longitude }}
                  onCloseClick={handleInfoWindowClose}
                >
                  <div className="p-2 max-w-[200px]">
                    <h3 className="font-medium text-sm">{selectedLocation.name}</h3>
                    <p className="text-xs text-gray-600 mt-1 mb-2">{selectedLocation.address}</p>
                    {selectedLocation.category && (
                      <div className="mb-2">
                        <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded">
                          {selectedLocation.category}
                        </span>
                      </div>
                    )}
                    <button
                      className="bg-blue-500 hover:bg-blue-600 text-white text-xs py-1 px-2 rounded w-full"
                      onClick={() => handleNavigate(selectedLocation)}
                    >
                      Navigate
                    </button>
                  </div>
                </InfoWindow>
              )}
            </GoogleMap>
          ) : (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
            </div>
          )}
        </Card>
      )}

      {/* Map Legend */}
      <Card className="border border-border/40 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Map Legend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center">
              <div className="w-4 h-4 rounded-full bg-[#4285F4] mr-2"></div>
              <span className="text-sm">Your Location</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 rounded-full bg-blue-500 mr-2"></div>
              <span className="text-sm">Landmarks</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 rounded-full bg-green-500 mr-2"></div>
              <span className="text-sm">Businesses</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 rounded-full bg-red-500 mr-2"></div>
              <span className="text-sm">Other</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          className="flex-1"
          onClick={() => {
            if (userLocation) {
              setMapCenter(userLocation)
              setMapZoom(15)
            }
          }}
        >
          <MapPin className="mr-2 h-4 w-4" />
          My Location
        </Button>
        <Button variant="outline" className="flex-1" onClick={fetchLocations}>
          <Loader2 className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>
    </div>
  )
}

// Mobile Search Feature
const MobileSearchFeature = () => {
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<SavedLocation[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedLocation, setSelectedLocation] = useState<SavedLocation | null>(null)
  const [showLocationDetails, setShowLocationDetails] = useState(false)
  const [searchType, setSearchType] = useState<"text" | "address" | "nearby">("text")
  const [userLocation, setUserLocation] = useState<Location | null>(null)
  const [searchRadius, setSearchRadius] = useState<number>(5) // in km

  // Get user's current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          })
        },
        (error) => {
          console.error("Error getting user location:", error)
        },
      )
    }
  }, [])

  // Handle search
  const handleSearch = async () => {
    if (!searchQuery.trim() && searchType !== "nearby") {
      setError("Please enter a search query")
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      setSearchResults([])

      let endpoint = ""
      let params: any = {}

      switch (searchType) {
        case "text":
          endpoint = "/api/location-recognition?operation=search"
          params = { query: searchQuery }
          break
        case "address":
          endpoint = "/api/location-recognition?operation=geocode"
          params = { address: searchQuery }
          break
        case "nearby":
          if (!userLocation) {
            throw new Error("User location is not available")
          }
          endpoint = "/api/location-recognition?operation=nearby"
          params = {
            lat: userLocation.latitude,
            lng: userLocation.longitude,
            radius: searchRadius,
          }
          break
      }

      const queryString = new URLSearchParams(params).toString()
      const response = await fetch(`${endpoint}&${queryString}`)

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()

      if (data.success) {
        if (searchType === "address" && data.location) {
          // Single location result from geocoding
          setSearchResults([
            {
              ...data.location,
              id: "temp-" + Date.now(),
              createdAt: new Date().toISOString(),
            },
          ])
        } else if (data.locations) {
          // Multiple location results
          const transformedLocations = data.locations.map((loc: any) => ({
            ...loc,
            createdAt: new Date(loc.createdAt).toISOString(),
            location: {
              latitude: loc.latitude,
              longitude: loc.longitude,
            },
          }))
          setSearchResults(transformedLocations)
        } else {
          setSearchResults([])
        }
      } else {
        setSearchResults([])
        if (data.error) {
          setError(data.error)
        }
      }
    } catch (err) {
      console.error("Search failed:", err)
      setError(err instanceof Error ? err.message : "Search failed")
    } finally {
      setIsLoading(false)
    }
  }

  // View location details
  const handleViewDetails = (location: SavedLocation) => {
    setSelectedLocation(location)
    setShowLocationDetails(true)
  }

  // Save search result to database
  const handleSaveLocation = async (location: SavedLocation) => {
    try {
      // Check if this is a temporary location (from geocoding)
      if (location.id.startsWith("temp-")) {
        // This is a new location, save it to the database
        const response = await fetch("/api/location-recognition", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: location.name,
            address: location.address,
            latitude: location.location?.latitude,
            longitude: location.location?.longitude,
            category: location.category,
            type: location.type,
            confidence: location.confidence,
          }),
        })

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`)
        }

        const data = await response.json()

        if (data.success) {
          toast({
            title: "Location saved",
            description: `${location.name} has been saved to your locations.`,
          })

          // Update the location in search results with the saved ID
          setSearchResults(
            searchResults.map((loc) => (loc.id === location.id ? { ...loc, id: data.id, isSaved: true } : loc)),
          )
        } else {
          throw new Error(data.error || "Failed to save location")
        }
      } else {
        // This location is already in the database
        toast({
          title: "Location already saved",
          description: `${location.name} is already in your saved locations.`,
        })
      }
    } catch (err) {
      console.error("Failed to save location:", err)
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to save location",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <div className="flex gap-2">
          <select
            className="flex h-10 w-1/3 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            value={searchType}
            onChange={(e) => setSearchType(e.target.value as any)}
          >
            <option value="text">By Name</option>
            <option value="address">By Address</option>
            <option value="nearby">Nearby</option>
          </select>
          <Input
            placeholder={
              searchType === "text"
                ? "Search by name..."
                : searchType === "address"
                  ? "Enter an address..."
                  : "Search nearby..."
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            disabled={isLoading || searchType === "nearby"}
            className="flex-1"
          />
        </div>

        {searchType === "nearby" && (
          <div className="flex items-center gap-2">
            <Label htmlFor="radius" className="min-w-[80px]">
              Radius (km):
            </Label>
            <Input
              id="radius"
              type="number"
              min="1"
              max="50"
              value={searchRadius}
              onChange={(e) => setSearchRadius(Number(e.target.value))}
              className="max-w-[100px]"
            />
          </div>
        )}

        <Button onClick={handleSearch} disabled={isLoading} className="w-full">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Searching
            </>
          ) : (
            <>
              <Search className="mr-2 h-4 w-4" />
              Search
            </>
          )}
        </Button>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-destructive/10 p-4 rounded-lg flex items-start"
        >
          <AlertCircle className="h-5 w-5 text-destructive mr-2 mt-0.5" />
          <div>
            <p className="font-medium text-destructive">Error</p>
            <p className="text-sm">{error}</p>
          </div>
        </motion.div>
      )}

      {isLoading ? (
        <Card className="border border-border/40 shadow-sm">
          <CardContent className="py-10">
            <div className="flex flex-col items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">Searching for locations...</p>
            </div>
          </CardContent>
        </Card>
      ) : searchResults.length > 0 ? (
        <div className="space-y-3">
          <h3 className="text-lg font-medium">Search Results ({searchResults.length})</h3>

          <div className="space-y-3">
            <AnimatePresence>
              {searchResults.map((location, index) => (
                <motion.div
                  key={location.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="overflow-hidden">
                    <div className="h-24 bg-muted relative">
                      {location.photos && location.photos.length > 0 ? (
                        <img
                          src={location.photos[0] || "/placeholder.svg"}
                          alt={location.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <MapPin className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}

                      {location.category && <Badge className="absolute top-2 right-2">{location.category}</Badge>}
                    </div>

                    <CardContent className="p-3">
                      <h3 className="font-medium">{location.name || "Unknown Location"}</h3>
                      <p className="text-xs text-muted-foreground truncate">
                        {location.address || "No address available"}
                      </p>

                      <div className="flex items-center text-xs mt-2">
                        <MapPin className="h-3 w-3 mr-1 text-muted-foreground" />
                        {location.location ? (
                          <span className="text-muted-foreground">
                            {location.location.latitude.toFixed(4)}, {location.location.longitude.toFixed(4)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">No coordinates</span>
                        )}
                      </div>

                      <div className="flex justify-between mt-3">
                        <Button variant="outline" size="sm" onClick={() => handleViewDetails(location)}>
                          <Info className="h-4 w-4 mr-2" />
                          Details
                        </Button>

                        {location.id.startsWith("temp-") ? (
                          <Button size="sm" onClick={() => handleSaveLocation(location)}>
                            <Plus className="h-4 w-4 mr-2" />
                            Save
                          </Button>
                        ) : (
                          <Button variant="secondary" size="sm" disabled>
                            <Database className="h-4 w-4 mr-2" />
                            Saved
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      ) : searchQuery || searchType === "nearby" ? (
        <Card className="border border-border/40 shadow-sm">
          <CardContent className="py-10">
            <div className="flex flex-col items-center justify-center text-center">
              <Search className="h-10 w-10 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No Results Found</h3>
              <p className="text-muted-foreground max-w-md">
                {searchType === "text"
                  ? "No locations match your search query. Try different keywords or search terms."
                  : searchType === "address"
                    ? "Could not find this address. Try a different format or more specific address."
                    : "No locations found near you. Try increasing the search radius."}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* Location Details Dialog */}
      <Dialog open={showLocationDetails} onOpenChange={setShowLocationDetails}>
        <DialogContent className="max-w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          {selectedLocation && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-lg">
                  {selectedLocation.name || "Unknown Location"}
                </DialogTitle>
                <DialogDescription>{selectedLocation.address || "No address available"}</DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                {selectedLocation.photos && selectedLocation.photos.length > 0 ? (
                  <div className="rounded-lg overflow-hidden border h-48">
                    <img
                      src={selectedLocation.photos[0] || "/placeholder.svg"}
                      alt={selectedLocation.name || "/placeholder.svg"}
                      alt={selectedLocation.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="rounded-lg overflow-hidden border h-48 bg-muted flex items-center justify-center">
                    <Image className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}

                {selectedLocation.location && (
                  <div className="rounded-lg overflow-hidden border h-48">
                    <iframe
                      width="100%"
                      height="100%"
                      frameBorder="0"
                      src={`https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&q=${selectedLocation.location.latitude},${selectedLocation.location.longitude}&zoom=15`}
                      allowFullScreen
                    ></iframe>
                  </div>
                )}

                <div>
                  <h4 className="text-sm font-medium mb-1">Category</h4>
                  <Badge variant="outline">{selectedLocation.category || "Unknown"}</Badge>
                  {selectedLocation.buildingType && (
                    <Badge variant="outline" className="ml-2">
                      {selectedLocation.buildingType}
                    </Badge>
                  )}
                </div>

                {selectedLocation.description && (
                  <div>
                    <h4 className="text-sm font-medium mb-1">Description</h4>
                    <p className="text-sm text-muted-foreground">{selectedLocation.description}</p>
                  </div>
                )}

                {selectedLocation.location && (
                  <div>
                    <h4 className="text-sm font-medium mb-1">Coordinates</h4>
                    <p className="text-sm text-muted-foreground">
                      {selectedLocation.location.latitude.toFixed(6)}, {selectedLocation.location.longitude.toFixed(6)}
                    </p>
                  </div>
                )}
              </div>

              <DialogFooter className="flex justify-between">
                {selectedLocation.id.startsWith("temp-") ? (
                  <Button onClick={() => handleSaveLocation(selectedLocation)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Save Location
                  </Button>
                ) : (
                  <Button variant="outline" disabled>
                    <Database className="mr-2 h-4 w-4" />
                    Already Saved
                  </Button>
                )}

                {selectedLocation.mapUrl && (
                  <Button asChild>
                    <a href={selectedLocation.mapUrl} target="_blank" rel="noopener noreferrer">
                      <MapPin className="mr-2 h-4 w-4" />
                      View on Map
                    </a>
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Mobile Bookmarks Feature
const MobileBookmarksFeature = () => {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedBookmark, setSelectedBookmark] = useState<Bookmark | null>(null)
  const [locationDetails, setLocationDetails] = useState<SavedLocation | null>(null)
  const [showLocationDetails, setShowLocationDetails] = useState(false)

  // Fetch bookmarks from the API
  const fetchBookmarks = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/bookmarks")

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()

      setBookmarks(data.success && data.bookmarks ? data.bookmarks : [])
    } catch (err) {
      console.error("Failed to fetch bookmarks:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch bookmarks")
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch bookmarks on component mount
  useEffect(() => {
    fetchBookmarks()
  }, [])

  // Handle bookmark deletion
  const handleDeleteBookmark = async (id: string) => {
    try {
      const response = await fetch(`/api/bookmarks/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      // Remove the bookmark from the state
      setBookmarks((prevBookmarks) => prevBookmarks.filter((bookmark) => bookmark.id !== id))
      toast({
        title: "Bookmark removed",
        description: "The bookmark has been successfully removed.",
      })
    } catch (err) {
      console.error("Failed to delete bookmark:", err)
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to delete bookmark",
        variant: "destructive",
      })
    }
  }

  // View location details
  const handleViewDetails = async (bookmark: Bookmark) => {
    try {
      setSelectedBookmark(bookmark)

      // Fetch the full location details
      const response = await fetch(`/api/location-recognition?operation=getById&id=${bookmark.locationId}`)

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()

      if (data.success) {
        setLocationDetails({
          ...data,
          location: {
            latitude: data.latitude,
            longitude: data.longitude,
          },
          createdAt: new Date(data.createdAt).toISOString(),
        })
        setShowLocationDetails(true)
      } else {
        throw new Error(data.error || "Failed to fetch location details")
      }
    } catch (err) {
      console.error("Failed to fetch location details:", err)
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to fetch location details",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-4">
      <Button onClick={fetchBookmarks} variant="outline" className="w-full">
        <Loader2 className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : "hidden"}`} />
        Refresh Bookmarks
      </Button>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : error ? (
        <Card className="border border-border/40 shadow-sm">
          <CardContent className="py-10">
            <div className="flex flex-col items-center justify-center text-center">
              <AlertCircle className="h-10 w-10 text-destructive mb-4" />
              <h3 className="text-lg font-medium mb-2">Error Loading Bookmarks</h3>
              <p className="text-muted-foreground">{error}</p>
              <Button onClick={fetchBookmarks} className="mt-4">
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : bookmarks.length === 0 ? (
        <Card className="border border-border/40 shadow-sm">
          <CardContent className="py-10">
            <div className="flex flex-col items-center justify-center text-center">
              <Heart className="h-10 w-10 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No Bookmarks Found</h3>
              <p className="text-muted-foreground">
                You haven't bookmarked any locations yet. Add bookmarks from your saved locations.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {bookmarks.map((bookmark, index) => (
              <motion.div
                key={bookmark.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="overflow-hidden">
                  <CardContent className="p-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">{bookmark.name || "Unknown Location"}</h3>
                        <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                          {bookmark.address || "No address available"}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {bookmark.category || "Unknown"}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(bookmark.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleViewDetails(bookmark)}
                          title="View details"
                          className="h-8 w-8"
                        >
                          <Info className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteBookmark(bookmark.id)}
                          title="Delete bookmark"
                          className="h-8 w-8"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Location Details Dialog */}
      <Dialog open={showLocationDetails} onOpenChange={setShowLocationDetails}>
        <DialogContent className="max-w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          {locationDetails && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-lg">
                  {locationDetails.name || "Unknown Location"}
                </DialogTitle>
                <DialogDescription>{locationDetails.address || "No address available"}</DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                {locationDetails.photos && locationDetails.photos.length > 0 ? (
                  <div className="rounded-lg overflow-hidden border h-48">
                    <img
                      src={locationDetails.photos[0] || "/placeholder.svg"}
                      alt={locationDetails.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="rounded-lg overflow-hidden border h-48 bg-muted flex items-center justify-center">
                    <Image className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}

                {locationDetails.location && (
                  <div className="rounded-lg overflow-hidden border h-48">
                    <iframe
                      width="100%"
                      height="100%"
                      frameBorder="0"
                      src={`https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&q=${locationDetails.location.latitude},${locationDetails.location.longitude}&zoom=15`}
                      allowFullScreen
                    ></iframe>
                  </div>
                )}

                <div>
                  <h4 className="text-sm font-medium mb-1">Category</h4>
                  <Badge variant="outline">{locationDetails.category || "Unknown"}</Badge>
                  {locationDetails.buildingType && (
                    <Badge variant="outline" className="ml-2">
                      {locationDetails.buildingType}
                    </Badge>
                  )}
                </div>

                {locationDetails.description && (
                  <div>
                    <h4 className="text-sm font-medium mb-1">Description</h4>
                    <p className="text-sm text-muted-foreground">{locationDetails.description}</p>
                  </div>
                )}

                {locationDetails.location && (
                  <div>
                    <h4 className="text-sm font-medium mb-1">Coordinates</h4>
                    <p className="text-sm text-muted-foreground">
                      {locationDetails.location.latitude.toFixed(6)}, {locationDetails.location.longitude.toFixed(6)}
                    </p>
                  </div>
                )}
              </div>

              <DialogFooter>
                {locationDetails.mapUrl && (
                  <Button asChild>
                    <a href={locationDetails.mapUrl} target="_blank" rel="noopener noreferrer">
                      <MapPin className="mr-2 h-4 w-4" />
                      View on Map
                    </a>
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Mobile Dashboard Component
export default function MobileDashboard() {
  const [activeTab, setActiveTab] = useState("recognition")
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const router = useRouter()

  // Handle dark mode toggle
  useEffect(() => {
    const storedTheme = localStorage.getItem("theme")
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches

    if (storedTheme === "dark" || (!storedTheme && prefersDark)) {
      setIsDarkMode(true)
      document.documentElement.classList.add("dark")
    } else {
      setIsDarkMode(false)
      document.documentElement.classList.remove("dark")
    }
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

  // Handle logout
  const handleLogout = async () => {
    try {
      // Remove authentication token
      localStorage.removeItem("token")

      // Redirect to login page
      router.push("/login")
    } catch (error) {
      console.error("Error during logout:", error)
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Mobile App Header */}
      <header className="sticky top-0 z-50 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="container flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-lg flex items-center justify-center">
              <Navigation className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-lg bg-gradient-to-r from-teal-600 to-cyan-600 dark:from-teal-400 dark:to-cyan-400 bg-clip-text text-transparent">
              Pic2Nav
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={toggleDarkMode} className="rounded-full">
              {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>

            <Sheet open={showUserMenu} onOpenChange={setShowUserMenu}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <User className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[80vw] sm:w-[350px]">
                <SheetHeader className="mb-6">
                  <SheetTitle>Account</SheetTitle>
                </SheetHeader>

                <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg mb-6">
                  <Avatar className="h-12 w-12 border-2 border-cyan-500/20">
                    <AvatarFallback className="bg-gradient-to-br from-cyan-500 to-teal-500 text-white font-medium">
                      U
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-medium">Demo User</h3>
                    <p className="text-xs text-muted-foreground">Pro Plan</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <Button variant="outline" className="w-full justify-start" onClick={() => router.push("/profile")}>
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </Button>
                  <Button variant="outline" className="w-full justify-start" onClick={() => router.push("/settings")}>
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                    onClick={handleLogout}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 pb-20">
        {activeTab === "recognition" && <MobileCameraRecognition />}
        {activeTab === "locations" && <MobileLocationsFeature />}
        {activeTab === "map" && <MobileMapFeature />}
        {activeTab === "search" && <MobileSearchFeature />}
        {activeTab === "bookmarks" && <MobileBookmarksFeature />}
        {activeTab === "suggestions" && (
          <LocationSuggestions
            location={{ lat: 0, lng: 0, name: "Default Location" }}
            currentLocation={{ lat: 0, lng: 0 }}
          />
        )}
        {activeTab === "captions" && <ImageCaptionGenerator />}
        {activeTab === "ai-content" && <AIContentGenerator />}
      </main>

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 z-50">
        <div className="grid grid-cols-5 h-16">
          <button
            className={`flex flex-col items-center justify-center gap-1 ${
              activeTab === "recognition" ? "text-teal-600 dark:text-teal-400" : "text-slate-500 dark:text-slate-400"
            }`}
            onClick={() => setActiveTab("recognition")}
          >
            <Camera className="h-5 w-5" />
            <span className="text-[10px]">Camera</span>
          </button>

          <button
            className={`flex flex-col items-center justify-center gap-1 ${
              activeTab === "locations" ? "text-teal-600 dark:text-teal-400" : "text-slate-500 dark:text-slate-400"
            }`}
            onClick={() => setActiveTab("locations")}
          >
            <MapPin className="h-5 w-5" />
            <span className="text-[10px]">Places</span>
          </button>

          <button
            className={`flex flex-col items-center justify-center gap-1 ${
              activeTab === "map" ? "text-teal-600 dark:text-teal-400" : "text-slate-500 dark:text-slate-400"
            }`}
            onClick={() => setActiveTab("map")}
          >
            <Map className="h-5 w-5" />
            <span className="text-[10px]">Map</span>
          </button>

          <button
            className={`flex flex-col items-center justify-center gap-1 ${
              activeTab === "search" ? "text-teal-600 dark:text-teal-400" : "text-slate-500 dark:text-slate-400"
            }`}
            onClick={() => setActiveTab("search")}
          >
            <Search className="h-5 w-5" />
            <span className="text-[10px]">Search</span>
          </button>

          <button
            className={`flex flex-col items-center justify-center gap-1 ${
              activeTab === "bookmarks" ? "text-teal-600 dark:text-teal-400" : "text-slate-500 dark:text-slate-400"
            }`}
            onClick={() => setActiveTab("bookmarks")}
          >
            <Heart className="h-5 w-5" />
            <span className="text-[10px]">Saved</span>
          </button>
        </div>
      </nav>
    </div>
  )
}
