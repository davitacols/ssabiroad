"use client"

import { useState } from "react"
import {
  Camera,
  MapPin,
  Map,
  Zap,
  Bookmark,
  Search,
  Clock,
  Info,
  ChevronRight,
  LayoutDashboard,
  Settings,
  Menu,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CameraRecognition } from "@/components/pic2nav/camera-recognition"
import { RecentLocationsPanel } from "@/components/pic2nav/recent-locations"
import { SearchPanel } from "@/components/pic2nav/search-panel"
import { BookmarksPanel } from "@/components/pic2nav/bookmarks-panel"
import { MapView } from "@/components/pic2nav/map-view"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

export function Pic2NavDashboard() {
  const [activeTab, setActiveTab] = useState("camera")
  const [selectedLocation, setSelectedLocation] = useState(null)

  // Handle location selection from any panel
  const handleLocationSelect = (location) => {
    setSelectedLocation(location)
    // If we're not already on the map tab, switch to it
    if (activeTab !== "map") {
      setActiveTab("map")
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <div className="mr-3 h-10 w-10 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center shadow-lg">
              <MapPin className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
                Pic2Nav
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">Visual Location Recognition</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-3">
              <Button variant="outline" size="sm" className="h-9">
                <Info className="h-4 w-4 mr-2" />
                Help & Guides
              </Button>
              <Button variant="outline" size="sm" className="h-9">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </div>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent>
                <div className="flex flex-col gap-4 mt-6">
                  <Button variant="ghost" className="justify-start">
                    <LayoutDashboard className="h-4 w-4 mr-2" />
                    Dashboard
                  </Button>
                  <Button variant="ghost" className="justify-start">
                    <MapPin className="h-4 w-4 mr-2" />
                    My Locations
                  </Button>
                  <Button variant="ghost" className="justify-start">
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </Button>
                  <Button variant="ghost" className="justify-start">
                    <Info className="h-4 w-4 mr-2" />
                    Help & Guides
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <Card className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50">
            <CardContent className="p-4 flex items-center">
              <div className="h-10 w-10 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center mr-3">
                <Camera className="h-5 w-5 text-teal-600 dark:text-teal-400" />
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Identified</p>
                <p className="text-xl font-bold">24</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50">
            <CardContent className="p-4 flex items-center">
              <div className="h-10 w-10 rounded-full bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center mr-3">
                <Bookmark className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Saved</p>
                <p className="text-xl font-bold">12</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50">
            <CardContent className="p-4 flex items-center">
              <div className="h-10 w-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mr-3">
                <Zap className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Fast Mode</p>
                <p className="text-xl font-bold">68%</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50">
            <CardContent className="p-4 flex items-center">
              <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mr-3">
                <Map className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Navigated</p>
                <p className="text-xl font-bold">18</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Card className="bg-white dark:bg-slate-800 border-slate-200/50 dark:border-slate-700/50 shadow-sm">
          <CardContent className="p-0">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="border-b border-slate-200 dark:border-slate-700">
                <TabsList className="h-14 w-full rounded-none bg-transparent border-b border-slate-200 dark:border-slate-700">
                  <TabsTrigger
                    value="camera"
                    className="flex items-center gap-2 data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-teal-500 data-[state=active]:shadow-none rounded-none h-14 px-4"
                  >
                    <Camera className="h-4 w-4" />
                    <span>Camera</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="recent"
                    className="flex items-center gap-2 data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-teal-500 data-[state=active]:shadow-none rounded-none h-14 px-4"
                  >
                    <Clock className="h-4 w-4" />
                    <span>Recent</span>
                    <Badge variant="secondary" className="ml-1 bg-slate-100 dark:bg-slate-700 text-xs">
                      3
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger
                    value="search"
                    className="flex items-center gap-2 data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-teal-500 data-[state=active]:shadow-none rounded-none h-14 px-4"
                  >
                    <Search className="h-4 w-4" />
                    <span>Search</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="map"
                    className="flex items-center gap-2 data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-teal-500 data-[state=active]:shadow-none rounded-none h-14 px-4"
                  >
                    <Map className="h-4 w-4" />
                    <span>Map</span>
                  </TabsTrigger>
                </TabsList>
              </div>

              <div className="p-6">
                <TabsContent value="camera" className="mt-0">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                      <CameraRecognition onLocationSelect={handleLocationSelect} />
                    </div>
                    <div className="lg:col-span-1 space-y-6">
                      <Card className="border-slate-200/50 dark:border-slate-700/50">
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg font-medium flex items-center">
                              <Clock className="h-4 w-4 mr-2 text-teal-500" />
                              Recent Locations
                            </CardTitle>
                            <Button variant="ghost" size="sm" className="h-8 gap-1">
                              View All <ChevronRight className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <RecentLocationsPanel onLocationSelect={handleLocationSelect} />
                        </CardContent>
                      </Card>

                      <Card className="border-slate-200/50 dark:border-slate-700/50">
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg font-medium flex items-center">
                              <Bookmark className="h-4 w-4 mr-2 text-teal-500" />
                              Bookmarks
                            </CardTitle>
                            <Button variant="ghost" size="sm" className="h-8 gap-1">
                              View All <ChevronRight className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <BookmarksPanel onLocationSelect={handleLocationSelect} />
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="recent" className="mt-0">
                  <RecentLocationsPanel onLocationSelect={handleLocationSelect} expanded={true} />
                </TabsContent>

                <TabsContent value="search" className="mt-0">
                  <SearchPanel onLocationSelect={handleLocationSelect} />
                </TabsContent>

                <TabsContent value="map" className="mt-0">
                  <MapView selectedLocation={selectedLocation} />
                </TabsContent>
              </div>
            </Tabs>
          </CardContent>
        </Card>

        {/* Activity & Usage */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <Card className="border-slate-200/50 dark:border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-lg font-medium">Recent Activity</CardTitle>
              <CardDescription>Your location recognition history</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  {
                    icon: Camera,
                    color: "text-teal-500 bg-teal-100 dark:bg-teal-900/30",
                    title: "Empire State Building",
                    time: "2 hours ago",
                    action: "Identified",
                  },
                  {
                    icon: Bookmark,
                    color: "text-cyan-500 bg-cyan-100 dark:bg-cyan-900/30",
                    title: "Central Park",
                    time: "Yesterday",
                    action: "Bookmarked",
                  },
                  {
                    icon: Map,
                    color: "text-purple-500 bg-purple-100 dark:bg-purple-900/30",
                    title: "Times Square",
                    time: "3 days ago",
                    action: "Navigated to",
                  },
                ].map((item, index) => (
                  <div key={index} className="flex items-start">
                    <div className={`h-8 w-8 rounded-full ${item.color} flex items-center justify-center mr-3 mt-0.5`}>
                      <item.icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">
                        {item.action} {item.title}
                      </p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{item.time}</p>
                    </div>
                    <Button variant="ghost" size="sm" className="h-8">
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200/50 dark:border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-lg font-medium">Usage Statistics</CardTitle>
              <CardDescription>Your app usage this month</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Fast Mode Usage</span>
                    <span className="text-sm text-slate-500">68%</span>
                  </div>
                  <Progress value={68} className="h-2" />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Recognition Accuracy</span>
                    <span className="text-sm text-slate-500">92%</span>
                  </div>
                  <Progress value={92} className="h-2" />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Monthly Quota</span>
                    <span className="text-sm text-slate-500">24/100</span>
                  </div>
                  <Progress value={24} className="h-2" />
                </div>

                <div className="pt-2">
                  <Button variant="outline" className="w-full">
                    View Detailed Analytics
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
