"use client"

import { useState, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Camera, X } from "lucide-react"

interface CameraCaptureProps {
  onCapture: (imageData: string) => void
}

export function CameraCapture({ onCapture }: CameraCaptureProps) {
  const [isCapturing, setIsCapturing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const startCapture = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
        setIsCapturing(true)
        setError(null)
      }
    } catch (err) {
      console.error("Error accessing the camera", err)
      setError("Unable to access the camera. Please check your permissions.")
    }
  }, [])

  const stopCapture = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
    }
    setIsCapturing(false)
  }, [])

  const captureImage = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext("2d")
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth
        canvasRef.current.height = videoRef.current.videoHeight
        context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height)
        const imageData = canvasRef.current.toDataURL("image/jpeg")
        onCapture(imageData)
        stopCapture()
      }
    }
  }, [onCapture, stopCapture])

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {isCapturing ? (
        <div className="relative">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full max-w-sm mx-auto rounded-lg shadow-lg"
            aria-label="Camera preview"
          />
          <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-4">
            <Button onClick={captureImage} variant="default">
              <Camera className="mr-2 h-4 w-4" />
              Capture
            </Button>
            <Button onClick={stopCapture} variant="secondary">
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <Button onClick={startCapture} className="w-full max-w-sm mx-auto">
          <Camera className="mr-2 h-4 w-4" />
          Start Camera
        </Button>
      )}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}

