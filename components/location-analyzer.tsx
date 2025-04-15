"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MapPin, Upload, Camera, X, AlertCircle, Sparkles } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { motion } from "framer-motion"
import { BusinessInfoDisplay } from "@/components/enhanced-business-display"

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
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
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

  // Handle analyze button click
  const handleImageRecognition = async (file: File) => {
    try {
      setIsAnalyzing(true)
      setResult({
        success: true,
        name: "Analyzing image...",
        type: "processing",
        description: "Please wait while we analyze your image. This may take a few moments.",
      })
      setProgress(10)
      setError(null)

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
                  setSelectedFile(file)
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

  // Handle view on mobile
  const handleViewOnMobile = () => {
    if (result) {
      // Save the result to localStorage
      localStorage.setItem("lastLocation", JSON.stringify(result))

      // Redirect to mobile dashboard
      window.location.href = "/mobile-dashboard"
    }
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold text-center mb-8">Image Location Analyzer</h1>

      <Card className="w-full max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle className="text-center">Upload an image to identify the location</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer mb-4"
            onClick={() => !isAnalyzing && !result && fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            {preview ? (
              <div className="relative">
                <img src={preview || "/placeholder.svg"} alt="Preview" className="max-h-[300px] mx-auto rounded-lg" />
                {!isAnalyzing && !result && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleReset()
                    }}
                  >
                    Change
                  </Button>
                )}
              </div>
            ) : cameraActive ? (
              <div className="relative">
                <video ref={videoRef} className="max-h-[300px] mx-auto rounded-lg" autoPlay playsInline muted />
                <Button
                  className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white text-black hover:bg-white/90"
                  size="lg"
                  onClick={handleCameraCapture}
                >
                  Capture
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-4">
                <Upload className="h-10 w-10 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground mb-1">Drag and drop an image here or click to browse</p>
                <p className="text-xs text-muted-foreground">Supports JPG, PNG, HEIC</p>
              </div>
            )}
            <canvas ref={canvasRef} className="hidden" />
          </div>

          {isAnalyzing && (
            <div className="text-center py-4">
              <div className="flex justify-center mb-4">
                <motion.div
                  animate={{
                    rotate: 360,
                  }}
                  transition={{
                    duration: 2,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: "linear",
                  }}
                >
                  <Sparkles className="h-8 w-8 text-indigo-500" />
                </motion.div>
              </div>
              <h3 className="text-lg font-medium mb-2">{result?.name || "Analyzing..."}</h3>
              <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mb-2">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                />
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {result?.description || "This may take a moment. We're identifying the location in your image."}
              </p>
            </div>
          )}

          {error && !isAnalyzing && (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 p-4 rounded-xl flex items-start mb-4">
              <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {result && !isAnalyzing && (
            <div className="mt-6">
              <div className="p-4 border rounded-lg mb-4">
                <h3 className="font-semibold text-lg mb-2">{result.name}</h3>

                {result.location && (
                  <div className="flex items-center text-sm text-muted-foreground mb-2">
                    <MapPin className="h-4 w-4 mr-1" />
                    {result.location.latitude.toFixed(6)}, {result.location.longitude.toFixed(6)}
                  </div>
                )}

                {result.description && <p className="text-sm mb-2">{result.description}</p>}

                {result.category && (
                  <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                    {result.category}
                  </div>
                )}

                {result.mapUrl && (
                  <div className="mt-4">
                    <a
                      href={result.mapUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline"
                    >
                      View on Google Maps
                    </a>
                  </div>
                )}
              </div>

              <BusinessInfoDisplay recognitionResult={result} />
            </div>
          )}

          <div className="flex gap-2 mt-4">
            {!isAnalyzing && !cameraActive && !result && (
              <>
                <Button className="flex-1" onClick={handleCameraCapture}>
                  <Camera className="mr-2 h-4 w-4" />
                  Camera
                </Button>

                <Button variant="outline" className="flex-1" onClick={() => fileInputRef.current?.click()}>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload
                </Button>
              </>
            )}

            {(result || cameraActive) && (
              <>
                <Button variant="outline" className="flex-1" onClick={handleReset}>
                  <X className="mr-2 h-4 w-4" />
                  Start Over
                </Button>

                {result && !isAnalyzing && (
                  <Button className="flex-1" onClick={handleViewOnMobile}>
                    <MapPin className="mr-2 h-4 w-4" />
                    View on Mobile
                  </Button>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
    </div>
  )
}

