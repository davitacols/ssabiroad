"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { Building, Camera, Upload, Loader2, X } from "lucide-react"

interface BuildingDetectorProps {
  onDetectionComplete: (result: any) => void
  currentLocation: { lat: number; lng: number; accuracy?: number } | null
}

export default function BuildingDetector({ onDetectionComplete, currentLocation }: BuildingDetectorProps) {
  const [isCapturing, setIsCapturing] = useState(false)
  const [image, setImage] = useState<File | null>(null)
  const [preview, setPreview] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview)
      stopCamera()
    }
  }, [preview])

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        setIsCapturing(true)
        setError("")
      }
    } catch (err) {
      setError("Camera access denied. Please check permissions.")
    }
  }

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach((track) => track.stop())
      videoRef.current.srcObject = null
      setIsCapturing(false)
    }
  }

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current
      const canvas = canvasRef.current
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight

      const context = canvas.getContext("2d")
      if (!context) {
        setError("Failed to initialize camera context")
        return
      }

      context.drawImage(video, 0, 0)

      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], "photo.jpg", { type: "image/jpeg" })
          setImage(file)
          setPreview(URL.createObjectURL(blob))
          stopCamera()
          setError("")
        } else {
          setError("Failed to capture photo")
        }
      }, "image/jpeg", 0.8) // Added quality parameter
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError("Please upload an image file")
        return
      }
      
      // Validate file size (e.g., 10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        setError("Image size should be less than 10MB")
        return
      }

      if (preview) URL.revokeObjectURL(preview)
      setImage(file)
      setPreview(URL.createObjectURL(file))
      setError("")
    }
  }

  const handleDetection = async () => {
    if (!image) {
      setError("Please select or capture an image first")
      return
    }

    setLoading(true)
    setError("")

    try {
      const formData = new FormData()
      formData.append("image", image)

      // Validate location data before appending
      if (currentLocation?.lat && currentLocation?.lng) {
        formData.append("lat", currentLocation.lat.toString())
        formData.append("lng", currentLocation.lng.toString())
        if (currentLocation.accuracy) {
          formData.append("accuracy", currentLocation.accuracy.toString())
        }
      }

      const response = await fetch("/api/process-image", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        throw new Error(errorData?.message || `Server error: ${response.status}`)
      }

      const result = await response.json()
      onDetectionComplete(result)

      // Clear the form after successful submission
      setImage(null)
      setPreview("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to analyze building. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="bg-white/80 backdrop-blur-2xl border-0 shadow-xl dark:bg-gray-900/80">
      <CardContent className="p-8">
        <div className="space-y-8">
          {error && (
            <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {!isCapturing && !preview && (
            <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-gray-300/50 dark:border-gray-700/50 rounded-xl bg-gradient-to-b from-gray-50/50 to-white/50 dark:from-gray-800/50 dark:to-gray-900/50">
              <Building className="w-16 h-16 text-blue-500 mb-4 animate-pulse" />
              <h3 className="text-xl font-medium text-gray-900 dark:text-gray-100 mb-2">Start Detection</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-6 max-w-md">
                Take a photo or upload an image of a building to identify it
              </p>
              <div className="flex gap-4">
                <Button variant="outline" onClick={startCamera} className="flex items-center gap-2">
                  <Camera className="w-4 h-4" />
                  Camera
                </Button>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={handleFileUpload} 
                  ref={fileInputRef} 
                  className="hidden" 
                />
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  Upload
                </Button>
              </div>
            </div>
          )}

          {isCapturing && (
            <div className="relative rounded-xl overflow-hidden">
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                className="w-full aspect-video object-cover"
                onError={() => setError("Failed to start video stream")}
              />
              <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
                <Button onClick={capturePhoto} className="bg-blue-600 hover:bg-blue-700">
                  Capture
                </Button>
                <Button onClick={stopCamera} variant="secondary">
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {preview && (
            <div className="space-y-4">
              <div className="relative rounded-xl overflow-hidden">
                <img 
                  src={preview} 
                  alt="Preview" 
                  className="w-full aspect-video object-cover"
                  onError={() => {
                    setError("Failed to load image preview")
                    setPreview("")
                    setImage(null)
                  }}
                />
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={() => {
                    URL.revokeObjectURL(preview)
                    setImage(null)
                    setPreview("")
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <Button
                onClick={handleDetection}
                disabled={loading || !image}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Building className="w-4 h-4 mr-2" />
                    Detect Building
                  </>
                )}
              </Button>
            </div>
          )}

          <canvas ref={canvasRef} className="hidden" />
        </div>
      </CardContent>
    </Card>
  )
}
