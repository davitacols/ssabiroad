"use client"

import { useState, useEffect, useRef } from "react"
import {
  Camera,
  MapPin,
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
  ArrowUpDown,
  Info,
  Phone,
  Sun,
  Moon,
  Building,
  Trees,
  Cloud,
  Wind,
  Droplets,
  PlusCircle,
  FileText,
  Bell,
  MessageSquare,
  HelpCircle,
  Maximize,
  Minimize,
  Globe,
  BarChart3,
  Filter,
  LayoutDashboard,
  Share,
  ChevronDown,
  LayoutGrid,
  ThumbsUp,
  Layers,
  GalleryHorizontalEnd,
} from "lucide-react"
import * as THREE from "three"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from "@react-google-maps/api"
import { Canvas } from "@react-three/fiber"
import { Environment, OrbitControls, useGLTF, Text, Float, PerspectiveCamera } from "@react-three/drei"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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

// Import the new components
import { LocationSuggestions } from "@/components/location-suggestions"
import { ImageCaptionGenerator } from "@/components/image-caption-generator"
import { AIContentGenerator } from "@/components/ai-content-generator"

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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/components/ui/use-toast"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useIsMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"

// Helper function to get environment variables that works in both local and production
function getEnv(key: string): string | undefined {
  // For server-side code
  if (typeof process !== "undefined" && process.env) {
    return process.env[key]
  }
  // For client-side code with NEXT_PUBLIC_ prefix
  if (typeof window !== "undefined" && key.startsWith("NEXT_PUBLIC_")) {
    return (window as any).__ENV?.[key]
  }
  return undefined
}

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

interface LocationModel {
  name: string
  address?: string
  latitude: number
  longitude: number
}

// Define a type for bookmarks
interface BookmarkType {
  id: string
  locationId: string
  name: string
  address: string
  category: string
  createdAt: string
  notes?: string
  imageUrl?: string
}

// Define a type for user
interface UserType {
  id: string
  username: string
  email: string
  plan: string
}

// 3D Models for the dashboard
const LocationModel = () => {
  const gltf = useGLTF("/assets/3d/location.glb")
  return <primitive object={gltf.scene} />
}

// 3D Globe Component
const GlobeComponent = ({ position = [0, 0, 0], scale = 1, rotation = [0, 0, 0] }) => {
  const globeRef = useRef()

  useEffect(() => {
    if (!globeRef.current) return

    const interval = setInterval(() => {
      if (globeRef.current) {
        globeRef.current.rotation.y += 0.005
      }
    }, 16)

    return () => clearInterval(interval)
  }, [])

  return (
    <group position={position} scale={[scale, scale, scale]} rotation={rotation} ref={globeRef}>
      <mesh>
        <sphereGeometry args={[1, 32, 32]} />
        <meshStandardMaterial map={new THREE.TextureLoader().load("/assets/3d/texture_earth.jpg")} />
      </mesh>
    </group>
  )
}

