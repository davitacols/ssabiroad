"use client"

import { useState, useEffect } from "react"
import { X, Search, Sliders, ChevronDown, Info, Heart, MapPin, Clock, Loader2, AlertCircle } from 'lucide-react'
import { motion } from "framer-motion"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/use-toast"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ImageIcon } from 'lucide-react'

// Define a type for saved locations
interface SavedLocation {
  id: string
  name: string
  address?: string
  category?: string
  confidence?: number
  createdAt: string
  description?: string
  location?: {
    latitude: number
    longitude: number
  }
  photos?: string[]
  isBookmarked?: boolean
  mapUrl?: string
  imageUrl?: string
}

// Helper function to get environment variables that works in both local and production
function getEnv(key: string): string | undefined {
  // For server-side code
  if (typeof process !== "undefined" && process.env) {
    return process.env[key]
  }
  // For client-side code with NEXT_PUBLIC_ prefix
  if (typeof window !== "undefined" && key.startsWith("NEXT_PUBLIC_")) {
    return (window as any).__ENV?.[key]
  }
  return undefined
}

export default function SearchFeature() {
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<SavedLocation[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedLocation, setSelectedLocation] = useState<SavedLocation | null>(null)
  const [showLocationDetails, setShowLocationDetails] = useState(false)
  const [searchFilters, setSearchFilters] = useState({
    category: "all",
    confidence: 0,
    dateRange: "all",
    sortBy: "relevance",
  })
  const [showFilters, setShowFilters] = useState(false)
  const [recentSearches, setRecentSearches] = useState<string[]>([])

  // Load recent searches from localStorage on component mount
  useEffect(() => {
    const storedSearches = localStorage.getItem("recentSearches")
    if (storedSearches) {
      try {
        setRecentSearches(JSON.parse(storedSearches))
      } catch (e) {
        console.error("Failed to parse stored searches", e)
      }
    }
  }, [])

  // Save recent searches to localStorage when they change
  useEffect(() => {
    if (recentSearches.length > 0) {
      localStorage.setItem("recentSearches", JSON.stringify(recentSearches))
    }
  }, [recentSearches])

  // Handle search
  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    try {
      setIsLoading(true)
      setError(null)

      // Add to recent searches
      if (searchQuery.trim() && !recentSearches.includes(searchQuery.trim())) {
        setRecentSearches((prev) => [searchQuery.trim(), ...prev].slice(0, 5))
      }

      // Simulate API call with setTimeout
      setTimeout(async () => {
        try {
          const response = await fetch(`/api/location-recognition/search?q=${encodeURIComponent(searchQuery)}&category=${searchFilters.category}&confidence=${searchFilters.confidence}&dateRange=${searchFilters.dateRange}&sortBy=${searchFilters.sortBy}`)

          if (!response.ok) {
            throw new Error(`API error: ${response.status}`)
          }

          const data = await response.json()

          if (data.success && data.locations) {
            setSearchResults(data.locations)
          } else {
            setSearchResults([])
          }
        } catch (err) {
          console.error("Search failed:", err)
          setError(err instanceof Error ? err.message : "Search failed")
          
          // For demo purposes, generate some mock results
          const mockResults = [
            {
              id: "1",
              name: "Empire State Building",
              address: "350 Fifth Avenue, New York, NY 10118",
              category: "Landmark",
              confidence: 0.95,
              createdAt: new Date().toISOString(),
              description: "The Empire State Building is a 102-story Art Deco skyscraper in Midtown Manhattan, New York City.",
              location: { latitude: 40.7484, longitude: -73.9857 },
              photos: ["/placeholder.svg?height=200&width=300&text=Empire%20State%20Building"],
              isBookmarked: true
            },
            {
              id: "2",
              name: "Central Park",
              address: "New York, NY",
              category: "Park",
              confidence: 0.92,
              createdAt: new Date().toISOString(),
              description: "Central Park is an urban park in New York City located between the Upper West and Upper East Sides of Manhattan.",
              location: { latitude: 40.7829, longitude: -73.9654 },
              photos: ["/placeholder.svg?height=200&width=300&text=Central%20Park"],
              isBookmarked: false
            },
            {
              id: "3",
              name: "Times Square",
              address: "Manhattan, NY 10036",
              category: "Point of Interest",
              confidence: 0.88,
              createdAt: new Date().toISOString(),
              description: "Times Square is a major commercial intersection, tourist destination, entertainment center, and neighborhood in Midtown Manhattan.",
              location: { latitude: 40.7580, longitude: -73.9855 },
              photos: ["/placeholder.svg?height=200&width=300&text=Times%20Square"],
              isBookmarked: false
            }
          ].filter(loc => 
            loc.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
            loc.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
            loc.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
            loc.category.toLowerCase().includes(searchQuery.toLowerCase())
          )
          
          setSearchResults(mockResults)
        } finally {
          setIsLoading(false)
        }
      }, 1000)
    } catch (err) {
      console.error("Search failed:", err)
      setError(err instanceof Error ? err.message : "Search failed")
      setIsLoading(false)
    }
  }

  // Handle location selection
  const handleViewDetails = (location: SavedLocation) => {
    setSelectedLocation(location)
    setShowLocationDetails(true)
  }

  // Handle filter change
  const handleFilterChange = (filter: string, value: any) => {
    setSearchFilters((prev) => ({
      ...prev,
      [filter]: value,
    }))
  }

  // Handle recent search selection
  const handleRecentSearchSelect = (search: string) => {
    setSearchQuery(search)
    // Trigger search immediately
    setTimeout(() => handleSearch(), 100)
  }

  // Handle clear recent searches
  const handleClearRecentSearches = () => {
    setRecentSearches([])
    localStorage.removeItem("recentSearches")
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Input
              placeholder="Search locations, landmarks, businesses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSearch()
                }
              }}
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full"
                onClick={() => setSearchQuery("")}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          <Button onClick={handleSearch} className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Search className="mr-2 h-4 w-4" />
            Search
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="gap-2"
          >
            <Sliders className="h-4 w-4" />
            Filters
            {showFilters ? <ChevronDown className="h-4 w-4" /> : <ChevronDown className="h-4 w-4 rotate-180" />}
          </Button>
        </div>

        {/* Filters */}
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-muted/30 rounded-lg p-4 border border-border"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category-filter">Category</Label>
                <Select
                  value={searchFilters.category}
                  onValueChange={(value) => handleFilterChange("category", value)}
                >
                  <SelectTrigger id="category-filter">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="Landmark">Landmarks</SelectItem>
                    <SelectItem value="Business">Businesses</SelectItem>
                    <SelectItem value="Point of Interest">Points of Interest</SelectItem>
                    <SelectItem value="Park">Parks</SelectItem>
                    <SelectItem value="Restaurant">Restaurants</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confidence-filter">Min. Confidence</Label>
                <Select
                  value={searchFilters.confidence.toString()}
                  onValueChange={(value) => handleFilterChange("confidence", parseInt(value))}
                >
                  <SelectTrigger id="confidence-filter">
                    <SelectValue placeholder="Select confidence" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Any Confidence</SelectItem>
                    <SelectItem value="50">50% or higher</SelectItem>
                    <SelectItem value="70">70% or higher</SelectItem>
                    <SelectItem value="90">90% or higher</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="date-filter">Date Range</Label>
                <Select
                  value={searchFilters.dateRange}
                  onValueChange={(value) => handleFilterChange("dateRange", value)}
                >
                  <SelectTrigger id="date-filter">
                    <SelectValue placeholder="Select date range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                    <SelectItem value="year">This Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sort-filter">Sort By</Label>
                <Select
                  value={searchFilters.sortBy}
                  onValueChange={(value) => handleFilterChange("sortBy", value)}
                >
                  <SelectTrigger id="sort-filter">
                    <SelectValue placeholder="Select sort order" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="relevance">Relevance</SelectItem>
                    <SelectItem value="date-desc">Newest First</SelectItem>
                    <SelectItem value="date-asc">Oldest First</SelectItem>
                    <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                    <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                    <SelectItem value="confidence-desc">Highest Confidence</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </motion.div>
        )}

        {/* Recent Searches */}
        {recentSearches.length > 0 && !searchResults.length && !isLoading && (
          <div className="mt-2">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-muted-foreground">Recent Searches</h3>
              <Button variant="ghost" size="sm" onClick={handleClearRecentSearches}>
                Clear
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {recentSearches.map((search, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  className="rounded-full"
                  onClick={() => handleRecentSearchSelect(search)}
                >
                  <Clock className="mr-1 h-3 w-3" />
                  {search}
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Search Results */}
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
            <h3 className="text-lg font-medium">Searching...</h3>
            <p className="text-muted-foreground">Looking for locations matching "{searchQuery}"</p>
          </div>
        </div>
      ) : error ? (
        <Card>
          <CardContent className="py-10">
            <div className="flex flex-col items-center justify-center text-center">
              <AlertCircle className="h-10 w-10 text-destructive mb-4" />
              <h3 className="text-lg font-medium mb-2">Search Error</h3>
              <p className="text-muted-foreground">{error}</p>
              <Button onClick={handleSearch} className="mt-4">
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : searchResults.length > 0 ? (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-medium">
              {searchResults.length} {searchResults.length === 1 ? "result" : "results"} for "{searchQuery}"
            </h2>
            <Select
              value={searchFilters.sortBy}
              onValueChange={(value) => handleFilterChange("sortBy", value)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="relevance">Relevance</SelectItem>
                <SelectItem value="date-desc">Newest First</SelectItem>
                <SelectItem value="date-asc">Oldest First</SelectItem>
                <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                <SelectItem value="confidence-desc">Highest Confidence</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {searchResults.map((location, index) => (
              <motion.div
                key={location.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="overflow-hidden h-full flex flex-col group hover:shadow-lg transition-shadow rounded-xl">
                  <div className="relative h-40 bg-muted">
                    <img
                      src={location.photos?.[0] || `/placeholder.svg?height=160&width=320&text=${encodeURIComponent(location.name || "Unknown")}`}
                      alt={location.name || "Unknown location"}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <h3 className="font-medium text-white truncate">{location.name || "Unknown"}</h3>
                      <p className="text-xs text-white/80 truncate">{location.address || "No address"}</p>
                    </div>
                    <div className="absolute top-2 right-2 flex gap-1">
                      <Button
                        variant="secondary"
                        size="icon"
                        className="h-7 w-7 bg-black/30 hover:bg-black/50 text-white border-none opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleViewDetails(location)}
                      >
                        <Info className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="secondary"
                        size="icon"
                        className="h-7 w-7 bg-black/30 hover:bg-black/50 text-white border-none opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        {location.isBookmarked ? (
                          <Heart className="h-3.5 w-3.5 fill-red-500 text-red-500" />
                        ) : (
                          <Heart className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </div>
                    {location.confidence && (
                      <div className="absolute top-2 left-2">
                        <Badge variant={location.confidence > 0.8 ? "default" : "secondary"} className="bg-black/30 text-white">
                          {Math.round(location.confidence * 100)}%
                        </Badge>
                      </div>
                    )}
                  </div>
                  <CardContent className="flex-1 p-3">
                    <div className="flex justify-between items-center mb-2">
                      <Badge variant="outline" className="text-xs">
                        {location.category || "Unknown"}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(location.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    {location.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-2">
                        {location.description}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      ) : searchQuery ? (
        <Card>
          <CardContent className="py-10">
            <div className="flex flex-col items-center justify-center text-center">
              <Search className="h-10 w-10 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No Results Found</h3>
              <p className="text-muted-foreground">
                No locations match your search for "{searchQuery}". Try adjusting your search terms or filters.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-10">
            <div className="flex flex-col items-center justify-center text-center">
              <Search className="h-10 w-10 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Search for Locations</h3>
              <p className="text-muted-foreground">
                Enter a search term to find locations, landmarks, or businesses in your database.
              </p>
              <div className="mt-6 space-y-2 text-left max-w-md mx-auto">
                <p className="text-sm font-medium">Search Tips:</p>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc pl-5">
                  <li>Search by location name, address, or description</li>
                  <li>Use filters to narrow down results by category or date</li>
                  <li>Sort results by relevance, date, or confidence level</li>
                  <li>Click on a location card to view detailed information</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Location Details Dialog */}
      <Dialog open={showLocationDetails} onOpenChange={setShowLocationDetails}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedLocation && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {selectedLocation.name || "Unknown Location"}
                  {selectedLocation.confidence && (
                    <Badge variant={selectedLocation.confidence > 0.8 ? "default" : "outline"} className="ml-2">
                      {Math.round(selectedLocation.confidence * 100)}% confidence
                    </Badge>
                  )}
                </DialogTitle>
                <DialogDescription>{selectedLocation.address || "No address available"}</DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-4">
                  {selectedLocation.photos && selectedLocation.photos.length > 0 ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="rounded-lg overflow-hidden border h-48"
                    >
                      <img
                        src={selectedLocation.photos[0] || "/placeholder.svg"}
                        alt={selectedLocation.name}
                        className="w-full h-full object-cover"
                      />
                    </motion.div>
                  ) : (
                    <div className="rounded-lg overflow-hidden border h-48 bg-muted flex items-center justify-center">
                      <ImageIcon className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}

                  {selectedLocation.location && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.2 }}
                      className="rounded-lg overflow-hidden border h-48"
                    >
                      <iframe
                        width="100%"
                        height="100%"
                        frameBorder="0"
                        src={`https://www.google.com/maps/embed/v1/place?key=${getEnv("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY")}&q=${selectedLocation.location.latitude},${selectedLocation.location.longitude}&zoom=15`}
                        allowFullScreen
                      ></iframe>
                    </motion.div>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium mb-1">Category</h4>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">{selectedLocation.category || "Unknown"}</Badge>
                    </div>
                  </div>

                  {selectedLocation.description && (
                    <div>
                      <h4 className="text-sm font-medium mb-1">Description</h4>
                      <p className="text-sm text-muted-foreground">{selectedLocation.description}</p>
                    </div>
                  )}

                  {selectedLocation.location && (
                    <div>
                      <h4 className="text-sm font-medium mb-1">Coordinates</h4>
                      <p className="text-sm text-muted-foreground">
                        {selectedLocation.location.latitude.toFixed(6)},{" "}
                        {selectedLocation.location.longitude.toFixed(6)}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <DialogFooter className="flex flex-wrap justify-between gap-2 mt-4">
                <Button variant="outline">
                  {selectedLocation.isBookmarked ? (
                    <>
                      <Heart className="mr-2 h-4 w-4 fill-primary text-primary" />
                      Remove Bookmark
                    </>
                  ) : (
                    <>
                      <Heart className="mr-2 h-4 w-4" />
                      Add Bookmark
                    </>
                  )}
                </Button>

                <Button asChild className="bg-primary hover:bg-primary/90">
                  <a href={`https://www.google.com/maps/search/?api=1&query=${selectedLocation.location?.latitude},${selectedLocation.location?.longitude}`} target="_blank" rel="noopener noreferrer">
                    <MapPin className="mr-2 h-4 w-4" />
                    View on Map
                  </a>
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
