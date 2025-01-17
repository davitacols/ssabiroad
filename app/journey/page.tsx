"use client";

import React, { useState, useRef, ChangeEvent } from 'react';
import { Camera, Upload, Loader2, Info, MapPin, Clock, Navigation, Building, Landmark, ChevronRight, Sun, Cloud, Wind, Users, Palette } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ShareResult } from '@/components/share-result';

interface Location {
  lat: number;
  lng: number;
}

type DirectionStep = {
  instruction: string;
  distance: string;
  duration: string;
  travelMode: 'DRIVING' | 'WALKING' | 'BICYCLING' | 'TRANSIT' | 'FLIGHT' | 'SHIP';
};

interface Directions {
  distance: string;
  duration: string;
  primaryMode: 'road' | 'transit' | 'flight' | 'ship';
  steps: DirectionStep[];
}

interface BuildingResponse {
  success: boolean;
  type: 'landmark' | 'text-detection' | 'image-metadata' | 'building' | 'unknown';
  description?: string;
  confidence?: number;
  location?: Location;
  address?: string;
  directions?: Directions;
  error?: string;
}

interface NearbyPlace {
  name: string;
  type: string;
  distance: string;
  rating?: number;
}

interface EnhancedBuildingResponse extends BuildingResponse {
  weather?: WeatherInfo;
  nearbyPlaces?: NearbyPlace[];
  popularTimes?: Record<string, number[]>;
  estimatedWaitTime?: string;
  analysis?: {
    timeOfDay: string;
    lightingConditions: string;
    weatherConditions: string;
    crowdDensity?: CrowdDensity;
    mainColors: string[];
    architecturalFeatures: string[];
  };
}

