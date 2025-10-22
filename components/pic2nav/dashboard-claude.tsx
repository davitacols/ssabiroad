"use client"

import { useState, useEffect } from "react"
import {
  Camera,
  MapPin,
  Upload,
  Search,
  Clock,
  Bookmark,
  ChevronRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { CameraRecognition } from "@/components/pic2nav/camera-recognition"
import { RecentLocationsPanel } from "@/components/pic2nav/recent-locations"
import { SearchPanel } from "@/components/pic2nav/search-panel"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

export function ClaudeDashboard() {
  const [activeView, setActiveView] = useState("upload")
  const [selectedLocation, setSelectedLocation] = useState(null)
  const [stats, setStats] = useState(null)
  const [recentLocations, setRecentLocations] = useState([])
  const [savedLocations, setSavedLocations] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, recentRes, savedRes] = await Promise.all([
          fetch('/api/location-stats'),
          fetch('/api/recent-locations?limit=10'),
          fetch('/api/saved-locations?limit=20')
        ]);
        
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats({
            totalDetections: statsData.totalLocations || 0,
            totalLocations: statsData.totalLocations || 0,
            totalBookmarks: 0,
            successRate: Math.round((statsData.avgConfidence || 0) * 100),
          });
        }
        
        if (recentRes.ok) {
          const recentData = await recentRes.json();
          const formattedLocations = (recentData.locations || []).map(loc => ({
            ...loc,
            timeAgo: new Date(loc.createdAt).toLocaleDateString()
          }));
          setRecentLocations(formattedLocations);
        }
        
        if (savedRes.ok) {
          const savedData = await savedRes.json();
          setSavedLocations(savedData.locations || []);
          setStats(prev => prev ? { ...prev, totalBookmarks: (savedData.locations || []).length } : null);
        }
        
      } catch (error) {
        console.error('Dashboard fetch error:', error);
        setStats({
          totalDetections: 0,
          totalLocations: 0,
          totalBookmarks: 0,
          successRate: 0,
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [])

  const handleLocationSelect = (location) => {
    setSelectedLocation(location)
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        {/* Simple Header */}
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
            <Camera className="h-4 w-4" />
            <span className="text-sm">Pic2Nav</span>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Your Dashboard
          </h1>
        </div>

        {/* Stats - Simple Numbers */}
        {!loading && stats && (
          <div className="flex flex-wrap gap-8 mb-12 text-sm">
            <div>
              <div className="text-gray-600 dark:text-gray-400 mb-1">Photos analyzed</div>
              <div className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.totalDetections}</div>
            </div>
            <div>
              <div className="text-gray-600 dark:text-gray-400 mb-1">Locations found</div>
              <div className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.totalLocations}</div>
            </div>
            <div>
              <div className="text-gray-600 dark:text-gray-400 mb-1">Saved places</div>
              <div className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.totalBookmarks}</div>
            </div>
          </div>
        )}

        {/* Main Content - Single Column */}
        <div className="space-y-12">
          {/* Upload Section */}
          <section>
            <div className="flex items-center gap-4 mb-6">
              <button
                onClick={() => setActiveView("upload")}
                className={`text-lg font-medium ${
                  activeView === "upload"
                    ? "text-gray-900 dark:text-white"
                    : "text-gray-400 dark:text-gray-600"
                }`}
              >
                Upload Photo
              </button>
              <button
                onClick={() => setActiveView("search")}
                className={`text-lg font-medium ${
                  activeView === "search"
                    ? "text-gray-900 dark:text-white"
                    : "text-gray-400 dark:text-gray-600"
                }`}
              >
                Search
              </button>
            </div>
            
            <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-8">
              {activeView === "upload" && <CameraRecognition onLocationSelect={handleLocationSelect} />}
              {activeView === "search" && <SearchPanel onLocationSelect={handleLocationSelect} />}
            </div>
          </section>

          {/* Recent Activity */}
          {recentLocations.length > 0 && (
            <section>
              <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-6">
                Recent Activity
              </h2>
              <div className="space-y-3">
                {recentLocations.slice(0, 8).map((location) => (
                  <div
                    key={location.id}
                    onClick={() => handleLocationSelect(location)}
                    className="flex items-start justify-between py-4 border-b border-gray-100 dark:border-gray-900 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900 -mx-4 px-4 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 dark:text-white mb-1">
                        {location.name}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {location.address}
                      </div>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-xs text-gray-500">{location.timeAgo}</span>
                        {location.confidence && (
                          <span className="text-xs text-gray-500">
                            {Math.round(location.confidence * 100)}% match
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0 ml-4" />
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Saved Places */}
          {savedLocations.length > 0 && (
            <section>
              <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-6">
                Saved Places
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {savedLocations.slice(0, 6).map((location) => (
                  <div
                    key={location.id}
                    onClick={() => handleLocationSelect(location)}
                    className="border border-gray-200 dark:border-gray-800 rounded-lg p-5 cursor-pointer hover:border-gray-300 dark:hover:border-gray-700 transition-colors"
                  >
                    <div className="font-medium text-gray-900 dark:text-white mb-2">
                      {location.name}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      {location.address}
                    </div>
                    {location.rating && (
                      <div className="text-sm text-gray-900 dark:text-white">
                        ★ {location.rating}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}
