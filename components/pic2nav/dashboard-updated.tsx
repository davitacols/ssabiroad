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
  RefreshCw
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CameraRecognition } from "@/components/pic2nav/camera-recognition"
import { RecentLocationsPanel } from "@/components/pic2nav/recent-locations"
import { SearchPanel } from "@/components/pic2nav/search-panel"
import { BookmarksPanel } from "@/components/pic2nav/bookmarks-panel"
import { Badge } from "@/components/ui/badge"
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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showAnalytics, setShowAnalytics] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  useEffect(() => {
    // Fetch global stats and recent locations from database
    Promise.all([
      fetch('/api/location-stats'),
      fetch('/api/recent-locations?limit=10')
    ])
    .then(async ([statsRes, recentRes]) => {
      if (statsRes.ok) {
        const statsData = await statsRes.json()
        setStats({
          totalDetections: statsData.totalLocations,
          totalLocations: statsData.totalLocations,
          totalBookmarks: 0,
          recentDetections: statsData.todayCount,
          successRate: Math.round(statsData.avgConfidence * 100),
          weeklyGrowth: Math.round((statsData.weekCount / Math.max(statsData.totalLocations, 1)) * 100)
        })
      } else {
        setStats({
          totalDetections: 0,
          totalLocations: 0,
          totalBookmarks: 0,
          recentDetections: 0,
          successRate: 0,
          weeklyGrowth: 0
        })
      }
      
      if (recentRes.ok) {
        const recentData = await recentRes.json()
        const formattedLocations = recentData.locations.map(loc => ({
          ...loc,
          timeAgo: new Date(loc.createdAt).toLocaleDateString()
        }))
        setRecentLocations(formattedLocations)
      }
    })
    .catch(err => {
      setStats({
        totalDetections: 0,
        totalLocations: 0,
        totalBookmarks: 0,
        recentDetections: 0,
        successRate: 0,
        weeklyGrowth: 0
      })
      setRecentLocations([])
    })
    .finally(() => setLoading(false))
  }, [])



  const handleLocationSelect = (location) => {
    setSelectedLocation(location)
  }

  const statCards = stats ? [
    { 
      label: "Total Detections", 
      value: stats.totalDetections.toString(), 
      icon: Eye, 
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-950",
      change: `+${stats.weeklyGrowth}%`,
      changeColor: "text-green-600"
    },
    { 
      label: "Locations Found", 
      value: stats.totalLocations.toString(), 
      icon: MapPin, 
      color: "text-emerald-600",
      bgColor: "bg-emerald-50 dark:bg-emerald-950",
      change: `+${Math.floor(stats.weeklyGrowth * 0.8)}%`,
      changeColor: "text-green-600"
    },
    { 
      label: "Success Rate", 
      value: `${stats.successRate}%`, 
      icon: Target, 
      color: "text-purple-600",
      bgColor: "bg-purple-50 dark:bg-purple-950",
      change: stats.successRate > 80 ? "+2%" : "-1%",
      changeColor: stats.successRate > 80 ? "text-green-600" : "text-red-600"
    },
    { 
      label: "Saved Places", 
      value: stats.totalBookmarks.toString(), 
      icon: Bookmark, 
      color: "text-orange-600",
      bgColor: "bg-orange-50 dark:bg-orange-950",
      change: "+5%",
      changeColor: "text-green-600"
    },
  ] : []

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-slate-900 dark:via-indigo-950 dark:to-purple-950">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-12 gap-6">
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 flex items-center justify-center shadow-2xl">
                <Activity className="h-8 w-8 text-white" />
              </div>
              <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 opacity-20 animate-pulse"></div>
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                Dashboard
              </h1>
              <p className="text-slate-600 dark:text-slate-400 font-medium text-lg">AI-powered location intelligence platform</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="sm" 
              className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-md border-white/20 dark:border-slate-700/50 shadow-xl hover:bg-white/80 dark:hover:bg-slate-800/80 transition-all duration-300"
              onClick={() => setShowAnalytics(true)}
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Analytics
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-md border-white/20 dark:border-slate-700/50 shadow-xl hover:bg-white/80 dark:hover:bg-slate-800/80 transition-all duration-300"
              onClick={() => setShowSettings(true)}
            >
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {loading ? (
            Array.from({ length: 4 }).map((_, index) => (
              <Card key={index} className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border-white/20 dark:border-slate-700/50 shadow-2xl">
                <CardContent className="p-8">
                  <div className="animate-pulse">
                    <div className="h-4 bg-gradient-to-r from-slate-200 to-slate-300 rounded-full w-20 mb-4"></div>
                    <div className="h-10 bg-gradient-to-r from-slate-200 to-slate-300 rounded-full w-16 mb-4"></div>
                    <div className="h-3 bg-gradient-to-r from-slate-200 to-slate-300 rounded-full w-12"></div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            statCards.map((stat, index) => (
              <Card key={index} className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border-white/20 dark:border-slate-700/50 shadow-2xl hover:shadow-3xl hover:scale-105 transition-all duration-500 group relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <CardContent className="p-8 relative z-10">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">{stat.label}</p>
                      <p className="text-3xl font-bold mt-2 bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">{stat.value}</p>
                      <Badge className={`text-xs ${stat.changeColor} bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-950 dark:to-emerald-950 border-0 mt-3`}>
                        {stat.change} this week
                      </Badge>
                    </div>
                    <div className="relative">
                      <div className={`h-16 w-16 rounded-2xl ${stat.bgColor} flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-xl`}>
                        <stat.icon className={`h-8 w-8 ${stat.color}`} />
                      </div>
                      <div className="absolute -inset-2 rounded-2xl bg-gradient-to-r from-indigo-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-pulse"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Navigation */}
        <div className="flex flex-wrap gap-4 mb-12">
          {[
            { id: "upload", label: "Upload Photo", icon: Upload, color: "from-indigo-500 to-purple-500" },
            { id: "recent", label: "Recent", icon: Clock, color: "from-emerald-500 to-teal-500" },
            { id: "search", label: "Search", icon: Search, color: "from-pink-500 to-rose-500" },
          ].map((item) => (
            <Button
              key={item.id}
              variant={activeView === item.id ? "default" : "outline"}
              onClick={() => setActiveView(item.id)}
              className={`flex items-center gap-3 px-6 py-3 rounded-2xl font-semibold transition-all duration-500 transform hover:scale-105 ${
                activeView === item.id 
                  ? `bg-gradient-to-r ${item.color} text-white border-0 shadow-2xl` 
                  : "bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border-white/20 dark:border-slate-700/50 shadow-xl hover:bg-white/80 dark:hover:bg-slate-800/80 hover:shadow-2xl"
              }`}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Button>
          ))}
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
          <div className="xl:col-span-2">
            <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border-white/20 dark:border-slate-700/50 shadow-2xl rounded-3xl overflow-hidden">
              <CardContent className="p-10">
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
          
          <div className="xl:col-span-1 space-y-8">
            <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border-white/20 dark:border-slate-700/50 shadow-2xl rounded-3xl overflow-hidden">
              <CardHeader className="pb-6 bg-gradient-to-r from-emerald-500/10 to-teal-500/10">
                <CardTitle className="text-xl flex items-center gap-3 font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 flex items-center justify-center">
                    <Clock className="h-5 w-5 text-white" />
                  </div>
                  Recent Locations
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {loading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                      </div>
                    ))}
                  </div>
                ) : recentLocations.length > 0 ? (
                  <div className="space-y-4">
                    {recentLocations.slice(0, 5).map((location, index) => (
                      <div key={location.id} className="p-4 rounded-xl bg-white/40 dark:bg-slate-800/40 backdrop-blur-sm border border-white/20 dark:border-slate-700/50 hover:bg-white/60 dark:hover:bg-slate-800/60 transition-all duration-300 cursor-pointer"
                           onClick={() => handleLocationSelect(location)}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold text-sm text-slate-900 dark:text-white">{location.name}</h4>
                            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">{location.address}</p>
                            <div className="flex items-center gap-2 mt-2">
                              {location.confidence && (
                                <span className="text-xs px-2 py-1 bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300 rounded-full">
                                  {Math.round(location.confidence * 100)}% confident
                                </span>
                              )}
                              <span className="text-xs text-slate-500">{location.timeAgo}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-500">
                    <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No recent detections</p>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border-white/20 dark:border-slate-700/50 shadow-2xl rounded-3xl overflow-hidden">
              <CardHeader className="pb-6 bg-gradient-to-r from-purple-500/10 to-pink-500/10">
                <CardTitle className="text-xl flex items-center gap-3 font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                    <Bookmark className="h-5 w-5 text-white" />
                  </div>
                  Saved Places
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <BookmarksPanel onLocationSelect={handleLocationSelect} />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Quick Actions */}
        <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border-white/20 dark:border-slate-700/50 shadow-2xl rounded-3xl overflow-hidden mt-12">
          <CardHeader className="pb-6 bg-gradient-to-r from-yellow-500/10 to-orange-500/10">
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-500 flex items-center justify-center">
                <Zap className="h-6 w-6 text-white" />
              </div>
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { icon: Camera, label: "Take Photo", color: "from-indigo-500 to-purple-500", action: () => setActiveView("upload") },
                { icon: Upload, label: "Upload Image", color: "from-emerald-500 to-teal-500", action: () => setActiveView("upload") },
                { icon: Search, label: "Search Places", color: "from-pink-500 to-rose-500", action: () => setActiveView("search") },
                { icon: Plus, label: "Add Bookmark", color: "from-orange-500 to-red-500", action: () => {} },
              ].map((action, index) => (
                <Button 
                  key={index}
                  variant="outline" 
                  className="h-32 flex flex-col gap-4 bg-white/40 dark:bg-slate-800/40 backdrop-blur-xl border-white/20 dark:border-slate-700/50 hover:bg-white/60 dark:hover:bg-slate-800/60 hover:shadow-2xl hover:scale-105 transition-all duration-500 group rounded-2xl"
                  onClick={action.action}
                >
                  <div className="relative">
                    <div className={`h-14 w-14 rounded-2xl bg-gradient-to-r ${action.color} flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-xl`}>
                      <action.icon className="h-7 w-7 text-white" />
                    </div>
                    <div className="absolute -inset-2 rounded-2xl bg-gradient-to-r from-indigo-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-pulse"></div>
                  </div>
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors duration-300">{action.label}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Analytics Modal */}
        <Dialog open={showAnalytics} onOpenChange={setShowAnalytics}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Analytics Dashboard
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Weekly Activity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={[
                        { day: 'Mon', detections: 12 },
                        { day: 'Tue', detections: 19 },
                        { day: 'Wed', detections: 8 },
                        { day: 'Thu', detections: 25 },
                        { day: 'Fri', detections: 22 },
                        { day: 'Sat', detections: 30 },
                        { day: 'Sun', detections: 18 }
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="day" />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="detections" stroke="#8884d8" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Detection Types</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Buildings', value: 45, color: '#8884d8' },
                            { name: 'Landmarks', value: 30, color: '#82ca9d' },
                            { name: 'Streets', value: 25, color: '#ffc658' }
                          ]}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          dataKey="value"
                        >
                          {[
                            { name: 'Buildings', value: 45, color: '#8884d8' },
                            { name: 'Landmarks', value: 30, color: '#82ca9d' },
                            { name: 'Streets', value: 25, color: '#ffc658' }
                          ].map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Monthly Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={[
                      { month: 'Jan', detections: 65, accuracy: 85 },
                      { month: 'Feb', detections: 78, accuracy: 88 },
                      { month: 'Mar', detections: 90, accuracy: 92 },
                      { month: 'Apr', detections: 85, accuracy: 90 },
                      { month: 'May', detections: 95, accuracy: 94 },
                      { month: 'Jun', detections: 110, accuracy: 96 }
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="detections" fill="#8884d8" />
                      <Bar dataKey="accuracy" fill="#82ca9d" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </DialogContent>
        </Dialog>

        {/* Settings Modal */}
        <Dialog open={showSettings} onOpenChange={setShowSettings}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Settings
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Detection Preferences</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="auto-save">Auto-save detections</Label>
                    <Switch id="auto-save" defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="notifications">Push notifications</Label>
                    <Switch id="notifications" defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="location-sharing">Share location data</Label>
                    <Switch id="location-sharing" />
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">API Configuration</h3>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="confidence-threshold">Confidence Threshold (%)</Label>
                    <Input id="confidence-threshold" type="number" defaultValue="85" min="0" max="100" />
                  </div>
                  <div>
                    <Label htmlFor="max-results">Max Results per Query</Label>
                    <Input id="max-results" type="number" defaultValue="10" min="1" max="50" />
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Privacy & Data</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="analytics">Usage analytics</Label>
                    <Switch id="analytics" defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="data-retention">Data retention (30 days)</Label>
                    <Switch id="data-retention" defaultChecked />
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setShowSettings(false)}>Cancel</Button>
                <Button onClick={() => setShowSettings(false)}>Save Changes</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}