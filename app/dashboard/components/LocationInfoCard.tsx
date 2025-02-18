import { FC } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  Navigation,
  Star,
  Phone,
  Globe,
  Building,
  Info
} from "lucide-react";

interface LocationDetails {
  name: string;
  formattedAddress: string;
  location: {
    lat: number;
    lng: number;
  };
  placeId: string;
  types: string[];
  website?: string;
  phoneNumber?: string;
  rating?: number;
  userRatingsTotal?: number;
}

interface LocationInfoCardProps {
  locationDetails: LocationDetails;
}

const LocationInfoCard: FC<LocationInfoCardProps> = ({ locationDetails }) => {
  const handleNavigate = () => {
    if (locationDetails?.location) {
      const destination = encodeURIComponent(
        `${locationDetails.location.lat},${locationDetails.location.lng}`
      );
      const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${destination}`;
      window.open(mapsUrl, "_blank");
    }
  };

  // Early return if locationDetails is not provided
  if (!locationDetails) {
    return (
      <Card className="w-full shadow-lg bg-card">
        <CardHeader className="bg-gradient-to-r from-background to-muted px-4 sm:px-6">
          <CardTitle className="text-xl sm:text-2xl font-bold text-foreground">
            No Location Data Available
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="w-full shadow-lg bg-card">
      <CardHeader className="bg-gradient-to-r from-background to-muted px-4 sm:px-6">
        <div className="flex items-center gap-2">
          <Building className="w-5 h-5 sm:w-6 sm:h-6 text-foreground" />
          <CardTitle className="text-xl sm:text-2xl font-bold text-foreground truncate">
            {locationDetails.name || "Location Details"}
          </CardTitle>
        </div>
      </CardHeader>

      <CardContent className="p-3 sm:p-6">
        <Tabs defaultValue="details" className="w-full">
          <TabsList className="w-full justify-start mb-4 sm:mb-6 bg-muted p-1 rounded-lg overflow-x-auto flex-nowrap">
            <TabsTrigger value="details" className="flex-shrink-0">
              Details
            </TabsTrigger>
            <TabsTrigger value="contact" className="flex-shrink-0">
              Contact
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  {locationDetails.types?.map((type, index) => (
                    <Badge key={index} variant="secondary" className="text-xs sm:text-sm">
                      {type.replace(/_/g, ' ').toLowerCase()}
                    </Badge>
                  ))}
                </div>

                {locationDetails.location && (
                  <div className="flex flex-col gap-2">
                    <span className="font-semibold flex items-center gap-2 text-foreground">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      Location
                    </span>
                    <div className="pl-4 sm:pl-6 space-y-2">
                      <div className="text-xs sm:text-sm text-muted-foreground break-words">
                        Coordinates: {locationDetails.location.lat.toFixed(6)},{" "}
                        {locationDetails.location.lng.toFixed(6)}
                      </div>
                      <div className="text-xs sm:text-sm text-foreground break-words">
                        {locationDetails.formattedAddress}
                      </div>
                    </div>
                  </div>
                )}

                <Button 
                  onClick={handleNavigate} 
                  className="w-full mt-4 sm:mt-6" 
                  size="sm"
                  disabled={!locationDetails.location}
                >
                  <Navigation className="w-4 h-4 mr-2" />
                  Open in Maps
                </Button>
              </div>

              {locationDetails.rating && (
                <div className="space-y-4">
                  <div className="flex flex-col gap-2">
                    <span className="font-semibold flex items-center gap-2 text-foreground">
                      <Star className="w-4 h-4 text-muted-foreground" />
                      Ratings
                    </span>
                    <div className="pl-4 sm:pl-6">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center">
                          <Star className="w-4 h-4 text-yellow-400" />
                          <span className="text-sm ml-1">{locationDetails.rating.toFixed(1)}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          ({locationDetails.userRatingsTotal} reviews)
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="contact" className="space-y-4 sm:space-y-6">
            <div className="space-y-4">
              {(locationDetails.phoneNumber || locationDetails.website) && (
                <div className="flex flex-col gap-2">
                  <span className="font-semibold flex items-center gap-2 text-foreground">
                    <Info className="w-4 h-4 text-muted-foreground" />
                    Contact Information
                  </span>
                  <div className="pl-4 sm:pl-6 space-y-2">
                    {locationDetails.phoneNumber && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {locationDetails.phoneNumber}
                        </span>
                      </div>
                    )}
                    {locationDetails.website && (
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-muted-foreground" />
                        <a
                          href={locationDetails.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-500 hover:underline"
                        >
                          {locationDetails.website}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default LocationInfoCard;