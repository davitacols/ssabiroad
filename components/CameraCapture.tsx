import { useState, useRef } from 'react'
import { Button } from "@/components/ui/button"
import { Camera } from 'lucide-react'

interface CameraCaptureProps {
  onCapture: (imageData: string) => void
}

export default function CameraCapture({ onCapture }: CameraCaptureProps) {
  const [isCapturing, setIsCapturing] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const startCapture = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        setIsCapturing(true)
      }
    } catch (err) {
      console.error("Error accessing the camera", err)
    }
  }

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d')
      if (context) {
        context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height)
        const imageData = canvasRef.current.toDataURL('image/jpeg')
        onCapture(imageData)
        setIsCapturing(false)
        if (videoRef.current.srcObject instanceof MediaStream) {
          videoRef.current.srcObject.getTracks().forEach(track => track.stop())
        }
      }
    }
  }

  return (
    <div className="space-y-4">
      {isCapturing ? (
        <>
          <video ref={videoRef} autoPlay className="w-full max-w-sm mx-auto" />
          <Button onClick={captureImage}>
            <Camera className="mr-2 h-4 w-4" />
            Capture Image
          </Button>
        </>
      ) : (
        <Button onClick={startCapture}>
          <Camera className="mr-2 h-4 w-4" />
          Start Camera
        </Button>
      )}
      <canvas ref={canvasRef} style={{ display: 'none' }} width="640" height="480" />
    </div>
  )
}

