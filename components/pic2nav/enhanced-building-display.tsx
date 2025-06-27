"use client"

import { useState, useEffect } from "react"
import { 
  Building, 
  MapPin, 
  Landmark, 
  ImageIcon, 
  Info, 
  ChevronDown,
  ExternalLink,
  Loader2,
  Map,
  Navigation,
  Clock,
  Star,
  Phone,
  Globe
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { motion } from "framer-motion"
import { searchLocationImages } from "./image-search-service"

interface EnhancedBuildingDisplayProps {
  recognitionResult: any
  onShowFullDetails: () => void
}

export function EnhancedBuildingDisplay({ recognitionResult, onShowFullDetails }: EnhancedBuildingDisplayProps) {
  const [activeTab, setActiveTab] = useState("info")
  const [showMore, setShowMore] = useState(false)
  const [nearbyPlaces, setNearbyPlaces] = useState([])
  const [buildingPhotos, setBuildingPhotos] = useState([])
  const [isLoadingPhotos, setIsLoadingPhotos] = useState(false)
  const [isLoadingNearby, setIsLoadingNearby] = useState(false)
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0)
  
  // Fetch location photos when component mounts
  useEffect(() => {
    if (recognitionResult?.name) {
      fetchPhotosForLocation(recognitionResult.name)
    }
  }, [recognitionResult])
  
  // Function to fetch photos for the identified location
  const fetchPhotosForLocation = async (locationName: string) => {
    setIsLoadingPhotos(true)
    
    try {
      const photos = await searchLocationImages(locationName)
      setBuildingPhotos(photos)
    } catch (error) {
      console.error("Error fetching location photos:", error)
    } finally {
      setIsLoadingPhotos(false)
    }
  }
  
  if (!recognitionResult) return null
  
  return (
    <div className="space-y-4">
      {/* Main photo display */}
      <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden">
        {isLoadingPhotos ? (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-100 dark:bg-slate-800">
            <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
          </div>
        ) : buildingPhotos.length > 0 ? (
          <>
            <img
              src={buildingPhotos[selectedPhotoIndex]}
              alt={recognitionResult.name || "Building"}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4">
              <h2 className="text-white font-bold text-xl">{recognitionResult.name}</h2>
              <div className="flex items-center text-white/80 text-sm">
                <MapPin className="h-4 w-4 mr-1 flex-shrink-0" />
                <span className="truncate">{recognitionResult.address || recognitionResult.formattedAddress}</span>
              </div>
            </div>
            
            {/* Photo navigation dots */}
            {buildingPhotos.length > 1 && (
              <div className="absolute bottom-20 left-0 right-0 flex justify-center gap-1.5">
                {buildingPhotos.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedPhotoIndex(index)}
                    className={`w-2 h-2 rounded-full ${
                      index === selectedPhotoIndex ? "bg-white" : "bg-white/50"
                    }`}
                    aria-label={`View photo ${index + 1}`}
                  />
                ))}
              </div>
            )}
            
            {/* Quick action buttons */}
            <div className="absolute top-4 right-4 flex gap-2">
              {recognitionResult.location && (
                <Button
                  size="sm"
                  variant="secondary"
                  className="bg-white/90 hover:bg-white text-slate-800 h-9 px-3 rounded-full shadow-md"
                  asChild
                >
                  <a
                    href={`https://www.google.com/maps?q=${recognitionResult.location.latitude},${recognitionResult.location.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Map className="w-4 h-4 mr-1.5" />
                    Map
                  </a>
                </Button>
              )}
              
              {recognitionResult.location && (
                <Button
                  size="sm"
                  variant="secondary"
                  className="bg-white/90 hover:bg-white text-slate-800 h-9 px-3 rounded-full shadow-md"
                  asChild
                >
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${recognitionResult.location.latitude},${recognitionResult.location.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Navigation className="w-4 h-4 mr-1.5" />
                    Directions
                  </a>
                </Button>
              )}
            </div>
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-500">
            <ImageIcon className="h-12 w-12 mb-2 opacity-50" />
            <p>No photos available</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => fetchPhotosForLocation(recognitionResult.name)} 
              className="mt-2"
            >
              <ImageIcon className="h-4 w-4 mr-2" />
              Retry Loading Photos
            </Button>
          </div>
        )}
      </div>

      {/* Info tabs */}
      <Card className="overflow-hidden">
        <Tabs defaultValue="info" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 w-full rounded-none border-b">
            <TabsTrigger value="info" className="text-xs py-3 rounded-none">
              <Info className="h-3.5 w-3.5 mr-1.5" />
              Details
            </TabsTrigger>
            <TabsTrigger value="photos" className="text-xs py-3 rounded-none">
              <ImageIcon className="h-3.5 w-3.5 mr-1.5" />
              Photos
            </TabsTrigger>
            <TabsTrigger value="nearby" className="text-xs py-3 rounded-none">
              <Landmark className="h-3.5 w-3.5 mr-1.5" />
              Nearby
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="info" className="p-4 space-y-4">
            {/* Key details */}
            <div className="grid grid-cols-2 gap-3">
              {recognitionResult.buildingType && (
                <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Building Type</p>
                  <p className="font-medium">{recognitionResult.buildingType}</p>
                </div>
              )}
              
              {recognitionResult.materialType && (
                <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Material</p>
                  <p className="font-medium">{recognitionResult.materialType}</p>
                </div>
              )}
              
              {recognitionResult.rating && (
                <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Rating</p>
                  <div className="flex items-center">
                    <Star className="h-4 w-4 text-amber-500 fill-amber-500 mr-1" />
                    <p className="font-medium">{recognitionResult.rating}</p>
                  </div>
                </div>
              )}
              
              {recognitionResult.openingHours && (
                <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Hours</p>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 text-slate-500 mr-1" />
                    <p className="font-medium truncate">{typeof recognitionResult.openingHours === 'string' ? recognitionResult.openingHours : 'Open'}</p>
                  </div>
                </div>
              )}
            </div>
            
            {/* Description */}
            {recognitionResult.description && (
              <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg">
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Description</p>
                <p className="text-sm">
                  {showMore 
                    ? recognitionResult.description 
                    : `${recognitionResult.description.substring(0, 100)}${recognitionResult.description.length > 100 ? '...' : ''}`
                  }
                </p>
                
                {recognitionResult.description.length > 100 && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setShowMore(!showMore)} 
                    className="w-full mt-1 h-6 text-xs"
                  >
                    {showMore ? (
                      <>Show Less <ChevronDown className="ml-1 h-3 w-3" /></>
                    ) : (
                      <>Show More <ChevronDown className="ml-1 h-3 w-3 transform rotate-180" /></>
                    )}
                  </Button>
                )}
              </div>
            )}
            
            {/* Contact info */}
            {(recognitionResult.phoneNumber || recognitionResult.website) && (
              <div className="space-y-2">
                {recognitionResult.phoneNumber && (
                  <a 
                    href={`tel:${recognitionResult.phoneNumber}`}
                    className="flex items-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <Phone className="h-4 w-4 mr-3 text-teal-500" />
                    <span>{recognitionResult.phoneNumber}</span>
                  </a>
                )}
                
                {recognitionResult.website && (
                  <a 
                    href={recognitionResult.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <Globe className="h-4 w-4 mr-3 text-teal-500" />
                    <span className="truncate">{recognitionResult.website.replace(/^https?:\/\//, '')}</span>
                  </a>
                )}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="photos" className="p-4">
            {isLoadingPhotos ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin mr-2 text-teal-500" />
                <span className="text-sm text-slate-500">Loading photos...</span>
              </div>
            ) : buildingPhotos.length > 0 ? (
              <div className="grid grid-cols-2 gap-2">
                {buildingPhotos.map((photo, index) => (
                  <motion.div 
                    key={index} 
                    className="aspect-video overflow-hidden rounded-md cursor-pointer"
                    whileHover={{ scale: 1.03 }}
                    transition={{ duration: 0.2 }}
                    onClick={() => setSelectedPhotoIndex(index)}
                  >
                    <img
                      src={photo}
                      alt={`${recognitionResult.name || "Building"} - Photo ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-md text-center">
                <p className="text-sm text-slate-500">No photos available for this location</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => fetchPhotosForLocation(recognitionResult.name)} 
                  className="mt-2"
                >
                  <ImageIcon className="h-4 w-4 mr-2" />
                  Retry Loading Photos
                </Button>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="nearby" className="p-4">
            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-md text-center">
              <p className="text-sm text-slate-500">Nearby places information not available</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2"
                asChild
              >
                <a
                  href={`https://www.google.com/maps/search/places+near+${encodeURIComponent(recognitionResult.name)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Landmark className="h-4 w-4 mr-2" />
                  Search Nearby Places
                </a>
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </Card>
      
      {/* View Complete Details Button */}
      <Button 
        variant="outline" 
        size="sm" 
        onClick={onShowFullDetails}
        className="w-full h-10 bg-teal-50 hover:bg-teal-100 border-teal-200 dark:bg-teal-900/20 dark:hover:bg-teal-900/30 dark:border-teal-800/50 rounded-lg"
      >
        <ExternalLink className="w-4 h-4 mr-2 text-teal-600 dark:text-teal-400" />
        <span className="text-teal-700 dark:text-teal-300">View Complete Building Information</span>
      </Button>
    </div>
  )
}