"use client"

import { useState, useEffect } from "react"
import { Camera, MapPin, Upload, Search, Clock, Settings, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CameraRecognition } from "@/components/pic2nav/camera-recognition"
import { RecentLocationsPanel } from "@/components/pic2nav/recent-locations"
import { SearchPanel } from "@/components/pic2nav/search-panel"

export function SimpleDashboard() {
  const [activeView, setActiveView] = useState("upload")
  const [stats, setStats] = useState(null)
  const [recentLocations, setRecentLocations] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, recentRes] = await Promise.all([
          fetch('/api/location-stats'),
          fetch('/api/recent-locations?limit=5')
        ])
        
        if (statsRes.ok) {
          const statsData = await statsRes.json()
          setStats({
            totalDetections: statsData.totalLocations || 0,
            successRate: Math.round((statsData.avgConfidence || 0) * 100),
            recentCount: statsData.todayCount || 0
          })
        }
        
        if (recentRes.ok) {
          const recentData = await recentRes.json()
          setRecentLocations(recentData.locations || [])
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="text-gray-600 dark:text-gray-400">Analyze photos and discover locations</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href="/settings">
                <Settings className="h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>

        {stats && (
          <div className="grid grid-cols-3 gap-4 mb-8">
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold">{stats.totalDetections}</div>
                <div className="text-sm text-gray-600">Total Detections</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold">{stats.successRate}%</div>
                <div className="text-sm text-gray-600">Success Rate</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold">{stats.recentCount}</div>
                <div className="text-sm text-gray-600">Today</div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="flex gap-2 mb-6">
          {[
            { id: "upload", label: "Upload", icon: Upload },
            { id: "recent", label: "Recent", icon: Clock },
            { id: "search", label: "Search", icon: Search },
          ].map((item) => (
            <Button
              key={item.id}
              variant={activeView === item.id ? "default" : "outline"}
              onClick={() => setActiveView(item.id)}
              className="flex items-center gap-2"
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="p-6">
                {activeView === "upload" && <CameraRecognition />}
                {activeView === "recent" && <RecentLocationsPanel expanded={true} />}
                {activeView === "search" && <SearchPanel />}
              </CardContent>
            </Card>
          </div>
          
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Recent Locations
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div>Loading...</div>
                ) : recentLocations.length > 0 ? (
                  <div className="space-y-3">
                    {recentLocations.map((location) => (
                      <div key={location.id} className="p-3 border rounded">
                        <div className="font-medium">{location.name}</div>
                        <div className="text-sm text-gray-600">{location.address}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    No recent locations
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}