"use client"

import { useState, useEffect } from "react"
import type React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Info,
  MapPin,
  Navigation,
  Star,
  Clock,
  Phone,
  Globe,
  AccessibilityIcon,
  Shield,
  CheckCircle,
  Loader2,
  Building,
  Bus,
  Palette,
  Droplet,
  Contrast,
  Zap,
  Layers,
  PaintBucket,
} from "lucide-react"

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
}

const BuildingInfoCard: React.FC<BuildingInfoCardProps> = ({ detectionResult }) => {
  const [address, setAddress] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  useEffect(() => {
    const fetchAddress = async () => {
      try {
        const response = await fetch(
          `https://api.opencagedata.com/geocode/v1/json?q=${detectionResult.location.latitude}+${detectionResult.location.longitude}&key=YOUR_API_KEY`,
        )
        const data = await response.json()
        if (data.results && data.results.length > 0) {
          setAddress(data.results[0].formatted)
        }
      } catch (error) {
        console.error("Error fetching address:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchAddress()
  }, [detectionResult.location])

  const handleNavigate = () => {
    if (detectionResult?.location) {
      const destination = encodeURIComponent(
        `${detectionResult.location.latitude},${detectionResult.location.longitude}`,
      )
      const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${destination}`
      window.open(mapsUrl, "_blank")
    }
  }

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
  
    try {
      // ✅ Retrieve token from localStorage (or use useSession if applicable)
      const token = localStorage.getItem("token"); 
      if (!token) {
        setSaveError("You must be logged in to save detections.");
        return;
      }
  
      // ✅ Make API request with authorization header
      const response = await fetch("/api/save-detection", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`, // 🔹 Ensure token is included
        },
        body: JSON.stringify(detectionResult),
      });
  
      if (!response.ok) {
        throw new Error("Failed to save detection");
      }
  
      // ✅ Show success notification (optional)
      toast({
        title: "Success",
        description: "Detection saved successfully!",
        duration: 3000,
      });
    } catch (error) {
      console.error("Error saving detection:", error);
      setSaveError("Failed to save detection");
    } finally {
      setSaving(false);
    }
  };  

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return "text-green-500"
    if (confidence >= 0.6) return "text-yellow-500"
    return "text-red-500"
  }

  const getSafetyBadgeColor = (score: number) => {
    if (score >= 8) return "bg-green-500"
    if (score >= 6) return "bg-yellow-500"
    return "bg-red-500"
  }

  const getBrightnessContrastColor = (hexColor: string): string => {
    const r = Number.parseInt(hexColor.slice(1, 3), 16)
    const g = Number.parseInt(hexColor.slice(3, 5), 16)
    const b = Number.parseInt(hexColor.slice(5, 7), 16)
    const brightness = (r * 299 + g * 587 + b * 114) / 1000
    return brightness > 128 ? "#000000" : "#ffffff"
  }

  return (
    <Card className="w-full shadow-lg bg-card">
      <CardHeader className="bg-gradient-to-r from-background to-muted px-4 sm:px-6">
        <div className="flex items-center gap-2">
          <Building className="w-5 h-5 sm:w-6 sm:h-6 text-foreground" />
          <CardTitle className="text-xl sm:text-2xl font-bold text-foreground truncate">
            {detectionResult.description || "Building Details"}
          </CardTitle>
        </div>
      </CardHeader>

      <CardContent className="p-3 sm:p-6">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="w-full justify-start mb-4 sm:mb-6 bg-muted p-1 rounded-lg overflow-x-auto flex-nowrap">
            <TabsTrigger value="overview" className="flex-shrink-0">
              Overview
            </TabsTrigger>
            <TabsTrigger value="amenities" className="flex-shrink-0">
              Amenities
            </TabsTrigger>
            <TabsTrigger value="imageProperties" className="flex-shrink-0">
              Image Analysis
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    variant="outline"
                    className={`${getConfidenceColor(detectionResult.confidence)} text-xs sm:text-sm`}
                  >
                    <Info className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                    Confidence: {(detectionResult.confidence * 100).toFixed(1)}%
                  </Badge>
                  <Badge
                    variant="outline"
                    className={`${getSafetyBadgeColor(detectionResult.safetyScore)} text-white text-xs sm:text-sm`}
                  >
                    <Shield className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                    Safety Score: {detectionResult.safetyScore}/10
                  </Badge>
                </div>

                <div className="flex flex-col gap-2">
                  <span className="font-semibold flex items-center gap-2 text-foreground">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    Location
                  </span>
                  <div className="pl-4 sm:pl-6 space-y-2">
                    <div className="text-xs sm:text-sm text-muted-foreground break-words">
                      Coordinates: {detectionResult.location.latitude.toFixed(6)},{" "}
                      {detectionResult.location.longitude.toFixed(6)}
                    </div>
                    {loading ? (
                      <div className="text-xs sm:text-sm text-muted-foreground">Fetching address...</div>
                    ) : address ? (
                      <div className="text-xs sm:text-sm text-foreground break-words">{address}</div>
                    ) : (
                      <div className="text-xs sm:text-sm text-muted-foreground">Address not available</div>
                    )}
                  </div>
                </div>

                <Button onClick={handleNavigate} className="w-full mt-4 sm:mt-6" size="sm">
                  <Navigation className="w-4 h-4 mr-2" />
                  Open in Maps
                </Button>
              </div>

              <div className="space-y-4">
                <div className="flex flex-col gap-2">
                  <span className="font-semibold flex items-center gap-2 text-foreground">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    Last Updated
                  </span>
                  <div className="pl-4 sm:pl-6">
                    <div className="text-xs sm:text-sm text-muted-foreground">
                      {new Date(detectionResult.lastUpdated).toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <span className="font-semibold flex items-center gap-2 text-foreground">
                    <CheckCircle className="w-4 h-4 text-muted-foreground" />
                    Source Reliability
                  </span>
                  <div className="pl-4 sm:pl-6">
                    <Progress value={detectionResult.sourceReliability * 100} className="h-2" />
                    <span className="text-xs sm:text-sm text-muted-foreground mt-1 block">
                      {(detectionResult.sourceReliability * 100).toFixed(2)}% reliable
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex flex-col gap-2">
                <span className="font-semibold flex items-center gap-2 text-foreground">
                  <Building className="w-4 h-4 text-muted-foreground" />
                  Building Features
                </span>
                <div className="pl-4 sm:pl-6 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {detectionResult.features?.architecture && (
                    <div>
                      <span className="text-sm font-medium text-foreground">Architecture:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {detectionResult.features.architecture.map((item, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {item}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {detectionResult.features?.materials && (
                    <div>
                      <span className="text-sm font-medium text-foreground">Materials:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {detectionResult.features.materials.map((item, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {item}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {detectionResult.features?.style && (
                    <div>
                      <span className="text-sm font-medium text-foreground">Style:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {detectionResult.features.style.map((item, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {item}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex flex-col gap-2">
                <span className="font-semibold flex items-center gap-2 text-foreground">
                  <Layers className="w-4 h-4 text-muted-foreground" />
                  Similar Buildings
                </span>
                <div className="pl-4 sm:pl-6">
                  <div className="flex flex-wrap gap-2">
                    {detectionResult.similarBuildings.map((building, index) => (
                      <Badge key={index} variant="outline" className="text-xs sm:text-sm">
                        {building}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="amenities" className="space-y-4 sm:space-y-6">
            {detectionResult.publicInfo && (
              <>
                {detectionResult.publicInfo.openingHours && (
                  <div className="flex flex-col gap-2">
                    <span className="font-semibold flex items-center gap-2 text-foreground">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      Opening Hours
                    </span>
                    <div className="pl-4 sm:pl-6">
                      {detectionResult.publicInfo.openingHours.map((hours, index) => (
                        <div key={index} className="text-sm text-muted-foreground">
                          {hours}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {detectionResult.publicInfo.contactInfo && (
                  <div className="flex flex-col gap-2">
                    <span className="font-semibold flex items-center gap-2 text-foreground">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      Contact Information
                    </span>
                    <div className="pl-4 sm:pl-6 space-y-2">
                      {detectionResult.publicInfo.contactInfo.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            {detectionResult.publicInfo.contactInfo.phone}
                          </span>
                        </div>
                      )}
                      {detectionResult.publicInfo.contactInfo.website && (
                        <div className="flex items-center gap-2">
                          <Globe className="w-4 h-4 text-muted-foreground" />
                          <a
                            href={detectionResult.publicInfo.contactInfo.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-500 hover:underline"
                          >
                            {detectionResult.publicInfo.contactInfo.website}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {detectionResult.publicInfo.ratings && detectionResult.publicInfo.ratings.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <span className="font-semibold flex items-center gap-2 text-foreground">
                      <Star className="w-4 h-4 text-muted-foreground" />
                      Ratings
                    </span>
                    <div className="pl-4 sm:pl-6 space-y-2">
                      {detectionResult.publicInfo.ratings.map((rating, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Star className="w-4 h-4 text-yellow-400" />
                          <span className="text-sm text-muted-foreground">
                            {rating.average.toFixed(1)} ({rating.total} reviews) - {rating.source}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {detectionResult.publicInfo.accessibility && (
                  <div className="flex flex-col gap-2">
                    <span className="font-semibold flex items-center gap-2 text-foreground">
                      <AccessibilityIcon className="w-4 h-4 text-muted-foreground" />
                      Accessibility Features
                    </span>
                    <div className="pl-4 sm:pl-6">
                      <div className="flex flex-wrap gap-2">
                        {detectionResult.publicInfo.accessibility.features.map((feature, index) => (
                          <Badge key={index} variant="outline" className="text-xs sm:text-sm">
                            {feature}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {detectionResult.publicInfo.publicTransport && (
                  <div className="flex flex-col gap-2">
                    <span className="font-semibold flex items-center gap-2 text-foreground">
                      <Bus className="w-4 h-4 text-muted-foreground" />
                      Public Transport
                    </span>
                    <div className="pl-4 sm:pl-6">
                      {detectionResult.publicInfo.publicTransport.map((transport, index) => (
                        <div key={index} className="text-sm text-muted-foreground">
                          {transport}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="imageProperties" className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div className="flex flex-col gap-2">
                <span className="font-semibold flex items-center gap-2 text-foreground">
                  <Palette className="w-4 h-4 text-muted-foreground" />
                  Dominant Colors
                </span>
                <div className="pl-4 sm:pl-6 flex flex-wrap gap-2">
                  {detectionResult.imageProperties.dominantColors.map((color, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div
                        className="w-6 h-6 rounded-full border border-gray-300"
                        style={{ backgroundColor: color }}
                      ></div>
                      <span className="text-xs font-mono" style={{ color: getBrightnessContrastColor(color) }}>
                        {color}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <span className="font-semibold flex items-center gap-2 text-foreground">
                  <Droplet className="w-4 h-4 text-muted-foreground" />
                  Brightness
                </span>
                <div className="pl-4 sm:pl-6">
                  <Progress value={detectionResult.imageProperties.brightness * 100} className="h-2" />
                  <span className="text-xs sm:text-sm text-muted-foreground mt-1 block">
                    {(detectionResult.imageProperties.brightness * 100).toFixed(2)}%
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <span className="font-semibold flex items-center gap-2 text-foreground">
                  <Contrast className="w-4 h-4 text-muted-foreground" />
                  Contrast
                </span>
                <div className="pl-4 sm:pl-6">
                  <Progress value={detectionResult.imageProperties.contrast * 100} className="h-2" />
                  <span className="text-xs sm:text-sm text-muted-foreground mt-1 block">
                    {(detectionResult.imageProperties.contrast * 100).toFixed(2)}%
                  </span>
                </div>
              </div>

              {detectionResult.imageProperties.primaryStyle && (
                <div className="flex flex-col gap-2">
                  <span className="font-semibold flex items-center gap-2 text-foreground">
                    <PaintBucket className="w-4 h-4 text-muted-foreground" />
                    Primary Style
                  </span>
                  <div className="pl-4 sm:pl-6">
                    <Badge variant="secondary" className="text-xs sm:text-sm">
                      {detectionResult.imageProperties.primaryStyle}
                    </Badge>
                  </div>
                </div>
              )}

              {detectionResult.imageProperties.aestheticScore !== undefined && (
                <div className="flex flex-col gap-2">
                  <span className="font-semibold flex items-center gap-2 text-foreground">
                    <Zap className="w-4 h-4 text-muted-foreground" />
                    Aesthetic Score
                  </span>
                  <div className="pl-4 sm:pl-6">
                    <Progress value={detectionResult.imageProperties.aestheticScore * 10} className="h-2" />
                    <span className="text-xs sm:text-sm text-muted-foreground mt-1 block">
                      {detectionResult.imageProperties.aestheticScore.toFixed(1)}/10
                    </span>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* ✅ Save Detection Button */}
        <div className="mt-6 flex justify-end">
          {saveError && <p className="text-red-500 text-sm">{saveError}</p>}
          <Button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                Save Detection
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default BuildingInfoCard;
