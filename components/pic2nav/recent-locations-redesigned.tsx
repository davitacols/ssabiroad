"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ShareButton } from "@/components/ui/share-button";
import { Search, MapPin, Calendar, Star, Navigation } from "lucide-react";

interface RecentLocationsPanelProps {
  onLocationSelect?: (location: any) => void;
  expanded?: boolean;
}

export function RecentLocationsPanel({ onLocationSelect, expanded = false }: RecentLocationsPanelProps) {
  const [filter, setFilter] = useState("");
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const response = await fetch('/api/recent-locations?limit=20');
        if (response.ok) {
          const data = await response.json();
          setLocations(data.locations);
        }
      } catch (error) {
        console.error('Failed to fetch recent locations:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLocations();
  }, []);
  
  const filteredLocations = locations.filter(location => 
    location.name.toLowerCase().includes(filter.toLowerCase()) || 
    location.address.toLowerCase().includes(filter.toLowerCase())
  );
  
  const handleLocationClick = (location: any) => {
    if (onLocationSelect) {
      onLocationSelect(location);
    }
  };
  
  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-20 bg-slate-200 rounded-lg"></div>
          </div>
        ))}
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {expanded && (
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search locations..."
            className="pl-8"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
      )}
      
      <div className="space-y-3">
        {filteredLocations.length > 0 ? (
          filteredLocations.map(location => (
            <div key={location.id} className="group border rounded-lg p-4 hover:bg-muted/50 transition-colors">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 cursor-pointer" onClick={() => handleLocationClick(location)}>
                  <h4 className="font-semibold text-sm">{location.name}</h4>
                  <p className="text-xs text-muted-foreground mt-1">{location.address}</p>
                  
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(location.createdAt).toLocaleDateString()}
                    </div>
                    {location.confidence && (
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full">
                        {Math.round(location.confidence * 100)}% confident
                      </span>
                    )}
                    {location.rating && (
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 text-amber-500" />
                        {location.rating}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <ShareButton
                    title={location.name}
                    text={`Check out ${location.name} at ${location.address}`}
                    url={`${window.location.origin}/locations/${location.id}`}
                    variant="ghost"
                    size="sm"
                  />
                  {location.location && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(`https://www.google.com/maps/dir/?api=1&destination=${location.location.latitude},${location.location.longitude}`, '_blank');
                      }}
                    >
                      <Navigation className="h-3 w-3 mr-1" />
                      Navigate
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-6 text-muted-foreground">
            <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No locations found</p>
          </div>
        )}
      </div>
    </div>
  );
}