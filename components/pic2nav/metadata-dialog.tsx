"use client"
import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
  Download,
  ImageIcon,
  MapPin,
  Building2,
  Leaf,
  Smartphone,
  Info,
  Star,
  Phone,
  MapIcon,
  History,
  Landmark,
  Building,
  Cloud,
  Globe,
  RefreshCw,
  Clock,
  AlertTriangle,
} from "lucide-react"
import { useCallback, useEffect, useMemo, useState } from "react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"

export function MetadataDialog({ open, onOpenChange, recognitionResult, selectedFile }) {
  const [activeTab, setActiveTab] = useState("location")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [enrichedData, setEnrichedData] = useState(null)
  const [nearbyPlaces, setNearbyPlaces] = useState([])
  const [isLoadingNearby, setIsLoadingNearby] = useState(false)
  const [buildingPhotos, setBuildingPhotos] = useState([])

  // Extract metadata from file and recognition result using memoization
  const metadata = useMemo(() => extractMetadata(selectedFile, recognitionResult, enrichedData), 
    [selectedFile, recognitionResult, enrichedData])

  // Fetch additional public information when a location is identified
  useEffect(() => {
    if (open && recognitionResult && recognitionResult.placeId) {
      fetchAdditionalInformation(recognitionResult)
      fetchNearbyPlaces(recognitionResult)
      fetchBuildingPhotos(recognitionResult)
    }
  }, [open, recognitionResult])

  // Function to fetch additional public information
  const fetchAdditionalInformation = async (recognitionData) => {
    if (!recognitionData) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      // Fetch location data based on place ID or coordinates
      const placeId = recognitionData.placeId
      const coordinates = recognitionData.location ? 
        `${recognitionData.location.latitude},${recognitionData.location.longitude}` : null
      
      // Import the Google Places API functions
      const { fetchLocationPhotos, fetchNearbyPlaces } = await import('@/lib/google-places')
      
      // Get location photos from Google Places API
      let locationPhotos = []
      if (recognitionData.name) {
        locationPhotos = await fetchLocationPhotos(
          recognitionData.name,
          recognitionData.location?.latitude,
          recognitionData.location?.longitude
        )
      }
      
      // Make multiple API calls in parallel for different types of data
      const [placeDetails, newsArticles, reviews, additionalInfo, nearbyPlacesData] = await Promise.all([
        fetchPlaceDetails(placeId, locationPhotos),
        fetchNewsArticles(recognitionData.name || recognitionData.businessName),
        fetchPlaceReviews(placeId),
        fetchAdditionalPlaceInfo(placeId, coordinates),
        recognitionData.location ? fetchNearbyPlaces(
          recognitionData.location.latitude,
          recognitionData.location.longitude
        ) : []
      ])
      
      // Combine the enriched data
      const enriched = {
        placeDetails,
        newsArticles,
        reviews,
        additionalInfo,
        nearbyPlaces: nearbyPlacesData,
        lastUpdated: new Date().toISOString()
      }
      
      setEnrichedData(enriched)
    } catch (err) {
      console.error("Error fetching additional information:", err)
      setError("Failed to fetch additional public information")
    } finally {
      setIsLoading(false)
    }
  }
  
  // Function to fetch nearby places
  const fetchNearbyPlaces = async (recognitionData) => {
    if (!recognitionData || !recognitionData.location) return
    
    setIsLoadingNearby(true)
    
    try {
      // Simulating API response delay
      await new Promise(resolve => setTimeout(resolve, 600))
      
      // Use actual photos from the recognition result for nearby places
      // In a real implementation, this would come from a Places API
      const photos = recognitionData.photos || []
      
      // Create nearby places using the actual location data and photos
      const places = [
        {
          name: "Local Park",
          type: "Park",
          distance: "120",
          photos: [
            photos[1] || photos[0],
            photos[2] || photos[0]
          ],
          description: "A park near " + (recognitionData.name || "this location")
        },
        {
          name: "City Museum",
          type: "Museum",
          distance: "250",
          photos: [
            photos[2] || photos[0]
          ],
          description: "Historical museum featuring local artifacts and exhibitions."
        },
        {
          name: "Local Cafe",
          type: "Restaurant",
          distance: "180",
          photos: [
            photos[3] || photos[0],
            photos[1] || photos[0]
          ],
          description: "Cafe near " + (recognitionData.name || "this location")
        }
      ]
      
      setNearbyPlaces(places)
    } catch (err) {
      console.error("Error fetching nearby places:", err)
    } finally {
      setIsLoadingNearby(false)
    }
  }
  
  // Function to fetch additional building photos
  const fetchBuildingPhotos = async (recognitionData) => {
    if (!recognitionData || !recognitionData.placeId) return
    
    try {
      // Simulating API response delay
      await new Promise(resolve => setTimeout(resolve, 700))
      
      // Use actual photos from the recognition result
      const actualPhotos = recognitionData.photos || []
      
      if (actualPhotos.length > 0) {
        // Create photo objects using the actual photos
        const photos = actualPhotos.map((url, index) => {
          const captions = [
            "Front view of the building",
            "Side entrance",
            "Full view of the location",
            "Interior view"
          ]
          
          const sources = [
            "Location Database",
            "Architecture Archive",
            "Location Photos",
            "Building Database"
          ]
          
          return {
            url: url,
            caption: captions[index % captions.length],
            source: sources[index % sources.length]
          }
        })
        
        setBuildingPhotos(photos)
      } else {
        setBuildingPhotos([])
      }
    } catch (err) {
      console.error("Error fetching building photos:", err)
    }
  }
  
  // Mock functions for API calls (replace with actual API calls in production)
  const fetchPlaceDetails = async (placeId, locationPhotos = []) => {
    // In a real implementation, this would call an API
    // Example: return await fetch(`/api/place-details/${placeId}`).then(res => res.json())
    
    // Simulating API response delay
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // Use photos from Google Places API if available, otherwise use recognition result photos
    const photos = locationPhotos.length > 0 
      ? locationPhotos 
      : (recognitionResult.photos || [])
    
    // Create photo objects with captions
    const photoObjects = photos.map((url, index) => {
      const captions = [
        "Front view of " + (recognitionResult.name || "the building"),
        "Side entrance of " + (recognitionResult.name || "the building"),
        "Full view of " + (recognitionResult.name || "the location"),
        "Interior view of " + (recognitionResult.name || "the building")
      ]
      
      return {
        url: url,
        attribution: "Photo of " + (recognitionResult.name || "location"),
        caption: captions[index % captions.length]
      }
    })
    
    return {
      description: "Extended description of " + (recognitionResult.name || "this location") + " with additional details about its architecture and history.",
      popularTimes: {
        monday: [10, 20, 45, 60, 80, 70, 40, 30],
        tuesday: [15, 25, 50, 65, 85, 75, 45, 35],
        // ... other days
      },
      accessibility: ["Wheelchair accessible", "Elevator access"],
      establishedYear: "1985",
      photos: photoObjects
    }
  }
  
  const fetchNewsArticles = async (locationName) => {
    // Simulating API response delay
    await new Promise(resolve => setTimeout(resolve, 700))
    
    return [
      {
        title: `New Developments Around ${locationName}`,
        source: "Local News",
        date: "2025-04-10",
        summary: "Recent developments in the area have led to increased interest in this location."
      },
      {
        title: `Historical Significance of ${locationName}`,
        source: "History Channel",
        date: "2025-03-15",
        summary: "This location has historical significance dating back several decades."
      }
    ]
  }
  
  const fetchPlaceReviews = async (placeId) => {
    // Simulating API response delay
    await new Promise(resolve => setTimeout(resolve, 600))
    
    return [
      {
        author: "John D.",
        rating: 4.5,
        text: "Great location with amazing views. The service was excellent and the atmosphere was welcoming.",
        date: "2025-04-01"
      },
      {
        author: "Sarah M.",
        rating: 5,
        text: "One of my favorite places in the area. Highly recommended for visitors.",
        date: "2025-03-20"
      }
    ]
  }
  
  const fetchAdditionalPlaceInfo = async (placeId, coordinates) => {
    // Simulating API response delay
    await new Promise(resolve => setTimeout(resolve, 800))
    
    return {
      demographicData: {
        populationDensity: "High",
        medianAge: 34,
        medianIncome: "$68,000"
      },
      transitData: {
        nearbyStations: [
          { name: "Central Station", distance: "0.5 miles", type: "Subway" },
          { name: "Main St Bus Stop", distance: "0.2 miles", type: "Bus" }
        ],
        walkScore: 85,
        bikeScore: 75
      },
      environmentalData: {
        airQualityIndex: 42,
        greenSpaceProximity: "Multiple parks within 0.5 miles",
        noiseLevel: "Moderate"
      },
      safetyData: {
        crimeRate: "Low",
        emergencyServices: ["Police station within 1 mile", "Hospital within 2 miles"]
      }
    }
  }

  // Trigger a manual refresh of the additional data
  const handleRefreshData = () => {
    if (recognitionResult) {
      fetchAdditionalInformation(recognitionResult)
    }
  }

  // Export metadata as JSON file
  const handleExportMetadata = useCallback(() => {
    if (!metadata) return

    try {
      const dataStr = JSON.stringify(metadata, null, 2)
      const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`
      const exportName = `location-metadata-${new Date().getTime()}.json`

      const linkElement = document.createElement("a")
      linkElement.setAttribute("href", dataUri)
      linkElement.setAttribute("download", exportName)
      linkElement.click()
    } catch (error) {
      console.error("Error exporting metadata:", error)
    }
  }, [metadata])

  // Reusable metadata field component
  const MetadataField = ({ label, value, colSpan = 1 }) => (
    <div className={`bg-slate-50 dark:bg-slate-800/50 p-2 rounded-md ${colSpan > 1 ? `col-span-${colSpan}` : ""}`}>
      <span className="text-xs font-medium">{label}</span>
      <p className="text-xs text-slate-600 dark:text-slate-300 truncate">{value || "N/A"}</p>
    </div>
  )

  // Section header component
  const SectionHeader = ({ icon: Icon, title, onRefresh }) => (
    <div className="flex justify-between items-center mb-2">
      <h3 className="text-sm font-semibold flex items-center">
        <Icon className="h-4 w-4 mr-2 text-teal-500" />
        {title}
      </h3>
      {onRefresh && (
        <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={onRefresh}>
          <RefreshCw className="h-3 w-3" />
        </Button>
      )}
    </div>
  )

  if (!metadata) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Info className="h-5 w-5 mr-2 text-teal-500" />
            Location Details
          </DialogTitle>
          <DialogDescription>Comprehensive information about {metadata.locationInfo.name}</DialogDescription>
        </DialogHeader>

        {isLoading && (
          <div className="flex items-center justify-center space-x-2 text-sm text-slate-500">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>Fetching additional public information...</span>
          </div>
        )}

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="location" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-6 mb-4">
            <TabsTrigger value="location">
              <MapPin className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Location</span>
            </TabsTrigger>
            <TabsTrigger value="business">
              <Building className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Business</span>
            </TabsTrigger>
            <TabsTrigger value="nearby">
              <Landmark className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Nearby</span>
            </TabsTrigger>
            <TabsTrigger value="environment">
              <Leaf className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Environment</span>
            </TabsTrigger>
            <TabsTrigger value="public">
              <Globe className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Public Data</span>
            </TabsTrigger>
            <TabsTrigger value="technical">
              <ImageIcon className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Technical</span>
            </TabsTrigger>
          </TabsList>

          <div className="max-h-[60vh] overflow-y-auto pr-2">
            {/* Location Information Tab */}
            <TabsContent value="location" className="space-y-4">
              {/* Primary Location Information */}
              <div>
                <SectionHeader icon={MapPin} title="Primary Location Information" />
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <MetadataField label="Name" value={metadata.locationInfo.name} />
                  <MetadataField label="Category" value={metadata.locationInfo.category} />
                  <MetadataField label="Address" value={metadata.locationInfo.formattedAddress} colSpan={2} />
                  <MetadataField label="Coordinates" value={metadata.locationInfo.coordinates} />
                  <MetadataField label="Recognition Accuracy" value={metadata.locationInfo.accuracy} />
                  <MetadataField label="Building Type" value={metadata.locationInfo.buildingType} />
                  <MetadataField label="Material Type" value={metadata.locationInfo.materialType} />
                </div>
              </div>

              {/* Geographic Data */}
              <div>
                <SectionHeader icon={MapIcon} title="Geographic Data" />
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <MetadataField label="Country" value={metadata.geoData.country} />
                  <MetadataField label="Administrative Area" value={metadata.geoData.administrativeArea} />
                  <MetadataField label="Locality" value={metadata.geoData.locality} />
                  <MetadataField label="Postal Code" value={metadata.geoData.postalCode} />
                  <MetadataField label="Street Name" value={metadata.geoData.streetName} />
                  <MetadataField label="Street Number" value={metadata.geoData.streetNumber} />
                </div>
              </div>

              {/* Historical Information */}
              {metadata.historicalInfo && metadata.historicalInfo !== "N/A" && (
                <div>
                  <SectionHeader icon={History} title="Historical Information" />
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-md">
                    <p className="text-xs text-slate-600 dark:text-slate-300">{metadata.historicalInfo}</p>
                  </div>
                </div>
              )}

              {/* Historical Information */}
              {metadata.historicalInfo && metadata.historicalInfo !== "N/A" && (
                <div>
                  <SectionHeader icon={History} title="Historical Information" />
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-md">
                    <p className="text-xs text-slate-600 dark:text-slate-300">{metadata.historicalInfo}</p>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Business Information Tab */}
            <TabsContent value="business" className="space-y-4">
              {/* Business Details */}
              <div>
                <SectionHeader icon={Building2} title="Business Details" />
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <MetadataField label="Business Name" value={metadata.businessInfo.businessName} />
                  <MetadataField label="Business Category" value={metadata.businessInfo.businessCategory} />
                  <MetadataField label="Business Address" value={metadata.businessInfo.businessAddress} colSpan={2} />
                  <MetadataField label="Business Confidence" value={metadata.businessInfo.businessConfidence} />
                  {metadata.businessInfo.established !== "N/A" && (
                    <MetadataField label="Established" value={metadata.businessInfo.established} />
                  )}
                  <MetadataField label="Chain" value={metadata.businessInfo.chain || "N/A"} />
                  <MetadataField label="Owner" value={metadata.businessInfo.owner || "N/A"} />
                </div>
              </div>

              {/* Contact Information */}
              <div>
                <SectionHeader icon={Phone} title="Contact Information" />
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <MetadataField label="Phone Number" value={metadata.businessInfo.phoneNumber} />
                  <MetadataField label="Website" value={metadata.businessInfo.website} />
                  <MetadataField label="Email" value={metadata.businessInfo.email || "N/A"} />
                  <MetadataField label="Social Media" value={metadata.businessInfo.socialMedia || "N/A"} />
                </div>
              </div>

              {/* Ratings & Hours */}
              <div>
                <SectionHeader icon={Star} title="Ratings & Hours" />
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <MetadataField label="Rating" value={metadata.businessInfo.rating} />
                  <MetadataField label="Price Level" value={metadata.businessInfo.priceLevel} />
                  <MetadataField label="Review Count" value={metadata.businessInfo.reviewCount || "N/A"} />
                  <MetadataField label="Popularity Rank" value={metadata.businessInfo.popularityRank || "N/A"} />
                  <MetadataField
                    label="Opening Hours"
                    value={
                      Array.isArray(metadata.businessInfo.openingHours)
                        ? metadata.businessInfo.openingHours.join(", ")
                        : metadata.businessInfo.openingHours
                    }
                    colSpan={2}
                  />
                </div>
              </div>

              {/* Popular Times */}
              {metadata.businessInfo.popularTimes && (
                <div>
                  <SectionHeader icon={Clock} title="Popular Times" />
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-md">
                    <p className="text-xs text-slate-600 dark:text-slate-300 mb-2">
                      When this location is busiest (based on public data):
                    </p>
                    <div className="h-24 flex items-end space-x-1">
                      {metadata.businessInfo.popularTimes.monday && 
                        metadata.businessInfo.popularTimes.monday.map((value, i) => (
                          <div 
                            key={i} 
                            className="bg-teal-500 w-full rounded-t"
                            style={{height: `${value}%`}}
                            title={`Hour ${i+9}: ${value}% busy`}
                          ></div>
                        ))
                      }
                    </div>
                    <div className="flex justify-between text-xs mt-1">
                      <span>9AM</span>
                      <span>12PM</span>
                      <span>3PM</span>
                      <span>6PM</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Amenities */}
              {metadata.businessInfo.amenities && metadata.businessInfo.amenities.length > 0 && (
                <div>
                  <SectionHeader icon={Info} title="Amenities" />
                  <div className="flex flex-wrap gap-1">
                    {metadata.businessInfo.amenities.map((amenity, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {amenity}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Services */}
              {metadata.businessInfo.services && metadata.businessInfo.services.length > 0 && (
                <div>
                  <SectionHeader icon={Info} title="Services" />
                  <div className="flex flex-wrap gap-1">
                    {metadata.businessInfo.services.map((service, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {service}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Accessibility */}
              {metadata.businessInfo.accessibility && metadata.businessInfo.accessibility.length > 0 && (
                <div>
                  <SectionHeader icon={Info} title="Accessibility" />
                  <div className="flex flex-wrap gap-1">
                    {metadata.businessInfo.accessibility.map((item, index) => (
                      <Badge key={index} variant="secondary" className="text-xs bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-100">
                        {item}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Environmental Data Tab */}
            {/* Nearby Places Tab (NEW) */}
            <TabsContent value="nearby" className="space-y-4">
              {/* Nearby Places */}
              <div>
                <SectionHeader icon={Landmark} title="Nearby Places" onRefresh={() => fetchNearbyPlaces(recognitionResult)} />
                {isLoadingNearby ? (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="h-5 w-5 animate-spin mr-2 text-teal-500" />
                    <span className="text-sm text-slate-500">Loading nearby places...</span>
                  </div>
                ) : nearbyPlaces.length > 0 ? (
                  <div className="space-y-3">
                    {nearbyPlaces.map((place, index) => (
                      <div key={index} className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-md">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <span className="text-sm font-medium">{place.name}</span>
                            <p className="text-xs text-slate-600 dark:text-slate-300">{place.type}</p>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {place.distance}m
                          </Badge>
                        </div>
                        
                        {place.description && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">{place.description}</p>
                        )}
                        
                        {place.photos && place.photos.length > 0 && (
                          <div className="grid grid-cols-2 gap-1 mt-2">
                            {place.photos.map((photo, photoIndex) => (
                              <div key={photoIndex} className="aspect-video rounded-sm overflow-hidden">
                                <img 
                                  src={photo} 
                                  alt={`${place.name} - Photo ${photoIndex + 1}`}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-md text-center">
                    <p className="text-sm text-slate-500">No nearby places found</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => fetchNearbyPlaces(recognitionResult)} 
                      className="mt-2"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Refresh
                    </Button>
                  </div>
                )}
              </div>
              
              {/* Building Photos */}
              <div>
                <SectionHeader icon={ImageIcon} title="Building Photos" />
                <div className="grid grid-cols-2 gap-2">
                  {buildingPhotos.length > 0 ? (
                    buildingPhotos.map((photo, index) => (
                      <div key={index} className="bg-slate-50 dark:bg-slate-800/50 rounded-md overflow-hidden">
                        <img src={photo.url} alt={photo.caption} className="w-full h-32 object-cover" />
                        <div className="p-2">
                          <p className="text-xs font-medium">{photo.caption}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">Source: {photo.source}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-2 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-md text-center">
                      <p className="text-sm text-slate-500">No building photos available</p>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="environment" className="space-y-4">
              {/* Weather & Air */}
              <div>
                <SectionHeader icon={Cloud} title="Weather & Air Quality" />
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <MetadataField label="Weather Conditions" value={metadata.environmentalData.weatherConditions} />
                  <MetadataField label="Temperature" value={metadata.environmentalData.temperature} />
                  <MetadataField label="Humidity" value={metadata.environmentalData.humidity} />
                  <MetadataField label="Air Quality" value={metadata.environmentalData.airQuality} />
                  <MetadataField label="Air Quality Index" value={metadata.environmentalData.airQualityIndex} />
                  <MetadataField label="Time of Day" value={metadata.environmentalData.timeOfDay} />
                  <MetadataField label="Sunrise" value={metadata.environmentalData.sunriseTime} />
                  <MetadataField label="Sunset" value={metadata.environmentalData.sunsetTime} />
                  <MetadataField label="Light Conditions" value={metadata.environmentalData.lightConditions} />
                </div>
              </div>

              {/* Urban Environment */}
              <div>
                <SectionHeader icon={Building} title="Urban Environment" />
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <MetadataField label="Urban Density" value={metadata.environmentalData.urbanDensity} />
                  <MetadataField label="Crowd Density" value={metadata.environmentalData.crowdDensity} />
                  <MetadataField label="Noise Level" value={metadata.environmentalData.noiseLevel} />
                  <MetadataField label="Building Material" value={metadata.environmentalData.materialType} />
                  <MetadataField label="Building Age" value={metadata.environmentalData.buildingAge || "N/A"} />
                  <MetadataField label="Architecture Style" value={metadata.environmentalData.architectureStyle || "N/A"} />
                </div>
              </div>

              {/* Natural Environment */}
              <div>
                <SectionHeader icon={Leaf} title="Natural Environment" />
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <MetadataField label="Vegetation Density" value={metadata.environmentalData.vegetationDensity} />
                  <MetadataField label="Water Proximity" value={metadata.environmentalData.waterProximity} />
                  <MetadataField 
                    label="Green Space Proximity" 
                    value={metadata.environmentalData.greenSpaceProximity} 
                    colSpan={2} 
                  />
                  <MetadataField label="Terrain Type" value={metadata.environmentalData.terrainType || "N/A"} />
                  <MetadataField label="Elevation" value={metadata.geoData.elevation || "N/A"} />
                </div>
                
                {metadata.environmentalData.seasonalFeatures && 
                 metadata.environmentalData.seasonalFeatures.length > 0 && (
                  <div className="mt-2">
                    <span className="text-xs font-medium">Seasonal Features</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {metadata.environmentalData.seasonalFeatures.map((feature, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Safety Data */}
              <div>
                <SectionHeader icon={AlertTriangle} title="Safety Information" />
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <MetadataField label="Safety Score" value={metadata.environmentalData.safetyScore} />
                  <MetadataField label="Crime Rate" value={metadata.environmentalData.crimeRate} />
                </div>
                {metadata.environmentalData.emergencyServices && 
                 metadata.environmentalData.emergencyServices.length > 0 && (
                  <div className="mt-2 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-md">
                    <span className="text-xs font-medium">Emergency Services</span>
                    <ul className="text-xs text-slate-600 dark:text-slate-300 pl-4 list-disc">
                      {metadata.environmentalData.emergencyServices.map((service, index) => (
                        <li key={index}>{service}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Visual Characteristics */}
              {metadata.environmentalData.significantColors &&
                metadata.environmentalData.significantColors.length > 0 && (
                  <div>
                    <SectionHeader icon={ImageIcon} title="Visual Characteristics" />
                    <div className="flex flex-wrap gap-2">
                      {metadata.environmentalData.significantColors.map((color, index) => (
                        <div key={index} className="flex items-center">
                          <div className="w-4 h-4 rounded-full mr-1" style={{ backgroundColor: color }}></div>
                          <span className="text-xs">{color}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </TabsContent>

            {/* Public Data Tab (NEW) */}
            <TabsContent value="public" className="space-y-4">
              {/* Public Data Status */}
              <div className="flex justify-between items-center">
                <div className="flex items-center text-sm">
                  <Clock className="h-4 w-4 mr-2 text-slate-500" />
                  <span className="text-slate-500">
                    {enrichedData ? `Last updated: ${new Date(enrichedData.lastUpdated).toLocaleString()}` : "No public data fetched yet"}
                  </span>
                </div>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={handleRefreshData} 
                  disabled={isLoading}
                  className="h-8"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                  Refresh Data
                </Button>
              </div>

              {/* Extended Description */}
              {enrichedData?.placeDetails?.description && (
                <div>
                  <SectionHeader icon={Info} title="Extended Description" />
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-md">
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      {enrichedData.placeDetails.description}
                    </p>
                  </div>
                </div>
              )}
              
              {/* Cultural Information */}
              {(metadata.culturalInfo.localLanguages.length > 0 || 
                metadata.culturalInfo.culturalSignificance !== "N/A" ||
                metadata.culturalInfo.localCuisine.length > 0) && (
                <div>
                  <SectionHeader icon={Globe} title="Cultural Information" />
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {metadata.culturalInfo.culturalSignificance !== "N/A" && (
                      <MetadataField 
                        label="Cultural Significance" 
                        value={metadata.culturalInfo.culturalSignificance}
                        colSpan={2} 
                      />
                    )}
                    
                    {metadata.culturalInfo.localLanguages.length > 0 && (
                      <div className="bg-slate-50 dark:bg-slate-800/50 p-2 rounded-md">
                        <span className="text-xs font-medium">Local Languages</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {metadata.culturalInfo.localLanguages.map((language, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {language}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {metadata.culturalInfo.localCuisine.length > 0 && (
                      <div className="bg-slate-50 dark:bg-slate-800/50 p-2 rounded-md">
                        <span className="text-xs font-medium">Local Cuisine</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {metadata.culturalInfo.localCuisine.map((cuisine, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {cuisine}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Travel Information */}
              {(metadata.travelInfo.touristRating !== "N/A" || 
                metadata.travelInfo.bestTimeToVisit !== "N/A" ||
                metadata.travelInfo.travelTips.length > 0) && (
                <div>
                  <SectionHeader icon={MapIcon} title="Travel Information" />
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <MetadataField label="Tourist Rating" value={metadata.travelInfo.touristRating} />
                    <MetadataField label="Best Time to Visit" value={metadata.travelInfo.bestTimeToVisit} />
                    <MetadataField label="Visa Requirements" value={metadata.travelInfo.visaRequirements} colSpan={2} />
                    
                    {metadata.travelInfo.travelTips.length > 0 && (
                      <div className="col-span-2 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-md">
                        <span className="text-xs font-medium">Travel Tips</span>
                        <ul className="text-xs text-slate-600 dark:text-slate-300 pl-4 list-disc mt-1">
                          {metadata.travelInfo.travelTips.map((tip, index) => (
                            <li key={index}>{tip}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* News Articles */}
              {enrichedData?.newsArticles && enrichedData.newsArticles.length > 0 && (
                <div>
                  <SectionHeader icon={Globe} title="Recent News Articles" />
                  <div className="space-y-2">
                    {enrichedData.newsArticles.map((article, index) => (
                      <div key={index} className="bg-slate-50 dark:bg-slate-800/50 p-2 rounded-md">
                        <div className="flex justify-between items-start">
                          <span className="text-xs font-medium">{article.title}</span>
                          <Badge variant="outline" className="text-xs">
                            {article.date}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">{article.summary}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Source: {article.source}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Reviews */}
              {enrichedData?.reviews && enrichedData.reviews.length > 0 && (
                <div>
                  <SectionHeader icon={Star} title="Public Reviews" />
                  <div className="space-y-2">
                    {enrichedData.reviews.map((review, index) => (
                      <div key={index} className="bg-slate-50 dark:bg-slate-800/50 p-2 rounded-md">
                        <div className="flex justify-between items-start mb-1">
                          <span className="text-xs font-medium">{review.author}</span>
                          <div className="flex items-center">
                            <Star className="h-3 w-3 text-yellow-500 mr-1" />
                            <span className="text-xs">{review.rating}</span>
                          </div>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300">{review.text}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{review.date}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Transit Data */}
              {enrichedData?.additionalInfo?.transitData && (
                <div>
                  <SectionHeader icon={MapIcon} title="Transit Information" />
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <MetadataField label="Walk Score" value={enrichedData.additionalInfo.transitData.walkScore} />
                    <MetadataField label="Bike Score" value={enrichedData.additionalInfo.transitData.bikeScore} />
                  </div>
                  
                  {enrichedData.additionalInfo.transitData.nearbyStations && 
                   enrichedData.additionalInfo.transitData.nearbyStations.length > 0 && (
                    <div className="mt-2">
                      <span className="text-xs font-medium">Nearby Transit</span>
                      <div className="space-y-1 mt-1">
                        {enrichedData.additionalInfo.transitData.nearbyStations.map((station, index) => (
                          <div key={index} className="bg-slate-50 dark:bg-slate-800/50 p-2 rounded-md flex justify-between">
                            <div>
                              <span className="text-xs font-medium">{station.name}</span>
                              <p className="text-xs text-slate-600 dark:text-slate-300">{station.type}</p>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {station.distance}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Demographic Data */}
              {enrichedData?.additionalInfo?.demographicData && (
                <div>
                  <SectionHeader icon={Building} title="Area Demographics" />
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <MetadataField 
                      label="Population Density" 
                      value={enrichedData.additionalInfo.demographicData.populationDensity} 
                    />
                    <MetadataField 
                      label="Median Age" 
                      value={enrichedData.additionalInfo.demographicData.medianAge} 
                    />
                    <MetadataField 
                      label="Median Income" 
                      value={enrichedData.additionalInfo.demographicData.medianIncome} 
                    />
                  </div>
                </div>
              )}

              {/* Building Photos */}
              <div>
                <SectionHeader icon={ImageIcon} title="Building Photos" />
                <div className="grid grid-cols-2 gap-2">
                  {buildingPhotos.length > 0 ? (
                    buildingPhotos.map((photo, index) => (
                      <div key={index} className="bg-slate-50 dark:bg-slate-800/50 rounded-md overflow-hidden">
                        <img src={photo.url} alt={photo.caption} className="w-full h-32 object-cover" />
                        <div className="p-2">
                          <p className="text-xs font-medium">{photo.caption}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">Source: {photo.source}</p>
                        </div>
                      </div>
                    ))
                  ) : enrichedData?.placeDetails?.photos && enrichedData.placeDetails.photos.length > 0 ? (
                    enrichedData.placeDetails.photos.map((photo, index) => (
                      <div key={index} className="bg-slate-50 dark:bg-slate-800/50 rounded-md overflow-hidden">
                        <img src={photo.url} alt={`Photo ${index+1}`} className="w-full h-32 object-cover" />
                        <p className="text-xs text-slate-500 dark:text-slate-400 p-2">{photo.attribution}</p>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-2 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-md text-center">
                      <p className="text-sm text-slate-500">No building photos available</p>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Public Photos */}
              {enrichedData?.placeDetails?.photos && enrichedData.placeDetails.photos.length > 0 && (
                <div>
                  <SectionHeader icon={ImageIcon} title="Public Photos" />
                  <div className="grid grid-cols-2 gap-2">
                    {enrichedData.placeDetails.photos.map((photo, index) => (
                      <div key={index} className="bg-slate-50 dark:bg-slate-800/50 rounded-md overflow-hidden">
                        <img src={photo.url} alt={`Photo ${index+1}`} className="w-full h-32 object-cover" />
                        <p className="text-xs text-slate-500 dark:text-slate-400 p-2">{photo.attribution}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Technical Information Tab */}
            <TabsContent value="technical" className="space-y-4">
              {/* Image Information */}
              <div>
                <SectionHeader icon={ImageIcon} title="Image Information" />
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <MetadataField label="File Name" value={metadata.imageInfo.fileName} />
                  <MetadataField label="File Size" value={metadata.imageInfo.fileSize} />
                  <MetadataField label="Dimensions" value={metadata.imageInfo.dimensions} />
                  <MetadataField label="Format" value={metadata.imageInfo.format} />
                  <MetadataField label="Color Profile" value={metadata.imageInfo.colorProfile || "N/A"} />
                  <MetadataField label="Bit Depth" value={metadata.imageInfo.bitDepth || "N/A"} />
                </div>
              </div>

              {/* Camera Information */}
              {metadata.imageInfo.camera && (
                <div>
                  <SectionHeader icon={Smartphone} title="Camera Information" />
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <MetadataField label="Camera Make" value={metadata.imageInfo.camera.make} />
                    <MetadataField label="Camera Model" value={metadata.imageInfo.camera.model} />
                    <MetadataField label="Lens" value={metadata.imageInfo.camera.lens} />
                    <MetadataField label="Focal Length" value={metadata.imageInfo.camera.focalLength} />
                    <MetadataField label="Aperture" value={metadata.imageInfo.camera.aperture} />
                    <MetadataField label="ISO" value={metadata.imageInfo.camera.iso} />
                    <MetadataField label="Exposure Time" value={metadata.imageInfo.camera.exposureTime} />
                    <MetadataField label="White Balance" value={metadata.imageInfo.camera.whiteBalance || "N/A"} />
                    <MetadataField label="Flash" value={metadata.imageInfo.camera.flash || "N/A"} />
                    <MetadataField label="Metering Mode" value={metadata.imageInfo.camera.meteringMode || "N/A"} />
                  </div>
                </div>
              )}

              {/* Date and Location */}
              <div>
                <SectionHeader icon={Clock} title="Date and Location" />
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <MetadataField label="Date Taken" value={metadata.imageInfo.dateTaken} />
                  <MetadataField label="Date Modified" value={metadata.imageInfo.dateModified} />
                  <MetadataField label="GPS Coordinates" value={metadata.imageInfo.gpsCoordinates} />
                  <MetadataField label="Altitude" value={metadata.imageInfo.altitude || "N/A"} />
                  <MetadataField label="Direction" value={metadata.imageInfo.direction || "N/A"} />
                </div>
              </div>

              {/* Recognition Information */}
              <div>
                <SectionHeader icon={Info} title="Recognition Information" />
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <MetadataField label="Recognition Model" value={metadata.recognitionInfo.model} />
                  <MetadataField label="Recognition Version" value={metadata.recognitionInfo.version} />
                  <MetadataField label="Recognition Date" value={metadata.recognitionInfo.date} />
                  <MetadataField label="Recognition Confidence" value={metadata.recognitionInfo.confidence} />
                  <MetadataField label="Processing Time" value={metadata.recognitionInfo.processingTime} />
                  <MetadataField label="API Provider" value={metadata.recognitionInfo.apiProvider} />
                </div>
                
                {metadata.recognitionInfo.landmarks && metadata.recognitionInfo.landmarks.length > 0 && (
                  <div className="mt-2">
                    <span className="text-xs font-medium">Recognized Landmarks</span>
                    <div className="space-y-1 mt-1">
                      {metadata.recognitionInfo.landmarks.map((landmark, index) => (
                        <div key={index} className="bg-slate-50 dark:bg-slate-800/50 p-2 rounded-md flex justify-between">
                          <span className="text-xs">{landmark.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {(landmark.confidence * 100).toFixed(1)}%
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Raw Data */}
              <div>
                <SectionHeader icon={Info} title="Raw Metadata" />
                <div className="bg-slate-50 dark:bg-slate-800/50 p-2 rounded-md">
                  <pre className="text-xs text-slate-600 dark:text-slate-300 max-h-40 overflow-y-auto">
                    {JSON.stringify(metadata.rawData, null, 2)}
                  </pre>
                </div>
              </div>
            </TabsContent>
          </div>
        </Tabs>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button onClick={handleExportMetadata} className="gap-2">
            <Download className="h-4 w-4" />
            Export Metadata
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Utility function to extract metadata from file and recognition result
function extractMetadata(file, recognitionResult, enrichedData) {
  if (!file || !recognitionResult) return null
  
  // Basic defaults
  const defaultLocationInfo = {
    name: "Unknown Location",
    category: "Unknown",
    formattedAddress: "N/A",
    coordinates: "N/A",
    accuracy: "Low",
    buildingType: "N/A",
    materialType: "N/A",
    placeId: "N/A"
  }
  
  const defaultBusinessInfo = {
    businessName: "N/A",
    businessCategory: "N/A",
    businessAddress: "N/A",
    businessConfidence: "N/A",
    phoneNumber: "N/A",
    website: "N/A",
    rating: "N/A",
    priceLevel: "N/A",
    openingHours: "N/A",
    established: "N/A",
    amenities: [],
    services: [],
    accessibility: [],
    popularTimes: null
  }
  
  const defaultGeoData = {
    country: "N/A",
    administrativeArea: "N/A",
    locality: "N/A",
    postalCode: "N/A",
    streetName: "N/A",
    streetNumber: "N/A",
    region: "N/A",
    subLocality: "N/A"
  }
  
  const defaultEnvironmentalData = {
    weatherConditions: "N/A",
    airQuality: "N/A",
    airQualityIndex: "N/A",
    timeOfDay: "N/A",
    urbanDensity: "N/A",
    crowdDensity: "N/A",
    noiseLevel: "N/A",
    materialType: "N/A",
    vegetationDensity: "N/A",
    waterProximity: "N/A",
    greenSpaceProximity: "N/A",
    safetyScore: "N/A",
    crimeRate: "N/A",
    emergencyServices: [],
    significantColors: [],
    temperature: "N/A",
    humidity: "N/A"
  }

  // Extract file information
  const fileInfo = {
    fileName: file.name || "Unknown",
    fileSize: formatFileSize(file.size) || "Unknown",
    dimensions: recognitionResult.dimensions || "Unknown",
    format: file.type || "Unknown",
    dateTaken: recognitionResult.dateTaken ? new Date(recognitionResult.dateTaken).toLocaleString() : "Unknown",
    dateModified: file.lastModified ? new Date(file.lastModified).toLocaleString() : "Unknown",
    gpsCoordinates: recognitionResult.location ? 
      `${recognitionResult.location.latitude}, ${recognitionResult.location.longitude}` : "N/A",
    colorProfile: recognitionResult.colorProfile || "sRGB",
    bitDepth: recognitionResult.bitDepth || "24-bit",
    compression: recognitionResult.compression || "N/A",
    resolution: recognitionResult.resolution || "N/A",
    altitude: recognitionResult.altitude ? `${recognitionResult.altitude}m` : "N/A",
    direction: recognitionResult.direction ? `${recognitionResult.direction}°` : "N/A"
  }
  
  // Extract camera information if available
  const cameraInfo = recognitionResult.camera ? {
    make: recognitionResult.camera.make || "Unknown",
    model: recognitionResult.camera.model || "Unknown",
    lens: recognitionResult.camera.lens || "Unknown",
    focalLength: recognitionResult.camera.focalLength || "Unknown",
    aperture: recognitionResult.camera.aperture || "Unknown",
    iso: recognitionResult.camera.iso || "Unknown",
    exposureTime: recognitionResult.camera.exposureTime || "Unknown",
    whiteBalance: recognitionResult.camera.whiteBalance || "Auto",
    flash: recognitionResult.camera.flash || "No Flash",
    meteringMode: recognitionResult.camera.meteringMode || "Pattern",
    exposureMode: recognitionResult.camera.exposureMode || "Auto",
    exposureProgram: recognitionResult.camera.exposureProgram || "Normal",
    digitalZoom: recognitionResult.camera.digitalZoom || "None",
    software: recognitionResult.camera.software || "N/A"
  } : null
  
  // Extract location information
  const locationInfo = {
    ...defaultLocationInfo,
    name: recognitionResult.name || recognitionResult.businessName || defaultLocationInfo.name,
    category: recognitionResult.category || defaultLocationInfo.category,
    formattedAddress: recognitionResult.formattedAddress || defaultLocationInfo.formattedAddress,
    coordinates: recognitionResult.location ? 
      `${recognitionResult.location.latitude}, ${recognitionResult.location.longitude}` : defaultLocationInfo.coordinates,
    accuracy: `${recognitionResult.confidence ? (recognitionResult.confidence * 100).toFixed(1) + '%' : defaultLocationInfo.accuracy}`,
    buildingType: recognitionResult.buildingType || defaultLocationInfo.buildingType,
    materialType: recognitionResult.materialType || defaultLocationInfo.materialType,
    placeId: recognitionResult.placeId || defaultLocationInfo.placeId,
    lastVisited: recognitionResult.lastVisited ? new Date(recognitionResult.lastVisited).toLocaleString() : "N/A",
    popularity: recognitionResult.popularity || "N/A"
  }
  
  // Extract business information
  const businessInfo = {
    ...defaultBusinessInfo,
    businessName: recognitionResult.businessName || defaultBusinessInfo.businessName,
    businessCategory: recognitionResult.businessCategory || defaultBusinessInfo.businessCategory,
    businessAddress: recognitionResult.businessAddress || recognitionResult.formattedAddress || defaultBusinessInfo.businessAddress,
    businessConfidence: recognitionResult.businessConfidence ? 
      (recognitionResult.businessConfidence * 100).toFixed(1) + '%' : defaultBusinessInfo.businessConfidence,
    phoneNumber: recognitionResult.phoneNumber || defaultBusinessInfo.phoneNumber,
    website: recognitionResult.website || defaultBusinessInfo.website,
    rating: recognitionResult.rating ? `${recognitionResult.rating}/5` : defaultBusinessInfo.rating,
    priceLevel: recognitionResult.priceLevel ? "$".repeat(recognitionResult.priceLevel) : defaultBusinessInfo.priceLevel,
    openingHours: recognitionResult.openingHours || defaultBusinessInfo.openingHours,
    established: recognitionResult.established || 
      (enrichedData?.placeDetails?.establishedYear || defaultBusinessInfo.established),
    amenities: recognitionResult.amenities || defaultBusinessInfo.amenities,
    services: recognitionResult.services || defaultBusinessInfo.services,
    accessibility: recognitionResult.accessibility || 
      (enrichedData?.placeDetails?.accessibility || defaultBusinessInfo.accessibility)
  }
  
  // Add popular times if available from enriched data
  if (enrichedData?.placeDetails?.popularTimes) {
    businessInfo.popularTimes = enrichedData.placeDetails.popularTimes
  }
  
  // Extract geo data
  const geoData = {
    ...defaultGeoData,
    country: recognitionResult.address?.country || defaultGeoData.country,
    administrativeArea: recognitionResult.address?.administrativeArea || defaultGeoData.administrativeArea,
    locality: recognitionResult.address?.locality || defaultGeoData.locality,
    postalCode: recognitionResult.address?.postalCode || defaultGeoData.postalCode,
    streetName: recognitionResult.address?.streetName || defaultGeoData.streetName,
    streetNumber: recognitionResult.address?.streetNumber || defaultGeoData.streetNumber,
    region: recognitionResult.address?.region || defaultGeoData.region,
    subLocality: recognitionResult.address?.subLocality || defaultGeoData.subLocality,
    formattedAddress: recognitionResult.formattedAddress || recognitionResult.address?.formattedAddress || "N/A",
    timezone: recognitionResult.address?.timezone || "N/A",
    elevation: recognitionResult.address?.elevation ? `${recognitionResult.address.elevation}m` : "N/A"
  }
  
  // Extract environmental data
  const environmentalData = {
    ...defaultEnvironmentalData,
    weatherConditions: recognitionResult.weatherConditions || defaultEnvironmentalData.weatherConditions,
    airQuality: recognitionResult.airQuality || defaultEnvironmentalData.airQuality,
    airQualityIndex: recognitionResult.airQualityIndex || 
      (enrichedData?.additionalInfo?.environmentalData?.airQualityIndex || defaultEnvironmentalData.airQualityIndex),
    timeOfDay: recognitionResult.timeOfDay || defaultEnvironmentalData.timeOfDay,
    urbanDensity: recognitionResult.urbanDensity || defaultEnvironmentalData.urbanDensity,
    crowdDensity: recognitionResult.crowdDensity || defaultEnvironmentalData.crowdDensity,
    noiseLevel: recognitionResult.noiseLevel || 
      (enrichedData?.additionalInfo?.environmentalData?.noiseLevel || defaultEnvironmentalData.noiseLevel),
    materialType: recognitionResult.materialType || defaultEnvironmentalData.materialType,
    vegetationDensity: recognitionResult.vegetationDensity || defaultEnvironmentalData.vegetationDensity,
    waterProximity: recognitionResult.waterProximity || defaultEnvironmentalData.waterProximity,
    greenSpaceProximity: recognitionResult.greenSpaceProximity || 
      (enrichedData?.additionalInfo?.environmentalData?.greenSpaceProximity || defaultEnvironmentalData.greenSpaceProximity),
    safetyScore: recognitionResult.safetyScore || defaultEnvironmentalData.safetyScore,
    crimeRate: recognitionResult.crimeRate || 
      (enrichedData?.additionalInfo?.safetyData?.crimeRate || defaultEnvironmentalData.crimeRate),
    emergencyServices: recognitionResult.emergencyServices || 
      (enrichedData?.additionalInfo?.safetyData?.emergencyServices || defaultEnvironmentalData.emergencyServices),
    significantColors: recognitionResult.significantColors || defaultEnvironmentalData.significantColors,
    temperature: recognitionResult.temperature || 
      (enrichedData?.additionalInfo?.environmentalData?.temperature || defaultEnvironmentalData.temperature),
    humidity: recognitionResult.humidity || 
      (enrichedData?.additionalInfo?.environmentalData?.humidity || defaultEnvironmentalData.humidity),
    sunsetTime: recognitionResult.sunsetTime || "N/A",
    sunriseTime: recognitionResult.sunriseTime || "N/A",
    lightConditions: recognitionResult.lightConditions || "N/A",
    seasonalFeatures: recognitionResult.seasonalFeatures || []
  }
  
  // Combine all metadata
  return {
    locationInfo,
    businessInfo,
    geoData,
    imageInfo: {
      ...fileInfo,
      camera: cameraInfo
    },
    environmentalData,
    nearbyPlaces: recognitionResult.nearbyPlaces || [],
    historicalInfo: recognitionResult.historicalInfo || "N/A",
    recognitionInfo: {
      model: "Location Recognition v2.0",
      version: "2.5.0",
      date: new Date().toLocaleString(),
      confidence: recognitionResult.confidence ? 
        (recognitionResult.confidence * 100).toFixed(1) + '%' : "Unknown",
      processingTime: recognitionResult.processingTime || "N/A",
      apiProvider: recognitionResult.apiProvider || "Internal API",
      landmarks: recognitionResult.landmarks || []
    },
    culturalInfo: {
      localLanguages: recognitionResult.localLanguages || [],
      culturalSignificance: recognitionResult.culturalSignificance || "N/A",
      localCuisine: recognitionResult.localCuisine || [],
      events: recognitionResult.events || []
    },
    travelInfo: {
      touristRating: recognitionResult.touristRating || "N/A",
      bestTimeToVisit: recognitionResult.bestTimeToVisit || "N/A",
      travelTips: recognitionResult.travelTips || [],
      visaRequirements: recognitionResult.visaRequirements || "N/A"
    },
    rawData: recognitionResult,
    enrichedData: enrichedData || null
  }
}

// Utility function to format file size
function formatFileSize(sizeInBytes) {
  if (sizeInBytes < 1024) {
    return sizeInBytes + ' B'
  } else if (sizeInBytes < 1024 * 1024) {
    return (sizeInBytes / 1024).toFixed(2) + ' KB'
  } else {
    return (sizeInBytes / (1024 * 1024)).toFixed(2) + ' MB'
  }
}