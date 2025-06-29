"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MapPin, Calendar, Navigation, Star, Smartphone } from "lucide-react"

interface Location {
  id: number
  name: string
  address: string
  location: { latitude: number, longitude: number } | null
  confidence: number
  method: string
  apiVersion: string
  category: string
  rating: number | null
  phoneNumber: string | null
  createdAt: string
  nearbyPlacesCount: number
  photosCount: number
  deviceMake: string | null
  deviceModel: string | null
}

export function RecentLocations() {
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const response = await fetch('/api/recent-locations?limit=10')
        if (response.ok) {
          const data = await response.json()
          setLocations(data.locations)
        }
      } catch (error) {
        console.error('Failed to fetch recent locations:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchLocations()
  }, [])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Locations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          Recent Locations
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {locations.map((location) => (
            <div key={location.id} className="border rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-semibold">{location.name}</h3>
                  <p className="text-sm text-muted-foreground">{location.address}</p>
                </div>
                <div className="flex gap-2">
                  <Badge variant={location.apiVersion === 'v2' ? 'default' : 'secondary'}>
                    {location.apiVersion.toUpperCase()}
                  </Badge>
                  <Badge variant="outline">
                    {Math.round(location.confidence * 100)}%
                  </Badge>
                </div>
              </div>
              
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {new Date(location.createdAt).toLocaleDateString()}
                </div>
                {location.rating && (
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 text-amber-500" />
                    {location.rating}
                  </div>
                )}
                {location.deviceMake && (
                  <div className="flex items-center gap-1">
                    <Smartphone className="h-3 w-3" />
                    {location.deviceMake} {location.deviceModel}
                  </div>
                )}
              </div>

              {location.apiVersion === 'v2' && (
                <div className="flex gap-4 text-xs text-muted-foreground">
                  {location.photosCount > 0 && (
                    <span>{location.photosCount} photos</span>
                  )}
                  {location.nearbyPlacesCount > 0 && (
                    <span>{location.nearbyPlacesCount} nearby places</span>
                  )}
                </div>
              )}

              {location.location && (
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full"
                  asChild
                >
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${location.location.latitude},${location.location.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Navigation className="h-3 w-3 mr-2" />
                    Get Directions
                  </a>
                </Button>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}