"use client"

import type React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Info, MapPin, Navigation, Star, Clock, Phone, Globe, AccessibilityIcon, Shield, CheckCircle } from 'lucide-react'

interface DetectionResult {
  success: boolean
  type: string
  description: string
  location: {
    latitude: number
    longitude: number
  }
  confidence: number
  publicInfo?: {
    openingHours?: string[]
    contactInfo?: {
      phone?: string
      website?: string
    }
    ratings?: {
      average: number
      total: number
      source: string
    }[]
    accessibility?: {
      features: string[]
    }
    publicTransport?: string[]
  }
  features?: {
    architecture?: string[]
    materials?: string[]
    style?: string[]
  }
  imageProperties: {
    dominantColors: string[]
    brightness: number
    contrast: number
    primaryStyle?: string
    aestheticScore?: number
  }
  safetyScore: number
  similarBuildings: string[]
  lastUpdated: string
  sourceReliability: number
}

interface BuildingInfoCardProps {
  detectionResult: DetectionResult
  address: string | null
}

const BuildingInfoCard: React.FC<BuildingInfoCardProps> = ({ detectionResult, address }) => {
  const handleNavigate = () => {
    if (detectionResult?.location) {
      const destination = encodeURIComponent(
        `${detectionResult.location.latitude},${detectionResult.location.longitude}`,
      )
      const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${destination}`
      window.open(mapsUrl, "_blank")
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">{detectionResult.description || "Building Details"}</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="w-full justify-start mb-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="amenities">Amenities</TabsTrigger>
            <TabsTrigger value="imageProperties">Image Properties</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-2 text-green-600">
                <Info className="w-5 h-5" />
                <span>Detection Type: {detectionResult.type}</span>
              </div>
              <div className="flex items-center gap-2 text-green-600">
                <Info className="w-5 h-5" />
                <span>Confidence: {(detectionResult.confidence * 100).toFixed(1)}%</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                <span>
                  Location: {detectionResult.location.latitude.toFixed(6)},{" "}
                  {detectionResult.location.longitude.toFixed(6)}
                </span>
              </div>
              {address && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  <span>Address: {address}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                <span>Safety Score: {detectionResult.safetyScore}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                <span>Last Updated: {new Date(detectionResult.lastUpdated).toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                <span>Source Reliability: {(detectionResult.sourceReliability * 100).toFixed(2)}%</span>
              </div>
            </div>

            <Button onClick={handleNavigate} className="w-full mt-4">
              <Navigation className="w-5 h-5 mr-2" />
              Open in Maps
            </Button>

            {detectionResult.features && (
              <div className="mt-4">
                <h3 className="font-semibold mb-2">Building Features</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {detectionResult.features.style && (
                    <div>
                      <span className="font-medium">Style:</span> {detectionResult.features.style.join(", ")}
                    </div>
                  )}
                  {detectionResult.features.architecture && (
                    <div>
                      <span className="font-medium">Architecture:</span>{" "}
                      {detectionResult.features.architecture.join(", ")}
                    </div>
                  )}
                  {detectionResult.features.materials && (
                    <div>
                      <span className="font-medium">Materials:</span> {detectionResult.features.materials.join(", ")}
                    </div>
                  )}
                </div>
              </div>
            )}

            {detectionResult.publicInfo && (
              <div className="space-y-4 mt-4">
                {detectionResult.publicInfo.ratings && detectionResult.publicInfo.ratings.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-yellow-500" />
                    <span>
                      {detectionResult.publicInfo.ratings[0].average.toFixed(1)} (
                      {detectionResult.publicInfo.ratings[0].total} reviews)
                    </span>
                  </div>
                )}

                {detectionResult.publicInfo.openingHours && (
                  <div>
                    <h3 className="font-semibold mb-2">Opening Hours</h3>
                    <ul className="list-disc list-inside">
                      {detectionResult.publicInfo.openingHours.map((hours, index) => (
                        <li key={index}>{hours}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {detectionResult.publicInfo.contactInfo && (
                  <div className="space-y-2">
                    {detectionResult.publicInfo.contactInfo.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-5 h-5" />
                        <a
                          href={`tel:${detectionResult.publicInfo.contactInfo.phone}`}
                          className="text-blue-600 hover:underline"
                        >
                          {detectionResult.publicInfo.contactInfo.phone}
                        </a>
                      </div>
                    )}
                    {detectionResult.publicInfo.contactInfo.website && (
                      <div className="flex items-center gap-2">
                        <Globe className="w-5 h-5" />
                        <a
                          href={detectionResult.publicInfo.contactInfo.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          Visit Website
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="amenities" className="space-y-4">
            {detectionResult.publicInfo?.accessibility && (
              <div>
                <h3 className="font-semibold flex items-center gap-2 mb-2">
                  <AccessibilityIcon className="w-5 h-5" />
                  Accessibility Features
                </h3>
                <ul className="list-disc list-inside">
                  {detectionResult.publicInfo.accessibility.features.map((feature, index) => (
                    <li key={index}>{feature}</li>
                  ))}
                </ul>
              </div>
            )}

            {detectionResult.similarBuildings && detectionResult.similarBuildings.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">Similar Buildings</h3>
                <ul className="list-disc list-inside">
                  {detectionResult.similarBuildings.map((building, index) => (
                    <li key={index}>{building}</li>
                  ))}
                </ul>
              </div>
            )}

            {detectionResult.publicInfo?.publicTransport && detectionResult.publicInfo.publicTransport.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">Public Transport</h3>
                <ul className="list-disc list-inside">
                  {detectionResult.publicInfo.publicTransport.map((transport, index) => (
                    <li key={index}>{transport}</li>
                  ))}
                </ul>
              </div>
            )}
          </TabsContent>

          <TabsContent value="imageProperties" className="space-y-4">
            <h3 className="font-semibold text-lg">Image Properties</h3>
            {detectionResult.imageProperties && (
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold">Dominant Colors</h4>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {detectionResult.imageProperties.dominantColors.map((color, index) => (
                      <div
                        key={index}
                        className="w-8 h-8 rounded-full border"
                        style={{ backgroundColor: color }}
                        title={color}
                      ></div>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold">Brightness</h4>
                    <p>{(detectionResult.imageProperties.brightness * 100).toFixed(2)}%</p>
                  </div>
                  <div>
                    <h4 className="font-semibold">Contrast</h4>
                    <p>{(detectionResult.imageProperties.contrast * 100).toFixed(2)}%</p>
                  </div>
                  {detectionResult.imageProperties.primaryStyle && (
                    <div>
                      <h4 className="font-semibold">Primary Style</h4>
                      <p>{detectionResult.imageProperties.primaryStyle}</p>
                    </div>
                  )}
                  {detectionResult.imageProperties.aestheticScore !== undefined && (
                    <div>
                      <h4 className="font-semibold">Aesthetic Score</h4>
                      <p>{detectionResult.imageProperties.aestheticScore.toFixed(2)}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

export default BuildingInfoCard