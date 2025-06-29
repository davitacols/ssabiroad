"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ShareButton } from "@/components/ui/share-button"
import { MapPin, Navigation, Phone, Globe, Star, Calendar, Smartphone } from "lucide-react"

interface LocationDetailsProps {
  location: any
}

export function LocationDetails({ location }: LocationDetailsProps) {
  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">{location.name}</h1>
            <p className="text-muted-foreground mt-2">{location.address}</p>
          </div>
          <ShareButton
            title={location.name}
            text={`Check out ${location.name} at ${location.address}`}
            url={typeof window !== 'undefined' ? window.location.href : ''}
          />
        </div>

        {/* Main Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Location Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {location.category && (
                <Badge>{location.category}</Badge>
              )}
              {location.apiVersion && (
                <Badge variant="outline">{location.apiVersion.toUpperCase()}</Badge>
              )}
              {location.confidence && (
                <Badge variant="secondary">
                  {Math.round(location.confidence * 100)}% confident
                </Badge>
              )}
            </div>

            {location.description && (
              <p className="text-sm">{location.description}</p>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {location.rating && (
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-amber-500" />
                  <span>{location.rating}/5</span>
                </div>
              )}
              {location.phoneNumber && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  <a href={`tel:${location.phoneNumber}`} className="text-blue-600 hover:underline">
                    {location.phoneNumber}
                  </a>
                </div>
              )}
              {location.website && (
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  <a href={location.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    Website
                  </a>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>{new Date(location.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Device Info */}
        {location.deviceMake && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                Device Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>{location.deviceMake} {location.deviceModel}</p>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="flex gap-4">
          {location.location && (
            <Button size="lg" asChild>
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${location.location.latitude},${location.location.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Navigation className="h-4 w-4 mr-2" />
                Get Directions
              </a>
            </Button>
          )}
          {location.phoneNumber && (
            <Button size="lg" variant="outline" asChild>
              <a href={`tel:${location.phoneNumber}`}>
                <Phone className="h-4 w-4 mr-2" />
                Call
              </a>
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}