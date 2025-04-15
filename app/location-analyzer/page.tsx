"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { MapPin, Share2, Camera, X, Sparkles, Upload, AlertCircle } from "lucide-react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { BusinessInfoDisplay } from "@/components/enhanced-business-display"
import { useToast } from "@/hooks/use-toast"
import * as exifParser from "exif-parser"

export default function LocationAnalyzerPage() {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [result, setResult] = useState<any | null>(null)
  const [jobId, setJobId] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [cameraActive, setCameraActive] = useState(false)
  const { toast } = useToast()
  const [retryCount, setRetryCount] = useState(0)
  const maxRetries = 3

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      setFile(selectedFile)

      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreview(e.target?.result as string)
      }
      reader.readAsDataURL(selectedFile)

      // Reset states
      setResult(null)
      setJobId(null)
      setProgress(0)
      setError(null)
      setRetryCount(0)

      // Start processing
      handleImageRecognition(selectedFile)
    }
  }

  // Handle file drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0]
      setFile(droppedFile)

      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreview(e.target?.result as string)
      }
      reader.readAsDataURL(droppedFile)

      // Reset states
      setResult(null)
      setJobId(null)
      setProgress(0)
      setError(null)
      setRetryCount(0)

      // Start processing
      handleImageRecognition(droppedFile)
    }
  }

  // Prevent default behavior for drag events
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  // Check job status
  useEffect(() => {
    let intervalId: NodeJS.Timeout

    if (jobId) {
      console.log("Starting job status check for jobId:", jobId)

      intervalId = setInterval(async () => {
        try {
          console.log("Checking status for job:", jobId)

          const formData = new FormData()
          formData.append("operation", "checkStatus")
          formData.append("jobId", jobId)

          const response = await fetch("/api/location-recognition", {
            method: "POST",
            body: formData,
          })

          // Handle 404 responses with retry logic
          if (response.status === 404) {
            console.warn(`Job not found (attempt ${retryCount + 1}/${maxRetries}):`, jobId)

            if (retryCount < maxRetries) {
              setRetryCount((prev) => prev + 1)
              return // Try again on next interval
            }

            // Max retries reached, show error
            console.error("Max retries reached for job:", jobId)
            setError("Job not found after multiple attempts. The server might be busy. Please try again.")
            setIsAnalyzing(false)
            clearInterval(intervalId)

            // Try to recover by checking localStorage for a previous result
            const savedLocation = localStorage.getItem("lastLocation")
            if (savedLocation) {
              try {
                const parsedLocation = JSON.parse(savedLocation)
                if (parsedLocation.success) {
                  setResult(parsedLocation)
                  toast({
                    title: "Recovered previous result",
                    description: "We couldn't get the latest result, but found a previous one.",
                  })
                }
              } catch (e) {
                console.error("Error parsing saved location:", e)
              }
            }

            return
          }

          // Reset retry count on successful response
          setRetryCount(0)

          const data = await response.json()
          console.log("Job status response:", data)

          if (data.status === "completed" || (data.success === true && !data.status)) {
            console.log("Job completed successfully:", data)
            setResult(data)
            setIsAnalyzing(false)
            setProgress(100)
            clearInterval(intervalId)

            // Save the completed result to localStorage for the mobile dashboard
            localStorage.setItem("lastLocation", JSON.stringify(data))
            // Clear the job ID since it's complete
            localStorage.removeItem("currentLocationJobId")

            toast({
              title: "Analysis complete",
              description: `Identified: ${data.name || "Location"}`,
            })
          } else if (data.status === "failed" || data.success === false) {
            console.error("Job failed:", data.error)
            setError(data.error || "Something went wrong")
            setIsAnalyzing(false)
            clearInterval(intervalId)
            toast({
              title: "Analysis failed",
              description: data.error || "Something went wrong",
              variant: "destructive",
            })
          } else {
            // Update progress based on server response or estimate
            const serverProgress = data.progress || 0

            setProgress((prev) => {
              // Use server progress if available, otherwise increment
              const newProgress = serverProgress > 0 ? serverProgress : Math.min(prev + 5, 95)

              // Update the result message based on progress
              if (data.name && data.description) {
                // Use server-provided status messages if available
                setResult((prevResult) => ({
                  ...prevResult,
                  name: data.name,
                  description: data.description,
                }))
              } else if (newProgress > 30 && newProgress < 60) {
                setResult((prevResult) => ({
                  ...prevResult,
                  name: "Detecting features...",
                  description: "Identifying landmarks, businesses, and other points of interest.",
                }))
              } else if (newProgress >= 60 && newProgress < 90) {
                setResult((prevResult) => ({
                  ...prevResult,
                  name: "Almost there...",
                  description: "Finalizing location details and gathering additional information.",
                }))
              }

              return newProgress
            })
          }
        } catch (error) {
          console.error("Error checking job status:", error)

          // Increment retry count on error
          if (retryCount < maxRetries) {
            setRetryCount((prev) => prev + 1)
          } else {
            setError("Connection error. Please check your internet connection and try again.")
            setIsAnalyzing(false)
            clearInterval(intervalId)
          }
        }
      }, 2000) // Check every 2 seconds
    }

    return () => {
      if (intervalId) clearInterval(intervalId)
    }
  }, [jobId, retryCount, toast])

  // Add a function to extract EXIF data from the image before uploading
  const extractExifData = async (file: File): Promise<any> => {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const buffer = Buffer.from(e.target?.result as ArrayBuffer)
          const parser = exifParser.create(buffer)
          const result = parser.parse()

          resolve({
            make: result.tags.Make,
            model: result.tags.Model,
            software: result.tags.Software,
            dateTime: result.tags.DateTime,
            exposureTime: result.tags.ExposureTime,
            fNumber: result.tags.FNumber,
            iso: result.tags.ISO,
            focalLength: result.tags.FocalLength,
            lensModel: result.tags.LensModel,
            imageWidth: result.tags.ImageWidth,
            imageHeight: result.tags.ImageHeight,
          })
        } catch (error) {
          console.warn("Error extracting EXIF data:", error)
          resolve({})
        }
      }
      reader.readAsArrayBuffer(file)
    })
  }

  // Handle analyze button click
  const handleImageRecognition = async (file: File) => {
    try {
      setIsAnalyzing(true)
      setResult({
        success: true,
        name: "Processing your image...",
        type: "processing",
        description: "We're analyzing your image to identify the location.",
      })
      setProgress(10)
      setError(null)

      // Extract EXIF data before uploading
      const exifData = await extractExifData(file)
      console.log("Extracted EXIF data:", exifData)

      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 5
        })
      }, 1000)

      // Get current location if available
      let latitude: number | undefined
      let longitude: number | undefined

      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0,
          })
        })

        latitude = position.coords.latitude
        longitude = position.coords.longitude
        console.log("Got user location:", latitude, longitude)
      } catch (error) {
        console.warn("Could not get user location:", error)
      }

      // Prepare form data
      const formData = new FormData()
      formData.append("image", file)

      if (latitude && longitude) {
        formData.append("lat", latitude.toString())
        formData.append("lng", longitude.toString())
      }

      // Add device info to the request
      if (exifData.make) formData.append("deviceMake", exifData.make)
      if (exifData.model) formData.append("deviceModel", exifData.model)
      if (exifData.software) formData.append("deviceSoftware", exifData.software)
      if (exifData.dateTime) formData.append("captureTime", exifData.dateTime)

      console.log("Sending image for analysis...")

      // Use the enhanced API endpoint
      const response = await fetch("/api/location-recognition", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      console.log("API response:", data)

      // Add the EXIF data to the result
      if (data.success) {
        data.exifData = exifData
        data.deviceInfo = {
          make: exifData.make,
          model: exifData.model,
          software: exifData.software,
        }
        data.captureTime = exifData.dateTime
      }

      if (data.success && data.jobId) {
        setJobId(data.jobId)
        // Save the job ID to localStorage for the mobile dashboard
        localStorage.setItem("currentLocationJobId", data.jobId)
        // Set an initial processing state with a friendly message
        setResult({
          success: true,
          name: "Processing your image...",
          type: "processing",
          description: "We're analyzing your image to identify the location. This usually takes about 10-15 seconds.",
          exifData,
          deviceInfo: {
            make: exifData.make,
            model: exifData.model,
            software: exifData.software,
          },
          captureTime: exifData.dateTime,
        })
        toast({
          title: "Analysis started",
          description: "Your image is being processed. This may take a moment.",
        })
      } else if (data.success && !data.jobId) {
        // Handle immediate response (no job ID)
        clearInterval(progressInterval)
        setProgress(100)
        setIsAnalyzing(false)
        setResult(data)

        // Save to localStorage for mobile dashboard
        localStorage.setItem("lastLocation", JSON.stringify(data))
      } else {
        clearInterval(progressInterval)
        setIsAnalyzing(false)
        setError(data.error || "Something went wrong")
        toast({
          title: "Analysis failed",
          description: data.error || "Something went wrong",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      console.error("Error analyzing image:", error)
      setIsAnalyzing(false)
      setError(error.message || "Failed to analyze image. Please try again.")
      toast({
        title: "Error",
        description: "Failed to analyze image. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Handle camera capture
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
                  setFile(file)
                  const fileUrl = URL.createObjectURL(file)
                  setPreview(fileUrl)
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

  // Handle reset
  const handleReset = () => {
    setResult(null)
    setPreview(null)
    setFile(null)
    setIsAnalyzing(false)
    setError(null)
    setJobId(null)
    setProgress(0)
    setRetryCount(0)
    stopCamera()

    // Clear job ID from localStorage
    localStorage.removeItem("currentLocationJobId")
  }

  // Handle share
  const handleShare = () => {
    if (result && result.success && result.type !== "processing") {
      // Implement share functionality
      if (navigator.share) {
        navigator
          .share({
            title: result.name || "Shared Location",
            text: `Check out this location: ${result.name}`,
            url: result.mapUrl || window.location.href,
          })
          .catch((err) => console.error("Error sharing:", err))
      }
    }
  }

  // Determine what to display in the header
  const displayName =
    result?.type === "processing"
      ? result.name
      : result?.name && result.name !== "Unknown Location"
        ? result.name
        : "Location Details"

  return (
    <div className="flex flex-col min-h-screen bg-slate-900 text-white">
      <header className="bg-indigo-900/50 p-4 flex items-center">
        <div className="w-10 h-10 rounded-full bg-indigo-800/50 flex items-center justify-center mr-3">
          <MapPin className="h-5 w-5 text-indigo-300" />
        </div>
        <h1 className="text-xl font-bold">Pic2Nav</h1>
      </header>

      {/* Main content area */}
      <div className="flex-1 p-4 flex flex-col">
        {/* Location header card */}
        <div className="bg-slate-800/50 rounded-xl p-4 flex items-center mb-4">
          <div className="w-12 h-12 rounded-full bg-slate-700/50 flex items-center justify-center mr-3">
            <MapPin className="h-6 w-6 text-indigo-400" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold">{displayName}</h2>
            {result?.type === "processing" ? (
              <div className="w-full mt-2">
                <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: "10%" }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 15, ease: "linear" }}
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
                  />
                </div>
                <p className="text-sm text-slate-400 mt-1">{result.description}</p>
              </div>
            ) : result?.location ? (
              <p className="text-sm text-slate-400">
                {result.location.latitude.toFixed(6)}, {result.location.longitude.toFixed(6)}
              </p>
            ) : null}
          </div>
        </div>

        {/* Image upload/preview area */}
        {!preview && !cameraActive && !isAnalyzing && (
          <div
            className="bg-slate-800/30 rounded-xl p-6 mb-4 flex flex-col items-center justify-center"
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            <Upload className="h-10 w-10 text-indigo-400 mb-3" />
            <p className="text-center text-slate-300 mb-1">Tap to upload an image</p>
            <p className="text-center text-sm text-slate-400">or use the camera button below</p>
          </div>
        )}

        {/* Camera view */}
        {cameraActive && (
          <div className="bg-slate-800/30 rounded-xl overflow-hidden mb-4 relative">
            <video ref={videoRef} className="w-full h-auto" autoPlay playsInline muted />
            <Button
              className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white text-black hover:bg-white/90"
              size="lg"
              onClick={handleCameraCapture}
            >
              Capture
            </Button>
          </div>
        )}

        {/* Image preview */}
        {preview && !isAnalyzing && (
          <div className="bg-slate-800/30 rounded-xl overflow-hidden mb-4 relative">
            <img src={preview || "/placeholder.svg"} alt="Preview" className="w-full h-auto" />
          </div>
        )}

        {/* Processing state */}
        {isAnalyzing && (
          <div className="bg-slate-800/30 rounded-xl p-6 flex flex-col items-center justify-center mb-4">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
              className="mb-4"
            >
              <Sparkles className="h-8 w-8 text-indigo-400" />
            </motion.div>
            <p className="text-center text-slate-400">{result?.description || "Processing your image..."}</p>
          </div>
        )}

        {/* Error message */}
        {error && !isAnalyzing && (
          <div className="bg-red-900/20 text-red-300 p-4 rounded-xl flex items-start mb-4">
            <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Result display */}
        {result && !isAnalyzing && result.type !== "processing" && (
          <div className="flex-1 overflow-auto">
            <BusinessInfoDisplay recognitionResult={result} />
          </div>
        )}

        <canvas ref={canvasRef} className="hidden" />
      </div>

      {/* Action buttons */}
      <div className="p-4 space-y-2">
        {result && !isAnalyzing && result.type !== "processing" && (
          <Button
            variant="outline"
            className="w-full flex items-center justify-center gap-2 bg-slate-800 border-slate-700 text-white"
            onClick={handleShare}
          >
            <Share2 className="h-5 w-5" />
            Share
          </Button>
        )}

        {!cameraActive && !isAnalyzing ? (
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant={result ? "outline" : "default"}
              className={`w-full flex items-center justify-center gap-2 ${
                result ? "bg-slate-800 border-slate-700 text-white" : "bg-indigo-600"
              }`}
              onClick={result ? handleReset : handleCameraCapture}
            >
              {result ? (
                <>
                  <X className="h-5 w-5" />
                  Start Over
                </>
              ) : (
                <>
                  <Camera className="h-5 w-5" />
                  Camera
                </>
              )}
            </Button>

            {!result ? (
              <Button
                variant="outline"
                className="w-full flex items-center justify-center gap-2 bg-slate-800 border-slate-700 text-white"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-5 w-5" />
                Upload
              </Button>
            ) : (
              <Button
                className="w-full flex items-center justify-center gap-2 bg-indigo-600"
                onClick={() => (window.location.href = "/mobile-dashboard")}
              >
                <MapPin className="h-5 w-5" />
                Dashboard
              </Button>
            )}
          </div>
        ) : (
          <Button
            variant="outline"
            className="w-full flex items-center justify-center gap-2 bg-slate-800 border-slate-700 text-white"
            onClick={cameraActive ? stopCamera : handleReset}
          >
            <X className="h-5 w-5" />
            Cancel
          </Button>
        )}
      </div>

      {/* Bottom navigation */}
      <nav className="grid grid-cols-5 bg-slate-800/90 backdrop-blur-md border-t border-slate-700/50">
        <button className="p-3 flex flex-col items-center justify-center">
          <Camera className="h-6 w-6 text-indigo-400" />
          <span className="text-xs mt-1 text-slate-400">Camera</span>
        </button>
        <button className="p-3 flex flex-col items-center justify-center">
          <MapPin className="h-6 w-6 text-slate-500" />
          <span className="text-xs mt-1 text-slate-400">Places</span>
        </button>
        <button className="p-3 flex flex-col items-center justify-center">
          <svg className="h-6 w-6 text-slate-500" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M9 20L3 17V4L9 7M9 20L15 17M9 20V7M15 17L21 20V7L15 4M15 17V4M9 7L15 4"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="text-xs mt-1 text-slate-400">Map</span>
        </button>
        <button className="p-3 flex flex-col items-center justify-center">
          <svg className="h-6 w-6 text-slate-500" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="text-xs mt-1 text-slate-400">Search</span>
        </button>
        <button className="p-3 flex flex-col items-center justify-center">
          <svg className="h-6 w-6 text-slate-500" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M19.5 12.5719L12 19.9999L4.5 12.5719C3.33087 11.429 2.55962 9.93686 2.32138 8.32201C2.08313 6.70715 2.39077 5.05959 3.19545 3.63573C4.00013 2.21186 5.25608 1.09085 6.75 0.453626C8.24392 -0.183593 9.88831 -0.310836 11.4608 0.0932045C13.0334 0.497245 14.4527 1.40063 15.4732 2.6705C16.4938 3.94037 17.0568 5.49608 17.0568 7.09985C17.0568 8.70361 16.4938 10.2593 15.4732 11.5292L19.5 12.5719ZM19.5 12.5719C19.5 12.5719 19.5 12.572 19.5 12.572L19.5 12.5719Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="text-xs mt-1 text-slate-400">Saved</span>
        </button>
      </nav>

      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
    </div>
  )
}

