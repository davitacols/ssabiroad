"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import DashboardHeader from "./components/DashboardHeader";
import BuildingDetector from "./components/BuildingDetector";
import StatsGrid from "./components/StatsGrid";
import BuildingInfoCard from "./components/BuildingInfoCard";
import ActivityChart from "./components/ActivityChart";
import RecentDetectionsCard from "./components/RecentDetectionsCard";
import LocationSearch from "./components/LocationSearch";
import { Bell, Settings, Search } from "lucide-react";
import { fetchUserData, fetchStats, fetchRecentDetections } from "./utils/api";
import {
  updateStats,
  addRecentDetection,
  updateUsageData,
} from "./utils/dataHelpers";

interface Location {
  lat: number;
  lng: number;
  accuracy: number;
  timestamp: number;
}

interface LocationDetails {
  name: string;
  formattedAddress: string;
  location: {
    lat: number;
    lng: number;
  };
  placeId: string;
  types: string[];
  website?: string;
  phoneNumber?: string;
  rating?: number;
  userRatingsTotal?: number;
}

export default function Dashboard() {
  const [userName, setUserName] = useState("");
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
  const router = useRouter();
  const [theme, setTheme] = useState("system");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [fetchState, setFetchState] = useState({ loading: true, error: null });
  const [locationDetails, setLocationDetails] = useState<LocationDetails | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    fetchInitialData();
    applyTheme();

    // Add scroll event listener
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
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

    // Fetch location details and set them
    fetchLocationDetails(newLocation);
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

  const fetchLocationDetails = async (location: Location) => {
    try {
      const response = await fetch(`/api/location-search?query=${location.lat},${location.lng}`);
      if (!response.ok) {
        throw new Error("Failed to fetch location details");
      }
      const data: LocationDetails = await response.json();
      setLocationDetails(data);
    } catch (error) {
      console.error("Error fetching location details:", error);
    }
  };

  const fetchInitialData = async () => {
    setFetchState({ loading: true, error: null });

    try {
      // Fetch data in parallel but handle each response independently
      const userDataPromise = fetchUserData()
        .then((data) => setUserName(data.username))
        .catch((error) => {
          console.error("Error fetching user data:", error);
          setUserName("");
        });

      const statsPromise = fetchStats()
        .then((data) => setStats(data))
        .catch((error) => {
          console.error("Error fetching stats:", error);
          // Keep default stats
        });

      const detectionsPromise = fetchRecentDetections()
        .then((data) => {
          if (data && data.length > 0) {
            setRecentDetections(data);
          }
        })
        .catch((error) => {
          console.error("Error fetching recent detections:", error);
          // Keep fallback detections
        });

      // Wait for all promises to settle (regardless of success/failure)
      await Promise.allSettled([
        userDataPromise,
        statsPromise,
        detectionsPromise,
      ]);

      setFetchState({ loading: false, error: null });
    } catch (error) {
      setFetchState({
        loading: false,
        error:
          "Unable to load some dashboard data. Please try refreshing the page.",
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
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Fixed Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto">
          <DashboardHeader
            onLogout={handleLogout}
            onNavigate={(path) => router.push(path)}
            currentLocation={currentLocation}
            onLocationUpdate={handleLocationUpdate}
          />
        </div>
      </header>

      {/* Main Content with Proper Spacing */}
      <main className="flex-1 mt-16 pt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Welcome Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {userName ? `Welcome back, ${userName}! 👋` : "Welcome! 👋"}
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Ready to explore cities far and near you? 🌍
            </p>
          </div>

          {/* Content Grid */}
          <div className="space-y-6">
            {/* Location Search */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
              <LocationSearch onSelectLocation={handleLocationUpdate} />
            </div>

            {/* Building Detector */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
              <BuildingDetector
                onDetectionComplete={handleDetectionComplete}
                currentLocation={currentLocation}
              />
            </div>

            {/* Detection Result */}
            {showResult && detectionResult && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
                <BuildingInfoCard detectionResult={detectionResult} />
              </div>
            )}

            {/* Stats Grid */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
              <StatsGrid stats={stats} />
            </div>

            {/* Charts and Recent Detections */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
                <ActivityChart data={usageData} />
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
                <RecentDetectionsCard detections={recentDetections} />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}