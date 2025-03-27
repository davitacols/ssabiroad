"use client"

import { useState, useEffect, useRef } from "react"
import {
  Camera,
  MapPin,
  Search,
  Heart,
  User,
  X,
  Navigation,
  Upload,
  Settings,
  LogOut,
  AlertCircle,
  Loader2,
  Database,
  Trash2,
  Info,
  Sun,
  Moon,
  Image,
  Map,
  ChevronRight,
  Sparkles,
  MapPinned,
  History,
  Award,
  Share2,
  Copy,
  Facebook,
  Twitter,
  Mail,
  Check,
  ArrowLeft,
  UserPlus,
  LogIn,
  LogInIcon as SignIn,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { toast } from "@/components/ui/use-toast"
import { useIsMobile } from "@/hooks/use-mobile"

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
interface BookmarkType {
  id: string
  locationId: string
  name: string
  address: string
  category: string
  createdAt: string
}

// Share Location Dialog Component
const ShareLocationDialog = ({ open, onOpenChange, location }) => {
  const [copied, setCopied] = useState(false)
  const shareUrl = location ? `https://pic2nav.com/location/${location.id}` : ""

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast({
      title: "Link copied",
      description: "The location link has been copied to your clipboard.",
    })
  }

  const handleShare = (platform) => {
    let shareLink = ""
    const locationName = location?.name || "this location"
    const text = `Check out ${locationName} I found using Pic2Nav!`

    switch (platform) {
      case "facebook":
        shareLink = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(text)}`
        break
      case "twitter":
        shareLink = `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(text)}`
        break
      case "email":
        shareLink = `mailto:?subject=${encodeURIComponent(`Check out this location: ${locationName}`)}&body=${encodeURIComponent(`${text}\n\n${shareUrl}`)}`
        break
    }

    if (shareLink) {
      window.open(shareLink, "_blank")
    }

    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-full max-h-[90vh] overflow-y-auto p-6 rounded-2xl">
        <div className="flex flex-col gap-6">
          <div className="text-center">
            <h2 className="text-xl font-bold mb-2">Share {location?.name || "Location"}</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Share this location with friends or on social media
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <div className="grid flex-1 gap-2">
              <Label htmlFor="link" className="sr-only">
                Link
              </Label>
              <Input
                id="link"
                defaultValue={shareUrl}
                readOnly
                className="h-12 rounded-xl bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
              />
            </div>
            <Button
              size="icon"
              className="h-12 w-12 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              onClick={handleCopyLink}
            >
              {copied ? <Check className="h-5 w-5 text-green-500" /> : <Copy className="h-5 w-5" />}
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Button
              variant="outline"
              className="flex flex-col items-center py-4 rounded-xl h-auto"
              onClick={() => handleShare("facebook")}
            >
              <Facebook className="h-6 w-6 mb-2 text-blue-600" />
              <span className="text-xs">Facebook</span>
            </Button>
            <Button
              variant="outline"
              className="flex flex-col items-center py-4 rounded-xl h-auto"
              onClick={() => handleShare("twitter")}
            >
              <Twitter className="h-6 w-6 mb-2 text-sky-500" />
              <span className="text-xs">Twitter</span>
            </Button>
            <Button
              variant="outline"
              className="flex flex-col items-center py-4 rounded-xl h-auto"
              onClick={() => handleShare("email")}
            >
              <Mail className="h-6 w-6 mb-2 text-slate-600 dark:text-slate-400" />
              <span className="text-xs">Email</span>
            </Button>
          </div>

          <Button
            className="w-full h-12 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 border-0 text-white"
            onClick={() => onOpenChange(false)}
          >
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
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
  const [showShareDialog, setShowShareDialog] = useState(false)

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

  const handleShareLocation = () => {
    setShowShareDialog(true)
  }

  return (
    <div className="space-y-6">
      <div className="relative h-[55vh] bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-800 rounded-2xl overflow-hidden shadow-lg flex items-center justify-center">
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
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0">
            <motion.img
              initial={{ scale: 1.1 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5 }}
              src={previewUrl || "/placeholder.svg"}
              alt="Preview"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
          </motion.div>
        )}

        {isProcessing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-md z-10"
          >
            <div className="relative">
              <motion.div
                animate={{
                  rotate: 360,
                  boxShadow: [
                    "0 0 10px rgba(99,102,241,0.3)",
                    "0 0 20px rgba(99,102,241,0.6)",
                    "0 0 10px rgba(99,102,241,0.3)",
                  ],
                }}
                transition={{
                  rotate: { duration: 4, repeat: Number.POSITIVE_INFINITY, ease: "linear" },
                  boxShadow: { duration: 2, repeat: Number.POSITIVE_INFINITY, repeatType: "reverse" },
                }}
                className="w-20 h-20 rounded-full border-4 border-transparent border-t-indigo-500 border-b-purple-500"
              />
              <motion.div
                animate={{
                  rotate: -360,
                  boxShadow: [
                    "0 0 10px rgba(168,85,247,0.3)",
                    "0 0 20px rgba(168,85,247,0.6)",
                    "0 0 10px rgba(168,85,247,0.3)",
                  ],
                }}
                transition={{
                  rotate: { duration: 6, repeat: Number.POSITIVE_INFINITY, ease: "linear" },
                  boxShadow: { duration: 2, repeat: Number.POSITIVE_INFINITY, repeatType: "reverse", delay: 0.5 },
                }}
                className="absolute inset-2 rounded-full border-4 border-transparent border-t-purple-500 border-b-indigo-500"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles className="h-8 w-8 text-indigo-500" />
              </div>
            </div>

            <div className="text-lg font-medium mt-6 mb-2 bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
              Analyzing image...
            </div>

            <div className="w-64 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
              />
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, delay: 1 }}
              className="text-sm text-slate-500 dark:text-slate-400 mt-4"
            >
              Detecting landmarks and points of interest
            </motion.div>
          </motion.div>
        )}

        {recognitionResult && (
          <div className="absolute inset-0 flex flex-col p-4 overflow-auto">
            {recognitionResult.success ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-md p-6 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-xl"
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0">
                    <MapPin className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xl">{recognitionResult.name || "Unknown Location"}</h3>
                    {recognitionResult.address && (
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{recognitionResult.address}</p>
                    )}
                  </div>
                </div>

                {recognitionResult.confidence && (
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span>Recognition confidence</span>
                      <span className="font-medium">{Math.round(recognitionResult.confidence * 100)}%</span>
                    </div>
                    <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          recognitionResult.confidence > 0.8
                            ? "bg-green-500"
                            : recognitionResult.confidence > 0.6
                              ? "bg-yellow-500"
                              : "bg-red-500"
                        }`}
                        style={{ width: `${Math.round(recognitionResult.confidence * 100)}%` }}
                      />
                    </div>
                  </div>
                )}

                {recognitionResult.confidence && recognitionResult.confidence < 0.7 && (
                  <div className="mb-4 text-sm bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300 p-3 rounded-xl flex items-start">
                    <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Location may not be accurate. Please verify the details.</span>
                  </div>
                )}

                <div className="flex flex-wrap gap-2 mb-4">
                  {recognitionResult.type && (
                    <Badge variant="outline" className="bg-slate-50 dark:bg-slate-800 px-3 py-1 rounded-full">
                      {recognitionResult.type}
                    </Badge>
                  )}

                  {recognitionResult.category && recognitionResult.type !== recognitionResult.category && (
                    <Badge variant="secondary" className="px-3 py-1 rounded-full">
                      {recognitionResult.category}
                    </Badge>
                  )}

                  {recognitionResult.buildingType && (
                    <Badge variant="outline" className="bg-slate-50 dark:bg-slate-800 px-3 py-1 rounded-full">
                      {recognitionResult.buildingType}
                    </Badge>
                  )}
                </div>

                {recognitionResult.description && (
                  <div className="mb-4 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl text-sm">
                    {recognitionResult.description}
                  </div>
                )}

                {/* Display photos if available */}
                {recognitionResult.photos && recognitionResult.photos.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium mb-2">Photos</h4>
                    <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
                      {recognitionResult.photos.map((photo, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.1 }}
                          className="relative flex-shrink-0 h-24 w-32 rounded-xl overflow-hidden shadow-sm"
                        >
                          <img
                            src={photo || "/placeholder.svg"}
                            alt={`${recognitionResult.name} photo ${index + 1}`}
                            className="h-full w-full object-cover"
                          />
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Additional information */}
                {(recognitionResult.weatherConditions || recognitionResult.airQuality) && (
                  <div className="mb-4 grid grid-cols-2 gap-2">
                    {recognitionResult.weatherConditions && (
                      <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl">
                        <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Weather</div>
                        <div className="text-sm font-medium">{recognitionResult.weatherConditions}</div>
                      </div>
                    )}
                    {recognitionResult.airQuality && (
                      <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl">
                        <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Air Quality</div>
                        <div className="text-sm font-medium">{recognitionResult.airQuality}</div>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex gap-3 mt-5">
                  <Button variant="outline" size="lg" className="flex-1 rounded-xl h-12" onClick={handleShareLocation}>
                    <Share2 className="w-5 h-5 mr-2" />
                    Share
                  </Button>
                  {recognitionResult.location && (
                    <Button
                      variant="default"
                      size="lg"
                      className="flex-1 rounded-xl h-12 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 border-0"
                    >
                      <Navigation className="w-5 h-5 mr-2" />
                      Navigate
                    </Button>
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-md p-6 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-xl"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
                    <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xl">Recognition Failed</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                      We couldn't identify this location
                    </p>
                  </div>
                </div>

                <div className="mb-6 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl text-sm">
                  {recognitionResult.error || "Could not identify the location in this image."}
                </div>

                <Button variant="outline" size="lg" className="w-full rounded-xl h-12" onClick={handleReset}>
                  <Image className="w-5 h-5 mr-2" />
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
              initial={{ scale: 0.8, opacity: 0.5 }}
              animate={{
                scale: [0.9, 1, 0.9],
                opacity: [0.7, 1, 0.7],
              }}
              transition={{
                duration: 3,
                repeat: Number.POSITIVE_INFINITY,
                repeatType: "reverse",
              }}
              className="relative w-24 h-24 mb-6"
            >
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-500/20 to-purple-500/20 blur-xl"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Camera className="w-16 h-16 text-indigo-500/80 dark:text-indigo-400/80" />
              </div>
            </motion.div>

            <h2 className="text-2xl font-bold mb-3 bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
              Identify Any Location
            </h2>

            <p className="text-slate-600 dark:text-slate-300 mb-6 max-w-xs">
              Upload a photo or use your camera to instantly recognize places around you
            </p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col gap-2 w-full max-w-xs"
            >
              <Button
                size="lg"
                onClick={handleCameraCapture}
                className="w-full h-12 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 border-0"
              >
                <Camera className="mr-2 h-5 w-5" />
                Open Camera
              </Button>

              <Button
                size="lg"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-12 rounded-xl"
              >
                <Upload className="mr-2 h-5 w-5" />
                Upload Photo
              </Button>
            </motion.div>
          </motion.div>
        )}

        {error && !isProcessing && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute bottom-4 left-4 right-4 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 p-4 rounded-xl flex items-start"
          >
            <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}
      </div>

      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />

      {(previewUrl || recognitionResult || cameraActive) && (
        <Button variant="outline" onClick={handleReset} className="w-full rounded-xl h-12">
          <X className="mr-2 h-5 w-5" />
          Start Over
        </Button>
      )}

      {/* Recent Locations */}
      {recentLocations.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-bold mb-4 flex items-center">
            <History className="mr-2 h-5 w-5 text-indigo-500" />
            Recent Locations
          </h3>
          <div className="space-y-3">
            {recentLocations.slice(0, 3).map((location, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition-all shadow-sm hover:shadow"
                onClick={() => handleRecentLocationSelect(location)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
                    <MapPin className="h-5 w-5 text-indigo-500" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-base truncate">{location.name}</h4>
                    {location.address && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate">{location.address}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {location.confidence && (
                      <Badge variant="outline" className="text-xs">
                        {Math.round(location.confidence * 100)}%
                      </Badge>
                    )}
                    <ChevronRight className="h-4 w-4 text-slate-400" />
                  </div>
                </div>

                <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100 dark:border-slate-700">
                  <Badge variant="secondary" className="text-xs">
                    {location.category || location.type || "Unknown"}
                  </Badge>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {location.date || new Date().toLocaleDateString()}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="mt-2 text-indigo-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 w-full"
          >
            View All History
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      )}

      <div className="flex items-center space-x-2 mt-6 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl">
        <Switch id="save-to-db" checked={saveToDb} onCheckedChange={setSaveToDb} />
        <Label htmlFor="save-to-db" className="font-medium">
          Save to database
        </Label>
        <div className="text-xs text-slate-500 dark:text-slate-400 ml-auto">
          Saves recognized locations for future reference
        </div>
      </div>

      {/* Share Location Dialog */}
      <ShareLocationDialog open={showShareDialog} onOpenChange={setShowShareDialog} location={recognitionResult} />
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
  const [showShareDialog, setShowShareDialog] = useState(false)

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

  // Handle share location
  const handleShareLocation = () => {
    setShowShareDialog(true)
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
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search saved locations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 rounded-xl h-12 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
          />
        </div>

        <Button variant="outline" onClick={fetchLocations} className="w-full rounded-xl h-12">
          <Loader2 className={`mr-2 h-5 w-5 ${isLoading ? "animate-spin" : "hidden"}`} />
          Refresh Locations
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <Loader2 className="h-10 w-10 animate-spin text-indigo-500 mx-auto mb-4" />
            <p className="text-slate-500 dark:text-slate-400">Loading your saved locations...</p>
          </div>
        </div>
      ) : error ? (
        <Card className="border-slate-200 dark:border-slate-700 shadow-sm rounded-xl overflow-hidden">
          <CardContent className="py-10">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
                <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-xl font-bold mb-2">Error Loading Locations</h3>
              <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-xs">{error}</p>
              <Button onClick={fetchLocations} className="rounded-xl">
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : filteredLocations.length === 0 ? (
        <Card className="border-slate-200 dark:border-slate-700 shadow-sm rounded-xl overflow-hidden">
          <CardContent className="py-10">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                <Database className="h-8 w-8 text-slate-400" />
              </div>
              <h3 className="text-xl font-bold mb-2">No Locations Found</h3>
              <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-xs">
                {searchQuery
                  ? "No locations match your search criteria. Try adjusting your search."
                  : "You haven't saved any locations yet. Use the camera recognition feature to identify and save locations."}
              </p>
              <Button variant="outline" className="rounded-xl" onClick={() => setSearchQuery("")}>
                {searchQuery ? "Clear Search" : "Explore Camera Feature"}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold">Your Places ({filteredLocations.length})</h3>
            <Button
              variant="ghost"
              size="sm"
              className="text-indigo-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
            >
              <MapPinned className="h-4 w-4 mr-1" />
              Categories
            </Button>
          </div>

          <AnimatePresence>
            {filteredLocations.map((location, index) => (
              <motion.div
                key={location.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="overflow-hidden border-slate-200 dark:border-slate-700 shadow-sm hover:shadow transition-all rounded-xl">
                  <CardContent className="p-0">
                    {location.photos && location.photos.length > 0 ? (
                      <div className="h-32 relative">
                        <img
                          src={location.photos[0] || "/placeholder.svg"}
                          alt={location.name || "Location"}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                        <div className="absolute bottom-0 left-0 right-0 p-3">
                          <Badge className="bg-white/90 text-slate-800 hover:bg-white/80 dark:bg-slate-800/90 dark:text-slate-200 dark:hover:bg-slate-800/80">
                            {location.category || "Unknown"}
                          </Badge>
                        </div>
                      </div>
                    ) : (
                      <div className="h-32 bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-900/20 dark:to-purple-900/20 flex items-center justify-center">
                        <MapPin className="h-10 w-10 text-indigo-400" />
                      </div>
                    )}

                    <div className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-bold text-lg">{location.name || "Unknown"}</h3>
                          <p className="text-sm text-slate-500 dark:text-slate-400 truncate max-w-[200px]">
                            {location.address || "No address"}
                          </p>

                          <div className="flex items-center gap-2 mt-2">
                            {location.confidence && (
                              <div className="text-xs px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-full">
                                {Math.round(location.confidence * 100)}% match
                              </div>
                            )}
                            <div className="text-xs text-slate-500 dark:text-slate-400">
                              {new Date(location.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleToggleBookmark(location)}
                            title={location.isBookmarked ? "Remove bookmark" : "Add bookmark"}
                            className="h-9 w-9 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
                          >
                            {location.isBookmarked ? (
                              <Heart className="h-5 w-5 fill-red-500 text-red-500" />
                            ) : (
                              <Heart className="h-5 w-5" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleViewDetails(location)}
                            title="View details"
                            className="h-9 w-9 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
                          >
                            <Info className="h-5 w-5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteLocation(location.id)}
                            title="Delete location"
                            className="h-9 w-9 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
                          >
                            <Trash2 className="h-5 w-5" />
                          </Button>
                        </div>
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
        <DialogContent className="max-w-full max-h-[90vh] overflow-y-auto p-0 rounded-2xl">
          {selectedLocation && (
            <>
              <div className="relative h-48">
                {selectedLocation.photos && selectedLocation.photos.length > 0 ? (
                  <motion.img
                    initial={{ scale: 1.1 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.5 }}
                    src={selectedLocation.photos[0] || "/placeholder.svg"}
                    alt={selectedLocation.name || "Location"}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-r from-indigo-500/20 to-purple-500/20 flex items-center justify-center">
                    <MapPin className="h-16 w-16 text-indigo-500/50" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-4 right-4 h-10 w-10 rounded-full bg-black/30 hover:bg-black/40 text-white"
                  onClick={() => setShowLocationDetails(false)}
                >
                  <X className="h-5 w-5" />
                </Button>

                <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                  <h2 className="text-2xl font-bold">{selectedLocation.name || "Unknown Location"}</h2>
                  <p className="text-white/80 text-sm mt-1">{selectedLocation.address || "No address available"}</p>
                </div>
              </div>

              <div className="p-6 space-y-6">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="px-3 py-1 rounded-full">
                    {selectedLocation.category || "Unknown"}
                  </Badge>
                  {selectedLocation.buildingType && (
                    <Badge variant="outline" className="px-3 py-1 rounded-full">
                      {selectedLocation.buildingType}
                    </Badge>
                  )}
                  {selectedLocation.materialType && (
                    <Badge variant="outline" className="px-3 py-1 rounded-full">
                      {selectedLocation.materialType}
                    </Badge>
                  )}
                </div>

                {selectedLocation.description && (
                  <div>
                    <h4 className="text-sm font-bold mb-2 text-slate-500 dark:text-slate-400">ABOUT THIS PLACE</h4>
                    <p className="text-sm">{selectedLocation.description}</p>
                  </div>
                )}

                {selectedLocation.location && (
                  <div>
                    <h4 className="text-sm font-bold mb-2 text-slate-500 dark:text-slate-400">MAP</h4>
                    <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 h-48 shadow-sm">
                      <iframe
                        width="100%"
                        height="100%"
                        frameBorder="0"
                        src={`https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&q=${selectedLocation.location.latitude},${selectedLocation.location.longitude}&zoom=15`}
                        allowFullScreen
                      ></iframe>
                    </div>

                    <div className="mt-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-500 dark:text-slate-400">Coordinates</span>
                        <span className="font-medium">
                          {selectedLocation.location.latitude.toFixed(6)},{" "}
                          {selectedLocation.location.longitude.toFixed(6)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Additional details */}
                {(selectedLocation.weatherConditions ||
                  selectedLocation.airQuality ||
                  selectedLocation.urbanDensity) && (
                  <div>
                    <h4 className="text-sm font-bold mb-2 text-slate-500 dark:text-slate-400">ENVIRONMENT</h4>
                    <div className="grid grid-cols-2 gap-3">
                      {selectedLocation.weatherConditions && (
                        <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl">
                          <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Weather</div>
                          <div className="text-sm font-medium">{selectedLocation.weatherConditions}</div>
                        </div>
                      )}
                      {selectedLocation.airQuality && (
                        <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl">
                          <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Air Quality</div>
                          <div className="text-sm font-medium">{selectedLocation.airQuality}</div>
                        </div>
                      )}
                      {selectedLocation.urbanDensity && (
                        <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl">
                          <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Urban Density</div>
                          <div className="text-sm font-medium">{selectedLocation.urbanDensity}</div>
                        </div>
                      )}
                      {selectedLocation.vegetationDensity && (
                        <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl">
                          <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Vegetation</div>
                          <div className="text-sm font-medium">{selectedLocation.vegetationDensity}</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter className="p-4 border-t border-slate-200 dark:border-slate-700">
                <Button variant="outline" onClick={handleShareLocation} className="rounded-xl">
                  <Share2 className="mr-2 h-5 w-5" />
                  Share
                </Button>

                {selectedLocation.mapUrl && (
                  <Button
                    asChild
                    className="rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 border-0"
                  >
                    <a href={selectedLocation.mapUrl} target="_blank" rel="noopener noreferrer">
                      <Navigation className="mr-2 h-5 w-5" />
                      Navigate
                    </a>
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Share Location Dialog */}
      <ShareLocationDialog open={showShareDialog} onOpenChange={setShowShareDialog} location={selectedLocation} />
    </div>
  )
}

const MobileMapFeature = () => {
  return (
    <div>
      <h2>Mobile Map Feature</h2>
      {/* Add your map component here */}
    </div>
  )
}

const MobileSearchFeature = () => {
  return (
    <div>
      <h2>Mobile Search Feature</h2>
      {/* Add your search component here */}
    </div>
  )
}

const MobileBookmarksFeature = () => {
  return (
    <div>
      <h2>Mobile Bookmarks Feature</h2>
      {/* Add your bookmarks component here */}
    </div>
  )
}

export default function MobileDashboard() {
  const [activeTab, setActiveTab] = useState("recognition")
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [userData, setUserData] = useState({ username: "Guest", plan: "Free", savedPlaces: 0, bookmarks: 0 })
  const [isLoading, setIsLoading] = useState(true)
  const [authError, setAuthError] = useState(false)
  const router = useRouter()

  // Fetch user data from API with proper auth handling
  useEffect(() => {
    const fetchUserData = async () => {
      setIsLoading(true)
      try {
        // Get auth token from local storage - using consistent key name
        const token = localStorage.getItem("authToken")

        const response = await fetch("/api/user", {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })

        if (!response.ok) {
          if (response.status === 401) {
            setAuthError(true)
            console.warn("Authentication error when fetching user data")
            // Use fallback data instead of redirecting immediately
            setUserData({ username: "Guest", plan: "Free", savedPlaces: 0, bookmarks: 0 })
          } else {
            throw new Error(`API error: ${response.status}`)
          }
        } else {
          const data = await response.json()
          setUserData({
            username: data.username || "Guest",
            plan: data.plan || "Free",
            savedPlaces: data.savedPlaces || 0,
            bookmarks: data.bookmarks || 0,
          })
          setAuthError(false)
        }
      } catch (error) {
        console.error("Error fetching user data:", error)
        // Use fallback data on error
        setUserData({ username: "Guest", plan: "Free", savedPlaces: 0, bookmarks: 0 })
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserData()

    // Check session status separately
    const checkSession = async () => {
      try {
        const sessionRes = await fetch("/api/auth/session")
        if (!sessionRes.ok && sessionRes.status === 401) {
          // Optional: Redirect to login if session endpoint explicitly says user isn't authenticated
          // Commenting out to prevent unwanted redirects
          // router.push("/login");
        }
      } catch (error) {
        console.error("Session check error:", error)
      }
    }

    checkSession()
  }, [])

  // Handle theme preferences
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

  // Toggle dark mode
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
      // Using the consistent authToken key
      const token = localStorage.getItem("authToken")
      await fetch("/api/logout", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      // Clear local auth data with the correct key
      localStorage.removeItem("authToken")
      router.push("/signin")
    } catch (error) {
      console.error("Error during logout:", error)
      // Still clear local auth data and redirect even if API call fails
      localStorage.removeItem("authToken")
      router.push("/signin")
    }
  }

  // Handle login redirect
  const handleLogin = () => {
    router.push("/signin")
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* App Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-b border-slate-200 dark:border-slate-800">
        <div className="container flex items-center justify-between h-16 px-4">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <Navigation className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-xl bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
              Pic2Nav
            </span>
          </div>

          {/* User Actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleDarkMode}
              className="rounded-full h-10 w-10 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>

            <Sheet open={showUserMenu} onOpenChange={setShowUserMenu}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full h-10 w-10 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <Avatar className="h-10 w-10 border-2 border-slate-200 dark:border-slate-700 transition-all hover:border-indigo-500 dark:hover:border-indigo-400">
                    <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-medium">
                      {isLoading ? "..." : userData.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[85vw] sm:w-[380px] p-0 rounded-l-2xl border-l-0">
                <div className="h-full flex flex-col">
                  {/* User Profile Header */}
                  <div className="p-6 bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-tl-2xl">
                    <div className="flex items-center gap-4 mb-6">
                      <Avatar className="h-16 w-16 border-4 border-white/20">
                        <AvatarFallback className="bg-white/20 text-white font-bold text-xl">
                          {userData.username.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        {authError ? (
                          <>
                            <h3 className="text-2xl font-bold">Hello, Guest!</h3>
                            <p className="text-sm text-white/80 mt-1">Please sign in to continue</p>
                          </>
                        ) : (
                          <>
                            <h3 className="text-2xl font-bold">Hi, {userData.username}!</h3>
                            <Badge className="bg-white/20 hover:bg-white/30 border-0">{userData.plan} Plan</Badge>
                          </>
                        )}
                      </div>
                    </div>

                    {!authError && (
                      <div className="flex gap-2">
                        <div className="bg-white/10 rounded-lg p-3 flex-1 backdrop-blur-sm">
                          <div className="text-xs text-white/70 mb-1">Saved Places</div>
                          <div className="text-xl font-bold">{userData.savedPlaces}</div>
                        </div>
                        <div className="bg-white/10 rounded-lg p-3 flex-1 backdrop-blur-sm">
                          <div className="text-xs text-white/70 mb-1">Bookmarks</div>
                          <div className="text-xl font-bold">{userData.bookmarks}</div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* User Menu Options */}
                  <div className="p-6 flex-1">
                    {authError ? (
                      <div className="space-y-4">
                        <Button
                          className="w-full h-12 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600"
                          onClick={handleLogin}
                        >
                          <LogIn className="mr-2 h-5 w-5" />
                          Sign In
                        </Button>
                        <Button
                          variant="outline"
                          className="w-full h-12 rounded-lg"
                          onClick={() => router.push("/register")}
                        >
                          <UserPlus className="mr-2 h-5 w-5" />
                          Create Account
                        </Button>
                      </div>
                    ) : (
                      <>
                        <div className="space-y-1 mb-6">
                          <h4 className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">ACCOUNT</h4>
                          <Button
                            variant="ghost"
                            className="w-full justify-start h-12 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            onClick={() => router.push("/profile")}
                          >
                            <User className="mr-3 h-5 w-5" />
                            Profile
                          </Button>
                          <Button
                            variant="ghost"
                            className="w-full justify-start h-12 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            onClick={() => router.push("/settings")}
                          >
                            <Settings className="mr-3 h-5 w-5" />
                            Settings
                          </Button>
                          <Button
                            variant="ghost"
                            className="w-full justify-start h-12 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          >
                            <Award className="mr-3 h-5 w-5" />
                            Upgrade to Pro
                          </Button>
                        </div>

                        <div className="space-y-1">
                          <h4 className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">PREFERENCES</h4>
                          <div className="flex items-center justify-between px-3 py-3">
                            <div className="flex items-center">
                              {isDarkMode ? <Moon className="mr-3 h-5 w-5" /> : <Sun className="mr-3 h-5 w-5" />}
                              <span>Dark Mode</span>
                            </div>
                            <Switch checked={isDarkMode} onCheckedChange={toggleDarkMode} />
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Logout/Back Button */}
                  <div className="p-6 border-t border-slate-200 dark:border-slate-800">
                    {authError ? (
                      <Button
                        variant="ghost"
                        className="w-full justify-start h-12 rounded-lg transition-colors"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <ArrowLeft className="mr-3 h-5 w-5" />
                        Back to App
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        className="w-full justify-start h-12 rounded-lg text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        onClick={handleLogout}
                      >
                        <LogOut className="mr-3 h-5 w-5" />
                        Log out
                      </Button>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Welcome Banner with Authentication Awareness */}
      <div className="px-4 py-6">
        {isLoading ? (
          <div className="bg-slate-200 dark:bg-slate-800 animate-pulse rounded-2xl p-6 h-36" />
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white shadow-xl"
          >
            {authError ? (
              <>
                <h1 className="text-2xl font-bold mb-2">Welcome to Pic2Nav!</h1>
                <p className="text-white/80 mb-4">Discover and navigate to amazing places with just a photo.</p>
                <div className="flex gap-2">
                  <Button size="sm" className="bg-white/20 hover:bg-white/30 text-white border-0" onClick={handleLogin}>
                    <SignIn className="h-4 w-4 mr-1" />
                    Sign In
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="bg-transparent border-white/30 text-white hover:bg-white/10"
                    onClick={() => router.push("/register")}
                  >
                    Try for Free
                  </Button>
                </div>
              </>
            ) : (
              <>
                <h1 className="text-2xl font-bold mb-2">Welcome back, {userData.username}!</h1>
                <p className="text-white/80 mb-4">Ready to discover amazing places today?</p>
                <div className="flex items-center gap-2">
                  <Badge className="bg-white/20 hover:bg-white/30 text-white border-0">
                    <MapPin className="h-3 w-3 mr-1" />
                    {userData.savedPlaces} Places
                  </Badge>
                  <Badge className="bg-white/20 hover:bg-white/30 text-white border-0">
                    <Heart className="h-3 w-3 mr-1" />
                    {userData.bookmarks} Bookmarks
                  </Badge>
                </div>
              </>
            )}
          </motion.div>
        )}
      </div>

      {/* Main Content */}
      <main className="flex-1 px-4 pb-20">
        {activeTab === "recognition" && <MobileCameraRecognition />}
        {activeTab === "locations" && <MobileLocationsFeature />}
        {activeTab === "map" && <MobileMapFeature />}
        {activeTab === "search" && <MobileSearchFeature />}
        {activeTab === "bookmarks" && <MobileBookmarksFeature />}
      </main>

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 z-50 shadow-lg">
        <div className="grid grid-cols-5 h-16">
          {[
            { id: "recognition", icon: Camera, label: "Camera" },
            { id: "locations", icon: MapPin, label: "Places" },
            { id: "map", icon: Map, label: "Map" },
            { id: "search", icon: Search, label: "Search" },
            { id: "bookmarks", icon: Heart, label: "Saved" },
          ].map((item) => (
            <motion.button
              key={item.id}
              whileTap={{ scale: 0.9 }}
              className={`flex flex-col items-center justify-center gap-1 transition-colors ${
                activeTab === item.id ? "text-indigo-600 dark:text-indigo-400" : "text-slate-500 dark:text-slate-400"
              }`}
              onClick={() => setActiveTab(item.id)}
            >
              <div
                className={`p-1.5 rounded-full transition-colors ${
                  activeTab === item.id ? "bg-indigo-100 dark:bg-indigo-900/30" : ""
                }`}
              >
                <item.icon className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-medium">{item.label}</span>
            </motion.button>
          ))}
        </div>
      </nav>
    </div>
  )
}

