"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  MapPin, 
  Camera, 
  TrendingUp, 
  Users, 
  Activity, 
  Bookmark,
  Clock,
  Target,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Eye
} from "lucide-react"
import Link from "next/link"

interface DashboardStats {
  totalDetections: number
  totalLocations: number
  totalBookmarks: number
  recentDetections: number
  successRate: number
  weeklyGrowth: number
}

interface RecentDetection {
  id: string
  name: string
  address: string
  confidence: number
  timeAgo: string
}

interface ActivityData {
  day: string
  detections: number
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalDetections: 0,
    totalLocations: 0,
    totalBookmarks: 0,
    recentDetections: 0,
    successRate: 0,
    weeklyGrowth: 0
  })
  const [recentDetections, setRecentDetections] = useState<RecentDetection[]>([])
  const [activityData, setActivityData] = useState<ActivityData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [statsRes, recentRes, activityRes] = await Promise.all([
          fetch('/api/dashboard/stats'),
          fetch('/api/dashboard/recent'),
          fetch('/api/dashboard/activity')
        ])

        const [statsData, recentData, activityDataRes] = await Promise.all([
          statsRes.json(),
          recentRes.json(),
          activityRes.json()
        ])

        setStats(statsData)
        setRecentDetections(recentData)
        setActivityData(activityDataRes)
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4 sm:py-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-sm sm:text-base text-gray-600">Monitor your location detection activity</p>
              </div>
              <Link href="/camera">
                <Button className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto">
                  <Camera className="mr-2 h-4 w-4" />
                  New Detection
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <Card className="border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">Total Detections</CardTitle>
              <div className="p-1.5 sm:p-2 bg-blue-100 rounded-lg">
                <Target className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold text-gray-900">{stats.totalDetections.toLocaleString()}</div>
              <div className="flex items-center mt-2">
                <ArrowUpRight className="h-3 w-3 text-green-500 mr-1" />
                <span className="text-xs text-green-600 font-medium">+{stats.weeklyGrowth}% this week</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">Locations Found</CardTitle>
              <div className="p-1.5 sm:p-2 bg-green-100 rounded-lg">
                <MapPin className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold text-gray-900">{stats.totalLocations.toLocaleString()}</div>
              <div className="flex items-center mt-2">
                <Progress value={stats.successRate} className="w-16 h-2 mr-2" />
                <span className="text-xs text-gray-600">{stats.successRate}% success rate</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">Bookmarks</CardTitle>
              <div className="p-1.5 sm:p-2 bg-purple-100 rounded-lg">
                <Bookmark className="h-3 w-3 sm:h-4 sm:w-4 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold text-gray-900">{stats.totalBookmarks}</div>
              <p className="text-xs text-gray-600 mt-2">Saved locations</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">Recent Activity</CardTitle>
              <div className="p-1.5 sm:p-2 bg-orange-100 rounded-lg">
                <Activity className="h-3 w-3 sm:h-4 sm:w-4 text-orange-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold text-gray-900">{stats.recentDetections}</div>
              <p className="text-xs text-gray-600 mt-2">Last 24 hours</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
          {/* Recent Detections */}
          <div className="lg:col-span-2">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
                  <CardTitle className="text-base sm:text-lg font-semibold text-gray-900">Recent Detections</CardTitle>
                  <Link href="/locations">
                    <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
                      View all
                      <ArrowUpRight className="ml-1 h-3 w-3" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-gray-100">
                  {recentDetections.map((detection, index) => (
                    <div key={detection.id} className="p-4 sm:p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
                        <div className="flex-1 w-full">
                          <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0">
                              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                <MapPin className="h-5 w-5 text-blue-600" />
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {detection.name}
                              </p>
                              <p className="text-sm text-gray-500 truncate">
                                {detection.address}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 sm:space-x-3 flex-wrap">
                          <Badge 
                            variant={detection.confidence > 0.9 ? "default" : detection.confidence > 0.8 ? "secondary" : "outline"}
                            className="text-xs"
                          >
                            {Math.round(detection.confidence * 100)}% match
                          </Badge>
                          <div className="flex items-center text-xs text-gray-500">
                            <Clock className="h-3 w-3 mr-1" />
                            {detection.timeAgo}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {recentDetections.length === 0 && (
                  <div className="p-12 text-center">
                    <Eye className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">No recent detections</p>
                    <Link href="/camera">
                      <Button>Start Detecting</Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Activity Chart & Quick Actions */}
          <div className="space-y-4 sm:space-y-6">
            {/* Weekly Activity */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base sm:text-lg font-semibold text-gray-900 flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  Weekly Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {activityData.map((day, index) => (
                    <div key={day.day} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 w-8">{day.day}</span>
                      <div className="flex-1 mx-3">
                        <div className="bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${Math.max((day.detections / Math.max(...activityData.map(d => d.detections))) * 100, 5)}%` }}
                          />
                        </div>
                      </div>
                      <span className="text-sm font-medium text-gray-900 w-6 text-right">
                        {day.detections}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base sm:text-lg font-semibold text-gray-900">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 sm:space-y-3">
                <Link href="/camera" className="block">
                  <Button className="w-full justify-start bg-blue-600 hover:bg-blue-700">
                    <Camera className="mr-3 h-4 w-4" />
                    New Detection
                  </Button>
                </Link>
                <Link href="/locations" className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <MapPin className="mr-3 h-4 w-4" />
                    Browse Locations
                  </Button>
                </Link>
                <Link href="/analytics" className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <TrendingUp className="mr-3 h-4 w-4" />
                    View Analytics
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}