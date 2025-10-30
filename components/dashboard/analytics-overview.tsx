"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  MapPin, 
  Bookmark, 
  Camera,
  CheckCircle,
  Activity,
  Shield
} from "lucide-react"

interface AnalyticsData {
  overview: {
    totalLocations: number
    totalUsers: number
    totalBookmarks: number
    totalPhotos: number
    processedPhotos: number
    validLocations: number
    geofences: number
    activeGeofences: number
  }
  timeRanges: {
    today: number
    yesterday: number
    week: number
    month: number
    year: number
  }
  growth: {
    daily: number
    weeklyAverage: number
    monthlyAverage: number
  }
  quality: {
    successRate: number
    addressCompleteness: number
    photoProcessingRate: number
  }
  topLocations: Array<{ name: string; count: number }>
  topUsers: Array<{ userId: string; userName: string; locationCount: number }>
}

export function AnalyticsOverview() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        console.log('Fetching analytics from /api/analytics/overview')
        const response = await fetch('/api/analytics/overview')
        console.log('Analytics response status:', response.status)
        
        if (response.ok) {
          const analyticsData = await response.json()
          console.log('Analytics data received:', analyticsData)
          setData(analyticsData)
        } else {
          const errorText = await response.text()
          console.error('Analytics fetch failed:', response.status, errorText)
        }
      } catch (error) {
        console.error('Failed to fetch analytics:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
  }, [])

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-8 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!data) return <div>Failed to load analytics</div>

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Locations</CardTitle>
            <MapPin className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.overview.totalLocations.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {data.timeRanges.today} today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.overview.totalUsers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Active platform users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Photos Processed</CardTitle>
            <Camera className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.overview.processedPhotos.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {data.quality.photoProcessingRate.toFixed(1)}% processing rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.quality.successRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {data.overview.validLocations} valid locations
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Growth Metrics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm">Daily Growth</span>
              <div className="flex items-center gap-2">
                {data.growth.daily >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-600" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-600" />
                )}
                <Badge variant={data.growth.daily >= 0 ? "default" : "destructive"}>
                  {data.growth.daily.toFixed(1)}%
                </Badge>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Weekly Average</span>
              <Badge variant="outline">{data.growth.weeklyAverage.toFixed(1)}/day</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Monthly Average</span>
              <Badge variant="outline">{data.growth.monthlyAverage.toFixed(1)}/day</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Quality Metrics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm">Success Rate</span>
              <Badge variant="default">{data.quality.successRate.toFixed(1)}%</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Address Complete</span>
              <Badge variant="secondary">{data.quality.addressCompleteness.toFixed(1)}%</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Photo Processing</span>
              <Badge variant="outline">{data.quality.photoProcessingRate.toFixed(1)}%</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bookmark className="h-5 w-5" />
              Activity Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm">This Week</span>
              <Badge variant="default">{data.timeRanges.week}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">This Month</span>
              <Badge variant="secondary">{data.timeRanges.month}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Geofences Active</span>
              <Badge variant="outline">{data.overview.activeGeofences}/{data.overview.geofences}</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Top Locations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.topLocations.slice(0, 5).map((location, index) => (
                <div key={index} className="flex justify-between items-center p-2 bg-muted rounded">
                  <span className="text-sm font-medium truncate">{location.name}</span>
                  <Badge variant="secondary">{location.count}</Badge>
                </div>
              ))}
              {data.topLocations.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No location data yet</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.topUsers.slice(0, 5).map((user, index) => (
                <div key={index} className="flex justify-between items-center p-2 bg-muted rounded">
                  <span className="text-sm font-medium truncate">{user.userName}</span>
                  <Badge variant="secondary">{user.locationCount} locations</Badge>
                </div>
              ))}
              {data.topUsers.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No user data yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
