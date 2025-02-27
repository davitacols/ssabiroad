"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { 
  Bell, Settings, Search, Menu, MapPin, 
  Home, Calendar, BarChart2, User, Image, 
  ChevronRight, LogOut, X, Shield 
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { fetchUserData, fetchStats, fetchRecentDetections } from "./utils/api"
import { updateStats, addRecentDetection, updateUsageData } from "./utils/dataHelpers"

// Import the components we want to keep
import BuildingDetector from "./components/BuildingDetector"
import LocationSearch from "./components/LocationSearch"

interface Location {
  lat: number
  lng: number
  accuracy: number
  timestamp: number
}

interface LocationDetails {
  name: string
  formattedAddress: string
  location: {
    lat: number
    lng: number
  }
  placeId: string
  types: string[]
  website?: string
  phoneNumber?: string
  rating?: number
  userRatingsTotal?: number
}

export default function Dashboard() {
  const [userName, setUserName] = useState("")
  const [userEmail, setUserEmail] = useState("user@example.com")
  const [showResult, setShowResult] = useState(false)
  const [detectionResult, setDetectionResult] = useState(null)
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null)
  const [locationHistory, setLocationHistory] = useState<Location[]>([])
  const [stats, setStats] = useState({
    totalDetections: 0,
    savedBuildings: 0,
    detectionAccuracy: 0,
    detectionHistory: 0,
  })
  const [recentDetections, setRecentDetections] = useState([])
  const [usageData, setUsageData] = useState([
    { day: "Mon", detections: 12 },
    { day: "Tue", detections: 18 },
    { day: "Wed", detections: 15 },
    { day: "Thu", detections: 25 },
    { day: "Fri", detections: 20 },
    { day: "Sat", detections: 30 },
    { day: "Sun", detections: 22 },
  ])
  const router = useRouter()
  const [theme, setTheme] = useState("system")
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [fetchState, setFetchState] = useState({ loading: true, error: null })
  const [locationDetails, setLocationDetails] = useState<LocationDetails | null>(null)
  const [isScrolled, setIsScrolled] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isLoadingLocation, setIsLoadingLocation] = useState(false)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("overview")

  useEffect(() => {
    fetchInitialData()
    applyTheme()
    getCurrentLocation()

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener("scroll", handleScroll)

    return () => {
      window.removeEventListener("scroll", handleScroll)
    }
  }, [])

  const getCurrentLocation = () => {
    setIsLoadingLocation(true)
    setLocationError(null)
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp
          }
          handleLocationUpdate(newLocation)
          setIsLoadingLocation(false)
        },
        (error) => {
          console.error("Error getting location:", error)
          setLocationError("Failed to get your current location. Please try again or search manually.")
          setIsLoadingLocation(false)
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
      )
    } else {
      setLocationError("Geolocation is not supported by your browser.")
      setIsLoadingLocation(false)
    }
  }

  const applyTheme = () => {
    if (theme === "system") {
      if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
        document.documentElement.classList.add("dark")
      } else {
        document.documentElement.classList.remove("dark")
      }
    } else if (theme === "dark") {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }

  useEffect(() => {
    applyTheme()
  }, [theme])

  const handleLocationUpdate = (newLocation: Location) => {
    setCurrentLocation(newLocation)

    if (
      locationHistory.length === 0 ||
      calculateDistance(locationHistory[locationHistory.length - 1], newLocation) > 10
    ) {
      setLocationHistory((prev) => [...prev, newLocation])
    }

    fetchLocationDetails(newLocation)
  }

  const calculateDistance = (loc1: Location, loc2: Location) => {
    const R = 6371e3
    const φ1 = (loc1.lat * Math.PI) / 180
    const φ2 = (loc2.lat * Math.PI) / 180
    const Δφ = ((loc2.lat - loc1.lat) * Math.PI) / 180
    const Δλ = ((loc2.lng - loc1.lng) * Math.PI) / 180

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

    return R * c
  }

  const fetchLocationDetails = async (location: Location) => {
    try {
      const response = await fetch(`/api/location-search?query=${location.lat},${location.lng}`)
      if (!response.ok) {
        throw new Error("Failed to fetch location details")
      }
      const data: LocationDetails = await response.json()
      setLocationDetails(data)
    } catch (error) {
      console.error("Error fetching location details:", error)
    }
  }

  const fetchInitialData = async () => {
    setFetchState({ loading: true, error: null })

    try {
      const userDataPromise = fetchUserData()
        .then((data) => {
          setUserName(data.username)
          if (data.email) setUserEmail(data.email)
        })
        .catch((error) => {
          console.error("Error fetching user data:", error)
          setUserName("")
        })

      const statsPromise = fetchStats()
        .then((data) => setStats(data))
        .catch((error) => {
          console.error("Error fetching stats:", error)
        })

      const detectionsPromise = fetchRecentDetections()
        .then((data) => {
          if (data && data.length > 0) {
            setRecentDetections(data)
          }
        })
        .catch((error) => {
          console.error("Error fetching recent detections:", error)
        })

      await Promise.allSettled([userDataPromise, statsPromise, detectionsPromise])

      setFetchState({ loading: false, error: null })
    } catch (error) {
      setFetchState({
        loading: false,
        error: "Unable to load some dashboard data. Please try refreshing the page.",
      })
    }
  }

  const handleRetry = () => {
    fetchInitialData()
  }

  const handleDetectionComplete = (result) => {
    setDetectionResult(result)
    setShowResult(true)

    if (result.success) {
      const detectionWithLocation = {
        ...result,
        location: currentLocation,
      }

      setStats((prevStats) => updateStats(prevStats, detectionWithLocation))
      setRecentDetections((prevDetections) => addRecentDetection(prevDetections, detectionWithLocation))
      setUsageData((prevData) => updateUsageData(prevData))
    }
  }

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" })
      router.push("/login")
    } catch (error) {
      console.error("Logout failed:", error)
    }
  }

  const sidebarItems = [
    { icon: Home, label: "Dashboard", active: true },
    { icon: MapPin, label: "Locations", active: false },
    { icon: Image, label: "Detections", active: false },
    { icon: Calendar, label: "History", active: false },
    { icon: BarChart2, label: "Analytics", active: false },
    { icon: Shield, label: "Privacy", active: false },
    { icon: Settings, label: "Settings", active: false },
  ]

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Revamped Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-card/80 backdrop-blur-md border-r border-border transform transition-transform duration-200 ease-in-out ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
      >
        <div className="flex items-center justify-between h-16 px-6 border-b border-border">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-indigo-600 bg-clip-text text-transparent">SabiRoad</h1>
          <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(false)} className="lg:hidden">
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        <div className="px-4 py-6">
          <div className="flex items-center space-x-3 mb-8">
            <Avatar className="h-10 w-10 border-2 border-primary">
              <AvatarImage src="/avatars/01.png" alt={userName} />
              <AvatarFallback className="bg-primary-foreground text-primary">{userName ? userName.charAt(0) : "U"}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{userName || "User"}</p>
              <p className="text-xs text-muted-foreground">{userEmail}</p>
            </div>
          </div>

          <nav>
            <ul className="space-y-1">
              {sidebarItems.map((item, index) => (
                <li key={index}>
                  <Button 
                    variant={item.active ? "default" : "ghost"} 
                    className={`w-full justify-start py-2 ${item.active ? "bg-primary/10 text-primary hover:bg-primary/20" : ""}`}
                  >
                    <item.icon className={`mr-3 h-4 w-4 ${item.active ? "text-primary" : ""}`} />
                    {item.label}
                  </Button>
                </li>
              ))}
            </ul>
          </nav>

          <div className="absolute bottom-8 left-0 right-0 px-4">
            <Button 
              variant="outline" 
              className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
              onClick={handleLogout}
            >
              <LogOut className="mr-3 h-4 w-4" />
              Log out
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col lg:pl-64">
        {/* Enhanced Header */}
        <header className={`sticky top-0 z-40 bg-background/80 backdrop-blur-md transition-all duration-200 ${
          isScrolled ? "border-b border-border shadow-sm" : ""
        }`}>
          <div className="flex items-center justify-between h-16 px-6">
            <div className="flex items-center">
              <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(true)} className="lg:hidden">
                <Menu className="h-5 w-5" />
              </Button>
              <h2 className="ml-4 text-xl font-semibold">Dashboard</h2>
            </div>
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500"></span>
                </Button>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8 border border-primary/20">
                      <AvatarImage src="/avatars/01.png" alt={userName} />
                      <AvatarFallback>{userName ? userName.charAt(0) : "U"}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{userName}</p>
                      <p className="text-xs leading-none text-muted-foreground">{userEmail}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-500 focus:text-red-500">
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Main content area with improved layout and components */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6 max-w-7xl mx-auto">
            {/* Welcome message with current location */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">{userName ? `Welcome back, ${userName}! 👋` : "Welcome! 👋"}</h1>
                <p className="text-muted-foreground mt-1">Ready to explore cities far and near you? 🌍</p>
              </div>
              
              {locationDetails ? (
                <div className="flex items-center p-2 rounded-full bg-primary/10 text-primary">
                  <MapPin className="h-4 w-4 mr-2" />
                  <span className="text-sm font-medium">{locationDetails.name || "Current Location"}</span>
                </div>
              ) : (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={getCurrentLocation}
                  disabled={isLoadingLocation}
                >
                  {isLoadingLocation ? (
                    <>Getting Location...</>
                  ) : (
                    <>
                      <MapPin className="h-4 w-4 mr-2" />
                      Get Current Location
                    </>
                  )}
                </Button>
              )}
            </div>
            
            {/* Location error message */}
            {locationError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg dark:bg-red-900/30 dark:border-red-800 dark:text-red-400">
                <p className="flex items-center text-sm">
                  <X className="h-4 w-4 mr-2" />
                  {locationError}
                </p>
              </div>
            )}

            {/* Main action cards in a two-column layout */}
            <div className="grid gap-6 md:grid-cols-2">
              {/* Location Search */}
              <Card className="overflow-hidden border-border/50 shadow-md">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center">
                      <MapPin className="h-5 w-5 mr-2 text-primary" />
                      Search Location
                    </CardTitle>
                    <Badge variant="outline" className="bg-background/50 backdrop-blur-sm">
                      {currentLocation ? "Location Set" : "No Location"}
                    </Badge>
                  </div>
                  <CardDescription>Find and set a specific location for building detection</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <LocationSearch onSelectLocation={handleLocationUpdate} />
                  
                  {currentLocation && (
                    <div className="mt-4 p-3 bg-muted/50 rounded-md text-sm">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">Current Coordinates:</span>
                        <Badge variant="secondary" className="text-xs">
                          Accuracy: {currentLocation.accuracy.toFixed(1)}m
                        </Badge>
                      </div>
                      <div className="flex gap-2 text-xs text-muted-foreground">
                        <span>Lat: {currentLocation.lat.toFixed(6)}</span>
                        <span>•</span>
                        <span>Lng: {currentLocation.lng.toFixed(6)}</span>
                      </div>
                      {locationDetails && (
                        <div className="mt-2 pt-2 border-t border-border/50">
                          <p className="font-medium text-sm">{locationDetails.name}</p>
                          <p className="text-xs text-muted-foreground mt-1">{locationDetails.formattedAddress}</p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Building Detector */}
              <Card className="overflow-hidden border-border/50 shadow-md">
                <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center">
                      <Image className="h-5 w-5 mr-2 text-primary" />
                      Detect Building
                    </CardTitle>
                    <Badge variant={currentLocation ? "default" : "secondary"} className={!currentLocation ? "bg-muted" : ""}>
                      {currentLocation ? "Ready" : "Set Location First"}
                    </Badge>
                  </div>
                  <CardDescription>Upload or take a photo to identify a building</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <BuildingDetector 
                    onDetectionComplete={handleDetectionComplete} 
                    currentLocation={currentLocation} 
                  />
                </CardContent>
              </Card>
            </div>

            {/* Detection Result */}
            {showResult && detectionResult && (
              <Card className="border-primary/20 bg-gradient-to-b from-background to-primary/5 shadow-lg">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center">
                      <Search className="h-5 w-5 mr-2 text-primary" />
                      Detection Result
                    </CardTitle>
                    <Badge variant={detectionResult.success ? "default" : "destructive"}>
                      {detectionResult.success ? "Success" : "Failed"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="bg-card p-4 rounded-md overflow-x-auto border border-border/50">
                    <pre className="text-sm">
                      {JSON.stringify(detectionResult, null, 2)}
                    </pre>
                  </div>
                  
                  {detectionResult.success && detectionResult.buildingDetails && (
                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <h3 className="font-semibold">Building Information</h3>
                        <p className="text-sm">{detectionResult.buildingDetails.name || "Unknown Building"}</p>
                        <p className="text-xs text-muted-foreground">{detectionResult.buildingDetails.address || "No address available"}</p>
                      </div>
                      <div>
                        <h3 className="font-semibold mb-2">Confidence Score</h3>
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span>Recognition Accuracy</span>
                            <span className="font-medium">{detectionResult.confidence || 0}%</span>
                          </div>
                          <Progress value={detectionResult.confidence || 0} className="h-2" />
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Stats grid with improved styling */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow duration-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Detections</CardTitle>
                  <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <Search className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalDetections}</div>
                  <div className="flex items-center mt-1">
                    <ChevronRight className="h-3 w-3 rotate-90 text-green-500" />
                    <p className="text-xs text-green-500">+20.1% from last month</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow duration-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Saved Buildings</CardTitle>
                  <div className="h-8 w-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                    <Bell className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.savedBuildings}</div>
                  <div className="flex items-center mt-1">
                    <ChevronRight className="h-3 w-3 rotate-90 text-green-500" />
                    <p className="text-xs text-green-500">+180.1% from last month</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow duration-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Detection Accuracy</CardTitle>
                  <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <Settings className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.detectionAccuracy}%</div>
                  <div className="flex items-center mt-1">
                    <ChevronRight className="h-3 w-3 rotate-90 text-green-500" />
                    <p className="text-xs text-green-500">+5% from last month</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow duration-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Detection History</CardTitle>
                  <div className="h-8 w-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                    <Calendar className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.detectionHistory}</div>
                  <div className="flex items-center mt-1">
                    <ChevronRight className="h-3 w-3 rotate-90 text-green-500" />
                    <p className="text-xs text-green-500">+201 since last hour</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Improved Tabs for different sections */}
            <Card className="overflow-hidden border-border/50 shadow-lg">
              <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="w-full">
                <CardHeader className="pb-0">
                  <TabsList className="grid grid-cols-4 w-full md:w-auto md:inline-flex">
                    <TabsTrigger value="overview" className="rounded-md">Overview</TabsTrigger>
                    <TabsTrigger value="analytics" className="rounded-md">Analytics</TabsTrigger>
                    <TabsTrigger value="reports" className="rounded-md">Reports</TabsTrigger>
                    <TabsTrigger value="notifications" className="rounded-md">Notifications</TabsTrigger>
                  </TabsList>
                </CardHeader>
                <CardContent className="pt-6">
                  <TabsContent value="overview" className="space-y-4 mt-0">
                    <div className="grid gap-6 md:grid-cols-7">
                      <div className="col-span-4 space-y-4">
                        <div>
                          <h3 className="text-lg font-semibold mb-2">Your Activity Summary</h3>
                          <p className="text-sm text-muted-foreground">View a summary of your recent building detections and activity.</p>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-4 bg-muted/50 rounded-lg">
                            <div className="text-xs text-muted-foreground">This Week</div>
                            <div className="text-2xl font-bold mt-1">{stats.totalDetections}</div>
                            <div className="text-sm">Detections</div>
                          </div>
                          <div className="p-4 bg-muted/50 rounded-lg">
                            <div className="text-xs text-muted-foreground">Average</div>
                            <div className="text-2xl font-bold mt-1">{stats.detectionAccuracy}%</div>
                            <div className="text-sm">Accuracy</div>
                          </div>
                        </div>
                        
                        <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-lg">
                          <h4 className="text-sm font-medium mb-2">Weekly Usage</h4>
                          <div className="grid grid-cols-7 gap-1 h-24">
                            {usageData.map((day, i) => (
                              <div key={i} className="flex flex-col items-center justify-end">
                                <div 
                                  className="w-full bg-primary/70 rounded-t-sm" 
                                  style={{ height: `${(day.detections / 30) * 100}%` }}
                                ></div>
                                <span className="text-xs mt-1">{day.day}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="col-span-3 space-y-4">
                        <div>
                          <h3 className="text-lg font-semibold mb-2">Recent Detections</h3>
                          <p className="text-sm text-muted-foreground">Your latest building identifications and locations.</p>
                        </div>

                        <ScrollArea className="h-[350px] rounded-md border p-4">
                          {recentDetections.length > 0 ? (
                            <div className="space-y-4">
                              {recentDetections.map((detection, index) => (
                                <div key={index} className="flex items-start space-x-3 pb-4 border-b border-border/50 last:border-0">
                                  {detection.imageUrl ? (
                                    <div className="w-16 h-16 rounded-md overflow-hidden bg-muted flex-shrink-0">
                                      <img 
                                        src={detection.imageUrl} 
                                        alt="Building"
                                        className="w-full h-full object-cover"
                                      />
                                    </div>
                                  ) : (
                                    <div className="w-16 h-16 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
                                      <Image className="h-6 w-6 text-muted-foreground" />
                                    </div>
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start">
                                      <p className="font-medium truncate">
                                        {detection.buildingDetails?.name || "Unknown Building"}
                                      </p>
                                      <Badge variant={detection.success ? "default" : "secondary"} className="ml-2 flex-shrink-0">
                                        {detection.success ? 
                                          `${detection.confidence || 0}%` : 
                                          "Failed"
                                        }
                                      </Badge>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1 truncate">
                                      {detection.buildingDetails?.address || "No address available"}
                                    </p>
                                    <div className="flex items-center mt-2 text-xs text-muted-foreground">
                                      <MapPin className="h-3 w-3 mr-1" />
                                      <span>
                                        {detection.location && typeof detection.location.lat === 'number' && typeof detection.location.lng === 'number' ? 
                                          `${detection.location.lat.toFixed(4)}, ${detection.location.lng.toFixed(4)}` : 
                                          "No location data"
                                        }
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center h-full py-8 text-center">
                              <div className="rounded-full bg-blue-100 dark:bg-blue-900/30 p-3 mb-3">
                                <Image className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                              </div>
                              <h4 className="text-sm font-medium">No Detections Yet</h4>
                              <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                                Use the building detector to identify buildings around you.
                              </p>
                            </div>
                          )}
                        </ScrollArea>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="analytics" className="mt-0">
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <div className="rounded-full bg-blue-100 dark:bg-blue-900/30 p-3 mb-3">
                        <BarChart2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <h3 className="text-lg font-medium">Analytics Dashboard</h3>
                      <p className="text-sm text-muted-foreground mt-1 max-w-md">
                        Detailed analytics about your building detections, location history, and accuracy will be available soon.
                      </p>
                      <Button className="mt-4" variant="outline" size="sm">
                        Request Early Access
                      </Button>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="reports" className="mt-0">
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <div className="rounded-full bg-blue-100 dark:bg-blue-900/30 p-3 mb-3">
                        <Search className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <h3 className="text-lg font-medium">Custom Reports</h3>
                      <p className="text-sm text-muted-foreground mt-1 max-w-md">
                        Generate and export customized reports of your building detection activities.
                      </p>
                      <Button className="mt-4" variant="outline" size="sm">
                        Coming Soon
                      </Button>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="notifications" className="mt-0">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium">Notifications</h3>
                        <Button variant="outline" size="sm">Mark All as Read</Button>
                      </div>
                      
                      <div className="border rounded-lg divide-y divide-border">
                        <div className="p-4 bg-blue-50/50 dark:bg-blue-900/10">
                          <div className="flex justify-between items-start">
                            <div className="flex space-x-3">
                              <div className="rounded-full bg-blue-100 dark:bg-blue-900/30 p-2">
                                <Bell className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                              </div>
                              <div>
                                <p className="font-medium text-sm">New Feature Added</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  We've added improved location accuracy to help you identify buildings better.
                                </p>
                              </div>
                            </div>
                            <span className="text-xs text-muted-foreground">Just now</span>
                          </div>
                        </div>
                        
                        <div className="p-4">
                          <div className="flex justify-between items-start">
                            <div className="flex space-x-3">
                              <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-2">
                                <Settings className="h-4 w-4 text-green-600 dark:text-green-400" />
                              </div>
                              <div>
                                <p className="font-medium text-sm">Detection Engine Updated</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  Our building detection algorithm has been improved for better accuracy.
                                </p>
                              </div>
                            </div>
                            <span className="text-xs text-muted-foreground">2 days ago</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </CardContent>
              </Tabs>
            </Card>
          </div>
        </main>
        
        {/* Status footer */}
        <footer className="border-t border-border bg-card/50 py-2 px-6">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center space-x-4">
              <span>© 2025 SabiRoad</span>
              <span className="flex items-center">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500 mr-1.5"></span>
                All Systems Operational
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <a href="#" className="hover:text-foreground">Privacy</a>
              <a href="#" className="hover:text-foreground">Terms</a>
              <a href="#" className="hover:text-foreground">Help</a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}