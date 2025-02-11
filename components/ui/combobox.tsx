"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
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
  ListFilter,
  Home,
  Clock,
  BookmarkPlus,
  Sun,
  Moon,
} from "lucide-react"

// Types remain the same as in original code
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

// Initialize Places Autocomplete
const loadGoogleMapsScript = () => {
  const script = document.createElement("script")
  script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`
  script.async = true
  document.head.appendChild(script)
  return new Promise((resolve) => {
    script.onload = resolve
  })
}

const DashboardHeader = ({ isDarkMode, toggleDarkMode }) => {
  const router = useRouter()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [predictions, setPredictions] = useState([])
  const [autocompleteService, setAutocompleteService] = useState(null)

  useEffect(() => {
    loadGoogleMapsScript().then(() => {
      if (window.google) {
        setAutocompleteService(new window.google.maps.places.AutocompleteService())
      }
    })
  }, [])

  useEffect(() => {
    let active = true

    if (!autocompleteService || !searchQuery) {
      setPredictions([])
      return
    }

    const fetchPredictions = async () => {
      const request = {
        input: searchQuery,
        types: ["establishment", "geocode"],
        componentRestrictions: { country: "US" }, // Modify for your needs
      }

      try {
        const response = await new Promise((resolve, reject) => {
          autocompleteService.getPlacePredictions(request, (results, status) => {
            if (status === window.google.maps.places.PlacesServiceStatus.OK) {
              resolve(results)
            } else {
              reject(status)
            }
          })
        })

        if (active) {
          setPredictions(response)
        }
      } catch (error) {
        console.error("Error fetching predictions:", error)
        setPredictions([])
      }
    }

    if (searchQuery.length > 2) {
      fetchPredictions()
    }

    return () => {
      active = false
    }
  }, [searchQuery, autocompleteService])

  const handleNavigation = (path) => {
    router.push(path)
    setIsMenuOpen(false)
  }

  const handleSearchSelect = (prediction) => {
    console.log("Selected:", prediction)
    setSearchQuery(prediction.description)
    // Example: router.push(`/building/${prediction.place_id}`)
  }

  const handleLogout = async () => {
    try {
      // Add your logout logic here
      await fetch("/api/auth/logout", {
        method: "POST",
      })
      router.push("/login")
    } catch (error) {
      console.error("Logout failed:", error)
    }
  }

  const handleSettings = () => {
    router.push("/settings")
  }

  const navItems = [
    { name: "Dashboard", path: "/dashboard", icon: Home },
    { name: "History", path: "/history", icon: Clock },
    { name: "Saved", path: "/saved", icon: BookmarkPlus },
  ]

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl dark:bg-gray-900/90 border-b border-gray-200 dark:border-gray-800 transition-colors duration-300">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <span
              onClick={() => handleNavigation("/")}
              className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent cursor-pointer"
            >
              SabiRoad
            </span>
            <div className="hidden md:flex items-center gap-6">
              {navItems.map((item) => (
                <Button
                  key={item.name}
                  variant="ghost"
                  onClick={() => handleNavigation(item.path)}
                  className="text-gray-600 hover:text-gray-900 hover:bg-gray-100/50 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-800/50 transition-all"
                >
                  <item.icon className="w-4 h-4 mr-2" />
                  {item.name}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative hidden md:block w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search buildings..."
                className="w-full pl-10 pr-4 py-2 rounded-full bg-gray-100 dark:bg-gray-800 border-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
              {predictions.length > 0 && searchQuery && (
                <div className="absolute mt-2 w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
                  {predictions.map((prediction) => (
                    <div
                      key={prediction.place_id}
                      onClick={() => handleSearchSelect(prediction)}
                      className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                    >
                      <p className="text-sm font-medium">{prediction.structured_formatting.main_text}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {prediction.structured_formatting.secondary_text}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleDarkMode}
              className="relative h-10 w-10 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-300"
            >
              <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSettings}
              className="hover:bg-gray-100/50 dark:hover:bg-gray-800/50"
            >
              <Settings className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="hover:bg-gray-100/50 dark:hover:bg-gray-800/50"
            >
              <LogOut className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden hover:bg-gray-100/50 dark:hover:bg-gray-800/50"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 space-y-2 border-t border-gray-200 dark:border-gray-800">
            {navItems.map((item) => (
              <Button
                key={item.name}
                variant="ghost"
                onClick={() => handleNavigation(item.path)}
                className="w-full justify-start text-gray-600 hover:text-gray-900 hover:bg-gray-100/50 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-800/50"
              >
                <item.icon className="w-4 h-4 mr-2" />
                {item.name}
              </Button>
            ))}
          </div>
        )}
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
        video: { facingMode: "environment" },
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
      const formData = new FormData()
      formData.append("image", image)
      if (currentLocation) {
        formData.append("lat", currentLocation.lat.toString())
        formData.append("lng", currentLocation.lng.toString())
      }

      const response = await fetch("/api/process-image", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) throw new Error("Failed to process image")

      const result = await response.json()
      // Include the current location in the result
      onDetectionComplete({
        ...result,
        location: currentLocation,
      })

      // Reset state after successful detection
      setImage(null)
      setPreview("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to analyze building")
    } finally {
      setLoading(false)
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

  return (
    <Card className="bg-white/80 backdrop-blur-2xl border-0 shadow-xl dark:bg-gray-900/80 overflow-hidden transition-all duration-300 hover:shadow-2xl">
      <CardContent className="p-8">
        <div className="space-y-8">
          {error && (
            <Alert variant="destructive" className="animate-in fade-in slide-in-from-top-2">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {!isCapturing && !preview && (
            <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-gray-300/50 dark:border-gray-700/50 rounded-xl bg-gradient-to-b from-gray-50/50 to-white/50 dark:from-gray-800/50 dark:to-gray-900/50 transition-all hover:border-blue-500/50 dark:hover:border-blue-400/50">
              <Building className="w-16 h-16 text-blue-500 mb-4 animate-pulse" />
              <h3 className="text-xl font-medium text-gray-900 dark:text-gray-100 mb-2">Start Detection</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-6 max-w-md">
                Take a photo or upload an image of a building to identify it using our AI
              </p>
              <div className="flex gap-4">
                <Button
                  variant="outline"
                  onClick={startCamera}
                  className="flex items-center gap-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors duration-300"
                >
                  <Camera className="w-4 h-4" />
                  Camera
                </Button>
                <input type="file" accept="image/*" onChange={handleFileUpload} ref={fileInputRef} className="hidden" />
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors duration-300"
                >
                  <Upload className="w-4 h-4" />
                  Upload
                </Button>
              </div>
            </div>
          )}

          {isCapturing && (
            <div className="relative rounded-xl overflow-hidden">
              <video ref={videoRef} autoPlay playsInline className="w-full aspect-video object-cover" />
              <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
                <Button onClick={capturePhoto} className="bg-blue-600 hover:bg-blue-700 transition-colors duration-300">
                  Capture
                </Button>
                <Button
                  onClick={stopCamera}
                  variant="secondary"
                  className="hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-300"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {preview && (
            <div className="space-y-4">
              <div className="relative rounded-xl overflow-hidden">
                <img src={preview || "/placeholder.svg"} alt="Preview" className="w-full aspect-video object-cover" />
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute top-2 right-2 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-300"
                  onClick={resetState}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <Button
                onClick={handleDetection}
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white transition-colors duration-300"
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

// StatsCard component with enhanced animations and gradients
const StatsCard = ({ title, value, change, icon: Icon }) => (
  <Card className="bg-white/80 backdrop-blur-2xl border-0 shadow-xl dark:bg-gray-900/80 overflow-hidden group hover:scale-102 transition-all duration-300">
    <CardContent className="p-6 relative">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 dark:from-blue-500/10 dark:to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <div className="relative flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-semibold mt-1 text-gray-900 dark:text-gray-100">{value}</p>
        </div>
        <div className="p-3 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-lg group-hover:scale-110 transition-transform duration-300">
          <Icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        </div>
      </div>
      <div className="mt-4 flex items-center">
        <span className={`text-sm ${change >= 0 ? "text-green-600" : "text-red-600"}`}>
          {change >= 0 ? "+" : ""}
          {change}%
        </span>
        <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">from last month</span>
      </div>
    </CardContent>
  </Card>
)

const RecentDetectionsCard = ({ detections }) => (
  <Card className="bg-white/50 backdrop-blur-xl border-0 shadow-lg dark:bg-gray-900/50 transition-all duration-300 hover:shadow-xl">
    <CardHeader>
      <div className="flex items-center justify-between">
        <CardTitle>Recent Detections</CardTitle>
        <Button
          variant="ghost"
          size="icon"
          className="hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-300"
        >
          <ListFilter className="w-4 h-4" />
        </Button>
      </div>
    </CardHeader>
    <CardContent>
      <div className="space-y-4">
        {detections.map((detection) => (
          <div
            key={detection.id}
            className="flex items-center p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors duration-300 cursor-pointer"
          >
            {detection.imageUrl ? (
              <Image
                src={detection.imageUrl || "/placeholder.svg"}
                alt={detection.building}
                width={48}
                height={48}
                className="rounded-lg object-cover mr-3"
              />
            ) : (
              <Building className="w-8 h-8 text-blue-600 mr-3" />
            )}
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{detection.building}</p>
              <p className="text-sm text-gray-500">{detection.time}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-blue-600">{(detection.confidence * 100).toFixed(0)}%</span>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </div>
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
)

const ActivityChart = ({ data }) => (
  <Card className="bg-white/50 backdrop-blur-xl border-0 shadow-lg dark:bg-gray-900/50 transition-all duration-300 hover:shadow-xl">
    <CardHeader>
      <div className="flex items-center justify-between">
        <CardTitle>Detection Activity</CardTitle>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-300"
          >
            Day
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-300"
          >
            Week
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-300"
          >
            Month
          </Button>
        </div>
      </div>
    </CardHeader>
    <CardContent>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="day" stroke="#6b7280" tick={{ fill: "#6b7280" }} tickLine={{ stroke: "#6b7280" }} />
            <YAxis stroke="#6b7280" tick={{ fill: "#6b7280" }} tickLine={{ stroke: "#6b7280" }} />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(255, 255, 255, 0.8)",
                borderRadius: "8px",
                border: "none",
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                padding: "12px",
              }}
              labelStyle={{ color: "#374151" }}
            />
            <Line
              type="monotone"
              dataKey="detections"
              stroke="#2563eb"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 6, fill: "#2563eb" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </CardContent>
  </Card>
)

const handleNavigation = (destination) => {
  if (!destination || !currentLocation) return

  const url = `https://www.google.com/maps/dir/?api=1&origin=${currentLocation.lat},${currentLocation.lng}&destination=${destination.lat},${destination.lng}&travelmode=driving`
  window.open(url, "_blank")
}

