"use client"

import React, { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import {
  Camera,
  Upload,
  Building,
  Loader2,
  Settings,
  LogOut,
  Navigation,
  Star,
  History,
  Info,
  MapPin,
  ChevronRight,
  Menu,
  X,
  Search,
  BarChart3,
  ListFilter
} from "lucide-react"

// Types
interface Location {
  lat: number
  lng: number
}

interface DetectionResult {
  success: boolean
  confidence: number
  description?: string
  address?: string
  features?: {
    architecture?: string[]
    materials?: string[]
    style?: string[]
  }
  location?: Location
}

interface UsageStats {
  day: string
  detections: number
}

interface RecentDetection {
  id: number
  building: string
  time: string
  confidence: number
  imageUrl?: string
}

const DashboardHeader = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg dark:bg-gray-900/80 border-b border-gray-200 dark:border-gray-800">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              BuildingAI
            </span>
            <div className="hidden md:flex items-center gap-6">
              <Button variant="ghost" className="text-gray-600 hover:text-gray-900">Dashboard</Button>
              <Button variant="ghost" className="text-gray-600 hover:text-gray-900">History</Button>
              <Button variant="ghost" className="text-gray-600 hover:text-gray-900">Saved</Button>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search buildings..."
                className="pl-10 pr-4 py-2 rounded-full bg-gray-100 dark:bg-gray-800 border-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <Button variant="ghost" size="icon">
              <Settings className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon">
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </nav>
    </header>
  )
}

