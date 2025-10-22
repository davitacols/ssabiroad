import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  MapPin, Clock, Building, Users, CloudRain, Wind, 
  Sun, Globe, Phone, Star, Calendar, Map, Share2, History
} from "lucide-react";
import { Palmtree as Tree } from "lucide-react";

interface LocationDetailsProps {
  result: any;
  onOpenMap: () => void;
  onShare: () => void;
}

export function LocationDetails({ result, onOpenMap, onShare }: LocationDetailsProps) {
  if (!result) return null;
  
  return (
    <div className="space-y-4">
      <div className="flex flex-col space-y-2">
        <h2 className="text-2xl font-bold">{result.name}</h2>
        <div className="flex items-center text-muted-foreground">
          <MapPin className="h-4 w-4 mr-1" />
          <span className="text-sm">{result.formattedAddress || result.address}</span>
        </div>
        
        <div className="flex items-center gap-2 mt-1">
          <Badge variant="outline">{result.category || "Unknown"}</Badge>
          {result.confidence && (
            <Badge variant={result.confidence > 0.7 ? "default" : "secondary"}>
              {Math.round(result.confidence * 100)}% confidence
            </Badge>
          )}
        </div>
      </div>
      
      <Tabs defaultValue="details" className="w-full">
        <TabsList className="grid grid-cols-4 mb-2">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="environment">Environment</TabsTrigger>
          <TabsTrigger value="business">Business</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>
        
        <TabsContent value="details" className="space-y-3">
          {result.description && (
            <p className="text-sm text-muted-foreground">{result.description}</p>
          )}
          
          <div className="grid grid-cols-2 gap-2">
            {result.buildingType && (
              <Card className="bg-muted/40">
                <CardContent className="p-3 flex items-center">
                  <Building className="h-4 w-4 mr-2 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Building</p>
                    <p className="text-sm font-medium">{result.buildingType}</p>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {result.materialType && (
              <Card className="bg-muted/40">
                <CardContent className="p-3 flex items-center">
                  <Building className="h-4 w-4 mr-2 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Material</p>
                    <p className="text-sm font-medium">{result.materialType}</p>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {result.processingTime && (
              <Card className="bg-muted/40">
                <CardContent className="p-3 flex items-center">
                  <Clock className="h-4 w-4 mr-2 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Processing Time</p>
                    <p className="text-sm font-medium">{result.processingTime}ms</p>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {result.type && (
              <Card className="bg-muted/40">
                <CardContent className="p-3 flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Detection Type</p>
                    <p className="text-sm font-medium">{result.type}</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="environment" className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            {result.weatherConditions && (
              <Card className="bg-muted/40">
                <CardContent className="p-3 flex items-center">
                  <CloudRain className="h-4 w-4 mr-2 text-blue-500" />
                  <div>
                    <p className="text-xs text-muted-foreground">Weather</p>
                    <p className="text-sm font-medium">{result.weatherConditions}</p>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {result.airQuality && (
              <Card className="bg-muted/40">
                <CardContent className="p-3 flex items-center">
                  <Wind className="h-4 w-4 mr-2 text-green-500" />
                  <div>
                    <p className="text-xs text-muted-foreground">Air Quality</p>
                    <p className="text-sm font-medium">{result.airQuality}</p>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {result.timeOfDay && (
              <Card className="bg-muted/40">
                <CardContent className="p-3 flex items-center">
                  <Sun className="h-4 w-4 mr-2 text-yellow-500" />
                  <div>
                    <p className="text-xs text-muted-foreground">Time of Day</p>
                    <p className="text-sm font-medium">{result.timeOfDay}</p>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {result.urbanDensity && (
              <Card className="bg-muted/40">
                <CardContent className="p-3 flex items-center">
                  <Building className="h-4 w-4 mr-2 text-gray-500" />
                  <div>
                    <p className="text-xs text-muted-foreground">Urban Density</p>
                    <p className="text-sm font-medium">{result.urbanDensity}</p>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {result.vegetationDensity && (
              <Card className="bg-muted/40">
                <CardContent className="p-3 flex items-center">
                  <Tree className="h-4 w-4 mr-2 text-green-600" />
                  <div>
                    <p className="text-xs text-muted-foreground">Vegetation</p>
                    <p className="text-sm font-medium">{result.vegetationDensity}</p>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {result.crowdDensity && (
              <Card className="bg-muted/40">
                <CardContent className="p-3 flex items-center">
                  <Users className="h-4 w-4 mr-2 text-orange-500" />
                  <div>
                    <p className="text-xs text-muted-foreground">Crowd Density</p>
                    <p className="text-sm font-medium">{result.crowdDensity}</p>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {result.waterProximity && (
              <Card className="bg-muted/40">
                <CardContent className="p-3 flex items-center">
                  <Globe className="h-4 w-4 mr-2 text-blue-600" />
                  <div>
                    <p className="text-xs text-muted-foreground">Water Proximity</p>
                    <p className="text-sm font-medium">{result.waterProximity}</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="business" className="space-y-3">
          {result.isBusinessLocation ? (
            <div className="grid grid-cols-2 gap-2">
              {result.businessName && (
                <Card className="bg-muted/40 col-span-2">
                  <CardContent className="p-3">
                    <p className="text-xs text-muted-foreground">Business Name</p>
                    <p className="text-sm font-medium">{result.businessName}</p>
                  </CardContent>
                </Card>
              )}
              
              {result.businessCategory && (
                <Card className="bg-muted/40">
                  <CardContent className="p-3">
                    <p className="text-xs text-muted-foreground">Category</p>
                    <p className="text-sm font-medium">{result.businessCategory}</p>
                  </CardContent>
                </Card>
              )}
              
              {result.rating && (
                <Card className="bg-muted/40">
                  <CardContent className="p-3 flex items-center">
                    <Star className="h-4 w-4 mr-2 text-yellow-500" />
                    <div>
                      <p className="text-xs text-muted-foreground">Rating</p>
                      <p className="text-sm font-medium">{result.rating} ★</p>
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {result.phoneNumber && (
                <Card className="bg-muted/40">
                  <CardContent className="p-3 flex items-center">
                    <Phone className="h-4 w-4 mr-2 text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">Phone</p>
                      <p className="text-sm font-medium">{result.phoneNumber}</p>
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {result.website && (
                <Card className="bg-muted/40">
                  <CardContent className="p-3 flex items-center">
                    <Globe className="h-4 w-4 mr-2 text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">Website</p>
                      <p className="text-sm font-medium truncate">{result.website}</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <p>No business information available</p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="history" className="space-y-3">
          {result.historicalData ? (
            <div className="space-y-3">
              <Card className="bg-muted/40">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <History className="h-5 w-5 mt-0.5 text-primary" />
                    <div className="flex-1">
                      <p className="text-sm font-medium mb-2">Photo Age</p>
                      <p className="text-lg font-semibold">{result.historicalData.photoAge}</p>
                      {result.historicalData.photoTakenDate && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Taken: {new Date(result.historicalData.photoTakenDate).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {result.historicalData.historicalContext && (
                <Card className="bg-muted/40">
                  <CardContent className="p-4">
                    <p className="text-sm font-medium mb-2">Context</p>
                    <p className="text-sm text-muted-foreground">{result.historicalData.historicalContext}</p>
                  </CardContent>
                </Card>
              )}
              
              {result.historicalData.locationChanges && result.historicalData.locationChanges.length > 0 && (
                <Card className="bg-muted/40">
                  <CardContent className="p-4">
                    <p className="text-sm font-medium mb-2">Potential Changes</p>
                    <ul className="space-y-1">
                      {result.historicalData.locationChanges.map((change: string, index: number) => (
                        <li key={index} className="text-sm text-muted-foreground flex items-start">
                          <span className="mr-2">•</span>
                          <span>{change}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <p>No historical data available</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
      
      <div className="flex gap-2 pt-2">
        <Button className="flex-1" onClick={onOpenMap}>
          <Map className="h-4 w-4 mr-2" /> Open Map
        </Button>
        <Button variant="outline" className="flex-1" onClick={onShare}>
          <Share2 className="h-4 w-4 mr-2" /> Share
        </Button>
      </div>
    </div>
  );
}