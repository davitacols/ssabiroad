"use client"

import { useState, useRef } from "react"
import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Camera, Upload, Loader2, X } from "lucide-react"
import BuildingInfoCard from "../components/BuildingInfoCard"

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
  const [showBuildingInfo, setShowBuildingInfo] = useState(false)
  const [detectionResult, setDetectionResult] = useState(null)
  const [address, setAddress] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

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
        console.error("Failed to get canvas context")
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
          console.error("Failed to create blob from canvas")
          setError("Failed to capture photo")
        }
      }, "image/jpeg")
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
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
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
      setError("Location data is missing. Please enable location services and try again.")
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
        const errorText = await response.text()
        throw new Error(`Server error: ${response.status}. ${errorText}`)
      }

      const result = await response.json()

      // Convert coordinates to address
      if (currentLocation) {
        const addressResult = await convertToAddress(currentLocation.lat, currentLocation.lng)
        setAddress(addressResult)
      }

      setDetectionResult(result)
      onDetectionComplete(result)
      setShowBuildingInfo(true)
      resetState()
    } catch (err) {
      console.error("Detection error:", err)
      setError(err instanceof Error ? err.message : "Failed to analyze building. Please try again.")
      setLoading(false)
    }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}>
      <Card className="bg-white/90 backdrop-blur-xl border-0 shadow-2xl dark:bg-gray-900/90 p-6 rounded-lg">
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive" className="relative">
              <AlertDescription>{error}</AlertDescription>
              <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-8 w-8" onClick={resetState}>
                <X className="h-4 w-4" />
              </Button>
            </Alert>
          )}

          {!currentLocation && (
            <Alert variant="warning">
              <AlertDescription>
                Location data is missing. Please enable location services for better results.
              </AlertDescription>
            </Alert>
          )}

          {!isCapturing && !preview && (
            <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl bg-gradient-to-b from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 transition-all">
              <h3 className="text-xl font-medium text-gray-900 dark:text-gray-100">Start Detection</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center mt-2">
                Capture a photo or upload an image of a building to analyze.
              </p>
              <div className="flex gap-4 mt-4">
                <Button variant="outline" onClick={startCamera} className="flex items-center gap-2">
                  <Camera className="w-4 h-4" />
                  Camera
                </Button>
                <Input type="file" accept="image/*" onChange={handleFileUpload} ref={fileInputRef} className="hidden" />
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
            <div className="relative">
              <video ref={videoRef} autoPlay playsInline className="w-full aspect-video object-cover rounded-xl" />
              <Button onClick={capturePhoto} className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                Capture
              </Button>
            </div>
          )}

          {preview && (
            <div className="relative">
              <img
                src={preview || "/placeholder.svg"}
                alt="Preview"
                className="w-full aspect-video object-cover rounded-xl"
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 bg-white/80 dark:bg-gray-800/80"
                onClick={resetState}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          <Button onClick={handleDetection} disabled={loading || !image} className="w-full">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Detect Building"}
          </Button>
        </CardContent>
      </Card>

      {showBuildingInfo && detectionResult && (
        <BuildingInfoCard
          detectionResult={detectionResult}
          address={address}
          onClose={() => setShowBuildingInfo(false)}
        />
      )}

      <canvas ref={canvasRef} style={{ display: "none" }} />
    </motion.div>
  )
}

