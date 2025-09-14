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
  Plus,
  MoreHorizontal,
  Sparkles,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CameraRecognition } from "@/components/pic2nav/camera-recognition"
import { RecentLocationsPanel } from "@/components/pic2nav/recent-locations"
import { SearchPanel } from "@/components/pic2nav/search-panel"
import { Badge } from "@/components/ui/badge"
import { ShareButton } from "@/components/ui/share-button"

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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="flex items-start justify-between mb-16">
          <div className="space-y-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
                Dashboard
              </h1>
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-base">
              AI-powered location intelligence platform
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => window.location.reload()}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 h-9 px-3"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 h-9 px-3"
              asChild
            >
              <a href="/settings">
                <Settings className="h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          {loading ? (
            Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 mb-4"></div>
                  <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16 mb-2"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-12"></div>
                </div>
              </div>
            ))
          ) : (
            [
              { 
                label: "Total Detections", 
                value: stats?.totalDetections?.toString() || "0", 
                icon: Eye,
                change: `+${stats?.weeklyGrowth || 0}%`
              },
              { 
                label: "Locations Found", 
                value: stats?.totalLocations?.toString() || "0", 
                icon: MapPin,
                change: `+${Math.floor((stats?.weeklyGrowth || 0) * 0.8)}%`
              },
              { 
                label: "Success Rate", 
                value: `${stats?.successRate || 0}%`, 
                icon: Activity,
                change: stats?.successRate > 80 ? "+2%" : "-1%"
              },
              { 
                label: "Saved Places", 
                value: stats?.totalBookmarks?.toString() || "0", 
                icon: Bookmark,
                change: "+5%"
              },
            ].map((stat, index) => (
              <div key={index} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 hover:border-gray-300 dark:hover:border-gray-700 transition-colors">
                <div className="flex items-center justify-between mb-4">
                  <stat.icon className="h-5 w-5 text-gray-400" />
                  <span className="text-sm text-green-600 dark:text-green-400 font-medium">{stat.change}</span>
                </div>
                <div className="space-y-1">
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                    {stat.value}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {stat.label}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Navigation */}
        <div className="flex gap-1 mb-10 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl w-fit">
          {[
            { id: "upload", label: "Upload Photo", icon: Upload },
            { id: "recent", label: "Recent", icon: Clock },
            { id: "search", label: "Search", icon: Search },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeView === item.id 
                  ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm" 
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-gray-700/60"
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </button>
          ))}
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2">
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-8">
              {activeView === "upload" && (
                <CameraRecognition onLocationSelect={handleLocationSelect} />
              )}
              {activeView === "recent" && (
                <RecentLocationsPanel onLocationSelect={handleLocationSelect} expanded={true} />
              )}
              {activeView === "search" && (
                <SearchPanel onLocationSelect={handleLocationSelect} />
              )}
            </div>
          </div>
          
          <div className="xl:col-span-1 space-y-6">
            {/* Recent Locations */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
              <div className="p-6 pb-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    Recent Locations
                  </h3>
                  <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="px-6 pb-6 space-y-3">
                {loading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                      </div>
                    ))}
                  </div>
                ) : recentLocations.length > 0 ? (
                  <div className="space-y-3">
                    {recentLocations.slice(0, 5).map((location) => (
                      <div 
                        key={location.id} 
                        className="flex items-start justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 cursor-pointer transition-colors"
                        onClick={() => handleLocationSelect(location)}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 dark:text-white text-sm truncate">
                            {location.name}
                          </p>
                          <p className="text-gray-600 dark:text-gray-400 text-xs mt-1 truncate">
                            {location.address}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            {location.confidence && (
                              <Badge variant="secondary" className="text-xs">
                                {Math.round(location.confidence * 100)}%
                              </Badge>
                            )}
                            <span className="text-xs text-gray-500">{location.timeAgo}</span>
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0 ml-2" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No recent detections</p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Saved Places */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
              <div className="p-6 pb-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    Saved Places
                  </h3>
                  <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="px-6 pb-6 space-y-3">
                {loading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                      </div>
                    ))}
                  </div>
                ) : savedLocations.length > 0 ? (
                  <div className="space-y-3">
                    {savedLocations.slice(0, 5).map((location) => (
                      <div 
                        key={location.id} 
                        className="flex items-start justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 cursor-pointer transition-colors"
                        onClick={() => handleLocationSelect(location)}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 dark:text-white text-sm truncate">
                            {location.name}
                          </p>
                          <p className="text-gray-600 dark:text-gray-400 text-xs mt-1 truncate">
                            {location.address}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline" className="text-xs">
                              {location.apiVersion?.toUpperCase() || 'V1'}
                            </Badge>
                            {location.rating && (
                              <span className="text-xs text-amber-600">★ {location.rating}</span>
                            )}
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0 ml-2" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Bookmark className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No saved places</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 mt-10">
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-6">
              Quick Actions
            </h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { icon: Camera, label: "Take Photo", action: () => setActiveView("upload") },
                { icon: Upload, label: "Upload Image", action: () => setActiveView("upload") },
                { icon: Search, label: "Search Places", action: () => setActiveView("search") },
                { icon: Plus, label: "Add Bookmark", action: () => {} },
              ].map((action, index) => (
                <button 
                  key={index}
                  className="h-24 flex flex-col gap-2 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
                  onClick={action.action}
                >
                  <action.icon className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {action.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}