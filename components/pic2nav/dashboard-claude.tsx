"use client"

import { useState, useEffect } from "react"
import {
  Camera,
  MapPin,
  Upload,
  Search,
  Clock,
  Settings,
  Activity,
  Bookmark,
  Eye,
  RefreshCw,
  ChevronRight,
  TrendingUp,
  Users,
  Globe,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { CameraRecognitionEnhanced } from "@/components/pic2nav/camera-recognition-enhanced"
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
            recentDetections: statsData.todayCount || 0,
            successRate: Math.round((statsData.avgConfidence || 0) * 100),
            weeklyGrowth: Math.round(((statsData.weekCount || 0) / Math.max(statsData.totalLocations || 1, 1)) * 100)
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
          recentDetections: 0,
          successRate: 0,
          weeklyGrowth: 0
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900">
      {/* Top Navigation */}
      <nav className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-lg">
                <Camera className="h-4 w-4 text-white" />
              </div>
              <span className="font-bold text-xl text-gray-900 dark:text-white">Pic2Nav</span>
            </Link>
            <div className="hidden lg:flex items-center gap-1">
              <Button variant="ghost" size="sm" className="font-medium" asChild>
                <Link href="/dashboard">Dashboard</Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/analytics">Analytics</Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/history">History</Link>
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => window.location.reload()} className="hover:bg-gray-100 dark:hover:bg-gray-800">
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" asChild className="hover:bg-gray-100 dark:hover:bg-gray-800">
              <a href="/settings">
                <Settings className="h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Welcome back!
              </h1>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                Discover locations from your photos with AI-powered intelligence
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button size="sm" variant="outline" className="gap-2" asChild>
                <Link href="/map">
                  <Globe className="h-4 w-4" />
                  <span className="hidden sm:inline">View Map</span>
                  <span className="sm:hidden">Map</span>
                </Link>
              </Button>
              <Button size="sm" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 gap-2" onClick={() => setActiveView("upload")}>
                <Upload className="h-4 w-4" />
                <span className="hidden sm:inline">Upload Photo</span>
                <span className="sm:hidden">Upload</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-gray-800/50 p-6 shadow-lg">
                <div className="animate-pulse space-y-3">
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                </div>
              </div>
            ))
          ) : (
            [
              { label: "Total Detections", value: stats?.totalDetections || 0, icon: Eye, trend: "+12%", color: "from-blue-500 to-blue-600" },
              { label: "Locations Found", value: stats?.totalLocations || 0, icon: MapPin, trend: "+8%", color: "from-green-500 to-green-600" },
              { label: "Success Rate", value: `${stats?.successRate || 0}%`, icon: Activity, trend: "+2%", color: "from-purple-500 to-purple-600" },
              { label: "Saved Places", value: stats?.totalBookmarks || 0, icon: Bookmark, trend: "+5%", color: "from-orange-500 to-orange-600" },
            ].map((stat, i) => (
              <div key={i} className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-gray-800/50 p-6 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105">
                <div className="flex items-center justify-between mb-4">
                  <div className={`h-10 w-10 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg`}>
                    <stat.icon className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-xs text-green-600 dark:text-green-400 font-semibold flex items-center gap-1 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-full">
                    <TrendingUp className="h-3 w-3" />
                    {stat.trend}
                  </span>
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                  {stat.value}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                  {stat.label}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Left Column - Main Actions */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Action Tabs */}
            <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-gray-800/50 shadow-lg">
              <div className="border-b border-gray-200/50 dark:border-gray-800/50 px-4 sm:px-6 py-4 sm:py-5">
                <div className="flex gap-1 sm:gap-2 overflow-x-auto">
                  {[
                    { id: "upload", label: "Upload Photo", shortLabel: "Upload", icon: Upload },
                    { id: "recent", label: "Recent", shortLabel: "Recent", icon: Clock },
                    { id: "search", label: "Search", shortLabel: "Search", icon: Search },
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setActiveView(item.id)}
                      className={`flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                        activeView === item.id
                          ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
                          : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
                      }`}
                    >
                      <item.icon className="h-4 w-4" />
                      <span className="hidden sm:inline">{item.label}</span>
                      <span className="sm:hidden">{item.shortLabel}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="p-4 sm:p-6">
                {activeView === "upload" && <CameraRecognitionEnhanced onLocationSelect={handleLocationSelect} />}
                {activeView === "recent" && <RecentLocationsPanel onLocationSelect={handleLocationSelect} expanded={true} />}
                {activeView === "search" && <SearchPanel onLocationSelect={handleLocationSelect} />}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-gray-800/50 shadow-lg p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-4 sm:mb-6">
                Quick Actions
              </h3>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {[
                  { icon: Camera, label: "Take Photo", shortLabel: "Camera", action: () => setActiveView("upload"), color: "from-blue-500 to-blue-600" },
                  { icon: Upload, label: "Upload", shortLabel: "Upload", action: () => setActiveView("upload"), color: "from-green-500 to-green-600" },
                  { icon: Search, label: "Search", shortLabel: "Search", action: () => setActiveView("search"), color: "from-purple-500 to-purple-600" },
                  { icon: Bookmark, label: "Bookmarks", shortLabel: "Saved", action: () => {}, color: "from-orange-500 to-orange-600" },
                ].map((action, i) => (
                  <button
                    key={i}
                    onClick={action.action}
                    className="group flex flex-col items-center justify-center gap-2 sm:gap-3 p-3 sm:p-5 rounded-xl border border-gray-200/50 dark:border-gray-800/50 hover:bg-white dark:hover:bg-gray-800 transition-all duration-200 hover:shadow-lg hover:scale-105"
                  >
                    <div className={`h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-gradient-to-br ${action.color} flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow`}>
                      <action.icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                    </div>
                    <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white text-center">
                      <span className="hidden sm:inline">{action.label}</span>
                      <span className="sm:hidden">{action.shortLabel}</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-4 sm:space-y-6">
            {/* Recent Locations */}
            <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-gray-800/50 shadow-lg">
              <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-200/50 dark:border-gray-800/50">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                  Recent Locations
                </h3>
              </div>
              <div className="p-3 sm:p-4 space-y-1">
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="animate-pulse p-3">
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                    </div>
                  ))
                ) : recentLocations.length > 0 ? (
                  recentLocations.slice(0, 5).map((location) => (
                    <div
                      key={location.id}
                      onClick={() => handleLocationSelect(location)}
                      className="flex items-start justify-between p-2 sm:p-3 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white truncate">
                          {location.name}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400 truncate mt-1">
                          {location.address}
                        </p>
                        {location.confidence && (
                          <Badge variant="secondary" className="text-xs mt-2">
                            {Math.round(location.confidence * 100)}%
                          </Badge>
                        )}
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0 ml-2" />
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Clock className="h-6 w-6 mx-auto mb-2 opacity-50" />
                    <p className="text-xs">No recent detections</p>
                  </div>
                )}
              </div>
            </div>

            {/* Saved Places */}
            <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-gray-800/50 shadow-lg">
              <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-200/50 dark:border-gray-800/50">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                  Saved Places
                </h3>
              </div>
              <div className="p-3 sm:p-4 space-y-1">
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="animate-pulse p-3">
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                    </div>
                  ))
                ) : savedLocations.length > 0 ? (
                  savedLocations.slice(0, 5).map((location) => (
                    <div
                      key={location.id}
                      onClick={() => handleLocationSelect(location)}
                      className="flex items-start justify-between p-2 sm:p-3 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white truncate">
                          {location.name}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400 truncate mt-1">
                          {location.address}
                        </p>
                        {location.rating && (
                          <span className="text-xs text-amber-600 mt-2 inline-block">
                            ★ {location.rating}
                          </span>
                        )}
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0 ml-2" />
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Bookmark className="h-6 w-6 mx-auto mb-2 opacity-50" />
                    <p className="text-xs">No saved places</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