const BuildingDetector = ({ onDetectionComplete, currentLocation }) => {
  const [isCapturing, setIsCapturing] = useState(false)
  const [image, setImage] = useState(null)
  const [preview, setPreview] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  
  const fileInputRef = useRef(null)
  const videoRef = useRef(null)
  const canvasRef = useRef(null)

  useEffect(() => {
    return () => {
      if (preview) {
        URL.revokeObjectURL(preview)
      }
      stopCamera()
    }
  }, [preview])

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }
      })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        setIsCapturing(true)
      }
    } catch (err) {
      setError("Camera access denied. Please check permissions.")
    }
  }

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject
      stream.getTracks().forEach(track => track.stop())
      videoRef.current.srcObject = null
      setIsCapturing(false)
    }
  }

  const resetState = () => {
    if (preview) {
      URL.revokeObjectURL(preview)
    }
    setImage(null)
    setPreview("")
    setError("")
    stopCamera()
  }


  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current
      const canvas = canvasRef.current
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight

      const context = canvas.getContext("2d")
      if (!context) return

      context.drawImage(video, 0, 0)

      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], "photo.jpg", { type: "image/jpeg" })
          setImage(file)
          setPreview(URL.createObjectURL(blob))
          stopCamera()
        }
      }, "image/jpeg")
    }
  }

  const handleFileUpload = (event) => {
    const file = event.target.files?.[0]
    if (file) {
      if (preview) {
        URL.revokeObjectURL(preview)
      }
      setImage(file)
      setPreview(URL.createObjectURL(file))
      setError("")
    }
  }

  const handleDetection = async () => {
    if (!image) return
  
    setLoading(true)
    setError("")
  
    try {
      const formData = new FormData();
      formData.append('image', image); // ✅ Use 'image' state variable
      if (currentLocation) {
        formData.append('currentLat', currentLocation.lat.toString());
        formData.append('currentLng', currentLocation.lng.toString());
      }
  
      const response = await fetch('/api/process-image', {
        method: 'POST',
        body: formData
      });
  
      if (!response.ok) throw new Error("Failed to process image")
  
      const result = await response.json()
      onDetectionComplete(result)
      
      // Reset state after successful detection
      setImage(null)
      setPreview("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to analyze building")
    } finally {
      setLoading(false)
    }
  }
  

  return (
    <Card className="bg-white/50 backdrop-blur-xl border-0 shadow-lg dark:bg-gray-900/50">
      <CardContent className="p-8">
        <div className="space-y-8">
          {error && (
            <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {!isCapturing && !preview && (
            <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl bg-gray-50/50 dark:bg-gray-800/50">
              <Building className="w-12 h-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                Start Detection
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-6">
                Take a photo or upload an image of a building to identify it
              </p>
              <div className="flex gap-4">
                <Button 
                  variant="outline"
                  onClick={startCamera}
                  className="flex items-center gap-2"
                >
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
                <img src={preview} alt="Preview" className="w-full aspect-video object-cover" />
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={resetState}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <Button
                onClick={handleDetection}
                disabled={loading}
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

const StatsCard = ({ title, value, change, icon: Icon }) => (
  <Card className="bg-white/50 backdrop-blur-xl border-0 shadow-lg dark:bg-gray-900/50">
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-semibold mt-1 text-gray-900 dark:text-gray-100">{value}</p>
        </div>
        <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
          <Icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        </div>
      </div>
      <div className="mt-4 flex items-center">
        <span className={`text-sm ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {change >= 0 ? '+' : ''}{change}%
        </span>
        <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">from last month</span>
      </div>
    </CardContent>
  </Card>
)

const RecentDetectionsCard = ({ detections }) => (
  <Card className="bg-white/50 backdrop-blur-xl border-0 shadow-lg dark:bg-gray-900/50">
    <CardHeader>
      <div className="flex items-center justify-between">
        <CardTitle>Recent Detections</CardTitle>
        <Button variant="ghost" size="icon">
          <ListFilter className="w-4 h-4" />
        </Button>
      </div>
    </CardHeader>
    <CardContent>
      <div className="space-y-4">
        {detections.map((detection) => (
          <div 
            key={detection.id}
            className="flex items-center p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors cursor-pointer"
          >
            {detection.imageUrl ? (
              <img 
                src={detection.imageUrl} 
                alt={detection.building}
                className="w-12 h-12 rounded-lg object-cover mr-3"
              />
            ) : (
              <Building className="w-8 h-8 text-blue-600 mr-3" />
            )}
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{detection.building}</p>
              <p className="text-sm text-gray-500">{detection.time}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-blue-600">
                {(detection.confidence * 100).toFixed(0)}%
              </span>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </div>
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
)

const ActivityChart = ({ data }) => (
  <Card className="bg-white/50 backdrop-blur-xl border-0 shadow-lg dark:bg-gray-900/50">
    <CardHeader>
      <div className="flex items-center justify-between">
        <CardTitle>Detection Activity</CardTitle>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm">Day</Button>
          <Button variant="ghost" size="sm">Week</Button>
          <Button variant="ghost" size="sm">Month</Button>
        </div>
      </div>
    </CardHeader>
    <CardContent>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="day" 
              stroke="#6b7280"
              tick={{ fill: '#6b7280' }}
              tickLine={{ stroke: '#6b7280' }}
            />
            <YAxis
              stroke="#6b7280"
              tick={{ fill: '#6b7280' }}
              tickLine={{ stroke: '#6b7280' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                borderRadius: '8px',
                border: 'none',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                padding: '12px'
              }}
              labelStyle={{ color: '#374151' }}
            />
            <Line
              type="monotone"
              dataKey="detections"
              stroke="#2563eb"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 6, fill: '#2563eb' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </CardContent>
  </Card>
)

const Dashboard = () => {
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null)
  const [detectionResult, setDetectionResult] = useState<DetectionResult | null>(null)
  const [showResult, setShowResult] = useState(false)

  useEffect(() => {
    // Get user's current location
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCurrentLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        })
      },
      (error) => {
        console.error("Error getting location:", error)
      }
    )
  }, [])

  const statsData = [
    { title: "Total Detections", value: "1,234", change: 12.5, icon: BarChart3 },
    { title: "Saved Buildings", value: "56", change: 8.2, icon: Star },
    { title: "Detection Accuracy", value: "94%", change: 3.1, icon: Navigation },
    { title: "Detection History", value: "89", change: -2.4, icon: History }
  ]

  const recentDetections: RecentDetection[] = [
    {
      id: 1,
      building: "Empire State Building",
      time: "2 minutes ago",
      confidence: 0.98,
      imageUrl: "/buildings/empire-state.jpg"
    },
    {
      id: 2,
      building: "Chrysler Building",
      time: "15 minutes ago",
      confidence: 0.95,
      imageUrl: "/buildings/chrysler.jpg"
    },
    {
      id: 3,
      building: "Flatiron Building",
      time: "1 hour ago",
      confidence: 0.92,
      imageUrl: "/buildings/flatiron.jpg"
    }
  ]

  const usageData: UsageStats[] = [
    { day: "Mon", detections: 12 },
    { day: "Tue", detections: 18 },
    { day: "Wed", detections: 15 },
    { day: "Thu", detections: 25 },
    { day: "Fri", detections: 20 },
    { day: "Sat", detections: 14 },
    { day: "Sun", detections: 10 }
  ]

  const handleDetectionComplete = (result: DetectionResult) => {
    setDetectionResult(result)
    setShowResult(true)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <DashboardHeader />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 gap-8">
          <BuildingDetector 
            onDetectionComplete={handleDetectionComplete}
            currentLocation={currentLocation}
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {statsData.map((stat) => (
              <StatsCard key={stat.title} {...stat} />
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ActivityChart data={usageData} />
            <RecentDetectionsCard detections={recentDetections} />
          </div>
        </div>
      </main>

      <Dialog open={showResult} onOpenChange={setShowResult}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detection Result</DialogTitle>
          </DialogHeader>
          {detectionResult && (
            <div className="space-y-4">
              {detectionResult.success ? (
                <>
                  <div className="flex items-center gap-2 text-green-600">
                    <Info className="w-5 h-5" />
                    <span>Building detected with {(detectionResult.confidence * 100).toFixed(1)}% confidence</span>
                  </div>
                  {detectionResult.description && (
                    <p className="text-gray-600 dark:text-gray-300">{detectionResult.description}</p>
                  )}
                  {detectionResult.address && (
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                      <MapPin className="w-5 h-5" />
                      <span>{detectionResult.address}</span>
                    </div>
                  )}
                  {detectionResult.features && (
                    <div className="space-y-2">
                      {Object.entries(detectionResult.features).map(([category, items]) => (
                        <div key={category}>
                          <p className="font-medium capitalize">{category}</p>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {items.map((item) => (
                              <span
                                key={item}
                                className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full text-sm"
                              >
                                {item}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <Alert variant="destructive">
                  <AlertTitle>Detection Failed</AlertTitle>
                  <AlertDescription>
                    Unable to identify the building. Please try again with a clearer image.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default Dashboard