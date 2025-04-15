"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Clock, MapPin, Zap, Search, X, Calendar, Star } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface RecentLocation {
  name: string
  address: string
  confidence?: number
  category?: string
  date: string
  mapUrl?: string
  location?: {
    latitude: number
    longitude: number
  }
  photos?: string[]
  rating?: number
  fastMode?: boolean
  processingTime?: number
}

export function RecentLocationsPanel({ onLocationSelect, expanded = false, className = "" }) {
  const [recentLocations, setRecentLocations] = useState<RecentLocation[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredLocations, setFilteredLocations] = useState<RecentLocation[]>([])

  // Load recent locations from localStorage on component mount
  useEffect(() => {
    const storedLocations = localStorage.getItem("recentLocations")
    if (storedLocations) {
      try {
        setRecentLocations(JSON.parse(storedLocations))
      } catch (e) {
        console.error("Failed to parse stored locations", e)
      }
    }
  }, [])

  // Filter locations when search term changes
  useEffect(() => {
    if (!searchTerm) {
      setFilteredLocations(recentLocations)
      return
    }

    const filtered = recentLocations.filter(
      (location) =>
        location.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        location.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (location.category && location.category.toLowerCase().includes(searchTerm.toLowerCase())),
    )
    setFilteredLocations(filtered)
  }, [searchTerm, recentLocations])

  const handleClearSearch = () => {
    setSearchTerm("")
  }

  const handleClearHistory = () => {
    setRecentLocations([])
    localStorage.removeItem("recentLocations")
  }

  return (
    <Card className={`border border-slate-200 dark:border-slate-700 shadow-md rounded-xl overflow-hidden ${className}`}>
      <CardHeader
        className={`pb-2 bg-slate-50 dark:bg-slate-800/50 ${expanded ? "flex-row justify-between items-center" : ""}`}
      >
        <div>
          <CardTitle className="text-lg flex items-center">
            <Clock className="mr-2 h-4 w-4 text-teal-500" />
            Recent Locations
          </CardTitle>
          <CardDescription>Your recently identified places</CardDescription>
        </div>

        {expanded && (
          <Button variant="outline" size="sm" onClick={handleClearHistory}>
            Clear History
          </Button>
        )}
      </CardHeader>

      <CardContent className={expanded ? "p-4" : "p-3"}>
        {expanded && (
          <div className="relative mb-4">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Search recent locations..."
              className="pl-9 h-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                onClick={handleClearSearch}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-500"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        )}

        {filteredLocations.length > 0 ? (
          <ScrollArea className={expanded ? "h-[calc(100vh-300px)]" : "max-h-[350px]"} className="pr-3">
            <div className="space-y-3">
              {filteredLocations.map((location, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                  onClick={() => onLocationSelect(location)}
                >
                  <div className="flex items-start gap-3">
                    {location.photos && location.photos.length > 0 ? (
                      <div className="w-16 h-16 rounded-md overflow-hidden flex-shrink-0">
                        <img
                          src={location.photos[0] || "/placeholder.svg"}
                          alt={location.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = "/placeholder.svg?height=64&width=64"
                          }}
                        />
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-md bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
                        <MapPin className="h-6 w-6 text-slate-400" />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium truncate">{location.name}</h4>
                        {location.confidence && (
                          <Badge variant="outline" className="ml-2 text-xs">
                            {Math.round(location.confidence * 100)}%
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 truncate">{location.address}</p>

                      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mt-1">
                        <div className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          <span>{location.date}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          {location.rating && (
                            <div className="flex items-center">
                              <Star className="h-3 w-3 fill-amber-400 text-amber-400 mr-0.5" />
                              <span>{location.rating}</span>
                            </div>
                          )}

                          {location.fastMode !== undefined && (
                            <div className="flex items-center">
                              {location.fastMode ? (
                                <Zap className="h-3 w-3 mr-0.5 text-amber-500" />
                              ) : (
                                <Clock className="h-3 w-3 mr-0.5" />
                              )}
                              <span>{location.fastMode ? "Fast" : "Detailed"}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="py-8 text-center">
            <MapPin className="h-10 w-10 mx-auto text-slate-400 dark:text-slate-500 mb-3" />
            <p className="text-sm text-slate-600 dark:text-slate-300">No recent locations found</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {searchTerm ? "Try a different search term" : "Try recognizing a location first"}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

