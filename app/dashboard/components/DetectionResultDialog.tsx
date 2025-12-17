"use client"

import type React from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import {
  Info,
  MapPin,
  X,
  Navigation,
  Star,
  Clock,
  Phone,
  Globe,
  AccessibilityIcon,
  Leaf,
  Wifi,
  CreditCard,
  DollarSign,
  Shield,
  CheckCircle,
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
  publicInfo: {
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

interface DetectionResultDialogProps {
  showResult: boolean
  setShowResult: (show: boolean) => void
  detectionResult: DetectionResult | null
}

const DetectionResultDialog: React.FC<DetectionResultDialogProps> = ({
  showResult,
  setShowResult,
  detectionResult,
}) => {
  if (!detectionResult) return null

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
    <Dialog open={showResult} onOpenChange={setShowResult}>
      <DialogContent className="max-w-4xl bg-white rounded-lg p-0 overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-2xl font-semibold">{detectionResult.description || "Building Details"}</h2>
          <Button variant="ghost" size="icon" onClick={() => setShowResult(false)}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="w-full justify-start border-b px-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="amenities">Amenities</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
            <TabsTrigger value="accessibility">Accessibility</TabsTrigger>
            <TabsTrigger value="imageProperties">Image Properties</TabsTrigger>
            <TabsTrigger value="nearby">Nearby</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="p-4 space-y-6">
            <div className="flex items-center gap-2 text-green-600">
              <Info className="w-5 h-5" />
              <span>Building detected ({(detectionResult.confidence * 100).toFixed(1)}% confidence)</span>
            </div>

            {detectionResult.type && (
              <div className="flex items-center gap-2">
                <Info className="w-5 h-5" />
                <span>Detection Type: {detectionResult.type}</span>
              </div>
            )}

            {detectionResult.location && (
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                <span>
                  Location: {detectionResult.location.latitude}, {detectionResult.location.longitude}
                </span>
              </div>
            )}

            {detectionResult.safetyScore !== undefined && (
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                <span>Safety Score: {detectionResult.safetyScore}</span>
              </div>
            )}

            {detectionResult.lastUpdated && (
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                <span>Last Updated: {new Date(detectionResult.lastUpdated).toLocaleString()}</span>
              </div>
            )}

            {detectionResult.sourceReliability !== undefined && (
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                <span>Source Reliability: {(detectionResult.sourceReliability * 100).toFixed(2)}%</span>
              </div>
            )}

            {detectionResult.method && (
              <div className="flex items-center gap-2">
                <Info className="w-5 h-5" />
                <span>Detection Method: {detectionResult.method}</span>
              </div>
            )}

            {detectionResult.nearbyPlaces && detectionResult.nearbyPlaces.length > 0 && (
              <div>
                <h3 className="font-semibold">Nearby Places ({detectionResult.nearbyPlaces.length})</h3>
                <ul className="list-disc list-inside">
                  {detectionResult.nearbyPlaces.slice(0, 3).map((place, index) => (
                    <li key={index}>{place.name} - {place.distance}m away</li>
                  ))}
                </ul>
              </div>
            )}

            {detectionResult.weather && (
              <div>
                <h3 className="font-semibold">Current Weather</h3>
                <p>Temperature: {detectionResult.weather.temperature}°C</p>
                {detectionResult.weather.humidity && <p>Humidity: {detectionResult.weather.humidity}%</p>}
              </div>
            )}

            {detectionResult.historicalData && (
              <div>
                <h3 className="font-semibold">Photo Information</h3>
                <p>Photo Age: {detectionResult.historicalData.photoAge}</p>
                {detectionResult.historicalData.historicalContext && (
                  <p className="text-sm text-gray-600">{detectionResult.historicalData.historicalContext}</p>
                )}
              </div>
            )}

            {detectionResult.elevation && (
              <div>
                <h3 className="font-semibold">Elevation</h3>
                <p>{detectionResult.elevation.elevation} {detectionResult.elevation.unit}</p>
              </div>
            )}

            {detectionResult.timezone && (
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                <span>Timezone: {detectionResult.timezone}</span>
              </div>
            )}

            {detectionResult.transit && detectionResult.transit.length > 0 && (
              <div>
                <h3 className="font-semibold">Transit Stations</h3>
                <ul className="list-disc list-inside">
                  {detectionResult.transit.slice(0, 3).map((station, index) => (
                    <li key={index}>{station.name} ({station.type}) - {station.distance}m away</li>
                  ))}
                </ul>
              </div>
            )}

            {detectionResult.demographics && (
              <div>
                <h3 className="font-semibold">Area Demographics</h3>
                <p>Data Source: {detectionResult.demographics.dataSource}</p>
                {detectionResult.demographics.note && <p className="text-sm text-gray-600">{detectionResult.demographics.note}</p>}
              </div>
            )}

            {detectionResult.verification && (
              <div>
                <h3 className="font-semibold">Verification Status</h3>
                <p>Verified: {detectionResult.verification.verified ? 'Yes' : 'No'}</p>
                {detectionResult.verification.sources && detectionResult.verification.sources.length > 0 && (
                  <p>Sources: {detectionResult.verification.sources.join(', ')}</p>
                )}
                {detectionResult.verification.warnings && detectionResult.verification.warnings.length > 0 && (
                  <div className="text-yellow-600">
                    <p className="font-semibold">Warnings:</p>
                    <ul className="list-disc list-inside">
                      {detectionResult.verification.warnings.map((warning, index) => (
                        <li key={index}>{warning}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {detectionResult.features && (
              <div className="grid grid-cols-2 gap-4">
                {detectionResult.features.style && (
                  <div>
                    <h3 className="font-semibold">Architectural Style</h3>
                    <p>{detectionResult.features.style.join(", ")}</p>
                  </div>
                )}
                {detectionResult.features.materials && (
                  <div>
                    <h3 className="font-semibold">Materials</h3>
                    <p>{detectionResult.features.materials.join(", ")}</p>
                  </div>
                )}
                {detectionResult.features.architecture && (
                  <div>
                    <h3 className="font-semibold">Architecture</h3>
                    <p>{detectionResult.features.architecture.join(", ")}</p>
                  </div>
                )}
              </div>
            )}

            {detectionResult.enhancedAnalysis && (
              <div>
                <h3 className="font-semibold">Enhanced Analysis</h3>
                {detectionResult.enhancedAnalysis.walkability && (
                  <p>Walkability Score: {detectionResult.enhancedAnalysis.walkability.score}/100</p>
                )}
                {detectionResult.enhancedAnalysis.bikeability && (
                  <p>Bikeability Score: {detectionResult.enhancedAnalysis.bikeability.score}/100</p>
                )}
                {detectionResult.enhancedAnalysis.airQuality && (
                  <p>Air Quality: {detectionResult.enhancedAnalysis.airQuality.category}</p>
                )}
              </div>
            )}

            {detectionResult.deviceAnalysis && (
              <div>
                <h3 className="font-semibold">Camera Information</h3>
                <p>Device: {detectionResult.deviceAnalysis.camera.make} {detectionResult.deviceAnalysis.camera.model}</p>
                {detectionResult.deviceAnalysis.image && (
                  <p>Resolution: {detectionResult.deviceAnalysis.image.width}x{detectionResult.deviceAnalysis.image.height}</p>
                )}
              </div>
            )}

            {detectionResult.address && (
              <div className="space-y-2">
                <div className="flex items-start gap-2 text-gray-600">
                  <MapPin className="w-5 h-5 mt-1 flex-shrink-0" />
                  <span>{detectionResult.address}</span>
                </div>

                <Button onClick={handleNavigate} className="w-full">
                  <Navigation className="w-5 h-5 mr-2" />
                  Open in Maps
                </Button>
              </div>
            )}

            {detectionResult.publicInfo?.ratings && detectionResult.publicInfo.ratings.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-500" />
                  <span>
                    {detectionResult.publicInfo.ratings[0].average.toFixed(1)} (
                    {detectionResult.publicInfo.ratings[0].total} reviews)
                  </span>
                </div>
              </div>
            )}

            {detectionResult.publicInfo?.openingHours && (
              <div className="flex items-start gap-2">
                <Clock className="w-5 h-5 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold">Opening Hours</h3>
                  <ul className="list-disc list-inside">
                    {detectionResult.publicInfo.openingHours.map((hours, index) => (
                      <li key={index}>{hours}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {detectionResult.publicInfo?.contactInfo && (
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

            {detectionResult.publicInfo?.priceRange && (
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                <span>Price Range: {detectionResult.publicInfo.priceRange}</span>
              </div>
            )}

            {detectionResult.publicInfo?.paymentMethods && (
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                <span>Payment Methods: {detectionResult.publicInfo.paymentMethods.join(", ")}</span>
              </div>
            )}

            {detectionResult.publicInfo?.languages && (
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                <span>Languages: {detectionResult.publicInfo.languages.join(", ")}</span>
              </div>
            )}

            {detectionResult.publicInfo?.checkInOut && (
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  <span>Check-in: {detectionResult.publicInfo.checkInOut.checkIn}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  <span>Check-out: {detectionResult.publicInfo.checkInOut.checkOut}</span>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="amenities" className="p-4 space-y-6">
            {detectionResult.publicInfo?.amenities && (
              <div>
                <h3 className="font-semibold text-lg mb-2">Amenities</h3>
                <ul className="grid grid-cols-2 gap-2">
                  {detectionResult.publicInfo.amenities.map((amenity, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <Wifi className="w-4 h-4" />
                      {amenity}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {detectionResult.similarBuildings && detectionResult.similarBuildings.length > 0 && (
              <div>
                <h3 className="font-semibold text-lg mb-2">Similar Buildings</h3>
                <ul className="list-disc list-inside">
                  {detectionResult.similarBuildings.map((building, index) => (
                    <li key={index}>{building}</li>
                  ))}
                </ul>
              </div>
            )}

            {detectionResult.publicInfo?.publicTransport && detectionResult.publicInfo.publicTransport.length > 0 && (
              <div>
                <h3 className="font-semibold text-lg mb-2">Public Transport</h3>
                <ul className="list-disc list-inside">
                  {detectionResult.publicInfo.publicTransport.map((transport, index) => (
                    <li key={index}>{transport}</li>
                  ))}
                </ul>
              </div>
            )}

            {detectionResult.publicInfo?.services && (
              <div>
                <h3 className="font-semibold text-lg mb-2">Services</h3>
                <ul className="space-y-2">
                  {detectionResult.publicInfo.services.map((service, index) => (
                    <li key={index}>
                      <h4 className="font-semibold">{service.name}</h4>
                      <p>{service.description}</p>
                      <p>Availability: {service.availability}</p>
                      {service.pricing && <p>Pricing: {service.pricing}</p>}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {detectionResult.publicInfo?.parking && (
              <div>
                <h3 className="font-semibold text-lg mb-2">Parking</h3>
                <p>Available: {detectionResult.publicInfo.parking.available ? "Yes" : "No"}</p>
                {detectionResult.publicInfo.parking.type && (
                  <p>Type: {detectionResult.publicInfo.parking.type.join(", ")}</p>
                )}
                {detectionResult.publicInfo.parking.pricing && (
                  <p>Pricing: {detectionResult.publicInfo.parking.pricing}</p>
                )}
                {detectionResult.publicInfo.parking.capacity && (
                  <p>Capacity: {detectionResult.publicInfo.parking.capacity} spaces</p>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="history" className="p-4 space-y-4">
            {detectionResult.publicInfo?.historicalInfo ? (
              <div className="space-y-4">
                <p>{detectionResult.publicInfo.historicalInfo.description}</p>
                {detectionResult.publicInfo.historicalInfo.yearBuilt && (
                  <p>
                    <strong>Year Built:</strong> {detectionResult.publicInfo.historicalInfo.yearBuilt}
                  </p>
                )}
                {detectionResult.publicInfo.historicalInfo.architect && (
                  <p>
                    <strong>Architect:</strong> {detectionResult.publicInfo.historicalInfo.architect}
                  </p>
                )}
                {detectionResult.publicInfo.historicalInfo.significance && (
                  <p>
                    <strong>Significance:</strong> {detectionResult.publicInfo.historicalInfo.significance}
                  </p>
                )}
                {detectionResult.publicInfo.historicalInfo.events &&
                  detectionResult.publicInfo.historicalInfo.events.length > 0 && (
                    <div>
                      <h4 className="font-semibold">Historical Events</h4>
                      <ul className="list-disc list-inside">
                        {detectionResult.publicInfo.historicalInfo.events.map((event, index) => (
                          <li key={index}>
                            <strong>{event.date}:</strong> {event.description}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
              </div>
            ) : (
              <p>No historical information available.</p>
            )}
          </TabsContent>

          <TabsContent value="accessibility" className="p-4 space-y-4">
            {detectionResult.publicInfo?.accessibility ? (
              <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <AccessibilityIcon className="w-5 h-5" />
                  Accessibility Features
                </h3>
                <ul className="list-disc list-inside space-y-2">
                  {detectionResult.publicInfo.accessibility.features.map((feature, index) => (
                    <li key={index}>{feature}</li>
                  ))}
                </ul>
              </div>
            ) : (
              <p>No accessibility information available.</p>
            )}

            {detectionResult.publicInfo?.sustainabilityInfo && (
              <div className="mt-6 space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Leaf className="w-5 h-5" />
                  Sustainability Information
                </h3>
                {detectionResult.publicInfo.sustainabilityInfo.rating && (
                  <p>
                    <strong>Rating:</strong> {detectionResult.publicInfo.sustainabilityInfo.rating}
                  </p>
                )}
                {detectionResult.publicInfo.sustainabilityInfo.certifications.length > 0 && (
                  <div>
                    <strong>Certifications:</strong>
                    <ul className="list-disc list-inside">
                      {detectionResult.publicInfo.sustainabilityInfo.certifications.map((cert, index) => (
                        <li key={index}>{cert}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {detectionResult.publicInfo.sustainabilityInfo.features.length > 0 && (
                  <div>
                    <strong>Sustainability Features:</strong>
                    <ul className="list-disc list-inside">
                      {detectionResult.publicInfo.sustainabilityInfo.features.map((feature, index) => (
                        <li key={index}>{feature}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="imageProperties" className="p-4 space-y-4">
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
            )}
          </TabsContent>

          <TabsContent value="nearby" className="p-4 space-y-4">
            {detectionResult.nearbyPlaces && detectionResult.nearbyPlaces.length > 0 && (
              <div>
                <h3 className="font-semibold text-lg mb-2">Nearby Places</h3>
                <ul className="space-y-2">
                  {detectionResult.nearbyPlaces.map((place, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <MapPin className="w-5 h-5 mt-1" />
                      <div>
                        <h4 className="font-semibold">{place.name}</h4>
                        <p>Type: {place.type}</p>
                        <p>Distance: {place.distance}m away</p>
                        {place.rating && <p>Rating: {place.rating}/5</p>}
                        {place.address && <p className="text-sm text-gray-600">{place.address}</p>}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {detectionResult.publicInfo?.nearbyAttractions &&
            detectionResult.publicInfo.nearbyAttractions.length > 0 && (
              <div className="mt-6">
                <h3 className="font-semibold text-lg mb-2">Nearby Attractions</h3>
                <ul className="space-y-2">
                  {detectionResult.publicInfo.nearbyAttractions.map((attraction, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <MapPin className="w-5 h-5 mt-1" />
                      <div>
                        <h4 className="font-semibold">{attraction.name}</h4>
                        <p>Distance: {attraction.distance}</p>
                        <p>Type: {attraction.type}</p>
                        {attraction.rating && <p>Rating: {attraction.rating}/5</p>}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {detectionResult.landmarks && detectionResult.landmarks.length > 0 && (
              <div className="mt-6">
                <h3 className="font-semibold text-lg mb-2">Landmarks</h3>
                <ul className="space-y-2">
                  {detectionResult.landmarks.map((landmark, index) => (
                    <li key={index}>
                      <h4 className="font-semibold">{landmark.name}</h4>
                      <p className="text-sm text-gray-600">{landmark.description}</p>
                      {landmark.confidence && <p className="text-sm">Confidence: {(landmark.confidence * 100).toFixed(0)}%</p>}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {detectionResult.photos && detectionResult.photos.length > 0 && (
              <div className="mt-6">
                <h3 className="font-semibold text-lg mb-2">Location Photos</h3>
                <div className="grid grid-cols-2 gap-2">
                  {detectionResult.photos.slice(0, 4).map((photo, index) => (
                    <img key={index} src={photo} alt={`Location ${index + 1}`} className="w-full h-32 object-cover rounded" />
                  ))}
                </div>
              </div>
            )}

            {detectionResult.publicInfo?.events && detectionResult.publicInfo.events.length > 0 && (
              <div className="mt-6">
                <h3 className="font-semibold text-lg mb-2">Upcoming Events</h3>
                <ul className="space-y-4">
                  {detectionResult.publicInfo.events.map((event, index) => (
                    <li key={index} className="border-b pb-2">
                      <h4 className="font-semibold">{event.name}</h4>
                      <p>Date: {event.date}</p>
                      <p>{event.description}</p>
                      {event.ticketInfo && <p>Ticket Info: {event.ticketInfo}</p>}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

export default DetectionResultDialog

