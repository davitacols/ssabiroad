"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Camera, CheckCircle, XCircle, AlertTriangle } from "lucide-react"

export function CameraDiagnostic() {
  const [status, setStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string>('')
  const [permissions, setPermissions] = useState<string>('')
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([])
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const runDiagnostic = async () => {
    setStatus('testing')
    setErrorMessage('')
    
    try {
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API not supported in this browser')
      }

      // Check permissions
      try {
        const permission = await navigator.permissions.query({ name: 'camera' as PermissionName })
        setPermissions(permission.state)
      } catch (e) {
        setPermissions('Unable to check permissions')
      }

      // Get available devices
      try {
        const deviceList = await navigator.mediaDevices.enumerateDevices()
        const cameras = deviceList.filter(device => device.kind === 'videoinput')
        setDevices(cameras)
        
        if (cameras.length === 0) {
          throw new Error('No camera devices found')
        }
      } catch (e) {
        throw new Error('Unable to enumerate camera devices')
      }

      // Try to access camera
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
        await videoRef.current.play()
      }

      setStatus('success')
    } catch (error) {
      setStatus('error')
      setErrorMessage(error instanceof Error ? error.message : 'Unknown error occurred')
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setStatus('idle')
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-5 w-5" />
          Camera Diagnostic Tool
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {status === 'idle' && (
          <Button onClick={runDiagnostic} className="w-full">
            Test Camera Access
          </Button>
        )}

        {status === 'testing' && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>Testing camera access...</AlertDescription>
          </Alert>
        )}

        {status === 'success' && (
          <>
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Camera is working correctly!
              </AlertDescription>
            </Alert>
            <video
              ref={videoRef}
              className="w-full rounded-lg"
              autoPlay
              playsInline
              muted
            />
            <Button onClick={stopCamera} variant="outline" className="w-full">
              Stop Camera
            </Button>
          </>
        )}

        {status === 'error' && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              Camera Error: {errorMessage}
            </AlertDescription>
          </Alert>
        )}

        {/* Diagnostic Information */}
        <div className="space-y-2 text-sm">
          <div>
            <strong>HTTPS Status:</strong> {location.protocol === 'https:' ? '✅ Secure' : '❌ Not Secure (Required for camera)'}
          </div>
          {permissions && (
            <div>
              <strong>Camera Permission:</strong> {permissions}
            </div>
          )}
          {devices.length > 0 && (
            <div>
              <strong>Available Cameras:</strong>
              <ul className="ml-4 mt-1">
                {devices.map((device, index) => (
                  <li key={device.deviceId}>
                    {index + 1}. {device.label || `Camera ${index + 1}`}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Solutions */}
        {status === 'error' && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-semibold mb-2">Possible Solutions:</h4>
            <ul className="text-sm space-y-1">
              <li>• Ensure you're using HTTPS (not HTTP)</li>
              <li>• Check browser camera permissions</li>
              <li>• Close other apps using the camera</li>
              <li>• Try refreshing the page</li>
              <li>• Try a different browser</li>
              <li>• Check if camera is physically blocked</li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}