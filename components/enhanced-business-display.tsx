"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Building,
  ExternalLink,
  MapPin,
  Phone,
  Globe,
  Clock,
  Star,
  Info,
  ChevronDown,
  ChevronUp,
  Thermometer,
  Wind,
  Cloud,
  Trees,
  Building2,
  Landmark,
  Construction,
  MapPinned,
  LocateFixed,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"

// Type for location recognition response
interface Location {
  latitude: number
  longitude: number
}

interface LocationRecognitionResponse {
  success: boolean
  type: string
  name?: string
  address?: string
  location?: Location
  description?: string
  confidence?: number
  category?: string
  error?: string
  mapUrl?: string
  id?: string
  photos?: string[]
  rating?: number
  openingHours?: any
  formattedAddress?: string
  placeId?: string
  phoneNumber?: string
  website?: string
  // Building-specific fields
  buildingType?: string
  historicalInfo?: string
  materialType?: string
  architecturalStyle?: string
  yearBuilt?: string
  culturalSignificance?: string
  // Environmental fields
  weatherConditions?: string
  airQuality?: string
  urbanDensity?: string
  vegetationDensity?: string
  crowdDensity?: string
  timeOfDay?: string
  significantColors?: string[]
  waterProximity?: string
  // Geo data
  geoData?: {
    country?: string
    countryCode?: string
    administrativeArea?: string
    locality?: string
    subLocality?: string
    postalCode?: string
    streetName?: string
    streetNumber?: string
    formattedAddress?: string
    timezone?: string
    elevation?: number
  }
  // Nearby places
  nearbyPlaces?: {
    name: string
    type: string
    distance: number
    location: Location
  }[]
  // Business-specific fields
  isBusinessLocation?: boolean
  businessName?: string
  businessAddress?: string
  businessCategory?: string
  businessConfidence?: number
  // Additional business details
  businessDetails?: {
    type?: string
    established?: string
    hours?: string
    services?: string[]
    products?: string[]
    reviews?: {
      rating: number
      count: number
      source: string
    }[]
  }
  // Property records
  propertyRecords?: {
    parcelId?: string
    ownerName?: string
    lastSaleDate?: string
    lastSalePrice?: string
    assessedValue?: string
    taxInfo?: string
    lotSize?: string
    yearBuilt?: string
    zoning?: string
  }
  // Construction details
  constructionDetails?: {
    foundation?: string
    roofType?: string
    exteriorWalls?: string
    stories?: number
    totalArea?: string
  }
  // Additional metrics
  walkScore?: number
  bikeScore?: number
  safetyScore?: number
}

