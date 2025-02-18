"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import DashboardHeader from "./components/DashboardHeader";
import BuildingDetector from "./components/BuildingDetector";
import StatsGrid from "./components/StatsGrid";
import BuildingInfoCard from "./components/BuildingInfoCard";
import ActivityChart from "./components/ActivityChart";
import RecentDetectionsCard from "./components/RecentDetectionsCard";
import LocationSearch from "./components/LocationSearch";
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
        .then((data) => setUserName(data.name))
        .catch((error) => {
          console.error("Error fetching user data:", error);
          setUserName("Guest");
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
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-200">
      {/* Responsive Header with transition effect for scrolling */}
      <header className={`sticky top-0 z-50 bg-white dark:bg-gray-800 shadow-md transition-all duration-300 ${isScrolled ? 'py-2' : 'py-4'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-8 w-8 text-indigo-500" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" 
                />
              </svg>
              <h1 className={`font-bold transition-all duration-300 ${isScrolled ? 'text-lg' : 'text-xl'}`}>Building Explorer</h1>
            </div>

            {/* Desktop navigation */}
            <div className="hidden md:flex items-center space-x-4">
              <nav className="flex items-center space-x-6">
                <a href="#" className="text-gray-700 dark:text-gray-300 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors duration-150">
                  Dashboard
                </a>
                <a href="#" className="text-gray-700 dark:text-gray-300 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors duration-150">
                  Favorites
                </a>
                <a href="#" className="text-gray-700 dark:text-gray-300 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors duration-150">
                  History
                </a>
              </nav>
              <div className="border-l border-gray-200 dark:border-gray-700 h-6"></div>
              <select
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                className="p-2 bg-gray-200 dark:bg-gray-700 rounded text-sm"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="system">System</option>
              </select>
              <button
                onClick={handleLogout}
                className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-md text-sm transition-colors duration-150"
              >
                Logout
              </button>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 md:hidden transition-colors duration-150"
              aria-expanded={isMobileMenuOpen}
            >
              <span className="sr-only">
                {isMobileMenuOpen ? "Close main menu" : "Open main menu"}
              </span>
              {isMobileMenuOpen ? (
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
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              ) : (
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
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu - animated slide down */}
        <div 
          className={`transform transition-transform duration-300 ease-in-out ${
            isMobileMenuOpen ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
          } md:hidden absolute w-full bg-white dark:bg-gray-800 shadow-lg z-50`}
          style={{ visibility: isMobileMenuOpen ? 'visible' : 'hidden' }}
        >
          <div className="px-4 py-2 space-y-1 border-t border-gray-200 dark:border-gray-700">
            <nav className="flex flex-col space-y-3 py-3">
              <a href="#" className="text-gray-700 dark:text-gray-300 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors duration-150 py-1">
                Dashboard
              </a>
              <a href="#" className="text-gray-700 dark:text-gray-300 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors duration-150 py-1">
                Favorites
              </a>
              <a href="#" className="text-gray-700 dark:text-gray-300 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors duration-150 py-1">
                History
              </a>
            </nav>
            <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>
            <div className="flex flex-col space-y-3 py-2">
              <select
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                className="w-full p-2 bg-gray-200 dark:bg-gray-700 rounded text-sm"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="system">System</option>
              </select>
              <button
                onClick={handleLogout}
                className="w-full bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-md text-sm transition-colors duration-150"
              >
                Logout
              </button>
            </div>
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