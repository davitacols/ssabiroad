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
  History,
  Search,
  Compass,
  Sparkles,
  Clock,
  Loader2,
  Database,
  Trash2,
  Heart,
  Plus,
  ArrowUpDown,
  Info,
} from "lucide-react"
import * as LucideIcons from "lucide-react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from "@react-google-maps/api"

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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from '@/hooks/use-toast'

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
  phoneNumber?: string
  website?: string
  buildingType?: string
  historicalInfo?: string
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

                    <div className="flex flex-wrap gap-2 mb-4">
                      {recognitionResult.type && <Badge variant="outline">{recognitionResult.type}</Badge>}

                      {recognitionResult.category && recognitionResult.type !== recognitionResult.category && (
                        <Badge variant="secondary">{recognitionResult.category}</Badge>
                      )}

                      {recognitionResult.buildingType && (
                        <Badge variant="outline">{recognitionResult.buildingType}</Badge>
                      )}
                    </div>

                    {recognitionResult.description && <p className="text-sm mb-4">{recognitionResult.description}</p>}

                    {/* Display contact information if available */}
                    {(recognitionResult.phoneNumber || recognitionResult.website) && (
                      <div className="mb-4 space-y-1">
                        {recognitionResult.phoneNumber && (
                          <p className="text-sm flex items-center">
                            <LucideIcons.Phone className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                            {recognitionResult.phoneNumber}
                          </p>
                        )}
                        {recognitionResult.website && (
                          <p className="text-sm flex items-center">
                            <LucideIcons.Globe className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                            <a
                              href={recognitionResult.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline truncate"
                            >
                              {recognitionResult.website}
                            </a>
                          </p>
                        )}
                      </div>
                    )}

                    {/* Display opening hours if available */}
                    {recognitionResult.openingHours && recognitionResult.openingHours.length > 0 && (
                      <div className="mb-4">
                        <p className="text-sm font-medium mb-1 flex items-center">
                          <LucideIcons.Clock className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                          Opening Hours
                        </p>
                        <div className="text-xs text-muted-foreground space-y-0.5 ml-5">
                          {Array.isArray(recognitionResult.openingHours) ? (
                            recognitionResult.openingHours.map((hours, index) => <p key={index}>{hours}</p>)
                          ) : (
                            <p>{recognitionResult.openingHours}</p>
                          )}
                        </div>
                      </div>
                    )}

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

                    {/* Display historical information if available */}
                    {recognitionResult.historicalInfo && (
                      <div className="mb-4">
                        <p className="text-sm font-medium mb-1">Historical Information:</p>
                        <p className="text-xs text-muted-foreground">{recognitionResult.historicalInfo}</p>
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

// Implement the Locations feature
const LocationsFeature = () => {
  const [locations, setLocations] = useState<SavedLocation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedLocation, setSelectedLocation] = useState<SavedLocation | null>(null)
  const [showLocationDetails, setShowLocationDetails] = useState(false)
  const [sortField, setSortField] = useState<string>("createdAt")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  const [filterCategory, setFilterCategory] = useState<string>("all")
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

  // Filter and sort locations
  const filteredAndSortedLocations = locations
    .filter((loc) => {
      // Apply category filter
      if (filterCategory !== "all" && loc.category !== filterCategory) {
        return false
      }

      // Apply search filter
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
    .sort((a, b) => {
      // Apply sorting
      let comparison = 0

      switch (sortField) {
        case "name":
          comparison = (a.name || "").localeCompare(b.name || "")
          break
        case "category":
          comparison = (a.category || "").localeCompare(b.category || "")
          break
        case "confidence":
          comparison = (a.confidence || 0) - (b.confidence || 0)
          break
        case "createdAt":
        default:
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          break
      }

      return sortDirection === "asc" ? comparison : -comparison
    })

  // Toggle sort direction
  const toggleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  // Get unique categories for filter
  const categories = ["all", ...new Set(locations.map((loc) => loc.category || "Unknown"))]

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Saved Locations</h2>
          <p className="text-muted-foreground">Manage your saved locations and bookmarks</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
          <Input
            placeholder="Search locations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full md:w-64"
          />

          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-full md:w-40">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category === "all" ? "All Categories" : category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
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
      ) : filteredAndSortedLocations.length === 0 ? (
        <Card>
          <CardContent className="py-10">
            <div className="flex flex-col items-center justify-center text-center">
              <Database className="h-10 w-10 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No Locations Found</h3>
              <p className="text-muted-foreground">
                {searchQuery || filterCategory !== "all"
                  ? "No locations match your search criteria. Try adjusting your filters."
                  : "You haven't saved any locations yet. Use the camera recognition feature to identify and save locations."}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[250px]">
                  <Button variant="ghost" className="p-0 font-medium" onClick={() => toggleSort("name")}>
                    Name
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button variant="ghost" className="p-0 font-medium" onClick={() => toggleSort("category")}>
                    Category
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead className="hidden md:table-cell">Address</TableHead>
                <TableHead className="hidden md:table-cell">
                  <Button variant="ghost" className="p-0 font-medium" onClick={() => toggleSort("confidence")}>
                    Confidence
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead className="hidden md:table-cell">
                  <Button variant="ghost" className="p-0 font-medium" onClick={() => toggleSort("createdAt")}>
                    Date Added
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedLocations.map((location) => (
                <TableRow key={location.id}>
                  <TableCell className="font-medium">{location.name || "Unknown"}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{location.category || "Unknown"}</Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell truncate max-w-[200px]">
                    {location.address || "No address"}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {location.confidence ? `${Math.round(location.confidence * 100)}%` : "N/A"}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {new Date(location.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleToggleBookmark(location)}
                        title={location.isBookmarked ? "Remove bookmark" : "Add bookmark"}
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
                      >
                        <Info className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteLocation(location.id)}
                        title="Delete location"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Location Details Dialog */}
      <Dialog open={showLocationDetails} onOpenChange={setShowLocationDetails}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedLocation && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {selectedLocation.name || "Unknown Location"}
                  {selectedLocation.confidence && (
                    <Badge variant={selectedLocation.confidence > 0.8 ? "default" : "outline"} className="ml-2">
                      {Math.round(selectedLocation.confidence * 100)}% confidence
                    </Badge>
                  )}
                </DialogTitle>
                <DialogDescription>{selectedLocation.address || "No address available"}</DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  {selectedLocation.photos && selectedLocation.photos.length > 0 ? (
                    <div className="rounded-lg overflow-hidden border h-48">
                      <img
                        src={selectedLocation.photos[0] || "/placeholder.svg"}
                        alt={selectedLocation.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="rounded-lg overflow-hidden border h-48 bg-muted flex items-center justify-center">
                      <ImageIcon className="h-12 w-12 text-muted-foreground" />
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
                </div>

                <div className="space-y-4">
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
                        {selectedLocation.location.latitude.toFixed(6)},{" "}
                        {selectedLocation.location.longitude.toFixed(6)}
                      </p>
                    </div>
                  )}

                  {selectedLocation.geoData && (
                    <div>
                      <h4 className="text-sm font-medium mb-1">Location Details</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        {selectedLocation.geoData.country && (
                          <div>
                            <span className="text-muted-foreground">Country:</span> {selectedLocation.geoData.country} (
                            {selectedLocation.geoData.countryCode})
                          </div>
                        )}
                        {selectedLocation.geoData.administrativeArea && (
                          <div>
                            <span className="text-muted-foreground">State/Province:</span>{" "}
                            {selectedLocation.geoData.administrativeArea}
                          </div>
                        )}
                        {selectedLocation.geoData.locality && (
                          <div>
                            <span className="text-muted-foreground">City:</span> {selectedLocation.geoData.locality}
                          </div>
                        )}
                        {selectedLocation.geoData.postalCode && (
                          <div>
                            <span className="text-muted-foreground">Postal Code:</span>{" "}
                            {selectedLocation.geoData.postalCode}
                          </div>
                        )}
                        {selectedLocation.geoData.elevation && (
                          <div>
                            <span className="text-muted-foreground">Elevation:</span>{" "}
                            {selectedLocation.geoData.elevation.toFixed(1)} meters
                          </div>
                        )}
                        {selectedLocation.geoData.timezone && (
                          <div>
                            <span className="text-muted-foreground">Timezone:</span> {selectedLocation.geoData.timezone}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {selectedLocation.nearbyPlaces && selectedLocation.nearbyPlaces.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-1">Nearby Places</h4>
                      <div className="space-y-2">
                        {selectedLocation.nearbyPlaces.slice(0, 3).map((place, idx) => (
                          <div key={idx} className="flex justify-between text-sm">
                            <span>{place.name}</span>
                            <Badge variant="outline" className="text-xs">
                              {place.distance < 1000
                                ? `${Math.round(place.distance)}m`
                                : `${(place.distance / 1000).toFixed(1)}km`}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedLocation.phoneNumber && (
                    <div>
                      <h4 className="text-sm font-medium mb-1">Contact</h4>
                      <p className="text-sm text-muted-foreground">{selectedLocation.phoneNumber}</p>
                    </div>
                  )}

                  {selectedLocation.website && (
                    <div>
                      <h4 className="text-sm font-medium mb-1">Website</h4>
                      <a
                        href={selectedLocation.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline"
                      >
                        {selectedLocation.website}
                      </a>
                    </div>
                  )}

                  {selectedLocation.historicalInfo && (
                    <div>
                      <h4 className="text-sm font-medium mb-1">Historical Information</h4>
                      <p className="text-sm text-muted-foreground">{selectedLocation.historicalInfo}</p>
                    </div>
                  )}
                </div>
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

// Implement the Map feature
const MapFeature = () => {
  const [locations, setLocations] = useState<SavedLocation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedLocation, setSelectedLocation] = useState<SavedLocation | null>(null)
  const [mapCenter, setMapCenter] = useState<Location>({ latitude: 0, longitude: 0 })
  const [userLocation, setUserLocation] = useState<Location | null>(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [showInfoWindow, setShowInfoWindow] = useState(false)

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
    }
  }

  // Close info window
  const handleInfoWindowClose = () => {
    setShowInfoWindow(false)
  }

  // Navigate to location
  const handleNavigate = (location: SavedLocation) => {
    if (location.mapUrl) {
      window.open(location.mapUrl, "_blank")
    } else if (location.location) {
      window.open(
        `https://www.google.com/maps/dir/?api=1&destination=${location.location.latitude},${location.location.longitude}`,
        "_blank",
      )
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Map View</h2>
          <p className="text-muted-foreground">View all your saved locations on a map</p>
        </div>

        <Button onClick={fetchLocations} variant="outline">
          <Loader2 className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : "hidden"}`} />
          Refresh Map
        </Button>
      </div>

      {!isGoogleMapsLoaded ? (
        <Card className="h-[600px] flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
            <h3 className="text-lg font-medium">Loading Google Maps</h3>
            <p className="text-muted-foreground">Please wait while we load the map...</p>
          </div>
        </Card>
      ) : error ? (
        <Card className="h-[600px] flex items-center justify-center">
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
        <Card className="h-[600px] overflow-hidden">
          <GoogleMap
            mapContainerStyle={{ width: "100%", height: "100%" }}
            center={{ lat: mapCenter.latitude, lng: mapCenter.longitude }}
            zoom={12}
            onLoad={() => setMapLoaded(true)}
          >
            {/* User location marker */}
            {userLocation && (
              <Marker
                position={{ lat: userLocation.latitude, lng: userLocation.longitude }}
                icon={{
                  path: window.google.maps.SymbolPath.CIRCLE,
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
                    icon={{
                      url: `https://maps.google.com/mapfiles/ms/icons/${location.category === "Landmark" ? "blue" : location.category === "Business" ? "green" : "red"}-dot.png`,
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
                <div className="p-2 max-w-[250px]">
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
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Location Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Locations:</span>
                <span className="font-medium">{locations.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Landmarks:</span>
                <span className="font-medium">{locations.filter((loc) => loc.category === "Landmark").length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Businesses:</span>
                <span className="font-medium">{locations.filter((loc) => loc.category === "Business").length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Other:</span>
                <span className="font-medium">
                  {locations.filter((loc) => loc.category !== "Landmark" && loc.category !== "Business").length}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Map Legend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center">
                <div className="w-4 h-4 rounded-full bg-[#4285F4] mr-2"></div>
                <span>Your Current Location</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 rounded-full bg-blue-500 mr-2"></div>
                <span>Landmarks</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 rounded-full bg-green-500 mr-2"></div>
                <span>Businesses</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 rounded-full bg-red-500 mr-2"></div>
                <span>Other Locations</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => setMapCenter(userLocation || mapCenter)}
              >
                <MapPin className="mr-2 h-4 w-4" />
                Center on My Location
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={fetchLocations}>
                <Loader2 className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                Refresh Locations
              </Button>
              {selectedLocation && (
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => handleNavigate(selectedLocation)}
                >
                  <Navigation className="mr-2 h-4 w-4" />
                  Navigate to Selected
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Implement the Search feature
const SearchFeature = () => {
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
      let params = {}

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
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Search Locations</h2>
        <p className="text-muted-foreground">Find locations by name, address, or nearby your current location</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder={
                    searchType === "text"
                      ? "Search for a location by name..."
                      : searchType === "address"
                        ? "Enter an address to geocode..."
                        : "Search for locations near you..."
                  }
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  disabled={isLoading || searchType === "nearby"}
                />
              </div>

              <div className="flex gap-2">
                <Select value={searchType} onValueChange={(value) => setSearchType(value as any)}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Search type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">By Name</SelectItem>
                    <SelectItem value="address">By Address</SelectItem>
                    <SelectItem value="nearby">Nearby</SelectItem>
                  </SelectContent>
                </Select>

                <Button onClick={handleSearch} disabled={isLoading}>
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
            </div>

            {searchType === "nearby" && (
              <div className="flex items-center gap-4">
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
                <p className="text-sm text-muted-foreground">
                  {userLocation ? "Using your current location" : "Waiting for your location..."}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="bg-destructive/10 p-4 rounded-lg flex items-start">
          <AlertCircle className="h-5 w-5 text-destructive mr-2 mt-0.5" />
          <div>
            <p className="font-medium text-destructive">Error</p>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      )}

      {isLoading ? (
        <Card>
          <CardContent className="py-10">
            <div className="flex flex-col items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">Searching for locations...</p>
            </div>
          </CardContent>
        </Card>
      ) : searchResults.length > 0 ? (
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Search Results ({searchResults.length})</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {searchResults.map((location) => (
              <Card key={location.id} className="overflow-hidden">
                <div className="h-32 bg-muted relative">
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

                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{location.name || "Unknown Location"}</CardTitle>
                  <CardDescription className="line-clamp-1">
                    {location.address || "No address available"}
                  </CardDescription>
                </CardHeader>

                <CardContent className="pb-2">
                  <div className="flex items-center text-sm">
                    <MapPin className="h-4 w-4 mr-1 text-muted-foreground" />
                    {location.location ? (
                      <span className="text-muted-foreground">
                        {location.location.latitude.toFixed(4)}, {location.location.longitude.toFixed(4)}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">No coordinates</span>
                    )}
                  </div>

                  {location.confidence && (
                    <div className="mt-2">
                      <Badge variant={location.confidence > 0.8 ? "default" : "outline"}>
                        {Math.round(location.confidence * 100)}% confidence
                      </Badge>
                    </div>
                  )}
                </CardContent>

                <CardFooter className="flex justify-between">
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
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      ) : searchQuery || searchType === "nearby" ? (
        <Card>
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
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedLocation && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {selectedLocation.name || "Unknown Location"}
                  {selectedLocation.confidence && (
                    <Badge variant={selectedLocation.confidence > 0.8 ? "default" : "outline"} className="ml-2">
                      {Math.round(selectedLocation.confidence * 100)}% confidence
                    </Badge>
                  )}
                </DialogTitle>
                <DialogDescription>{selectedLocation.address || "No address available"}</DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  {selectedLocation.photos && selectedLocation.photos.length > 0 ? (
                    <div className="rounded-lg overflow-hidden border h-48">
                      <img
                        src={selectedLocation.photos[0] || "/placeholder.svg"}
                        alt={selectedLocation.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="rounded-lg overflow-hidden border h-48 bg-muted flex items-center justify-center">
                      <ImageIcon className="h-12 w-12 text-muted-foreground" />
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
                </div>

                <div className="space-y-4">
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
                        {selectedLocation.location.latitude.toFixed(6)},{" "}
                        {selectedLocation.location.longitude.toFixed(6)}
                      </p>
                    </div>
                  )}

                  {selectedLocation.geoData && (
                    <div>
                      <h4 className="text-sm font-medium mb-1">Location Details</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        {selectedLocation.geoData.country && (
                          <div>
                            <span className="text-muted-foreground">Country:</span> {selectedLocation.geoData.country} (
                            {selectedLocation.geoData.countryCode})
                          </div>
                        )}
                        {selectedLocation.geoData.administrativeArea && (
                          <div>
                            <span className="text-muted-foreground">State/Province:</span>{" "}
                            {selectedLocation.geoData.administrativeArea}
                          </div>
                        )}
                        {selectedLocation.geoData.locality && (
                          <div>
                            <span className="text-muted-foreground">City:</span> {selectedLocation.geoData.locality}
                          </div>
                        )}
                        {selectedLocation.geoData.postalCode && (
                          <div>
                            <span className="text-muted-foreground">Postal Code:</span>{" "}
                            {selectedLocation.geoData.postalCode}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {selectedLocation.nearbyPlaces && selectedLocation.nearbyPlaces.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-1">Nearby Places</h4>
                      <div className="space-y-2">
                        {selectedLocation.nearbyPlaces.slice(0, 3).map((place, idx) => (
                          <div key={idx} className="flex justify-between text-sm">
                            <span>{place.name}</span>
                            <Badge variant="outline" className="text-xs">
                              {place.distance < 1000
                                ? `${Math.round(place.distance)}m`
                                : `${(place.distance / 1000).toFixed(1)}km`}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
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

// Implement the Bookmarks feature
const BookmarksFeature = () => {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedBookmark, setSelectedBookmark] = useState<Bookmark | null>(null)
  const [locationDetails, setLocationDetails] = useState<SavedLocation | null>(null)
  const [showLocationDetails, setShowLocationDetails] = useState(false)

  // Fetch bookmarks from the API
  const fetchBookmarks = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch("/api/bookmarks")

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()

      if (data.success && data.bookmarks) {
        setBookmarks(data.bookmarks)
      } else {
        setBookmarks([])
      }
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
      setBookmarks(bookmarks.filter((bookmark) => bookmark.id !== id))
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Bookmarks</h2>
          <p className="text-muted-foreground">Your favorite and frequently visited locations</p>
        </div>

        <Button onClick={fetchBookmarks} variant="outline">
          <Loader2 className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : "hidden"}`} />
          Refresh
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
              <h3 className="text-lg font-medium mb-2">Error Loading Bookmarks</h3>
              <p className="text-muted-foreground">{error}</p>
              <Button onClick={fetchBookmarks} className="mt-4">
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : bookmarks.length === 0 ? (
        <Card>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {bookmarks.map((bookmark) => (
            <Card key={bookmark.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{bookmark.name || "Unknown Location"}</CardTitle>
                <CardDescription className="line-clamp-1">{bookmark.address || "No address available"}</CardDescription>
              </CardHeader>

              <CardContent className="pb-2">
                <Badge variant="outline">{bookmark.category || "Unknown"}</Badge>
                <p className="text-xs text-muted-foreground mt-2">
                  Added on {new Date(bookmark.createdAt).toLocaleDateString()}
                </p>
              </CardContent>

              <CardFooter className="flex justify-between">
                <Button variant="outline" size="sm" onClick={() => handleViewDetails(bookmark)}>
                  <Info className="h-4 w-4 mr-2" />
                  Details
                </Button>

                <Button variant="ghost" size="sm" onClick={() => handleDeleteBookmark(bookmark.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Location Details Dialog */}
      <Dialog open={showLocationDetails} onOpenChange={setShowLocationDetails}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {locationDetails && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {locationDetails.name || "Unknown Location"}
                  {locationDetails.confidence && (
                    <Badge variant={locationDetails.confidence > 0.8 ? "default" : "outline"} className="ml-2">
                      {Math.round(locationDetails.confidence * 100)}% confidence
                    </Badge>
                  )}
                </DialogTitle>
                <DialogDescription>{locationDetails.address || "No address available"}</DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                      <ImageIcon className="h-12 w-12 text-muted-foreground" />
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
                </div>

                <div className="space-y-4">
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

                  {locationDetails.geoData && (
                    <div>
                      <h4 className="text-sm font-medium mb-1">Location Details</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        {locationDetails.geoData.country && (
                          <div>
                            <span className="text-muted-foreground">Country:</span> {locationDetails.geoData.country} (
                            {locationDetails.geoData.countryCode})
                          </div>
                        )}
                        {locationDetails.geoData.administrativeArea && (
                          <div>
                            <span className="text-muted-foreground">State/Province:</span>{" "}
                            {locationDetails.geoData.administrativeArea}
                          </div>
                        )}
                        {locationDetails.geoData.locality && (
                          <div>
                            <span className="text-muted-foreground">City:</span> {locationDetails.geoData.locality}
                          </div>
                        )}
                        {locationDetails.geoData.postalCode && (
                          <div>
                            <span className="text-muted-foreground">Postal Code:</span>{" "}
                            {locationDetails.geoData.postalCode}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {locationDetails.nearbyPlaces && locationDetails.nearbyPlaces.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-1">Nearby Places</h4>
                      <div className="space-y-2">
                        {locationDetails.nearbyPlaces.slice(0, 3).map((place, idx) => (
                          <div key={idx} className="flex justify-between text-sm">
                            <span>{place.name}</span>
                            <Badge variant="outline" className="text-xs">
                              {place.distance < 1000
                                ? `${Math.round(place.distance)}m`
                                : `${(place.distance / 1000).toFixed(1)}km`}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
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

// Location Recognition Dialog Component
const LocationRecognitionDialog = ({ open, onOpenChange }) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Quick Location Scan</DialogTitle>
          <DialogDescription>Quickly identify a location using your camera or by uploading an image.</DialogDescription>
        </DialogHeader>
        <CameraRecognition />
      </DialogContent>
    </Dialog>
  )
}

// Dashboard Skeleton Component
const DashboardSkeleton = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-md animate-pulse">
        <CardHeader>
          <CardTitle className="h-6 bg-muted/50 rounded-md w-3/4"></CardTitle>
          <CardDescription className="h-4 bg-muted/50 rounded-md w-1/2"></CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="h-4 bg-muted/50 rounded-md"></div>
          <div className="h-4 bg-muted/50 rounded-md"></div>
          <div className="h-4 bg-muted/50 rounded-md"></div>
        </CardContent>
        <CardFooter>
          <Button className="w-full bg-muted/50 text-muted-foreground pointer-events-none">Loading...</Button>
        </CardFooter>
      </Card>
    </div>
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
      router.push("/login")
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
                        <Heart className="h-4 w-4" />
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
                <TabsTrigger value="bookmarks">
                  <Heart className="h-4 w-4 mr-2" />
                  Bookmarks
                </TabsTrigger>
              </TabsList>

              <TabsContent value="recognition" className="mt-0">
                <CameraRecognition />
              </TabsContent>

              <TabsContent value="locations" className="mt-0">
                <LocationsFeature />
              </TabsContent>

              <TabsContent value="map" className="mt-0">
                <MapFeature />
              </TabsContent>

              <TabsContent value="search" className="mt-0">
                <SearchFeature />
              </TabsContent>

              <TabsContent value="bookmarks" className="mt-0">
                <BookmarksFeature />
              </TabsContent>
            </Tabs>
          </main>

          {/* Location Recognition Dialog */}
          <LocationRecognitionDialog
            open={showLocationRecognitionDialog}
            onOpenChange={setShowLocationRecognitionDialog}
          />
        </div>
      </div>
    </SidebarProvider>
  )
}