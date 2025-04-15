"use client"

import type React from "react"

import { useState } from "react"
import { Search, MapPin, Building, X, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { searchPlaces, type LocationResult } from "@/app/actions/places-api"
import { useDebounce } from "@/hooks/use-debounce"
import { useEffect } from "react"

interface SearchPanelProps {
  onLocationSelect: (location: LocationResult) => void
}

export function SearchPanel({ onLocationSelect }: SearchPanelProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<LocationResult[]>([])
  const [error, setError] = useState<string | null>(null)

  // Debounce search term to avoid too many API calls
  const debouncedSearchTerm = useDebounce(searchTerm, 500)

  // Auto-search when debounced search term changes
  useEffect(() => {
    if (debouncedSearchTerm.trim().length >= 3) {
      handleSearch()
    }
  }, [debouncedSearchTerm])

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault()
    }

    if (!searchTerm.trim() || searchTerm.trim().length < 3) return

    setIsSearching(true)
    setError(null)

    try {
      const results = await searchPlaces(searchTerm)
      setSearchResults(results)
    } catch (err) {
      console.error("Search error:", err)
      setError("Failed to search locations. Please try again.")
    } finally {
      setIsSearching(false)
    }
  }

  const handleClearSearch = () => {
    setSearchTerm("")
    setSearchResults([])
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            type="text"
            placeholder="Search locations by name, address, or category..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-500"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Button type="submit" disabled={isSearching || searchTerm.trim().length < 3}>
          {isSearching ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Search className="h-4 w-4 mr-2" />}
          Search
        </Button>
      </form>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 p-3 rounded-md">{error}</div>
      )}

      {isSearching ? (
        <div className="flex justify-center py-12">
          <div className="flex flex-col items-center">
            <Loader2 className="h-8 w-8 animate-spin text-teal-500 mb-4" />
            <p className="text-slate-600 dark:text-slate-300">Searching locations...</p>
          </div>
        </div>
      ) : searchResults.length > 0 ? (
        <ScrollArea className="h-[calc(100vh-250px)]">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {searchResults.map((result) => (
              <Card
                key={result.id}
                className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => onLocationSelect(result)}
              >
                <div className="h-32 bg-slate-100 dark:bg-slate-800 relative">
                  {result.photos && result.photos.length > 0 ? (
                    <img
                      src={result.photos[0] || "/placeholder.svg"}
                      alt={result.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Building className="h-12 w-12 text-slate-300" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2">
                    <Badge variant={result.confidence > 0.9 ? "default" : "outline"}>
                      {Math.round(result.confidence * 100)}%
                    </Badge>
                  </div>
                  {result.rating && (
                    <div className="absolute bottom-2 right-2">
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          className="w-3 h-3 text-yellow-500"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z"
                            clipRule="evenodd"
                          />
                        </svg>
                        {result.rating.toFixed(1)}
                      </Badge>
                    </div>
                  )}
                </div>
                <CardContent className="p-4">
                  <h3 className="font-medium text-lg mb-1">{result.name}</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300 mb-2">{result.address}</p>
                  <div className="flex flex-wrap gap-2">
                    {result.category && <Badge variant="secondary">{result.category}</Badge>}
                    {result.buildingType && <Badge variant="outline">{result.buildingType}</Badge>}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      ) : searchTerm && !isSearching ? (
        <div className="flex justify-center py-12">
          <div className="flex flex-col items-center">
            <MapPin className="h-12 w-12 text-slate-300 mb-4" />
            <p className="text-slate-600 dark:text-slate-300">No locations found</p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Try a different search term</p>
          </div>
        </div>
      ) : null}
    </div>
  )
}
