"use client"

import { useState, useRef } from "react"
import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Camera, Upload, Loader2, X, Image as ImageIcon } from "lucide-react"
import BuildingInfoCard from "../components/BuildingInfoCard"

interface BuildingDetectorProps {
  onDetectionComplete: (result: any) => void
  currentLocation: { lat: number; lng: number; accuracy?: number } | null
}

export default function BuildingDetector({ 
  onDetectionComplete, 
  currentLocation 
}: BuildingDetectorProps) {
  const [isCapturing, setIsCapturing] = useState(false)
  const [image, setImage] = useState<File | null>(null)
  const [preview, setPreview] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [showBuildingInfo, setShowBuildingInfo] = useState(false)
  const [detectionResult, setDetectionResult] = useState(null)
  const [address, setAddress] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const startCamera = async () => {
    try {
      const constraints = {
        video: {
          facingMode: "environment",
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      }
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        setIsCapturing(true)
        setError("")
      }
    } catch (err) {
      console.error("Camera access error:", err)
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

  const resetState = () => {
    setImage(null)
    setPreview("")
    setError("")
    setLoading(false)
    setShowBuildingInfo(false)
    setAddress(null)
    if (preview) URL.revokeObjectURL(preview)
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

      context.drawImage(video, 0, 0, canvas.width, canvas.height)

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
      }, "image/jpeg", 0.9)
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      setError("Please upload a valid image file.")
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("Image size should be less than 10MB.")
      return
    }

    if (preview) URL.revokeObjectURL(preview)
    setImage(file)
    setPreview(URL.createObjectURL(file))
    setError("")
  }

  const convertToAddress = async (lat: number, lng: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
      )
      const data = await response.json()
      return data.display_name
    } catch (error) {
      console.error("Error converting coordinates to address:", error)
      return null
    }
  }

  const handleDetection = async () => {
    if (!image) {
      setError("Please select or capture an image first.")
      return
    }

    if (!currentLocation) {
      setError("Location data is missing. Please enable location services.")
      return
    }

    setLoading(true)
    setError("")

    try {
      const formData = new FormData()
      formData.append("image", image)
      formData.append("lat", currentLocation.lat.toString())
      formData.append("lng", currentLocation.lng.toString())
      if (currentLocation.accuracy) {
        formData.append("accuracy", currentLocation.accuracy.toString())
      }

      const response = await fetch("/api/process-image", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`)
      }

      const result = await response.json()
      const addressResult = await convertToAddress(
        currentLocation.lat,
        currentLocation.lng
      )
      
      setAddress(addressResult)
      setDetectionResult(result)
      onDetectionComplete(result)
      setShowBuildingInfo(true)
      resetState()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to analyze building.")
      setLoading(false)
    }
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      transition={{ duration: 0.6 }}
      className="w-full max-w-2xl mx-auto"
    >
      <Card className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-0 shadow-2xl">
        <CardContent className="p-4 sm:p-6 space-y-4">
          {error && (
            <Alert variant="destructive" className="relative">
              <AlertDescription>{error}</AlertDescription>
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 h-8 w-8"
                onClick={() => setError("")}
              >
                <X className="h-4 w-4" />
              </Button>
            </Alert>
          )}

          {!currentLocation && (
            <Alert variant="warning" className="mb-4">
              <AlertDescription>
                Please enable location services for better results.
              </AlertDescription>
            </Alert>
          )}

          {!isCapturing && !preview && (
            <div className="flex flex-col items-center justify-center p-6 sm:p-12 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl bg-gradient-to-b from-gray-50 to-white dark:from-gray-800 dark:to-gray-900">
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full mb-4">
                <ImageIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-lg sm:text-xl font-medium text-gray-900 dark:text-gray-100">
                Start Detection
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center mt-2 max-w-sm">
                Capture a photo or upload an image of a building to analyze.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 mt-6 w-full sm:w-auto">
                <Button
                  variant="outline"
                  onClick={startCamera}
                  className="w-full sm:w-auto flex items-center justify-center gap-2"
                >
                  <Camera className="w-4 h-4" />
                  Use Camera
                </Button>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  ref={fileInputRef}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full sm:w-auto flex items-center justify-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  Upload Image
                </Button>
              </div>
            </div>
          )}

          {isCapturing && (
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-gray-100 dark:bg-gray-800">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div className="absolute inset-x-0 bottom-4 flex justify-center">
                <Button onClick={capturePhoto} size="lg">
                  Capture Photo
                </Button>
              </div>
            </div>
          )}

          {preview && (
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-gray-100 dark:bg-gray-800">
              <img
                src={preview}
                alt="Preview"
                className="h-full w-full object-cover"
              />
              <Button
                variant="secondary"
                size="icon"
                className="absolute top-2 right-2 bg-white/90 dark:bg-gray-800/90 shadow-lg"
                onClick={resetState}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          {(preview || isCapturing) && (
            <Button
              onClick={handleDetection}
              disabled={loading || !image}
              className="w-full h-12 text-base font-medium"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing...
                </div>
              ) : (
                "Detect Building"
              )}
            </Button>
          )}
        </CardContent>
      </Card>

      {showBuildingInfo && detectionResult && (
        <BuildingInfoCard
          detectionResult={detectionResult}
          address={address}
          onClose={() => setShowBuildingInfo(false)}
        />
      )}

      <canvas ref={canvasRef} className="hidden" />
    </motion.div>
  )
}