const MapComponent = ({ currentLocation, destinationLocation }: { currentLocation: Location; destinationLocation: Location }) => {
  const mapRef = useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (typeof window.google === 'undefined') {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`;
      script.async = true;
      script.defer = true;
      script.onload = initMap;
      document.head.appendChild(script);
    } else {
      initMap();
    }
  }, [currentLocation, destinationLocation]);

  const initMap = () => {
    if (!mapRef.current) return;

    const map = new google.maps.Map(mapRef.current, {
      zoom: 13,
      center: currentLocation,
    });

    // Add markers for current location and destination
    new google.maps.Marker({
      position: currentLocation,
      map,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 8,
        fillColor: '#4285F4',
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 2,
      },
      title: 'Your Location',
    });

    new google.maps.Marker({
      position: destinationLocation,
      map,
      title: 'Destination',
    });

    // Draw route between points
    const directionsService = new google.maps.DirectionsService();
    const directionsRenderer = new google.maps.DirectionsRenderer({
      map,
      suppressMarkers: true,
    });

    directionsService.route(
      {
        origin: currentLocation,
        destination: destinationLocation,
        travelMode: google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === 'OK') {
          directionsRenderer.setDirections(result);
        }
      }
    );
  };

  return (
    <div ref={mapRef} className="w-full h-64 rounded-xl overflow-hidden shadow-md" />
  );
};

const getCurrentLocation = async (): Promise<Location> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser.'));
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (error) => {
        reject(new Error('Unable to retrieve your location.'));
      }
    );
  });
};

export default function BuildingDetectorDemo(): JSX.Element {
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [result, setResult] = useState<EnhancedBuildingResponse | null>(null);
  const [usageCount, setUsageCount] = useState<number>(0);
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const MAX_FREE_USES = 3;

  const handleImageCapture = (e: ChangeEvent<HTMLInputElement>): void => {
    if (usageCount >= MAX_FREE_USES) {
      setError('You have reached the maximum number of free attempts. Sign up for unlimited access!');
      return;
    }

    const file = e.target.files?.[0];
    if (!file) return;
    
    setImage(file);
    setPreview(URL.createObjectURL(file));
    setResult(null);
    setError('');
  };

  const handleSubmit = async (): Promise<void> => {
    if (!image) return;
    if (usageCount >= MAX_FREE_USES) {
      setError('You have reached the maximum number of free attempts. Sign up for unlimited access!');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const location = await getCurrentLocation();
      setCurrentLocation(location);
      
      const formData = new FormData();
      formData.append('image', image);
      formData.append('currentLat', location.lat.toString());
      formData.append('currentLng', location.lng.toString());
      
      const response = await fetch('/api/process-image', {
        method: 'POST',
        body: formData
      });
      
      const data: EnhancedBuildingResponse = await response.json();
      
      if (!response.ok) {
        throw new Error(data.errorMessage || 'Failed to detect building');
      }
      
      setResult(data);
      setUsageCount(prev => prev + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto p-4 max-w-6xl">
        {/* Header Section */}
        <div className="mb-12 text-center pt-12">
          <div className="inline-flex items-center gap-3 mb-6 bg-white p-3 rounded-2xl shadow-sm">
            <Landmark className="w-10 h-10 text-blue-600" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Enhanced Building Detector AI
            </h1>
          </div>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
            Instantly identify buildings and get detailed information with our advanced AI technology
          </p>
          <div className="bg-white p-4 rounded-2xl shadow-sm inline-flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Progress 
                value={((MAX_FREE_USES - usageCount) / MAX_FREE_USES) * 100} 
                className="w-32 h-3"
              />
              <span className="text-sm text-blue-800 font-medium whitespace-nowrap">
                {MAX_FREE_USES - usageCount} attempts remaining
              </span>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          {/* Upload Section */}
          <div className="space-y-6">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-xl">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Camera className="w-6 h-6 text-blue-600" />
                  Capture or Upload
                </CardTitle>
                <CardDescription className="text-base">
                  Take a photo or upload an image of any building
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-6">
                  <div className="flex gap-4 justify-center">
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      variant="outline"
                      className="w-44 h-12 border-2 hover:border-blue-400 hover:bg-blue-50 transition-all duration-300"
                      disabled={usageCount >= MAX_FREE_USES}
                    >
                      <Camera className="mr-2 h-5 w-5" />
                      Take Photo
                    </Button>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleImageCapture}
                      ref={fileInputRef}
                      className="hidden"
                    />
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      variant="outline"
                      className="w-44 h-12 border-2 hover:border-blue-400 hover:bg-blue-50 transition-all duration-300"
                      disabled={usageCount >= MAX_FREE_USES}
                    >
                      <Upload className="mr-2 h-5 w-5" />
                      Upload Image
                    </Button>
                  </div>

                  {preview && (
                    <div className="relative rounded-xl overflow-hidden bg-gray-100 border-2 border-blue-100 shadow-inner">
                      <div className="aspect-video">
                        <img
                          src={preview || "/placeholder.svg"}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                  )}

                  {image && (
                    <Button
                      onClick={handleSubmit}
                      disabled={loading || usageCount >= MAX_FREE_USES}
                      className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-md"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Analyzing Image...
                        </>
                      ) : (
                        <>
                          <Building className="mr-2 h-5 w-5" />
                          Detect Building
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {error && (
              <Alert variant="destructive" className="border-0 shadow-lg animate-in fade-in duration-300">
                <AlertTitle className="text-lg">Error</AlertTitle>
                <AlertDescription className="text-base">{error}</AlertDescription>
              </Alert>
            )}
          </div>

          {/* Results Section */}
          {result && result.success && (
            <Card className="border-0 shadow-lg animate-in slide-in-from-right duration-500">
              <CardHeader className="border-b bg-gradient-to-r from-green-50 to-emerald-50 rounded-t-xl">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Landmark className="w-6 h-6 text-green-600" />
                  Enhanced Detection Results
                </CardTitle>
                {result.confidence && (
                  <CardDescription className="text-base">
                    Confidence Score: {(result.confidence * 100).toFixed(1)}%
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <Tabs defaultValue="info" className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="info">Info</TabsTrigger>
                    <TabsTrigger value="analysis">Analysis</TabsTrigger>
                    <TabsTrigger value="nearby">Nearby</TabsTrigger>
                    <TabsTrigger value="weather">Weather</TabsTrigger>
                  </TabsList>
                  <TabsContent value="info" className="mt-4">
                    {result.description && (
                      <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl shadow-sm">
                        <h3 className="font-semibold flex items-center gap-2 text-green-800 mb-2">
                          <Building className="w-5 h-5" />
                          Building Identified
                        </h3>
                        <p className="text-green-900">{result.description}</p>
                      </div>
                    )}
                    {result.address && (
                      <div className="flex items-start gap-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl shadow-sm mt-4">
                        <MapPin className="w-5 h-5 text-blue-600 flex-shrink-0 mt-1" />
                        <div>
                          <h3 className="font-semibold text-blue-900 mb-1">Location</h3>
                          <p className="text-blue-800">{result.address}</p>
                        </div>
                      </div>
                    )}
                    {result.estimatedWaitTime && (
                      <div className="flex items-start gap-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl shadow-sm mt-4">
                        <Clock className="w-5 h-5 text-purple-600 flex-shrink-0 mt-1" />
                        <div>
                          <h3 className="font-semibold text-purple-900 mb-1">Estimated Wait Time</h3>
                          <p className="text-purple-800">{result.estimatedWaitTime}</p>
                        </div>
                      </div>
                    )}
                  </TabsContent>
                  <TabsContent value="analysis" className="mt-4">
                    {result.analysis && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-4 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-xl shadow-sm">
                            <h3 className="font-semibold flex items-center gap-2 text-yellow-800 mb-2">
                              <Sun className="w-5 h-5" />
                              Time of Day
                            </h3>
                            <p className="text-yellow-900">{result.analysis.timeOfDay}</p>
                          </div>
                          <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl shadow-sm">
                            <h3 className="font-semibold flex items-center gap-2 text-blue-800 mb-2">
                              <Cloud className="w-5 h-5" />
                              Weather Conditions
                            </h3>
                            <p className="text-blue-900">{result.analysis.weatherConditions}</p>
                          </div>
                        </div>
                        <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl shadow-sm">
                          <h3 className="font-semibold flex items-center gap-2 text-green-800 mb-2">
                            <Users className="w-5 h-5" />
                            Crowd Density
                          </h3>
                          <p className="text-green-900">{result.analysis.crowdDensity}</p>
                        </div>
                        <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl shadow-sm">
                          <h3 className="font-semibold flex items-center gap-2 text-purple-800 mb-2">
                            <Palette className="w-5 h-5" />
                            Main Colors
                          </h3>
                          <div className="flex gap-2">
                            {result.analysis.mainColors.map((color, index) => (
                              <div key={index} className="w-8 h-8 rounded-full" style={{ backgroundColor: color }} />
                            ))}
                          </div>
                        </div>
                        <div className="p-4 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl shadow-sm">
                          <h3 className="font-semibold flex items-center gap-2 text-indigo-800 mb-2">
                            <Building className="w-5 h-5" />
                            Architectural Features
                          </h3>
                          <div className="flex flex-wrap gap-2">
                            {result.analysis.architecturalFeatures.map((feature, index) => (
                              <Badge key={index} variant="secondary">{feature}</Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </TabsContent>
                  <TabsContent value="nearby" className="mt-4">
                    {result.nearbyPlaces && result.nearbyPlaces.length > 0 && (
                      <div className="space-y-4">
                        {result.nearbyPlaces.map((place, index) => (
                          <div key={index} className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl shadow-sm">
                            <h3 className="font-semibold text-blue-900 mb-1">{place.name}</h3>
                            <p className="text-blue-800">{place.type} • {place.distance}</p>
                            {place.rating && (
                              <div className="flex items-center mt-1">
                                <span className="text-yellow-500 mr-1">★</span>
                                <span className="text-blue-800">{place.rating.toFixed(1)}</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>
                  <TabsContent value="weather" className="mt-4">
                    {result.weather && (
                      <div className="space-y-4">
                        <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl shadow-sm">
                          <h3 className="font-semibold flex items-center gap-2 text-blue-800 mb-2">
                            <Sun className="w-5 h-5" />
                            Temperature
                          </h3>
                          <p className="text-blue-900">{result.weather.temperature}°C</p>
                        </div>
                        <div className="p-4 bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl shadow-sm">
                          <h3 className="font-semibold flex items-center gap-2 text-gray-800 mb-2">
                            <Cloud className="w-5 h-5" />
                            Conditions
                          </h3>
                          <p className="text-gray-900">{result.weather.conditions}</p>
                        </div>
                        <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl shadow-sm">
                          <h3 className="font-semibold flex items-center gap-2 text-blue-800 mb-2">
                            <Wind className="w-5 h-5" />
                            Wind Speed
                          </h3>
                          <p className="text-blue-900">{result.weather.windSpeed} m/s</p>
                        </div>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>

                {result.location && currentLocation && (
                  <div className="space-y-4">
                    <MapComponent
                      currentLocation={currentLocation}
                      destinationLocation={result.location}
                    />
                  </div>
                )}

                {result.directions && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl shadow-sm">
                      <div className="flex items-center gap-3">
                        <Clock className="w-5 h-5 text-purple-600" />
                        <div className="space-x-4">
                          <span className="font-medium text-purple-900">Duration: </span>
                          <span className="text-purple-800">{result.directions.duration}</span>
                        </div>
                      </div>
                      <div>
                        <span className="font-medium text-purple-900">Distance: </span>
                        <span className="text-purple-800">{result.directions.distance}</span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h3 className="font-semibold flex items-center gap-2 text-gray-800 ml-1">
                        <Navigation className="w-5 h-5" />
                        Step-by-Step Directions
                      </h3>
                      {result.directions.steps.map((step, index) => (
                        <div
                          key={index}
                          className="p-4 bg-white rounded-xl border border-gray-100 text-sm text-gray-700 shadow-sm hover:shadow-md transition-shadow duration-300 flex items-center gap-3"
                        >
                          <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-sm font-medium text-gray-600 flex-shrink-0">
                            {index + 1}
                          </span>
                          <div dangerouslySetInnerHTML={{ __html: step.instruction }} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <ShareResult result={result} />
              </CardContent>
            </Card>
          )}
        </div>

        {/* Upgrade Card */}
        {usageCount >= MAX_FREE_USES && (
          <Card className="border-0 shadow-lg overflow-hidden">
            <CardContent className="p-8 bg-gradient-to-r from-blue-600 to-purple-600">
              <div className="text-center space-y-6">
                <h3 className="text-3xl font-bold text-white">
                  Ready to unlock unlimited detections?
                </h3>
                <p className="text-lg text-blue-100 max-w-2xl mx-auto">
                  Get unlimited building detections, premium features, and priority support with our Pro plan.
                </p>
                <Button className="bg-white text-blue-600 hover:bg-blue-50 transition-colors duration-300 h-12 px-8 text-lg font-medium shadow-lg hover:shadow-xl">
                  Upgrade to Pro
                  <ChevronRight className="ml-2 w-5 h-5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