export const BusinessInfoDisplay = ({
  recognitionResult,
}: {
  recognitionResult: LocationRecognitionResponse | null
}) => {
  const [expanded, setExpanded] = useState(false)
  const [showMoreInfo, setShowMoreInfo] = useState(false)

  // Only render if we have a successful result
  if (!recognitionResult || !recognitionResult.success) {
    return null
  }

  // Determine if this is a business, institution, or other type of building
  const isBusinessLocation =
    recognitionResult.isBusinessLocation ||
    (recognitionResult.buildingType && recognitionResult.buildingType.includes("Commercial"))

  const isInstitution =
    recognitionResult.buildingType === "Educational" ||
    recognitionResult.buildingType === "Healthcare" ||
    recognitionResult.buildingType === "Government" ||
    recognitionResult.buildingType === "Religious"

  // If it's neither a business nor an institution, and there's no building info, don't show this component
  if (!isBusinessLocation && !isInstitution && !recognitionResult.buildingType) {
    return null
  }

  // Use business name if available, otherwise fall back to the general name
  const displayName = recognitionResult.businessName || recognitionResult.name || "Unknown Location"
  const displayAddress = recognitionResult.businessAddress || recognitionResult.address
  const displayCategory = recognitionResult.businessCategory || recognitionResult.category
  const displayConfidence = recognitionResult.businessConfidence || recognitionResult.confidence || 0

  // Determine the icon to use based on the building type
  const getBuildingIcon = () => {
    if (isBusinessLocation) return Building
    if (recognitionResult.buildingType === "Educational") return Landmark
    if (recognitionResult.buildingType === "Healthcare") return Building2
    if (recognitionResult.buildingType === "Government") return Landmark
    if (recognitionResult.buildingType === "Religious") return Landmark
    if (recognitionResult.buildingType === "Residential") return Building2
    return Building
  }

  const BuildingIcon = getBuildingIcon()

  // Format distance in a human-readable way
  const formatDistance = (meters: number) => {
    if (meters < 1000) {
      return `${Math.round(meters)}m`
    } else {
      return `${(meters / 1000).toFixed(1)}km`
    }
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="mt-4"
      >
        <Card className="border-indigo-100 dark:border-indigo-900/50 bg-indigo-50/50 dark:bg-indigo-900/20 shadow-sm rounded-xl overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center flex-shrink-0">
                <BuildingIcon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              </div>

              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-lg text-indigo-700 dark:text-indigo-300">{displayName}</h3>
                    {displayAddress && (
                      <p className="text-sm text-indigo-600/70 dark:text-indigo-400/70 flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {displayAddress}
                      </p>
                    )}
                  </div>

                  {displayConfidence > 0 && (
                    <Badge
                      variant="outline"
                      className={`
                        ${
                          displayConfidence > 0.8
                            ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800"
                            : displayConfidence > 0.6
                              ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800"
                              : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800"
                        }
                      `}
                    >
                      {Math.round(displayConfidence * 100)}% match
                    </Badge>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 mt-2">
                  {displayCategory && (
                    <Badge className="bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 border-0">
                      {displayCategory}
                    </Badge>
                  )}

                  {recognitionResult.buildingType && (
                    <Badge
                      variant="outline"
                      className="bg-white/50 dark:bg-slate-800/50 border-indigo-200 dark:border-indigo-800/50"
                    >
                      {recognitionResult.buildingType}
                    </Badge>
                  )}

                  {recognitionResult.materialType && (
                    <Badge
                      variant="outline"
                      className="bg-white/50 dark:bg-slate-800/50 border-indigo-200 dark:border-indigo-800/50"
                    >
                      {recognitionResult.materialType}
                    </Badge>
                  )}
                </div>

                {/* Basic business details section */}
                <div className="mt-3 space-y-2">
                  {recognitionResult.phoneNumber && (
                    <div className="flex items-center text-sm text-indigo-600/80 dark:text-indigo-400/80">
                      <Phone className="h-4 w-4 mr-2" />
                      <a href={`tel:${recognitionResult.phoneNumber}`} className="hover:underline">
                        {recognitionResult.phoneNumber}
                      </a>
                    </div>
                  )}

                  {recognitionResult.website && (
                    <div className="flex items-center text-sm text-indigo-600/80 dark:text-indigo-400/80">
                      <Globe className="h-4 w-4 mr-2" />
                      <a
                        href={recognitionResult.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline truncate max-w-[200px]"
                      >
                        {recognitionResult.website.replace(/^https?:\/\//, "")}
                      </a>
                    </div>
                  )}

                  {recognitionResult.businessDetails?.hours && (
                    <div className="flex items-center text-sm text-indigo-600/80 dark:text-indigo-400/80">
                      <Clock className="h-4 w-4 mr-2" />
                      <span>{recognitionResult.businessDetails.hours}</span>
                    </div>
                  )}

                  {recognitionResult.rating && (
                    <div className="flex items-center text-sm text-indigo-600/80 dark:text-indigo-400/80">
                      <Star className="h-4 w-4 mr-2 fill-amber-400 text-amber-400" />
                      <span>{recognitionResult.rating.toFixed(1)} rating</span>
                    </div>
                  )}
                </div>

                {/* Expandable section for additional details */}
                <AnimatePresence>
                  {expanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      {/* Building details */}
                      {(recognitionResult.yearBuilt ||
                        recognitionResult.architecturalStyle ||
                        recognitionResult.culturalSignificance) && (
                        <div className="mt-4 pt-3 border-t border-indigo-100 dark:border-indigo-800/50">
                          <h4 className="text-xs font-medium text-indigo-600/70 dark:text-indigo-400/70 mb-2">
                            BUILDING DETAILS
                          </h4>
                          <div className="grid grid-cols-2 gap-2">
                            {recognitionResult.yearBuilt && (
                              <div className="bg-white/50 dark:bg-slate-800/50 p-2 rounded-lg">
                                <div className="text-xs text-indigo-600/60 dark:text-indigo-400/60">Year Built</div>
                                <div className="text-sm font-medium">{recognitionResult.yearBuilt}</div>
                              </div>
                            )}
                            {recognitionResult.architecturalStyle && (
                              <div className="bg-white/50 dark:bg-slate-800/50 p-2 rounded-lg">
                                <div className="text-xs text-indigo-600/60 dark:text-indigo-400/60">Style</div>
                                <div className="text-sm font-medium">{recognitionResult.architecturalStyle}</div>
                              </div>
                            )}
                            {recognitionResult.culturalSignificance && (
                              <div className="bg-white/50 dark:bg-slate-800/50 p-2 rounded-lg col-span-2">
                                <div className="text-xs text-indigo-600/60 dark:text-indigo-400/60">
                                  Cultural Significance
                                </div>
                                <div className="text-sm font-medium">{recognitionResult.culturalSignificance}</div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Environmental information */}
                      {(recognitionResult.weatherConditions ||
                        recognitionResult.airQuality ||
                        recognitionResult.urbanDensity ||
                        recognitionResult.vegetationDensity) && (
                        <div className="mt-4 pt-3 border-t border-indigo-100 dark:border-indigo-800/50">
                          <h4 className="text-xs font-medium text-indigo-600/70 dark:text-indigo-400/70 mb-2">
                            ENVIRONMENT
                          </h4>
                          <div className="grid grid-cols-2 gap-2">
                            {recognitionResult.weatherConditions && (
                              <div className="bg-white/50 dark:bg-slate-800/50 p-2 rounded-lg flex items-start">
                                <Thermometer className="h-4 w-4 mr-1 mt-0.5 text-indigo-500/70" />
                                <div>
                                  <div className="text-xs text-indigo-600/60 dark:text-indigo-400/60">Weather</div>
                                  <div className="text-sm font-medium">{recognitionResult.weatherConditions}</div>
                                </div>
                              </div>
                            )}
                            {recognitionResult.airQuality && (
                              <div className="bg-white/50 dark:bg-slate-800/50 p-2 rounded-lg flex items-start">
                                <Wind className="h-4 w-4 mr-1 mt-0.5 text-indigo-500/70" />
                                <div>
                                  <div className="text-xs text-indigo-600/60 dark:text-indigo-400/60">Air Quality</div>
                                  <div className="text-sm font-medium">{recognitionResult.airQuality}</div>
                                </div>
                              </div>
                            )}
                            {recognitionResult.urbanDensity && (
                              <div className="bg-white/50 dark:bg-slate-800/50 p-2 rounded-lg flex items-start">
                                <Building2 className="h-4 w-4 mr-1 mt-0.5 text-indigo-500/70" />
                                <div>
                                  <div className="text-xs text-indigo-600/60 dark:text-indigo-400/60">
                                    Urban Density
                                  </div>
                                  <div className="text-sm font-medium">{recognitionResult.urbanDensity}</div>
                                </div>
                              </div>
                            )}
                            {recognitionResult.vegetationDensity && (
                              <div className="bg-white/50 dark:bg-slate-800/50 p-2 rounded-lg flex items-start">
                                <Trees className="h-4 w-4 mr-1 mt-0.5 text-indigo-500/70" />
                                <div>
                                  <div className="text-xs text-indigo-600/60 dark:text-indigo-400/60">Vegetation</div>
                                  <div className="text-sm font-medium">{recognitionResult.vegetationDensity}</div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Nearby places */}
                      {recognitionResult.nearbyPlaces && recognitionResult.nearbyPlaces.length > 0 && (
                        <div className="mt-4 pt-3 border-t border-indigo-100 dark:border-indigo-800/50">
                          <h4 className="text-xs font-medium text-indigo-600/70 dark:text-indigo-400/70 mb-2">
                            NEARBY PLACES
                          </h4>
                          <div className="space-y-2">
                            {recognitionResult.nearbyPlaces.slice(0, 3).map((place, index) => (
                              <div
                                key={index}
                                className="bg-white/50 dark:bg-slate-800/50 p-2 rounded-lg flex items-center justify-between"
                              >
                                <div className="flex items-center">
                                  <MapPinned className="h-4 w-4 mr-2 text-indigo-500/70" />
                                  <div>
                                    <div className="text-sm font-medium">{place.name}</div>
                                    <div className="text-xs text-indigo-600/60 dark:text-indigo-400/60">
                                      {place.type}
                                    </div>
                                  </div>
                                </div>
                                <Badge variant="outline" className="text-xs">
                                  {formatDistance(place.distance)}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Business services/products if available */}
                      {(recognitionResult.businessDetails?.services?.length ||
                        recognitionResult.businessDetails?.products?.length) && (
                        <div className="mt-4 pt-3 border-t border-indigo-100 dark:border-indigo-800/50">
                          <h4 className="text-xs font-medium text-indigo-600/70 dark:text-indigo-400/70 mb-2">
                            {recognitionResult.businessDetails?.services?.length ? "SERVICES" : "PRODUCTS"}
                          </h4>
                          <div className="flex flex-wrap gap-1">
                            {(
                              recognitionResult.businessDetails?.services ||
                              recognitionResult.businessDetails?.products ||
                              []
                            ).map((item, index) => (
                              <Badge key={index} variant="outline" className="bg-white/50 dark:bg-slate-800/50">
                                {item}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Toggle button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setExpanded(!expanded)}
                  className="w-full mt-3 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/30"
                >
                  {expanded ? (
                    <>
                      <ChevronUp className="h-4 w-4 mr-1" />
                      Show Less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4 mr-1" />
                      Show More
                    </>
                  )}
                </Button>

                {/* Call to action buttons */}
                <div className="mt-4 flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 bg-white/80 dark:bg-slate-800/80 border-indigo-200 dark:border-indigo-800/50 text-indigo-700 dark:text-indigo-300"
                    onClick={() => setShowMoreInfo(true)}
                  >
                    <Info className="h-4 w-4 mr-1" />
                    More Info
                  </Button>

                  {recognitionResult.location && (
                    <Button className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white" asChild>
                      <a
                        href={`https://www.google.com/maps?q=${recognitionResult.location.latitude},${recognitionResult.location.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="h-4 w-4 mr-1" />
                        Directions
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Detailed information dialog */}
      <Dialog open={showMoreInfo} onOpenChange={setShowMoreInfo}>
        <DialogContent className="max-w-full max-h-[90vh] overflow-y-auto p-6 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl">{displayName}</DialogTitle>
            {displayAddress && (
              <DialogDescription className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {displayAddress}
              </DialogDescription>
            )}
          </DialogHeader>

          <div className="space-y-6 mt-4">
            {/* Building information */}
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Building className="h-5 w-5 text-indigo-500" />
                Building Information
              </h3>

              <div className="grid grid-cols-2 gap-3">
                {recognitionResult.buildingType && (
                  <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl">
                    <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Building Type</div>
                    <div className="text-sm font-medium">{recognitionResult.buildingType}</div>
                  </div>
                )}

                {recognitionResult.materialType && (
                  <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl">
                    <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Material</div>
                    <div className="text-sm font-medium">{recognitionResult.materialType}</div>
                  </div>
                )}

                {recognitionResult.architecturalStyle && (
                  <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl">
                    <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Architectural Style</div>
                    <div className="text-sm font-medium">{recognitionResult.architecturalStyle}</div>
                  </div>
                )}

                {recognitionResult.yearBuilt && (
                  <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl">
                    <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Year Built</div>
                    <div className="text-sm font-medium">{recognitionResult.yearBuilt}</div>
                  </div>
                )}
              </div>

              {recognitionResult.culturalSignificance && (
                <div className="mt-3 bg-slate-50 dark:bg-slate-800 p-3 rounded-xl">
                  <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Cultural Significance</div>
                  <div className="text-sm">{recognitionResult.culturalSignificance}</div>
                </div>
              )}

              {recognitionResult.description && (
                <div className="mt-3 bg-slate-50 dark:bg-slate-800 p-3 rounded-xl">
                  <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Description</div>
                  <div className="text-sm">{recognitionResult.description}</div>
                </div>
              )}
            </div>

            {/* Construction details */}
            {recognitionResult.constructionDetails && Object.keys(recognitionResult.constructionDetails).length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Construction className="h-5 w-5 text-indigo-500" />
                  Construction Details
                </h3>

                <div className="grid grid-cols-2 gap-3">
                  {recognitionResult.constructionDetails.foundation && (
                    <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl">
                      <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Foundation</div>
                      <div className="text-sm font-medium">{recognitionResult.constructionDetails.foundation}</div>
                    </div>
                  )}

                  {recognitionResult.constructionDetails.roofType && (
                    <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl">
                      <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Roof Type</div>
                      <div className="text-sm font-medium">{recognitionResult.constructionDetails.roofType}</div>
                    </div>
                  )}

                  {recognitionResult.constructionDetails.exteriorWalls && (
                    <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl">
                      <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Exterior Walls</div>
                      <div className="text-sm font-medium">{recognitionResult.constructionDetails.exteriorWalls}</div>
                    </div>
                  )}

                  {recognitionResult.constructionDetails.stories && (
                    <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl">
                      <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Stories</div>
                      <div className="text-sm font-medium">{recognitionResult.constructionDetails.stories}</div>
                    </div>
                  )}

                  {recognitionResult.constructionDetails.totalArea && (
                    <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl">
                      <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Total Area</div>
                      <div className="text-sm font-medium">{recognitionResult.constructionDetails.totalArea}</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Property records */}
            {recognitionResult.propertyRecords && Object.keys(recognitionResult.propertyRecords).length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Landmark className="h-5 w-5 text-indigo-500" />
                  Property Records
                </h3>

                <div className="grid grid-cols-2 gap-3">
                  {recognitionResult.propertyRecords.parcelId && (
                    <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl">
                      <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Parcel ID</div>
                      <div className="text-sm font-medium">{recognitionResult.propertyRecords.parcelId}</div>
                    </div>
                  )}

                  {recognitionResult.propertyRecords.ownerName && (
                    <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl">
                      <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Owner</div>
                      <div className="text-sm font-medium">{recognitionResult.propertyRecords.ownerName}</div>
                    </div>
                  )}

                  {recognitionResult.propertyRecords.lastSaleDate && (
                    <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl">
                      <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Last Sale Date</div>
                      <div className="text-sm font-medium">{recognitionResult.propertyRecords.lastSaleDate}</div>
                    </div>
                  )}

                  {recognitionResult.propertyRecords.lastSalePrice && (
                    <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl">
                      <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Last Sale Price</div>
                      <div className="text-sm font-medium">{recognitionResult.propertyRecords.lastSalePrice}</div>
                    </div>
                  )}

                  {recognitionResult.propertyRecords.assessedValue && (
                    <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl">
                      <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Assessed Value</div>
                      <div className="text-sm font-medium">{recognitionResult.propertyRecords.assessedValue}</div>
                    </div>
                  )}

                  {recognitionResult.propertyRecords.zoning && (
                    <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl">
                      <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Zoning</div>
                      <div className="text-sm font-medium">{recognitionResult.propertyRecords.zoning}</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Environmental information */}
            {(recognitionResult.weatherConditions ||
              recognitionResult.airQuality ||
              recognitionResult.urbanDensity ||
              recognitionResult.vegetationDensity) && (
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Cloud className="h-5 w-5 text-indigo-500" />
                  Environmental Information
                </h3>

                <div className="grid grid-cols-2 gap-3">
                  {recognitionResult.weatherConditions && (
                    <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl">
                      <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Weather</div>
                      <div className="text-sm font-medium">{recognitionResult.weatherConditions}</div>
                    </div>
                  )}

                  {recognitionResult.airQuality && (
                    <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl">
                      <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Air Quality</div>
                      <div className="text-sm font-medium">{recognitionResult.airQuality}</div>
                    </div>
                  )}

                  {recognitionResult.urbanDensity && (
                    <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl">
                      <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Urban Density</div>
                      <div className="text-sm font-medium">{recognitionResult.urbanDensity}</div>
                    </div>
                  )}

                  {recognitionResult.vegetationDensity && (
                    <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl">
                      <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Vegetation</div>
                      <div className="text-sm font-medium">{recognitionResult.vegetationDensity}</div>
                    </div>
                  )}

                  {recognitionResult.waterProximity && (
                    <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl">
                      <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Water Proximity</div>
                      <div className="text-sm font-medium">{recognitionResult.waterProximity}</div>
                    </div>
                  )}

                  {recognitionResult.crowdDensity && (
                    <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl">
                      <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Crowd Density</div>
                      <div className="text-sm font-medium">{recognitionResult.crowdDensity}</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Nearby places with more details */}
            {recognitionResult.nearbyPlaces && recognitionResult.nearbyPlaces.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <MapPinned className="h-5 w-5 text-indigo-500" />
                  Nearby Places
                </h3>

                <div className="space-y-3">
                  {recognitionResult.nearbyPlaces.map((place, index) => (
                    <div
                      key={index}
                      className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl flex items-center justify-between"
                    >
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center flex-shrink-0 mr-3">
                          <LocateFixed className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div>
                          <div className="text-sm font-medium">{place.name}</div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center">
                            <span className="capitalize">{place.type}</span>
                            <span className="mx-1">•</span>
                            <span>{formatDistance(place.distance)}</span>
                          </div>
                        </div>
                      </div>

                      {place.location && (
                        <Button variant="outline" size="sm" className="text-xs" asChild>
                          <a
                            href={`https://www.google.com/maps?q=${place.location.latitude},${place.location.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Directions
                          </a>
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Scores and metrics */}
            {(recognitionResult.walkScore || recognitionResult.bikeScore || recognitionResult.safetyScore) && (
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Info className="h-5 w-5 text-indigo-500" />
                  Location Scores
                </h3>

                <div className="grid grid-cols-3 gap-3">
                  {recognitionResult.walkScore && (
                    <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl text-center">
                      <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Walk Score</div>
                      <div className="text-xl font-bold">{recognitionResult.walkScore}</div>
                    </div>
                  )}

                  {recognitionResult.bikeScore && (
                    <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl text-center">
                      <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Bike Score</div>
                      <div className="text-xl font-bold">{recognitionResult.bikeScore}</div>
                    </div>
                  )}

                  {recognitionResult.safetyScore && (
                    <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl text-center">
                      <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Safety Score</div>
                      <div className="text-xl font-bold">{recognitionResult.safetyScore}</div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 mt-6">
            {recognitionResult.website && (
              <Button variant="outline" className="flex-1" asChild>
                <a href={recognitionResult.website} target="_blank" rel="noopener noreferrer">
                  <Globe className="h-4 w-4 mr-2" />
                  Website
                </a>
              </Button>
            )}

            {recognitionResult.location && (
              <Button className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white" asChild>
                <a
                  href={`https://www.google.com/maps?q=${recognitionResult.location.latitude},${recognitionResult.location.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MapPin className="h-4 w-4 mr-2" />
                  View on Map
                </a>
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

