"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import DashboardHeader from "./components/DashboardHeader"
import BuildingDetector from "./components/BuildingDetector"
import StatsGrid from "./components/StatsGrid"
import ActivityChart from "./components/ActivityChart"
import RecentDetectionsCard from "./components/RecentDetectionsCard"
import BuildingInfoCard from "./components/BuildingInfoCard"
import { fetchUserData, fetchStats, fetchRecentDetections } from "./utils/api"
import { updateStats, addRecentDetection, updateUsageData } from "./utils/dataHelpers"
import LocationSearch from "./components/LocationSearch"

interface Location {
  lat: number
  lng: number
  accuracy: number
  timestamp: number
}

export default function Dashboard() {
  const router = useRouter()
  const [userName, setUserName] = useState("User")
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

  useEffect(() => {
    fetchInitialData()
  }, [])

  const handleLocationUpdate = (newLocation: Location) => {
    setCurrentLocation(newLocation)

    if (
      locationHistory.length === 0 ||
      calculateDistance(locationHistory[locationHistory.length - 1], newLocation) > 10
    ) {
      setLocationHistory((prev) => [...prev, newLocation])
    }
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

  const fetchInitialData = async () => {
    try {
      const [userData, statsData, detectionsData] = await Promise.all([
        fetchUserData(),
        fetchStats(),
        fetchRecentDetections(),
      ])
      setUserName(userData.name)
      setStats(statsData)
      setRecentDetections(detectionsData)
    } catch (error) {
      console.error("Error fetching initial data:", error)
    }
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

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-200">
      <DashboardHeader
        onLogout={handleLogout}
        onNavigate={(path) => router.push(path)}
        currentLocation={currentLocation}
        onLocationUpdate={handleLocationUpdate}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 gap-8">
          <div className="mt-4">
            <h1 className="text-4xl font-extrabold tracking-tight">Welcome back, {userName}! 👋</h1>
            <p className="mt-2 text-lg">Ready to explore cities far and near you? 🌍</p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <LocationSearch onSelectLocation={handleLocationUpdate} />
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <BuildingDetector onDetectionComplete={handleDetectionComplete} currentLocation={currentLocation} />
          </div>

          {showResult && detectionResult && (
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
              <BuildingInfoCard detectionResult={detectionResult} />
            </div>
          )}

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <StatsGrid stats={stats} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
              <ActivityChart data={usageData} />
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
              <RecentDetectionsCard detections={recentDetections} />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

