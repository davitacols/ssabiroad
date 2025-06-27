import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Navigation, Compass, ZoomIn, ZoomOut } from "lucide-react";

interface MapViewProps {
  location: {
    latitude: number;
    longitude: number;
  };
  name: string;
  address?: string;
}

export function MapView({ location, name, address }: MapViewProps) {
  const [mapUrl, setMapUrl] = useState<string>("");
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (!location || !location.latitude || !location.longitude) {
      setLoading(false);
      return;
    }
    
    // Create a Google Maps embed URL
    const url = `https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&q=${location.latitude},${location.longitude}&zoom=17`;
    setMapUrl(url);
    setLoading(false);
  }, [location]);
  
  const handleOpenDirections = () => {
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${location.latitude},${location.longitude}`,
      "_blank"
    );
  };
  
  const handleOpenFullMap = () => {
    window.open(
      `https://www.google.com/maps?q=${location.latitude},${location.longitude}`,
      "_blank"
    );
  };
  
  return (
    <Card className="overflow-hidden">
      <div className="relative w-full h-[300px]">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-muted">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : !mapUrl ? (
          <div className="absolute inset-0 flex items-center justify-center bg-muted">
            <p className="text-muted-foreground">Map not available</p>
          </div>
        ) : (
          <>
            <iframe
              src={mapUrl}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="absolute inset-0"
            />
            
            <div className="absolute top-2 right-2 flex flex-col gap-1">
              <Button size="icon" variant="secondary" className="h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm">
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="secondary" className="h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm">
                <ZoomOut className="h-4 w-4" />
              </Button>
            </div>
          </>
        )}
      </div>
      
      <CardContent className="p-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-medium">{name}</h3>
            {address && <p className="text-xs text-muted-foreground">{address}</p>}
          </div>
          
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={handleOpenDirections}>
              <Navigation className="h-4 w-4 mr-1" /> Directions
            </Button>
            <Button size="sm" onClick={handleOpenFullMap}>
              <Compass className="h-4 w-4 mr-1" /> Full Map
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}