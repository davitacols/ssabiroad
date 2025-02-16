"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import DashboardHeader from "./components/DashboardHeader";
import BuildingDetector from "./components/BuildingDetector";
import StatsGrid from "./components/StatsGrid";
import ActivityChart from "./components/ActivityChart";
import RecentDetectionsCard from "./components/RecentDetectionsCard";
import BuildingInfoCard from "./components/BuildingInfoCard";
import { fetchUserData, fetchStats, fetchRecentDetections } from "./utils/api";
import {
  updateStats,
  addRecentDetection,
  updateUsageData,
} from "./utils/dataHelpers";
import LocationSearch from "./components/LocationSearch";

interface Location {
  lat: number;
  lng: number;
  accuracy: number;
  timestamp: number;
}

export default function Dashboard() {
  const router = useRouter();
  const [userName, setUserName] = useState("User");
  const [showResult, setShowResult] = useState(false);
  const [detectionResult, setDetectionResult] = useState(null);
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [locationHistory, setLocationHistory] = useState<Location[]>([]);
  const [stats, setStats] = useState({
    totalDetections: 0,
    savedBuildings: 0,
    detectionAccuracy: 0,
    detectionHistory: 0,
  });
  const [recentDetections, setRecentDetections] = useState([]);
  const [usageData, setUsageData] = useState([
    { day: "Mon", detections: 12 },
    { day: "Tue", detections: 18 },
    { day: "Wed", detections: 15 },
    { day: "Thu", detections: 25 },
    { day: "Fri", detections: 20 },
    { day: "Sat", detections: 30 },
    { day: "Sun", detections: 22 },
  ]);
  const [theme, setTheme] = useState("system");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    fetchInitialData();
    applyTheme();
  }, []);

  const applyTheme = () => {
    if (theme === "system") {
      if (
        window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: dark)").matches
      ) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    } else if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  useEffect(() => {
    applyTheme();
  }, [theme]);

  const handleLocationUpdate = (newLocation: Location) => {
    setCurrentLocation(newLocation);

    if (
      locationHistory.length === 0 ||
      calculateDistance(
        locationHistory[locationHistory.length - 1],
        newLocation
      ) > 10
    ) {
      setLocationHistory((prev) => [...prev, newLocation]);
    }
  };

  const calculateDistance = (loc1: Location, loc2: Location) => {
    const R = 6371e3;
    const φ1 = (loc1.lat * Math.PI) / 180;
    const φ2 = (loc2.lat * Math.PI) / 180;
    const Δφ = ((loc2.lat - loc1.lat) * Math.PI) / 180;
    const Δλ = ((loc2.lng - loc1.lng) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  const fetchInitialData = async () => {
    setFetchState({ loading: true, error: null });
    
    try {
      // Fetch data in parallel but handle each response independently
      const userDataPromise = fetchUserData()
        .then(data => setUserName(data.name))
        .catch(error => {
          console.error("Error fetching user data:", error);
          setUserName("Guest");
        });

      const statsPromise = fetchStats()
        .then(data => setStats(data))
        .catch(error => {
          console.error("Error fetching stats:", error);
          // Keep default stats
        });

      const detectionsPromise = fetchRecentDetections()
        .then(data => {
          if (data && data.length > 0) {
            setRecentDetections(data);
          }
        })
        .catch(error => {
          console.error("Error fetching recent detections:", error);
          // Keep fallback detections
        });

      // Wait for all promises to settle (regardless of success/failure)
      await Promise.allSettled([userDataPromise, statsPromise, detectionsPromise]);
      
      setFetchState({ loading: false, error: null });
    } catch (error) {
      setFetchState({ 
        loading: false, 
        error: "Unable to load some dashboard data. Please try refreshing the page."
      });
    }
  };

  const handleRetry = () => {
    fetchInitialData();
  };

  const handleDetectionComplete = (result) => {
    setDetectionResult(result);
    setShowResult(true);

    if (result.success) {
      const detectionWithLocation = {
        ...result,
        location: currentLocation,
      };

      setStats((prevStats) => updateStats(prevStats, detectionWithLocation));
      setRecentDetections((prevDetections) =>
        addRecentDetection(prevDetections, detectionWithLocation)
      );
      setUsageData((prevData) => updateUsageData(prevData));
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-200">
      {/* Responsive Header */}
      <header className="sticky top-0 z-50 bg-white dark:bg-gray-800 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-bold">Dashboard</h1>
            
            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 md:hidden"
            >
              <span className="sr-only">Open main menu</span>
              <svg
                className="block h-6 w-6"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>

            {/* Desktop navigation */}
            <div className="hidden md:flex items-center space-x-4">
              <select
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                className="p-2 bg-gray-200 dark:bg-gray-700 rounded"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="system">System</option>
              </select>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        <div className={`${isMobileMenuOpen ? 'block' : 'hidden'} md:hidden`}>
          <div className="px-2 pt-2 pb-3 space-y-1">
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              className="w-full p-2 bg-gray-200 dark:bg-gray-700 rounded"
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="system">System</option>
            </select>
          </div>
        </div>
      </header>

      <DashboardHeader
        onLogout={handleLogout}
        onNavigate={(path) => router.push(path)}
        currentLocation={currentLocation}
        onLocationUpdate={handleLocationUpdate}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 lg:py-20">
        <div className="space-y-6 sm:space-y-8">
          {/* Welcome Section */}
          <div className="text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight">
              Welcome back, {userName}! 👋
            </h1>
            <p className="mt-2 text-base sm:text-lg">
              Ready to explore cities far and near you? 🌍
            </p>
          </div>

          {/* Location Search */}
          <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-md">
            <LocationSearch onSelectLocation={handleLocationUpdate} />
          </div>

          {/* Building Detector */}
          <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-md">
            <BuildingDetector
              onDetectionComplete={handleDetectionComplete}
              currentLocation={currentLocation}
            />
          </div>

          {/* Detection Result */}
          {showResult && detectionResult && (
            <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-md">
              <BuildingInfoCard detectionResult={detectionResult} />
            </div>
          )}

          {/* Stats Grid */}
          <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-md">
            <StatsGrid stats={stats} />
          </div>

          {/* Charts and Recent Detections */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
            <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-md">
              <ActivityChart data={usageData} />
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-md">
              <RecentDetectionsCard detections={recentDetections} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}