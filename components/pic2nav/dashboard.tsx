"use client"

import { useState, useEffect } from "react"
import {
  Camera,
  MapPin,
  Upload,
  Search,
  Clock,
  Settings,
  Plus,
  Activity,
  Bookmark,
  BarChart3,
  Zap,
  Target,
  Eye,
  RefreshCw,
} from "lucide-react"
import { BrandLogo } from "@/components/ui/brand-logo"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CameraRecognition } from "@/components/pic2nav/camera-recognition"
import { RecentLocationsPanel } from "@/components/pic2nav/recent-locations"
import { SearchPanel } from "@/components/pic2nav/search-panel"
import { BookmarksPanel } from "@/components/pic2nav/bookmarks-panel"
import { Badge } from "@/components/ui/badge"
import { ShareButton } from "@/components/ui/share-button"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"

export function Pic2NavDashboard() {
  const [activeView, setActiveView] = useState("upload")
  const [selectedLocation, setSelectedLocation] = useState(null)
  const [stats, setStats] = useState(null)
  const [recentLocations, setRecentLocations] = useState([])
  const [savedLocations, setSavedLocations] = useState([])
  const [activityFeed, setActivityFeed] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAnalytics, setShowAnalytics] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('🔄 Fetching dashboard data...');
        
        const [statsRes, recentRes, savedRes] = await Promise.all([
          fetch('/api/location-stats'),
          fetch('/api/recent-locations?limit=10'),
          fetch('/api/saved-locations?limit=20')
        ]);
        
        console.log('📊 API responses:', {
          stats: statsRes.status,
          recent: recentRes.status,
          saved: savedRes.status
        });
        
        // Handle stats
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          console.log('📈 Stats data:', statsData);
          setStats({
            totalDetections: statsData.totalLocations || 0,
            totalLocations: statsData.totalLocations || 0,
            totalBookmarks: 0,
            recentDetections: statsData.todayCount || 0,
            successRate: Math.round((statsData.avgConfidence || 0) * 100),
            weeklyGrowth: Math.round(((statsData.weekCount || 0) / Math.max(statsData.totalLocations || 1, 1)) * 100)
          });
        } else {
          console.error('❌ Stats API failed:', await statsRes.text());
          setStats({
            totalDetections: 0,
            totalLocations: 0,
            totalBookmarks: 0,
            recentDetections: 0,
            successRate: 0,
            weeklyGrowth: 0
          });
        }
        
        // Handle recent locations
        if (recentRes.ok) {
          const recentData = await recentRes.json();
          console.log('🕒 Recent data:', recentData);
          const formattedLocations = (recentData.locations || []).map(loc => ({
            ...loc,
            timeAgo: new Date(loc.createdAt).toLocaleDateString()
          }));
          setRecentLocations(formattedLocations);
          
          // Create activity feed
          const activities = formattedLocations.slice(0, 4).map(location => ({
            action: location.apiVersion === 'v2' ? 'GPS extraction' : 'Photo analyzed',
            location: location.name || location.address || 'Unknown location',
            time: new Date(location.createdAt).toLocaleString(),
            type: location.apiVersion === 'v2' ? 'gps' : 'success'
          }));
          setActivityFeed(activities);
        } else {
          console.error('❌ Recent locations API failed:', await recentRes.text());
          setRecentLocations([]);
          setActivityFeed([]);
        }
        
        // Handle saved locations
        if (savedRes.ok) {
          const savedData = await savedRes.json();
          console.log('💾 Saved data:', savedData);
          setSavedLocations(savedData.locations || []);
          setStats(prev => prev ? { ...prev, totalBookmarks: (savedData.locations || []).length } : null);
        } else {
          console.error('❌ Saved locations API failed:', await savedRes.text());
          setSavedLocations([]);
        }
        
      } catch (error) {
        console.error('❌ Dashboard fetch error:', error);
        setError(error.message);
        setStats({
          totalDetections: 0,
          totalLocations: 0,
          totalBookmarks: 0,
          recentDetections: 0,
          successRate: 0,
          weeklyGrowth: 0
        });
        setRecentLocations([]);
        setSavedLocations([]);
        setActivityFeed([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [])



  const handleLocationSelect = (location) => {
    setSelectedLocation(location)
  }

  const statCards = stats ? [
    { 
      label: "Total Detections", 
      value: stats.totalDetections.toString(), 
      icon: Eye, 
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-50 dark:bg-blue-900",
      change: `+${stats.weeklyGrowth}%`,
      changeColor: "text-green-600"
    },
    { 
      label: "Locations Found", 
      value: stats.totalLocations.toString(), 
      icon: MapPin, 
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-50 dark:bg-green-900",
      change: `+${Math.floor(stats.weeklyGrowth * 0.8)}%`,
      changeColor: "text-green-600"
    },
    { 
      label: "Success Rate", 
      value: `${stats.successRate}%`, 
      icon: Target, 
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-50 dark:bg-purple-900",
      change: stats.successRate > 80 ? "+2%" : "-1%",
      changeColor: stats.successRate > 80 ? "text-green-600" : "text-red-600"
    },
    { 
      label: "Saved Places", 
      value: stats.totalBookmarks.toString(), 
      icon: Bookmark, 
      color: "text-orange-600 dark:text-orange-400",
      bgColor: "bg-orange-50 dark:bg-orange-900",
      change: "+5%",
      changeColor: "text-green-600"
    },
  ] : []

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div className="flex items-center gap-4">
            <BrandLogo size="md" className="rounded-lg" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-400">Location intelligence platform</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => window.location.reload()}
            >
              <RefreshCw className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              asChild
            >
              <a href="/settings">
                <Settings className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Settings</span>
              </a>
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {loading ? (
            Array.from({ length: 4 }).map((_, index) => (
              <Card key={index} className="bg-white dark:bg-gray-800">
                <CardContent className="p-6">
                  <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 mb-4"></div>
                    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16 mb-2"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-12"></div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            statCards.map((stat, index) => (
              <Card key={index} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">{stat.label}</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{stat.value}</p>
                      <div className={`text-sm ${stat.changeColor} mt-2`}>
                        {stat.change} this week
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className={`h-12 w-12 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                        <stat.icon className={`h-6 w-6 ${stat.color}`} />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Navigation */}
        <div className="flex flex-wrap gap-2 mb-8">
          {[
            { id: "upload", label: "Upload Photo", icon: Upload },
            { id: "recent", label: "Recent", icon: Clock },
            { id: "search", label: "Search", icon: Search },
          ].map((item) => (
            <Button
              key={item.id}
              variant={activeView === item.id ? "default" : "outline"}
              onClick={() => setActiveView(item.id)}
              className={`flex items-center gap-2 px-4 py-2 ${
                activeView === item.id 
                  ? "bg-blue-600 text-white" 
                  : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Button>
          ))}
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2">
            <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <CardContent className="p-6">
                {activeView === "upload" && (
                  <CameraRecognition onLocationSelect={handleLocationSelect} />
                )}
                {activeView === "recent" && (
                  <RecentLocationsPanel onLocationSelect={handleLocationSelect} expanded={true} />
                )}
                {activeView === "search" && (
                  <SearchPanel onLocationSelect={handleLocationSelect} />
                )}
              </CardContent>
            </Card>
          </div>
          
          <div className="xl:col-span-1 space-y-6">
            <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-3 text-gray-900 dark:text-white">
                  <div className="h-8 w-8 rounded-lg bg-green-100 dark:bg-green-900 flex items-center justify-center">
                    <Clock className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                  Recent Locations
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
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
                  <div className="space-y-4">
                    {recentLocations.slice(0, 5).map((location, index) => (
                      <div key={location.id} className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer"
                           onClick={() => handleLocationSelect(location)}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-gray-900 dark:text-white truncate">{location.name}</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{location.address}</p>
                            <div className="flex items-center gap-2 mt-2">
                              {location.confidence && (
                                <span className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded">
                                  {Math.round(location.confidence * 100)}% confident
                                </span>
                              )}
                              <span className="text-xs text-gray-500">{location.timeAgo}</span>
                            </div>
                          </div>
                          <ShareButton
                            title={location.name}
                            text={`Check out ${location.name} at ${location.address}`}
                            url={`${typeof window !== 'undefined' ? window.location.origin : ''}/locations/${location.id}`}
                            variant="ghost"
                            size="sm"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No recent detections</p>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-3 text-gray-900 dark:text-white">
                  <div className="h-8 w-8 rounded-lg bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                    <Bookmark className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  Saved Places
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
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
                  <div className="space-y-4">
                    {savedLocations.slice(0, 5).map((location, index) => (
                      <div key={location.id} className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer"
                           onClick={() => handleLocationSelect(location)}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900 dark:text-white">{location.name}</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{location.address}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="outline" className="text-xs">
                                {location.apiVersion?.toUpperCase() || 'V1'}
                              </Badge>
                              {location.rating && (
                                <span className="text-xs text-amber-600">★ {location.rating}</span>
                              )}
                            </div>
                          </div>
                          <ShareButton
                            title={location.name}
                            text={`Check out ${location.name} at ${location.address}`}
                            url={`${typeof window !== 'undefined' ? window.location.origin : ''}/locations/${location.id}`}
                            variant="ghost"
                            size="sm"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Bookmark className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No saved places</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Recent Activity */}
        <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 mt-8">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-3 text-gray-900 dark:text-white">
              <div className="h-8 w-8 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                <Activity className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="animate-pulse flex items-center gap-4 p-4 rounded-lg bg-gray-50 dark:bg-gray-700">
                    <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-600"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-1/2"></div>
                    </div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-16"></div>
                  </div>
                ))
              ) : activityFeed.length > 0 ? (
                activityFeed.map((activity, index) => (
                <div key={index} className="flex items-center gap-4 p-4 rounded-lg bg-gray-50 dark:bg-gray-700">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                    activity.type === 'success' ? 'bg-green-100 dark:bg-green-900' :
                    activity.type === 'bookmark' ? 'bg-yellow-100 dark:bg-yellow-900' :
                    activity.type === 'search' ? 'bg-blue-100 dark:bg-blue-900' :
                    'bg-purple-100 dark:bg-purple-900'
                  }`}>
                    {activity.type === 'success' && <Eye className="h-5 w-5 text-green-600 dark:text-green-400" />}
                    {activity.type === 'bookmark' && <Bookmark className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />}
                    {activity.type === 'search' && <Search className="h-5 w-5 text-blue-600 dark:text-blue-400" />}
                    {activity.type === 'gps' && <MapPin className="h-5 w-5 text-purple-600 dark:text-purple-400" />}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-white">{activity.action}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{activity.location}</p>
                  </div>
                  <span className="text-xs text-gray-500">{activity.time}</span>
                </div>
              ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No recent activity</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}