// 3D Scene for the dashboard
const DashboardScene = () => {
  return (
    <Canvas>
      <PerspectiveCamera makeDefault position={[0, 0, 5]} />
      <ambientLight intensity={0.5} />
      <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} />
      <pointLight position={[-10, -10, -10]} />

      <Float speed={1.5} rotationIntensity={0.5} floatIntensity={0.5}>
        <GlobeComponent position={[0, 0, 0]} scale={1.5} />
      </Float>

      <Environment preset="city" />
      <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={0.5} />
    </Canvas>
  )
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
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [cameraActive, setCameraActive] = useState(false)
  const isMobile = useIsMobile()
  const googleMapsApiKey = getEnv("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY") || ""

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

  // Function to handle sharing location details
  const handleShare = () => {
    if (recognitionResult) {
      const shareData = {
        title: recognitionResult.name || "Location",
        text: recognitionResult.description || "Check out this location!",
        url: recognitionResult.mapUrl || window.location.href,
      }

      if (navigator.share) {
        navigator
          .share(shareData)
          .then(() => {
            toast({
              title: "Shared successfully",
              description: "Location details have been shared",
            })
          })
          .catch((error) => {
            console.error("Error sharing:", error)
            toast({
              title: "Sharing failed",
              description: "Could not share location details",
              variant: "destructive",
            })
          })
      } else {
        // Fallback for browsers that don't support the Web Share API
        toast({
          title: "Sharing not supported",
          description: "Your browser doesn't support sharing. Try copying the URL manually.",
          variant: "destructive",
        })
      }
    }
  }

  // Render environmental data
  const renderEnvironmentalData = (data) => {
    if (!data) return null

    return (
      <div className="grid grid-cols-2 gap-2 mt-4">
        {data.weatherConditions && (
          <div className="flex items-center gap-2 bg-primary/5 p-2 rounded-md">
            <Cloud className="h-4 w-4 text-primary" />
            <span className="text-xs">{data.weatherConditions}</span>
          </div>
        )}

        {data.airQuality && (
          <div className="flex items-center gap-2 bg-primary/5 p-2 rounded-md">
            <Wind className="h-4 w-4 text-primary" />
            <span className="text-xs">Air: {data.airQuality}</span>
          </div>
        )}

        {data.urbanDensity && (
          <div className="flex items-center gap-2 bg-primary/5 p-2 rounded-md">
            <Building className="h-4 w-4 text-primary" />
            <span className="text-xs">{data.urbanDensity}</span>
          </div>
        )}

        {data.vegetationDensity && (
          <div className="flex items-center gap-2 bg-primary/5 p-2 rounded-md">
            <Trees className="h-4 w-4 text-primary" />
            <span className="text-xs">{data.vegetationDensity}</span>
          </div>
        )}

        {data.waterProximity && (
          <div className="flex items-center gap-2 bg-primary/5 p-2 rounded-md">
            <Droplets className="h-4 w-4 text-primary" />
            <span className="text-xs">{data.waterProximity}</span>
          </div>
        )}

        {data.materialType && (
          <div className="flex items-center gap-2 bg-primary/5 p-2 rounded-md">
            <Layers className="h-4 w-4 text-primary" />
            <span className="text-xs">Material: {data.materialType}</span>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
        <div className="flex-1">
          <div className="relative h-[400px] bg-background rounded-xl overflow-hidden border border-border shadow-md flex items-center justify-center">
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
                    className="bg-background/90 backdrop-blur-sm p-6 rounded-xl border border-border shadow-lg"
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
                            <Phone className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                            {recognitionResult.phoneNumber}
                          </p>
                        )}
                        {recognitionResult.website && (
                          <p className="text-sm flex items-center">
                            <Globe className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
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

                    {/* Environmental data */}
                    {renderEnvironmentalData(recognitionResult)}

                    {/* Display opening hours if available */}
                    {recognitionResult.openingHours && recognitionResult.openingHours.length > 0 && (
                      <div className="mb-4">
                        <p className="text-sm font-medium mb-1 flex items-center">
                          <Clock className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
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

                    <div className="flex flex-wrap justify-between gap-2 mt-4">
                      {recognitionResult.mapUrl && (
                        <Button variant="outline" size="lg" asChild>
                          <a href={recognitionResult.mapUrl} target="_blank" rel="noopener noreferrer">
                            <Map className="w-4 h-4 mr-2" />
                            View on Map
                          </a>
                        </Button>
                      )}
                      <Button variant="outline" size="lg" onClick={handleShare}>
                        <Share className="w-4 h-4 mr-2" />
                        Share
                      </Button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-background/90 backdrop-blur-sm p-6 rounded-xl border border-border shadow-lg"
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
                  <Camera className="w-20 h-20 mb-6 text-primary/70" />
                </motion.div>
                <h2 className="text-2xl font-bold mb-2">Identify Any Location</h2>
                <p className="text-muted-foreground mb-6 max-w-md">
                  Upload a photo or use your camera to instantly recognize landmarks, businesses, and navigate to them
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button
                    size="lg"
                    className="bg-primary text-primary-foreground shadow-lg hover:bg-primary/90"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="mr-2 h-5 w-5" />
                    Upload Image
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-primary/20 hover:bg-primary/5"
                    onClick={handleCameraCapture}
                  >
                    <Camera className="mr-2 h-5 w-5" />
                    Use Camera
                  </Button>
                </div>
              </motion.div>
            )}

            {error && !isProcessing && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute bottom-4 left-4 right-4 bg-destructive/10 text-destructive p-3 rounded-md"
              >
                {error}
              </motion.div>
            )}
          </div>

          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />

          <div className="flex justify-between items-center mt-4">
            {(previewUrl || recognitionResult || cameraActive) && (
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
        <div className="w-full lg:w-80 shrink-0">
          <Card className="border border-border/40 shadow-md rounded-xl overflow-hidden">
            <CardHeader className="pb-2 bg-muted/30">
              <CardTitle className="text-lg flex items-center">
                <Clock className="mr-2 h-4 w-4 text-primary" />
                Recent Locations
              </CardTitle>
              <CardDescription>Your recently identified places</CardDescription>
            </CardHeader>
            <CardContent className="p-3">
              {recentLocations.length > 0 ? (
                <ScrollArea className="max-h-[350px] pr-3">
                  <div className="space-y-3">
                    {recentLocations.map((location, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="p-3 rounded-lg border border-border/50 hover:bg-muted/50 cursor-pointer transition-colors"
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
                      </motion.div>
                    ))}
                  </div>
                </ScrollArea>
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
      <Card className="border border-border/40 shadow-md rounded-xl overflow-hidden">
        <CardHeader className="pb-2 bg-muted/30">
          <CardTitle>How It Works</CardTitle>
          <CardDescription>Three simple steps to navigate to any place using just a photo</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex flex-col items-center text-center"
            >
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 relative">
                <Camera className="h-6 w-6 text-primary" />
                <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm flex items-center justify-center font-medium shadow-md">
                  1
                </div>
              </div>
              <h3 className="text-lg font-medium mb-2">Upload or Take a Photo</h3>
              <p className="text-muted-foreground">
                Capture or select an image of any landmark, building, or location you want to visit
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex flex-col items-center text-center"
            >
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 relative">
                <Sparkles className="h-6 w-6 text-primary" />
                <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm flex items-center justify-center font-medium shadow-md">
                  2
                </div>
              </div>
              <h3 className="text-lg font-medium mb-2">AI Identifies the Location</h3>
              <p className="text-muted-foreground">
                Our technology recognizes the place in your image and provides details about it
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col items-center text-center"
            >
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 relative">
                <Compass className="h-6 w-6 text-primary" />
                <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm flex items-center justify-center font-medium shadow-md">
                  3
                </div>
              </div>
              <h3 className="text-lg font-medium mb-2">Get Navigation Directions</h3>
              <p className="text-muted-foreground">
                Navigate to the identified location with precise turn-by-turn directions
              </p>
            </motion.div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Implement the Locations feature
const LocationsFeature = ({ filterCategory = "all" }) => {
  const [locations, setLocations] = useState<SavedLocation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedLocation, setSelectedLocation] = useState<SavedLocation | null>(null)
  const [showLocationDetails, setShowLocationDetails] = useState(false)
  const [sortField, setSortField] = useState<string>("createdAt")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  const [localFilterCategory, setLocalFilterCategory] = useState<string>(filterCategory)

  // Update local filter when prop changes
  useEffect(() => {
    setLocalFilterCategory(filterCategory)
  }, [filterCategory])
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [isBookmarked, setIsBookmarked] = useState<boolean>(false)
  const [view, setView] = useState<"grid" | "list">("list")

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
            const bookmarkedLocationIds = bookmarksData.bookmarks.map((b: BookmarkType) => b.locationId)

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

  // Filter and sort locations
  const filteredAndSortedLocations = locations
    .filter((loc) => {
      // Apply category filter
      if (
        localFilterCategory !== "all" &&
        loc.category !== localFilterCategory &&
        // Handle case differences and plurals
        loc.category?.toLowerCase() !== localFilterCategory.toLowerCase().replace(/s$/, "")
      ) {
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Saved Locations</h2>
          <p className="text-muted-foreground">Manage your saved locations and bookmarks</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Input
            placeholder="Search locations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:w-48 md:w-64"
          />

          <Select value={localFilterCategory} onValueChange={setLocalFilterCategory}>
            <SelectTrigger className="w-full sm:w-36 md:w-40">
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

          <div className="flex rounded-md border border-input overflow-hidden">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`h-9 w-9 rounded-none ${view === "list" ? "bg-muted" : ""}`}
                    onClick={() => setView("list")}
                  >
                    <LayoutDashboard className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>List View</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`h-9 w-9 rounded-none ${view === "grid" ? "bg-muted" : ""}`}
                    onClick={() => setView("grid")}
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Grid View</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
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
        <Card className="rounded-xl shadow-md">
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
      ) : view === "list" ? (
        <Card className="border border-border/40 shadow-md rounded-xl overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/30">
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
              <AnimatePresence>
                {filteredAndSortedLocations.map((location, index) => (
                  <motion.tr
                    key={location.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ delay: index * 0.03 }}
                    className="group"
                  >
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
                          className="opacity-70 group-hover:opacity-100 transition-opacity"
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
                          className="opacity-70 group-hover:opacity-100 transition-opacity"
                        >
                          <Info className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteLocation(location.id)}
                          title="Delete location"
                          className="opacity-70 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </TableBody>
          </Table>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredAndSortedLocations.map((location, index) => (
            <motion.div
              key={location.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="overflow-hidden h-full flex flex-col group hover:shadow-lg transition-shadow rounded-xl">
                <div className="relative h-40 bg-muted">
                  <img
                    src={
                      location.photos?.[0] ||
                      `/placeholder.svg?height=160&width=320&text=${encodeURIComponent(location.name || "Unknown")}`
                    }
                    alt={location.name || "Unknown location"}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <h3 className="font-medium text-white truncate">{location.name || "Unknown"}</h3>
                    <p className="text-xs text-white/80 truncate">{location.address || "No address"}</p>
                  </div>
                  <div className="absolute top-2 right-2 flex gap-1">
                    <Button
                      variant="secondary"
                      size="icon"
                      className="h-7 w-7 bg-black/30 hover:bg-black/50 text-white border-none opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleViewDetails(location)}
                    >
                      <Info className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="secondary"
                      size="icon"
                      className="h-7 w-7 bg-black/30 hover:bg-black/50 text-white border-none opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleToggleBookmark(location)}
                    >
                      {location.isBookmarked ? (
                        <Heart className="h-3.5 w-3.5 fill-red-500 text-red-500" />
                      ) : (
                        <Heart className="h-3.5 w-3.5" />
                      )}
                    </Button>
                    <Button
                      variant="secondary"
                      size="icon"
                      className="h-7 w-7 bg-black/30 hover:bg-black/50 text-white border-none opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleDeleteLocation(location.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  {location.confidence && (
                    <div className="absolute top-2 left-2">
                      <Badge
                        variant={location.confidence > 0.8 ? "default" : "secondary"}
                        className="bg-black/30 text-white"
                      >
                        {Math.round(location.confidence * 100)}%
                      </Badge>
                    </div>
                  )}
                </div>
                <CardContent className="flex-1 p-3">
                  <div className="flex justify-between items-center mb-2">
                    <Badge variant="outline" className="text-xs">
                      {location.category || "Unknown"}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(location.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
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
                      <ImageIcon className="h-12 w-12 text-muted-foreground" />
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
                        src={`https://www.google.com/maps/embed/v1/place?key=${getEnv("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY")}&q=${selectedLocation.location.latitude},${selectedLocation.location.longitude}&zoom=15`}
                        allowFullScreen
                      ></iframe>
                    </motion.div>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium mb-1">Category</h4>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">{selectedLocation.category || "Unknown"}</Badge>
                      {selectedLocation.buildingType && (
                        <Badge variant="outline">{selectedLocation.buildingType}</Badge>
                      )}
                      {selectedLocation.materialType && (
                        <Badge variant="outline">{selectedLocation.materialType}</Badge>
                      )}
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
                        {selectedLocation.location.latitude.toFixed(6)},{" "}
                        {selectedLocation.location.longitude.toFixed(6)}
                      </p>
                    </div>
                  )}

                  {/* Environmental data */}
                  <div className="grid grid-cols-2 gap-2">
                    {selectedLocation.weatherConditions && (
                      <div className="flex items-center gap-2 bg-primary/5 p-2 rounded-md">
                        <Cloud className="h-4 w-4 text-primary" />
                        <span className="text-xs">{selectedLocation.weatherConditions}</span>
                      </div>
                    )}

                    {selectedLocation.airQuality && (
                      <div className="flex items-center gap-2 bg-primary/5 p-2 rounded-md">
                        <Wind className="h-4 w-4 text-primary" />
                        <span className="text-xs">Air: {selectedLocation.airQuality}</span>
                      </div>
                    )}

                    {selectedLocation.urbanDensity && (
                      <div className="flex items-center gap-2 bg-primary/5 p-2 rounded-md">
                        <Building className="h-4 w-4 text-primary" />
                        <span className="text-xs">{selectedLocation.urbanDensity}</span>
                      </div>
                    )}

                    {selectedLocation.vegetationDensity && (
                      <div className="flex items-center gap-2 bg-primary/5 p-2 rounded-md">
                        <Trees className="h-4 w-4 text-primary" />
                        <span className="text-xs">{selectedLocation.vegetationDensity}</span>
                      </div>
                    )}
                  </div>

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

              <DialogFooter className="flex flex-wrap justify-between gap-2 mt-4">
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
                  <Button asChild className="bg-primary hover:bg-primary/90">
                    <a href={selectedLocation.mapUrl} target="_blank" rel="noopener noreferrer">
                      <MapPin className="mr-2 h-4 w-4" />
                      View on Map
                    </a>
                  </Button>
                )}

                <Button
                  variant="outline"
                  onClick={() => {
                    if (selectedLocation) {
                      const shareData = {
                        title: selectedLocation.name || "Location",
                        text: selectedLocation.description || "Check out this location!",
                        url: selectedLocation.mapUrl || window.location.href,
                      }

                      if (navigator.share) {
                        navigator.share(shareData).catch((error) => console.error("Error sharing:", error))
                      } else {
                        toast({
                          title: "Sharing not supported",
                          description: "Your browser doesn't support sharing. Try copying the URL manually.",
                          variant: "destructive",
                        })
                      }
                    }
                  }}
                >
                  <Share className="mr-2 h-4 w-4" />
                  Share
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Implement the Map feature
const MapFeature = ({ filterCategory = "all" }) => {
  const [locations, setLocations] = useState<SavedLocation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedLocation, setSelectedLocation] = useState<SavedLocation | null>(null)
  const [showInfoWindow, setShowInfoWindow] = useState(false)
  const [mapCenter, setMapCenter] = useState<Location>({ latitude: 0, longitude: 0 })
  const [userLocation, setUserLocation] = useState<Location | null>(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [mapZoom, setMapZoom] = useState(12)
  const [is3DMode, setIs3DMode] = useState(false)
  const isMobile = useIsMobile()
  const googleMapsApiKey = getEnv("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY") || ""

  // Load Google Maps API
  const { isLoaded: isGoogleMapsLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey,
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

  const handleToggleBookmark = async (location: SavedLocation) => {
    try {
      const response = await fetch("/api/location-recognition", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          operation: "bookmark",
          locationId: location.id,
        }),
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()

      if (data.success) {
        // Update the location in the state
        setLocations((prevLocations) =>
          prevLocations.map((loc) => (loc.id === location.id ? { ...loc, isBookmarked: !loc.isBookmarked } : loc)),
        )
      }
    } catch (err) {
      console.error("Failed to toggle bookmark:", err)
    }
  }

  // Toggle 3D mode
  const toggle3DMode = () => {
    setIs3DMode(!is3DMode)
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Map View</h2>
          <p className="text-muted-foreground">View all your saved locations on a map</p>
        </div>

        <div className="flex gap-2">
          <Button onClick={toggle3DMode} variant="outline" className="gap-2">
            {is3DMode ? <Map className="h-4 w-4" /> : <Globe className="h-4 w-4" />}
            {is3DMode ? "2D Map" : "3D View"}
          </Button>
          <Button onClick={fetchLocations} variant="outline" className="gap-2">
            <Loader2 className={`h-4 w-4 ${isLoading ? "animate-spin" : "hidden"}`} />
            Refresh Map
          </Button>
        </div>
      </div>

      {!isGoogleMapsLoaded ? (
        <Card className="h-[600px] flex items-center justify-center border border-border/40 shadow-md rounded-xl">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
            <h3 className="text-lg font-medium">Loading Google Maps</h3>
            <p className="text-muted-foreground">Please wait while we load the map...</p>
          </div>
        </Card>
      ) : error ? (
        <Card className="h-[600px] flex items-center justify-center border border-border/40 shadow-md rounded-xl">
          <div className="text-center">
            <AlertCircle className="h-10 w-10 text-destructive mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Error Loading Map</h3>
            <p className="text-muted-foreground">{error}</p>
            <Button onClick={fetchLocations} className="mt-4">
              Try Again
            </Button>
          </div>
        </Card>
      ) : is3DMode ? (
        <Card className="h-[600px] overflow-hidden border border-border/40 shadow-md rounded-xl">
          <div className="w-full h-full">
            <Canvas>
              <PerspectiveCamera makeDefault position={[0, 5, 10]} />
              <ambientLight intensity={0.5} />
              <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} />
              <pointLight position={[-10, -10, -10]} />

              {/* Earth globe */}
              <GlobeComponent position={[0, 0, 0]} scale={3} />

              {/* Location markers */}
              {locations.map(
                (location) =>
                  location.location && (
                    <Float
                      key={location.id}
                      speed={1}
                      rotationIntensity={0.5}
                      floatIntensity={0.5}
                      position={[(location.location.longitude / 180) * 3, (location.location.latitude / 90) * 1.5, 3.1]}
                    >
                      <mesh onClick={() => handleMarkerClick(location)} scale={0.1}>
                        <sphereGeometry args={[1, 16, 16]} />
                        <meshStandardMaterial
                          color={getMarkerColor(location.category)}
                          emissive={getMarkerColor(location.category)}
                          emissiveIntensity={0.5}
                        />
                      </mesh>

                      {/* Location name */}
                      <Text position={[0, 0.2, 0]} fontSize={0.1} color="white" anchorX="center" anchorY="middle">
                        {location.name || "Unknown"}
                      </Text>
                    </Float>
                  ),
              )}

              {/* User location marker */}
              {userLocation && (
                <Float
                  speed={1.5}
                  rotationIntensity={0.5}
                  floatIntensity={0.5}
                  position={[(userLocation.longitude / 180) * 3, (userLocation.latitude / 90) * 1.5, 3.1]}
                >
                  <mesh scale={0.15}>
                    <sphereGeometry args={[1, 16, 16]} />
                    <meshStandardMaterial color="#4285F4" emissive="#4285F4" emissiveIntensity={0.8} />
                  </mesh>
                  <Text position={[0, 0.3, 0]} fontSize={0.12} color="white" anchorX="center" anchorY="middle">
                    You are here
                  </Text>
                </Float>
              )}

              <Environment preset="city" />
              <OrbitControls enableZoom={true} autoRotate autoRotateSpeed={0.5} />
            </Canvas>
          </div>
        </Card>
      ) : (
        <Card className="h-[600px] overflow-hidden border border-border/40 shadow-md rounded-xl">
          <GoogleMap
            mapContainerStyle={{ width: "100%", height: "100%" }}
            center={{ lat: mapCenter.latitude, lng: mapCenter.longitude }}
            zoom={mapZoom}
            onLoad={() => setMapLoaded(true)}
            options={{
              mapTypeControl: true,
              streetViewControl: true,
              fullscreenControl: true,
              mapTypeId: "hybrid",
              styles: [
                {
                  featureType: "all",
                  elementType: "labels.text.fill",
                  stylers: [{ color: "#7c93a3" }, { lightness: -10 }],
                },
                {
                  featureType: "administrative.country",
                  elementType: "geometry",
                  stylers: [{ visibility: "on" }],
                },
                {
                  featureType: "administrative.province",
                  elementType: "geometry.stroke",
                  stylers: [{ color: "#ffffff" }, { visibility: "on" }, { weight: 1 }],
                },
                {
                  featureType: "landscape",
                  elementType: "geometry",
                  stylers: [{ color: "#f3f4f4" }],
                },
                {
                  featureType: "water",
                  elementType: "geometry",
                  stylers: [{ color: "#a3ccff" }],
                },
              ],
            }}
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
                    animation={window.google.maps.Animation.DROP}
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
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="border border-border/40 shadow-md rounded-xl h-full">
            <CardHeader className="pb-2 bg-muted/30">
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Location Stats
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Total Locations:</span>
                  <span className="font-medium text-lg">{locations.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Landmarks:</span>
                  <Badge variant="outline">{locations.filter((loc) => loc.category === "Landmark").length}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Businesses:</span>
                  <Badge variant="outline">{locations.filter((loc) => loc.category === "Business").length}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Other:</span>
                  <Badge variant="outline">
                    {locations.filter((loc) => loc.category !== "Landmark" && loc.category !== "Business").length}
                  </Badge>
                </div>
                {userLocation && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Your Position:</span>
                    <span className="text-xs font-mono bg-muted p-1 rounded">
                      {userLocation.latitude.toFixed(4)}, {userLocation.longitude.toFixed(4)}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="border border-border/40 shadow-md rounded-xl h-full">
            <CardHeader className="pb-2 bg-muted/30">
              <CardTitle className="text-lg flex items-center gap-2">
                <GalleryHorizontalEnd className="h-5 w-5 text-primary" />
                Map Legend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
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
                  <div className="w-4 h-4 rounded-full bg-purple-500 mr-2"></div>
                  <span>Points of Interest</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 rounded-full bg-red-500 mr-2"></div>
                  <span>Other Locations</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="border border-border/40 shadow-md rounded-xl h-full">
            <CardHeader className="pb-2 bg-muted/30">
              <CardTitle className="text-lg flex items-center gap-2">
                <Settings className="h-5 w-5 text-primary" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => {
                    if (userLocation) {
                      setMapCenter(userLocation)
                      setMapZoom(15)
                    }
                  }}
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
                <Button variant="outline" className="w-full justify-start" onClick={toggle3DMode}>
                  {is3DMode ? (
                    <>
                      <Map className="mr-2 h-4 w-4" />
                      Switch to 2D Map
                    </>
                  ) : (
                    <>
                      <Globe className="mr-2 h-4 w-4" />
                      Switch to 3D View
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}

// Main Dashboard Component
export default function Dashboard() {
  const [showLocationRecognitionDialog, setShowLocationRecognitionDialog] = useState(false)
  const [activeTab, setActiveTab] = useState("recognition")
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [filterCategory, setFilterCategory] = useState("all")
  const [user, setUser] = useState<UserType | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const router = useRouter()
  const isMobile = useIsMobile()

  /* // Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true)

        // Get the JWT token from localStorage
        const token = localStorage.getItem("token")

        if (!token) {
          throw new Error("No authentication token found")
        }

        const response = await fetch("/api/user", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          if (response.status === 401) {
            // Token is invalid or expired, redirect to login
            router.push("/login")
            return
          }
          throw new Error("Failed to fetch user data")
        }

        const userData = await response.json()
        setUser(userData)
      } catch (err) {
        console.error("Error fetching user data:", err)
        setError(err instanceof Error ? err.message : "An error occurred")
      } finally {
        setLoading(false)
      }
    }

    fetchUserData()
  }, [router]) */

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

  // Function to toggle fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((e) => {
        console.error(`Error attempting to enable fullscreen: ${e.message}`)
      })
      setIsFullscreen(true)
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen()
        setIsFullscreen(false)
      }
    }
  }

  // Function to handle filter change
  const handleFilterChange = (category: string) => {
    setFilterCategory(category)
    toast({
      title: "Filter Applied",
      description: `Showing ${category === "all" ? "all" : category} locations.`,
    })
  }

  // Function to initiate a new scan
  const handleNewScan = () => {
    setActiveTab("recognition")
    setShowLocationRecognitionDialog(true)
    toast({
      title: "New Scan",
      description: "Initiating a new image recognition scan.",
    })
  }

  /* // Handle logout
  const handleLogout = async () => {
    try {
      // Remove the token from localStorage
      localStorage.removeItem("token")

      // Redirect to login page
      router.push("/login")
    } catch (error) {
      console.error("Error during logout:", error)
    }
  } */

  // Enhanced Location Recognition Dialog Component
  const LocationRecognitionDialog = ({ open, onOpenChange }) => {
    const fileInputRef = useRef(null)
    const [progress, setProgress] = useState(0)
    const [isProcessing, setIsProcessing] = useState(false)
    const [selectedFile, setSelectedFile] = useState(null)
    const [previewUrl, setPreviewUrl] = useState(null)
    const [cameraActive, setCameraActive] = useState(false)
    const videoRef = useRef<HTMLVideoElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)

    const handleFileChange = (e) => {
      if (e.target.files && e.target.files.length > 0) {
        const file = e.target.files[0]
        setSelectedFile(file)
        setPreviewUrl(URL.createObjectURL(file))
        handleImageProcessing(file)
      }
    }

    const handleImageProcessing = (file) => {
      setIsProcessing(true)
      setProgress(0)

      // Simulate processing with progress updates
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval)
            setIsProcessing(false)
            onOpenChange(false) // Close dialog when done
            return 100
          }
          return prev + 5
        })
      }, 150)
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
                    handleImageProcessing(file)

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
      }
    }

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

    return (
      <Dialog
        open={open}
        onOpenChange={(newOpen) => {
          if (!newOpen) stopCamera() // Stop camera when dialog closes
          onOpenChange(newOpen)
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5 text-primary" />
              Quick Location Scan
            </DialogTitle>
            <DialogDescription>
              Use your camera to quickly identify locations. Capture or upload an image to start the scan.
            </DialogDescription>
          </DialogHeader>

          <div className="relative h-[300px] bg-muted rounded-lg overflow-hidden border border-border flex items-center justify-center">
            {/* Camera video feed */}
            <video
              ref={videoRef}
              className={`absolute inset-0 w-full h-full object-cover ${cameraActive ? "block" : "hidden"}`}
              autoPlay
              playsInline
              muted
            />
            <canvas ref={canvasRef} className="hidden" />

            {previewUrl && (
              <img
                src={previewUrl || "/placeholder.svg"}
                alt="Preview"
                className="absolute inset-0 w-full h-full object-cover"
              />
            )}

            {!cameraActive && !previewUrl && (
              <div className="flex flex-col items-center justify-center text-center p-6">
                <Camera className="w-16 h-16 mb-4 text-primary/70" />
                <h2 className="text-xl font-bold mb-2">Identify Any Location</h2>
                <p className="text-muted-foreground mb-4">
                  Upload a photo or use your camera to instantly recognize places
                </p>
              </div>
            )}

            {isProcessing && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm z-10">
                <Loader2 className="w-12 h-12 animate-spin text-primary" />
                <div className="text-sm font-medium mt-4 mb-2">Analyzing image...</div>
              </div>
            )}
          </div>

          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />

          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <Button
              size="lg"
              className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="mr-2 h-5 w-5" />
              Upload Image
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="flex-1 border-primary/20 hover:bg-primary/5"
              onClick={handleCameraCapture}
            >
              <Camera className="mr-2 h-5 w-5" />
              {cameraActive ? "Capture Photo" : "Use Camera"}
            </Button>
          </div>

          {isProcessing && (
            <div className="mt-4">
              <Progress value={progress} className="w-full h-2" />
              <p className="text-xs text-center text-muted-foreground mt-1">
                {progress < 100 ? "Processing image..." : "Completed!"}
              </p>
            </div>
          )}

          <DialogFooter className="flex justify-between mt-4">
            <div className="flex items-center space-x-2">
              <Switch id="save-to-db" defaultChecked />
              <Label htmlFor="save-to-db">Save to database</Label>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                stopCamera()
                onOpenChange(false)
              }}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  // Navigation items
  const navigationItems = [
    { id: "recognition", label: "Image Recognition", icon: Camera, color: "text-primary" },
    { id: "locations", label: "Saved Locations", icon: MapPin, color: "text-emerald-500" },
    { id: "map", label: "Map View", icon: Map, color: "text-indigo-500" },
    { id: "search", label: "Search", icon: Search, color: "text-amber-500" },
    { id: "bookmarks", label: "Bookmarks", icon: Heart, color: "text-rose-500" },
  ]

  // Advanced features
  const advancedFeatures = [
    { id: "location-suggestions", label: "Suggestions", icon: PlusCircle, color: "text-purple-500" },
    { id: "image-caption", label: "Image Captions", icon: ImageIcon, color: "text-sky-500" },
    { id: "ai-content-generator", label: "AI Content", icon: FileText, color: "text-orange-500" },
  ]

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center space-y-4">
          <div className="relative w-16 h-16 mx-auto">
            <div className="absolute inset-0 flex items-center justify-center">
              <MapPin className="h-8 w-8 text-primary animate-pulse" />
            </div>
            <div className="absolute inset-0 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
          </div>
          <h2 className="text-xl font-semibold mt-4">Loading Pic2Nav</h2>
          <p className="text-muted-foreground">Preparing your location dashboard...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Card className="w-full max-w-md border-none shadow-xl rounded-xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-red-500/10 to-orange-500/10">
            <CardTitle className="text-red-500 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Error Loading Dashboard
            </CardTitle>
            <CardDescription>We encountered an issue while loading your data</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">{error}</p>
          </CardContent>
          <CardFooter className="bg-muted/30 flex justify-center">
            <Button
              onClick={() => window.location.reload()}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Loader2 className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 w-full border-b bg-background/90 backdrop-blur-sm">
        <div className="flex h-16 items-center px-4 md:px-6">
          <div className="flex items-center gap-2 mr-4">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsMenuOpen(true)}>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <line x1="3" y1="6" x2="21" y2="6" />
                      <line x1="3" y1="12" x2="21" y2="12" />
                      <line x1="3" y1="18" x2="21" y2="18" />
                    </svg>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Menu</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <MapPin className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold hidden sm:inline-block">Pic2Nav</span>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="hidden md:flex flex-1 mx-4">
            <TabsList className="bg-muted/50 p-1">
              {navigationItems.map((item) => (
                <TabsTrigger
                  key={item.id}
                  value={item.id}
                  className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md"
                >
                  <item.icon className={`h-4 w-4 mr-2 ${item.color}`} />
                  {item.label}
                </TabsTrigger>
              ))}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 gap-1">
                    More
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {advancedFeatures.map((item) => (
                    <DropdownMenuItem key={item.id} onClick={() => setActiveTab(item.id)} className="gap-2">
                      <item.icon className={`h-4 w-4 ${item.color}`} />
                      {item.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </TabsList>
          </Tabs>

          <div className="flex items-center gap-2 ml-auto">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="rounded-full"
                    onClick={() => setShowLocationRecognitionDialog(true)}
                  >
                    <Camera className="h-4 w-4" />
                    <span className="sr-only">Quick Scan</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Quick Scan</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" className="rounded-full" onClick={toggleFullscreen}>
                    {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
                    <span className="sr-only">Toggle fullscreen</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" className="rounded-full" onClick={toggleDarkMode}>
                    {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                    <span className="sr-only">Toggle theme</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{isDarkMode ? "Light Mode" : "Dark Mode"}</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="rounded-full relative">
                  <Bell className="h-4 w-4" />
                  <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-primary"></span>
                  <span className="sr-only">Notifications</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <ScrollArea className="h-[300px]">
                  <div className="p-2 space-y-2">
                    <div className="flex items-start gap-4 p-3 hover:bg-muted/50 rounded-md">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                        <MapPin className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">New location recognized</p>
                        <p className="text-xs text-muted-foreground">
                          Empire State Building was added to your locations
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">2 hours ago</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4 p-3 hover:bg-muted/50 rounded-md">
                      <div className="w-8 h-8 bg-amber-500/10 rounded-full flex items-center justify-center flex-shrink-0">
                        <Bell className="h-4 w-4 text-amber-500" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">System update</p>
                        <p className="text-xs text-muted-foreground">New features have been added to the platform</p>
                        <p className="text-xs text-muted-foreground mt-1">1 day ago</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4 p-3 hover:bg-muted/50 rounded-md">
                      <div className="w-8 h-8 bg-emerald-500/10 rounded-full flex items-center justify-center flex-shrink-0">
                        <ThumbsUp className="h-4 w-4 text-emerald-500" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Enhanced precision</p>
                        <p className="text-xs text-muted-foreground">
                          Our location recognition model has been upgraded for better accuracy
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">3 days ago</p>
                      </div>
                    </div>
                  </div>
                </ScrollArea>
                <DropdownMenuSeparator />
                <div className="p-2">
                  <Button variant="outline" size="sm" className="w-full">
                    View all notifications
                  </Button>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${user?.username || "User"}`} />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {user?.username?.[0]}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{user?.username}</p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="gap-2">
                  <User className="h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-2">
                  <Settings className="h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {/* <DropdownMenuItem onClick={handleLogout} className="gap-2">
                  <LogOut className="h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem> */}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Mobile Menu Sheet */}
      <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
        <SheetContent side="left" className="w-64 pt-10">
          <SheetHeader className="text-left mb-4">
            <SheetTitle className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <MapPin className="w-4 h-4 text-primary-foreground" />
              </div>
              <span>Pic2Nav</span>
            </SheetTitle>
          </SheetHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <h3 className="text-xs font-semibold text-muted-foreground tracking-wider pl-2 mb-1">MAIN NAVIGATION</h3>
              {navigationItems.map((item) => (
                <Button
                  key={item.id}
                  variant={activeTab === item.id ? "secondary" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => {
                    setActiveTab(item.id)
                    setIsMenuOpen(false)
                  }}
                >
                  <item.icon className={`h-4 w-4 mr-2 ${activeTab === item.id ? "text-primary" : item.color}`} />
                  {item.label}
                </Button>
              ))}
            </div>
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground tracking-wider pl-2 mb-1 pt-2">
                ADVANCED FEATURES
              </h3>
              {advancedFeatures.map((item) => (
                <Button
                  key={item.id}
                  variant={activeTab === item.id ? "secondary" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => {
                    setActiveTab(item.id)
                    setIsMenuOpen(false)
                  }}
                >
                  <item.icon className={`h-4 w-4 mr-2 ${activeTab === item.id ? "text-primary" : item.color}`} />
                  {item.label}
                </Button>
              ))}
            </div>
          </div>
          <div className="absolute bottom-4 left-4 right-4">
            <Card className="bg-muted/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${user?.username || "User"}`} />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {user?.username?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 overflow-hidden">
                    <p className="text-sm font-medium truncate">{user?.username}</p>
                    <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </SheetContent>
      </Sheet>

      {/* Main Content Area */}
      <div className="flex-1 container mx-auto p-4 md:p-6">
        {/* Mobile Tabs Navigation */}
        <div className="md:hidden mb-4">
          <ScrollArea orientation="horizontal" className="w-full">
            <div className="flex space-x-2 p-1 min-w-full">
              {navigationItems.map((item) => (
                <Button
                  key={item.id}
                  variant={activeTab === item.id ? "default" : "outline"}
                  size="sm"
                  className={cn(
                    "rounded-full gap-2",
                    activeTab === item.id ? "bg-primary text-primary-foreground" : "",
                  )}
                  onClick={() => setActiveTab(item.id)}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Button>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Dashboard Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">
              {navigationItems.concat(advancedFeatures).find((item) => item.id === activeTab)?.label}
            </h1>
            <p className="text-muted-foreground mt-1">
              {activeTab === "recognition"
                ? "Upload or capture images to identify locations"
                : activeTab === "locations"
                  ? "Manage your saved locations and bookmarks"
                  : activeTab === "map"
                    ? "View all your saved locations on a map"
                    : "Explore and manage your location data"}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 gap-2">
                  <Filter className="h-4 w-4" />
                  <span>Filter</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Filter Options</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleFilterChange("Landmarks")} className="gap-2">
                  <div className="w-4 h-4 rounded-full bg-blue-500" />
                  Landmarks
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleFilterChange("Businesses")} className="gap-2">
                  <div className="w-4 h-4 rounded-full bg-green-500" />
                  Businesses
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleFilterChange("Points of Interest")} className="gap-2">
                  <div className="w-4 h-4 rounded-full bg-purple-500" />
                  Points of Interest
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleFilterChange("all")} className="gap-2">
                  <div className="w-4 h-4 rounded-full bg-gray-500" />
                  Show All
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              size="sm"
              className="h-9 gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={handleNewScan}
            >
              <Camera className="h-4 w-4" />
              <span>New Scan</span>
            </Button>
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="bg-background rounded-xl shadow-md border overflow-hidden">
          <div className="p-6">
            {activeTab === "recognition" && <CameraRecognition />}
            {activeTab === "locations" && <LocationsFeature filterCategory={filterCategory} />}
            {activeTab === "map" && <MapFeature filterCategory={filterCategory} />}
            {activeTab === "bookmarks" && (
              <div className="flex items-center justify-center h-64">
                <p className="text-muted-foreground">Bookmarks feature coming soon</p>
              </div>
            )}
            {activeTab === "search" && (
              <div className="flex items-center justify-center h-64">
                <p className="text-muted-foreground">Search feature coming soon</p>
              </div>
            )}
            {activeTab === "location-suggestions" && (
              <LocationSuggestions
                location={{ lat: 0, lng: 0, name: "Default Location" }}
                currentLocation={{ lat: 0, lng: 0 }}
              />
            )}
            {activeTab === "image-caption" && <ImageCaptionGenerator />}
            {activeTab === "ai-content-generator" && <AIContentGenerator />}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          <Card className="border shadow-sm rounded-xl overflow-hidden">
            <CardContent className="p-0">
              <div className="flex">
                <div className="w-3 bg-primary h-full"></div>
                <div className="p-4 flex items-center gap-4 flex-1">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <MapPin className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Locations</p>
                    <p className="text-2xl font-bold">124</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border shadow-sm rounded-xl overflow-hidden">
            <CardContent className="p-0">
              <div className="flex">
                <div className="w-3 bg-emerald-500 h-full"></div>
                <div className="p-4 flex items-center gap-4 flex-1">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
                    <Camera className="h-6 w-6 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Scans This Month</p>
                    <p className="text-2xl font-bold">37</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border shadow-sm rounded-xl overflow-hidden">
            <CardContent className="p-0">
              <div className="flex">
                <div className="w-3 bg-purple-500 h-full"></div>
                <div className="p-4 flex items-center gap-4 flex-1">
                  <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center">
                    <Heart className="h-6 w-6 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Bookmarks</p>
                    <p className="text-2xl font-bold">18</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border shadow-sm rounded-xl overflow-hidden">
            <CardContent className="p-0">
              <div className="flex">
                <div className="w-3 bg-amber-500 h-full"></div>
                <div className="p-4 flex items-center gap-4 flex-1">
                  <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center">
                    <BarChart3 className="h-6 w-6 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Accuracy Rate</p>
                    <p className="text-2xl font-bold">94%</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Help and Support */}
        <div className="mt-8 flex justify-center">
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <Button variant="link" size="sm" className="h-auto p-0 text-muted-foreground hover:text-foreground">
              <HelpCircle className="h-4 w-4 mr-1" />
              Help Center
            </Button>
            <Button variant="link" size="sm" className="h-auto p-0 text-muted-foreground hover:text-foreground">
              <MessageSquare className="h-4 w-4 mr-1" />
              Feedback
            </Button>
            <Button variant="link" size="sm" className="h-auto p-0 text-muted-foreground hover:text-foreground">
              <Info className="h-4 w-4 mr-1" />
              About
            </Button>
          </div>
        </div>
      </div>

      {/* Location Recognition Dialog */}
      <LocationRecognitionDialog open={showLocationRecognitionDialog} onOpenChange={setShowLocationRecognitionDialog} />
    </div>
  )
}

