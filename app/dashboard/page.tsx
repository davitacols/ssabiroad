"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import DashboardHeader from "./components/DashboardHeader"
import BuildingDetector from "./components/BuildingDetector"
import StatsGrid from "./components/StatsGrid"
import ActivityChart from "./components/ActivityChart"
import RecentDetectionsCard from "./components/RecentDetectionsCard"
import DetectionResultDialog from "./components/DetectionResultDialog"
import { fetchUserData, fetchStats, fetchRecentDetections } from "./utils/api"
import { updateStats, addRecentDetection, updateUsageData } from "./utils/dataHelpers"

export default function Dashboard() {
  const router = useRouter()
  const [userName, setUserName] = useState("User")
  const [showResult, setShowResult] = useState(false)
  const [detectionResult, setDetectionResult] = useState(null)
  const [currentLocation, setCurrentLocation] = useState(null)
  const [locationError, setLocationError] = useState(null)
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
    initializeLocationTracking()
    fetchInitialData()
  }, [])

  const initializeLocationTracking = () => {
    if (navigator.geolocation) {
      navigator.geolocation.watchPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
          })
        },
        (error) => {
          setLocationError(error.message)
        },
        { enableHighAccuracy: true },
      )
    }
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
      setStats((prevStats) => updateStats(prevStats, result))
      setRecentDetections((prevDetections) => addRecentDetection(prevDetections, result))
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <DashboardHeader onLogout={handleLogout} onNavigate={(path) => router.push(path)} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 gap-8">
          <div className="mt-4">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Welcome back, {userName}! 👋</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Ready to explore more buildings today? Start by capturing or uploading a photo.
            </p>
          </div>

          <BuildingDetector onDetectionComplete={handleDetectionComplete} currentLocation={currentLocation} />

          <StatsGrid stats={stats} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ActivityChart data={usageData} />
            <RecentDetectionsCard detections={recentDetections} />
          </div>
        </div>
      </main>

      <DetectionResultDialog showResult={showResult} setShowResult={setShowResult} detectionResult={detectionResult} />
    </div>
  )
}

