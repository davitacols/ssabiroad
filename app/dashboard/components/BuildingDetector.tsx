"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { Building, Camera, Upload, Loader2 } from "lucide-react"
import { motion } from "framer-motion"

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

      console.log("Sending form data:", {
        image: image.name,
        lat: currentLocation.lat,
        lng: currentLocation.lng,
        accuracy: currentLocation.accuracy,
      })

      const response = await fetch("/api/process-image", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Server response:", errorText)
        throw new Error(`Server error: ${response.status}. ${errorText}`)
      }

      const result = await response.json()
      console.log("Detection result:", result)
      onDetectionComplete(result)

      setImage(null)
      setPreview("")
    } catch (err) {
      console.error("Detection error:", err)
      setError(err instanceof Error ? err.message : "Failed to analyze building. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}>
      <Card className="bg-white/90 backdrop-blur-xl border-0 shadow-2xl dark:bg-gray-900/90 p-6 rounded-lg">
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {!currentLocation && (
            <Alert variant="warning">
              <AlertTitle>Warning</AlertTitle>
              <AlertDescription>
                Location data is missing. Please enable location services for better results.
              </AlertDescription>
            </Alert>
          )}

          {!isCapturing && !preview && (
            <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl bg-gradient-to-b from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 transition-all">
              <Building className="w-16 h-16 text-blue-500 mb-4 animate-pulse" />
              <h3 className="text-xl font-medium text-gray-900 dark:text-gray-100">Start Detection</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                Capture a photo or upload an image of a building to analyze.
              </p>
              <div className="flex gap-4 mt-4">
                <Button variant="outline" onClick={startCamera} className="flex items-center gap-2">
                  <Camera className="w-4 h-4" />
                  Camera
                </Button>
                <input type="file" accept="image/*" onChange={handleFileUpload} ref={fileInputRef} className="hidden" />
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
            <motion.div className="relative rounded-xl overflow-hidden" initial={{ scale: 0.9 }} animate={{ scale: 1 }}>
              <video ref={videoRef} autoPlay playsInline className="w-full aspect-video object-cover" />
              <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
                <Button onClick={capturePhoto} className="bg-blue-600 hover:bg-blue-700">
                  Capture
                </Button>
                <Button onClick={stopCamera} variant="secondary">
                  Cancel
                </Button>
              </div>
            </motion.div>
          )}

          {preview && (
            <motion.div className="space-y-4" initial={{ scale: 0.9 }} animate={{ scale: 1 }}>
              <img
                src={preview || "/placeholder.svg"}
                alt="Preview"
                className="w-full aspect-video object-cover rounded-xl"
              />
              <Button
                onClick={handleDetection}
                disabled={loading || !image}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Building className="w-4 h-4 mr-2" />}
                {loading ? "Analyzing..." : "Detect Building"}
              </Button>
            </motion.div>
          )}

          <canvas ref={canvasRef} className="hidden" />
        </CardContent>
      </Card>
    </motion.div>
  )
}