const Dashboard = () => {
  const [currentLocation, setCurrentLocation] = useState(null)
  const [detectionResult, setDetectionResult] = useState(null)
  const [showResult, setShowResult] = useState(false)
  const [userName, setUserName] = useState("")
  const [isDarkMode, setIsDarkMode] = useState(false)

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme")
    const prefersDarkMode = window.matchMedia("(prefers-color-scheme: dark)").matches

    if (savedTheme === "dark" || (!savedTheme && prefersDarkMode)) {
      setIsDarkMode(true)
      document.documentElement.classList.add("dark")
    } else {
      setIsDarkMode(false)
      document.documentElement.classList.remove("dark")
    }
  }, [])

  useEffect(() => {
    // Get user's current location
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCurrentLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        })
      },
      (error) => {
        console.error("Error getting location:", error)
      },
    )

    // Fetch user data
    const fetchUserData = async () => {
      try {
        const response = await fetch("/api/user", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`, // Assuming token is stored in localStorage
          },
        })

        if (response.status === 401) {
          console.error("Unauthorized! Token may have expired. Redirecting to login...")
          localStorage.removeItem("token") // Clear invalid token
          window.location.href = "/login" // Redirect to login
          return
        }

        const data = await response.json()
        console.log("Fetched user data:", data) // Debugging log
        setUserName(data.user.username) // Adjusted to data.user.username
      } catch (error) {
        console.error("Error fetching user data:", error)
      }
    }

    fetchUserData()
  }, [])

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode)
    document.documentElement.classList.toggle("dark")
    localStorage.setItem("theme", isDarkMode ? "light" : "dark")
  }

  const statsData = [
    { title: "Total Detections", value: "1,234", change: 12.5, icon: BarChart3 },
    { title: "Saved Buildings", value: "56", change: 8.2, icon: Star },
    { title: "Detection Accuracy", value: "94%", change: 3.1, icon: Navigation },
    { title: "Detection History", value: "89", change: -2.4, icon: History },
  ]

  const recentDetections = [
    {
      id: 1,
      building: "Empire State Building",
      time: "2 minutes ago",
      confidence: 0.98,
      imageUrl: "/buildings/empire-state.jpg",
    },
    {
      id: 2,
      building: "Chrysler Building",
      time: "15 minutes ago",
      confidence: 0.95,
      imageUrl: "/buildings/chrysler.jpg",
    },
    {
      id: 3,
      building: "Flatiron Building",
      time: "1 hour ago",
      confidence: 0.92,
      imageUrl: "/buildings/flatiron.jpg",
    },
  ]

  const usageData = [
    { day: "Mon", detections: 12 },
    { day: "Tue", detections: 18 },
    { day: "Wed", detections: 15 },
    { day: "Thu", detections: 25 },
    { day: "Fri", detections: 20 },
    { day: "Sat", detections: 14 },
    { day: "Sun", detections: 10 },
  ]

  const handleDetectionComplete = (result) => {
    setDetectionResult(result)
    setShowResult(true)
  }

  return (
    <div
      className={`min-h-screen ${isDarkMode ? "dark" : ""} bg-gray-50 dark:bg-gray-900 transition-colors duration-300`}
    >
      <DashboardHeader isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 gap-8">
          {/* Welcome Message */}
          <div className="mt-4 mb-2">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Welcome back, {userName || "User"}! 👋</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Ready to explore more buildings today, {userName || "User"}? Start by capturing or uploading a photo.
            </p>
          </div>

          <BuildingDetector onDetectionComplete={handleDetectionComplete} currentLocation={currentLocation} />

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
                    div>
                        </div>
                      ))}
                    </div>
                  )}
                  {detectionResult.location && (
                    <Button
                      onClick={() => handleNavigation(detectionResult.location)}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white transition-colors duration-300"
                    >
                      <Navigation className="w-4 h-4 mr-2" />
                      Navigate to Building
                    </Button>
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

