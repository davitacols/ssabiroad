import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Clock, Building, Map, Share2, Info } from "lucide-react";
import Link from "next/link";

interface LocationCardProps {
  location: {
    id: string;
    name: string;
    address: string;
    category?: string;
    buildingType?: string;
    createdAt: string;
    mapUrl?: string;
    confidence?: number;
  };
  compact?: boolean;
}

export function LocationCard({ location, compact = false }: LocationCardProps) {
  const formattedDate = new Date(location.createdAt).toLocaleDateString();
  
  return (
    <Card className={`overflow-hidden ${compact ? 'h-full' : ''}`}>
      <CardContent className={`${compact ? 'p-3' : 'p-4'}`}>
        <div className="space-y-2">
          <div className="flex justify-between items-start">
            <h3 className={`font-medium ${compact ? 'text-sm' : 'text-base'} line-clamp-1`}>
              {location.name}
            </h3>
            {location.category && (
              <Badge variant="outline" className="text-xs">
                {location.category}
              </Badge>
            )}
          </div>
          
          <div className="flex items-start">
            <MapPin className={`${compact ? 'h-3 w-3 mt-0.5' : 'h-4 w-4 mt-0.5'} mr-1 flex-shrink-0 text-muted-foreground`} />
            <span className={`${compact ? 'text-xs' : 'text-sm'} text-muted-foreground line-clamp-2`}>
              {location.address}
            </span>
          </div>
          
          {!compact && (
            <>
              {location.buildingType && (
                <div className="flex items-center">
                  <Building className="h-4 w-4 mr-1 text-muted-foreground" />
                  <span className="text-sm">{location.buildingType}</span>
                </div>
              )}
              
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-1 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{formattedDate}</span>
              </div>
            </>
          )}
        </div>
      </CardContent>
      
      {!compact && (
        <CardFooter className="px-4 py-3 bg-muted/20 flex justify-between">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/locations/${location.id}`}>
              <Info className="h-4 w-4 mr-1" /> Details
            </Link>
          </Button>
          
          <div className="flex gap-1">
            {location.mapUrl && (
              <Button variant="ghost" size="sm" asChild>
                <a href={location.mapUrl} target="_blank" rel="noopener noreferrer">
                  <Map className="h-4 w-4 mr-1" /> Map
                </a>
              </Button>
            )}
            
            <Button variant="ghost" size="sm">
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        </CardFooter>
      )}
    </Card>
  );
}