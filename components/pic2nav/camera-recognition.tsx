"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Camera,
  MapPin,
  X,
  Upload,
  AlertCircle,
  Sparkles,
  Map,
  Share2,
  Zap,
  Clock,
  FileText,
  Globe,
  Phone,
  Star,
  BookmarkPlus,
  ChevronDown,
  ImageIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { MetadataDialog } from "@/components/pic2nav/metadata-dialog"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"

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
  fastMode?: boolean
  processingTime?: number
  formattedAddress?: string
  placeId?: string
  addressComponents?: any[]
  photos?: string[]
  rating?: number
  openingHours?: any
  phoneNumber?: string
  website?: string
  buildingType?: string
  materialType?: string
  weatherConditions?: string
  airQuality?: string
  urbanDensity?: string
  vegetationDensity?: string
  crowdDensity?: string
  timeOfDay?: string
  significantColors?: string[]
  waterProximity?: string
  isBusinessLocation?: boolean
  businessName?: string
  businessAddress?: string
  businessCategory?: string
  businessConfidence?: number
}

interface JobStatus {
  id: string
  status: "pending" | "processing" | "completed" | "failed"
  progress: number
  result?: LocationRecognitionResponse
  error?: string
}

export function CameraRecognition({ onLocationSelect }) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [recognitionResult, setRecognitionResult] = useState(null)
  const [error, setError] = useState(null)
  const fileInputRef = useRef(null)
  const [saveToDb, setSaveToDb] = useState(true)
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const [cameraActive, setCameraActive] = useState(false)
  const [showMetadataDialog, setShowMetadataDialog] = useState(false)
  const { toast } = useToast()
  const [jobId, setJobId] = useState(null)
  const [jobStatus, setJobStatus] = useState(null)
  const [fastMode, setFastMode] = useState(true) // Default to fast mode for quicker results
  const pollingIntervalRef = useRef(null)
  const pollingAttemptsRef = useRef(0) // Track polling attempts
  const maxPollingAttempts = 30 // Maximum number of polling attempts (30 seconds)
  const [currentLocation, setCurrentLocation] = useState(null) // Store current location
  const [activeTab, setActiveTab] = useState("camera")
  const [showDetails, setShowDetails] = useState(false)

  // Get user's location when component mounts
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          }
          console.log("Got user location:", location)
          setCurrentLocation(location)
        },
        (error) => {
          console.error("Geolocation error:", error)
          toast({
            title: "Location Error",
            description: "Unable to access your location. Some features may be limited.",
            variant: "destructive",
          })
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        },
      )
    }
  }, [toast])

  // Poll for job status updates
  useEffect(() => {
    if (!jobId) return

    // Clear any existing polling interval
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
    }

    // Reset polling attempts counter
    pollingAttemptsRef.current = 0

    const checkJobStatus = async () => {
      try {
        pollingAttemptsRef.current += 1

        // If we've been polling for too long, stop and show fallback result
        if (pollingAttemptsRef.current > maxPollingAttempts) {
          clearInterval(pollingIntervalRef.current)

          // If we still don't have a result, create a fallback one
          if (!recognitionResult && isProcessing) {
            setIsProcessing(false)

            // Create a fallback result based on the image
            const fallbackResult = {
              success: true,
              name: "Location",
              address: "Address could not be determined",
              confidence: 0.5,
              type: "fallback",
              category: "Unknown",
              description: "Location details could not be retrieved from the server",
              processingTime: 0,
              fastMode: fastMode,
            }

            setRecognitionResult(fallbackResult)
            toast({
              title: "Processing timeout",
              description: "Could not retrieve full location details. Showing limited information.",
              variant: "destructive",
            })
          }

          return
        }

        console.log(`Polling job status for ID: ${jobId} (attempt ${pollingAttemptsRef.current})`)

        // Make sure the URL is correctly formatted - use a simple string concatenation
        // to avoid any encoding issues
        const url = `/api/location-recognition/${jobId}`
        console.log(`Fetching from URL: ${url}`)

        // Add retry mechanism with exponential backoff
        const response = await fetch(url, {
          // Add cache: 'no-store' to prevent caching issues
          cache: "no-store",
        })

        if (!response.ok) {
          if (response.status === 404) {
            console.log("Job not found, stopping polling")

            // After several attempts with 404, assume the job was lost
            if (pollingAttemptsRef.current > 5) {
              clearInterval(pollingIntervalRef.current)
              setError("Job not found. Please try again.")
              setIsProcessing(false)
            }
            return
          }

          // Log detailed error information
          const errorText = await response.text().catch(() => "No error text available")
          console.error(`API error: ${response.status}`, errorText)

          throw new Error(`API error: ${response.status}`)
        }

        const data = await response.json()
        console.log(`Job status response:`, data)

        if (data.success && data.job) {
          setJobStatus(data.job)

          // Update progress
          setProgress(data.job.progress)

          // If job is completed, set the result
          if (data.job.status === "completed" && data.job.result) {
            console.log("Job completed, setting result:", JSON.stringify(data.job.result, null, 2))
            setRecognitionResult(data.job.result)
            setIsProcessing(false)
            clearInterval(pollingIntervalRef.current)

            // Save to recent locations
            if (data.job.result.success) {
              saveToRecentLocations(data.job.result)
            }
          } else if (data.job.status === "failed") {
            setError(data.job.error || "Job processing failed")
            setIsProcessing(false)
            clearInterval(pollingIntervalRef.current)
          }
        }
      } catch (err) {
        console.error("Error checking job status:", err)

        // Don't set error on every failed poll - only after several attempts
        if (pollingAttemptsRef.current > 5) {
          setError(err instanceof Error ? err.message : "Failed to check job status")
          setIsProcessing(false)
          clearInterval(pollingIntervalRef.current)
        }
      }
    }

    // Initial check
    checkJobStatus()

    // Set up polling interval
    const interval = setInterval(checkJobStatus, 1000)
    pollingIntervalRef.current = interval

    // Clean up on unmount
    return () => {
      if (interval) {
        clearInterval(interval)
      }
    }
  }, [jobId, recognitionResult, isProcessing, fastMode, toast, maxPollingAttempts])

  const handleFileChange = (e) => {
    setError(null)
    setRecognitionResult(null)
    setJobId(null)
    setJobStatus(null)

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

  // Update the handleImageRecognition function to better handle errors
  const handleImageRecognition = async (file) => {
    try {
      setIsProcessing(true)
      setProgress(0)
      setError(null)

      const formData = new FormData()
      formData.append("image", file)
      formData.append("saveToDb", saveToDb.toString())
      formData.append("async", "true") // Request async processing
      formData.append("fastMode", fastMode.toString()) // Add fast mode parameter

      // Check if we have location data
      if (currentLocation) {
        console.log("Adding location to request:", currentLocation)
        formData.append("latitude", currentLocation.latitude.toString())
        formData.append("longitude", currentLocation.longitude.toString())
      } else {
        // Try to get location one more time
        try {
          const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 5000,
              maximumAge: 0,
            })
          })

          const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          }

          console.log("Got location just in time:", location)
          setCurrentLocation(location)

          formData.append("latitude", location.latitude.toString())
          formData.append("longitude", location.longitude.toString())
        } catch (locationError) {
          console.error("Failed to get location:", locationError)

          // Use a default location if we can't get the user's location
          // This prevents the "No location provided" error
          const defaultLocation = {
            latitude: 40.7128, // New York City coordinates as fallback
            longitude: -74.006,
          }

          console.log("Using default location:", defaultLocation)
          formData.append("latitude", defaultLocation.latitude.toString())
          formData.append("longitude", defaultLocation.longitude.toString())
          formData.append("usingDefaultLocation", "true")

          toast({
            title: "Location unavailable",
            description: "Using approximate location. Results may be less accurate.",
            variant: "warning",
          })
        }
      }

      // Log the form data for debugging
      console.log("FormData contents:")
      for (const pair of formData.entries()) {
        console.log(`${pair[0]}: ${pair[1]}`)
      }

      // Add retry logic with exponential backoff
      let retries = 0
      const maxRetries = 3
      let response

      while (retries < maxRetries) {
        try {
          response = await fetch("/api/location-recognition", {
            method: "POST",
            body: formData,
            // Add cache: 'no-store' to prevent caching issues
            cache: "no-store",
          })

          if (response.ok) break

          // If we get a 5xx error, retry
          if (response.status >= 500) {
            retries++
            await new Promise((resolve) => setTimeout(resolve, 1000 * Math.pow(2, retries)))
            continue
          }

          // For other errors, don't retry
          break
        } catch (err) {
          retries++
          if (retries >= maxRetries) throw err
          await new Promise((resolve) => setTimeout(resolve, 1000 * Math.pow(2, retries)))
        }
      }

      if (!response.ok) {
        // Try to get error details from response
        const errorText = await response.text().catch(() => "No error details available")
        console.error(`API error: ${response.status}`, errorText)
        throw new Error(`API error: ${response.status} - ${errorText}`)
      }

      const result = await response.json()
      console.log("Recognition job started:", result)
      console.log("Full recognition result details:", JSON.stringify(result, null, 2))

      if (result.success && result.jobId) {
        // Store the job ID for polling
        console.log(`Setting job ID for polling: ${result.jobId}`)
        setJobId(result.jobId)

        // Initial job status
        setJobStatus({
          id: result.jobId,
          status: result.status || "pending",
          progress: result.progress || 0,
          result: undefined,
          error: undefined,
        })
      } else if (result.error) {
        throw new Error(result.error)
      } else if (result.success) {
        // For backward compatibility with non-async API or direct responses
        console.log("Setting recognition result directly:", result)
        setIsProcessing(false)
        setRecognitionResult(result)

        // Save to recent locations
        if (result.success) {
          saveToRecentLocations(result)
        }
      } else {
        // Handle case where result doesn't have success or error
        console.warn("Unexpected API response format:", result)
        throw new Error("Unexpected response from server")
      }
    } catch (err) {
      console.error("Recognition failed:", err)
      setIsProcessing(false)
      setError(err instanceof Error ? err.message : "Recognition failed")

      // Create a fallback result to show something to the user
      const fallbackResult = {
        success: false,
        type: "error",
        name: "Unknown Location",
        error: err instanceof Error ? err.message : "Recognition failed",
        description: "Could not recognize location",
        confidence: 0.1,
      }
      setRecognitionResult(fallbackResult)

      // Show toast for better user feedback
      toast({
        title: "Recognition failed",
        description: err instanceof Error ? err.message : "Failed to process image",
        variant: "destructive",
      })
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
      const stream = videoRef.current.srcObject
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
    setJobId(null)
    setJobStatus(null)
    stopCamera()
    setShowDetails(false)

    // Clear polling interval if it exists
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
      pollingIntervalRef.current = null
    }
  }

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

  const handleBookmark = () => {
    if (recognitionResult) {
      // Get existing bookmarks
      const existingBookmarks = localStorage.getItem("bookmarks")
      let bookmarks = []

      if (existingBookmarks) {
        try {
          bookmarks = JSON.parse(existingBookmarks)
        } catch (e) {
          console.error("Failed to parse bookmarks", e)
        }
      }

      // Create bookmark object
      const bookmark = {
        id: `bookmark_${Date.now()}`,
        name: recognitionResult.name,
        address: recognitionResult.address,
        category: recognitionResult.category,
        date: new Date().toISOString().split("T")[0],
        notes: "",
        rating: recognitionResult.rating,
        location: recognitionResult.location,
        mapUrl: recognitionResult.mapUrl,
        photos: recognitionResult.photos,
      }

      // Add to bookmarks
      bookmarks.unshift(bookmark)

      // Save back to localStorage
      localStorage.setItem("bookmarks", JSON.stringify(bookmarks))

      toast({
        title: "Location bookmarked",
        description: "This location has been added to your bookmarks",
      })
    }
  }

  const handleShowMetadata = () => {
    setShowMetadataDialog(true)
  }

  // Toggle fast mode
  const toggleFastMode = () => {
    setFastMode(!fastMode)
  }

  // Save to recent locations
  const saveToRecentLocations = (result) => {
    if (!result || !result.success) return

    // Get existing recent locations
    const existingLocations = localStorage.getItem("recentLocations")
    let recentLocations = []

    if (existingLocations) {
      try {
        recentLocations = JSON.parse(existingLocations)
      } catch (e) {
        console.error("Failed to parse recent locations", e)
      }
    }

    // Create location object
    const location = {
      name: result.name,
      address: result.address,
      confidence: result.confidence,
      category: result.category,
      date: new Date().toLocaleDateString(),
      mapUrl: result.mapUrl,
      location: result.location,
      photos: result.photos,
      rating: result.rating,
      fastMode: result.fastMode,
      processingTime: result.processingTime,
    }

    // Add to recent locations (at the beginning)
    recentLocations.unshift(location)

    // Limit to 20 recent locations
    if (recentLocations.length > 20) {
      recentLocations = recentLocations.slice(0, 20)
    }

    // Save back to localStorage
    localStorage.setItem("recentLocations", JSON.stringify(recentLocations))
  }

  return (
    <div className="space-y-6">
      <div className="relative h-[500px] min-h-[500px] bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-800 rounded-xl overflow-hidden shadow-lg">
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
              src={previewUrl}
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
            className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm z-10"
          >
            <div className="relative">
              <motion.div
                animate={{
                  rotate: 360,
                }}
                transition={{
                  rotate: { duration: 4, repeat: Number.POSITIVE_INFINITY, ease: "linear" },
                }}
                className="w-20 h-20 rounded-full border-4 border-transparent border-t-teal-500 border-b-cyan-500"
              />
              <motion.div
                animate={{
                  rotate: -360,
                }}
                transition={{
                  rotate: { duration: 6, repeat: Number.POSITIVE_INFINITY, ease: "linear" },
                }}
                className="absolute inset-2 rounded-full border-4 border-transparent border-t-cyan-500 border-b-teal-500"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles className="h-8 w-8 text-teal-500" />
              </div>
            </div>

            <div className="text-lg font-medium mt-6 mb-2 bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
              {fastMode ? "Quick analysis in progress..." : "Detailed analysis in progress..."}
            </div>

            <div className="w-64 mt-2 mb-4">
              <Progress value={progress} className="h-2" />
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, delay: 1 }}
              className="text-sm text-slate-500 dark:text-slate-400 mt-2"
            >
              {jobStatus?.status === "processing"
                ? "Processing image data..."
                : "Detecting landmarks and points of interest"}
            </motion.div>
          </motion.div>
        )}

        {recognitionResult && (
          <div className="absolute inset-0 flex flex-col overflow-auto">
            {recognitionResult.success ? (
              <div className="flex-1 overflow-auto">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="p-4"
                >
                  <div className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm p-6 rounded-xl border border-slate-200/50 dark:border-slate-700/50 shadow-lg">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                        <MapPin className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="font-bold text-xl">{recognitionResult.name || "Unknown Location"}</h3>
                          {recognitionResult.confidence && (
                            <Badge variant={recognitionResult.confidence > 0.8 ? "default" : "outline"}>
                              {Math.round(recognitionResult.confidence * 100)}% confidence
                            </Badge>
                          )}
                        </div>
                        {recognitionResult.address && (
                          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{recognitionResult.address}</p>
                        )}

                        <div className="flex flex-wrap gap-2 mt-2">
                          {recognitionResult.category && (
                            <Badge variant="secondary">{recognitionResult.category}</Badge>
                          )}
                          {recognitionResult.buildingType && (
                            <Badge variant="outline">{recognitionResult.buildingType}</Badge>
                          )}
                        </div>

                        {/* Processing info */}
                        <div className="flex items-center mt-2 space-x-3">
                          {recognitionResult.fastMode && (
                            <div className="flex items-center">
                              <Zap className="h-4 w-4 text-amber-500 mr-1" />
                              <span className="text-xs text-amber-500 font-medium">Quick analysis</span>
                            </div>
                          )}
                          {recognitionResult.processingTime && (
                            <div className="flex items-center">
                              <Clock className="h-4 w-4 text-slate-400 mr-1" />
                              <span className="text-xs text-slate-500">
                                {(recognitionResult.processingTime / 1000).toFixed(1)}s
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <AnimatePresence>
                      {showDetails && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden"
                        >
                          {/* Contact information */}
                          {(recognitionResult.phoneNumber || recognitionResult.website) && (
                            <div className="mb-4 space-y-2">
                              {recognitionResult.phoneNumber && (
                                <div className="flex items-center">
                                  <Phone className="h-4 w-4 mr-2 text-slate-400" />
                                  <a
                                    href={`tel:${recognitionResult.phoneNumber}`}
                                    className="text-sm text-teal-500 hover:underline"
                                  >
                                    {recognitionResult.phoneNumber}
                                  </a>
                                </div>
                              )}
                              {recognitionResult.website && (
                                <div className="flex items-center">
                                  <Globe className="h-4 w-4 mr-2 text-slate-400" />
                                  <a
                                    href={recognitionResult.website}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-teal-500 hover:underline truncate max-w-[200px]"
                                  >
                                    {recognitionResult.website.replace(/^https?:\/\//, "")}
                                  </a>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Rating */}
                          {recognitionResult.rating && (
                            <div className="mb-4">
                              <div className="flex items-center">
                                <Star className="h-4 w-4 fill-amber-400 text-amber-400 mr-1" />
                                <span className="font-medium">{recognitionResult.rating}</span>
                                <div className="ml-2 flex">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <svg
                                      key={star}
                                      className={`w-3 h-3 ${
                                        star <= Math.round(recognitionResult.rating)
                                          ? "text-amber-400 fill-amber-400"
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
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowDetails(!showDetails)}
                      className="w-full flex items-center justify-center mt-2 text-slate-500"
                    >
                      {showDetails ? "Show less" : "Show more"}
                      <ChevronDown className={`ml-1 h-4 w-4 transition-transform ${showDetails ? "rotate-180" : ""}`} />
                    </Button>

                    <div className="grid grid-cols-3 gap-3 mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-lg h-10 flex flex-col items-center justify-center"
                        onClick={handleBookmark}
                      >
                        <BookmarkPlus className="w-4 h-4 mb-1" />
                        <span className="text-xs">Save</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-lg h-10 flex flex-col items-center justify-center"
                        onClick={handleShare}
                      >
                        <Share2 className="w-4 h-4 mb-1" />
                        <span className="text-xs">Share</span>
                      </Button>
                      {recognitionResult.location && (
                        <Button
                          variant="default"
                          size="sm"
                          className="rounded-lg h-10 flex flex-col items-center justify-center bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 border-0"
                          asChild
                        >
                          <a
                            href={`https://www.google.com/maps?q=${recognitionResult.location.latitude},${recognitionResult.location.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Map className="w-4 h-4 mb-1" />
                            <span className="text-xs">Map</span>
                          </a>
                        </Button>
                      )}
                    </div>

                    {/* More Info Button */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleShowMetadata}
                      className="w-full mt-3 bg-teal-50 hover:bg-teal-100 border-teal-200 dark:bg-teal-900/20 dark:hover:bg-teal-900/30 dark:border-teal-800/50 rounded-lg"
                    >
                      <FileText className="w-4 h-4 mr-2 text-teal-600 dark:text-teal-400" />
                      <span className="text-teal-700 dark:text-teal-300">More Info</span>
                    </Button>
                  </div>

                  {recognitionResult.photos && recognitionResult.photos.length > 0 && (
                    <div className="mt-4">
                      <div className="aspect-video w-full overflow-hidden rounded-lg">
                        <img
                          src={recognitionResult.photos[0] || "/placeholder.svg"}
                          alt={recognitionResult.name || "Location"}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                  )}
                </motion.div>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="p-4"
              >
                <div className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm p-6 rounded-xl border border-slate-200/50 dark:border-slate-700/50 shadow-lg">
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
                    <Camera className="w-5 h-5 mr-2" />
                    Try Again
                  </Button>
                </div>
              </motion.div>
            )}
          </div>
        )}

        {!previewUrl && !isProcessing && !recognitionResult && !cameraActive && (
          <div className="absolute inset-0">
            <Tabs defaultValue="camera" value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
              <div className="px-4 pt-4">
                <TabsList className="grid grid-cols-2 w-full">
                  <TabsTrigger value="camera" className="rounded-lg">
                    <Camera className="w-4 h-4 mr-2" />
                    Camera
                  </TabsTrigger>
                  <TabsTrigger value="upload" className="rounded-lg">
                    <ImageIcon className="w-4 h-4 mr-2" />
                    Upload
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="camera" className="flex-1 flex flex-col items-center justify-center p-4">
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
                  className="relative w-20 h-20 mb-4"
                >
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-teal-500/20 to-cyan-500/20 blur-xl"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Camera className="w-16 h-16 text-teal-500/80 dark:text-teal-400/80" />
                  </div>
                </motion.div>

                <h2 className="text-xl font-bold mb-2 bg-gradient-to-r from-teal-600 to-cyan-600 dark:from-teal-400 dark:to-cyan-400 bg-clip-text text-transparent">
                  Identify Any Location
                </h2>

                <p className="text-slate-600 dark:text-slate-300 mb-4 max-w-xs text-center text-sm">
                  Take a photo to instantly recognize places around you
                </p>

                <div className="flex items-center justify-center mb-4 space-x-2">
                  <Switch id="fast-mode" checked={fastMode} onCheckedChange={toggleFastMode} />
                  <Label htmlFor="fast-mode" className="flex items-center cursor-pointer">
                    <Zap className={`h-4 w-4 mr-1 ${fastMode ? "text-amber-500" : "text-slate-400"}`} />
                    <span className={fastMode ? "text-amber-500 font-medium" : "text-slate-500"}>
                      {fastMode ? "Quick mode (10-15s)" : "Detailed mode (30s+)"}
                    </span>
                  </Label>
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="w-full max-w-xs"
                >
                  <Button
                    size="lg"
                    onClick={handleCameraCapture}
                    className="w-full h-12 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 border-0"
                  >
                    <Camera className="mr-2 h-5 w-5" />
                    Open Camera
                  </Button>
                </motion.div>
              </TabsContent>

              <TabsContent value="upload" className="flex-1 flex flex-col items-center justify-center p-4">
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
                  className="relative w-20 h-20 mb-4"
                >
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-teal-500/20 to-cyan-500/20 blur-xl"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Upload className="w-16 h-16 text-teal-500/80 dark:text-teal-400/80" />
                  </div>
                </motion.div>

                <h2 className="text-xl font-bold mb-2 bg-gradient-to-r from-teal-600 to-cyan-600 dark:from-teal-400 dark:to-cyan-400 bg-clip-text text-transparent">
                  Upload a Photo
                </h2>

                <p className="text-slate-600 dark:text-slate-300 mb-4 max-w-xs text-center text-sm">
                  Select an image from your device to identify the location
                </p>

                <div className="flex items-center justify-center mb-4 space-x-2">
                  <Switch id="fast-mode-upload" checked={fastMode} onCheckedChange={toggleFastMode} />
                  <Label htmlFor="fast-mode-upload" className="flex items-center cursor-pointer">
                    <Zap className={`h-4 w-4 mr-1 ${fastMode ? "text-amber-500" : "text-slate-400"}`} />
                    <span className={fastMode ? "text-amber-500 font-medium" : "text-slate-500"}>
                      {fastMode ? "Quick mode (10-15s)" : "Detailed mode (30s+)"}
                    </span>
                  </Label>
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="w-full max-w-xs"
                >
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-12 rounded-xl"
                  >
                    <Upload className="mr-2 h-5 w-5" />
                    Select Photo
                  </Button>
                </motion.div>
              </TabsContent>
            </Tabs>
          </div>
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

      {/* Metadata Dialog */}
      {showMetadataDialog && recognitionResult && (
        <MetadataDialog
          open={showMetadataDialog}
          onOpenChange={setShowMetadataDialog}
          recognitionResult={recognitionResult}
          selectedFile={selectedFile}
        />
      )}
    </div>
  )
}
