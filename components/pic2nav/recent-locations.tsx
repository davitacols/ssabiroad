"use client";

import { useState } from "react";
import { LocationCard } from "./location-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface RecentLocationsPanelProps {
  onLocationSelect?: (location: any) => void;
  expanded?: boolean;
}

export function RecentLocationsPanel({ onLocationSelect, expanded = false }: RecentLocationsPanelProps) {
  const [filter, setFilter] = useState("");
  
  // Mock data for recent locations
  const mockLocations = [
    {
      id: "1",
      name: "Empire State Building",
      address: "350 5th Ave, New York, NY 10118",
      category: "Landmark",
      buildingType: "Skyscraper",
      createdAt: "2023-06-01T12:00:00Z",
      mapUrl: "https://maps.google.com/?q=Empire+State+Building"
    },
    {
      id: "2",
      name: "Central Park",
      address: "New York, NY",
      category: "Park",
      createdAt: "2023-05-28T15:30:00Z",
      mapUrl: "https://maps.google.com/?q=Central+Park+NY"
    },
    {
      id: "3",
      name: "Times Square",
      address: "Manhattan, NY 10036",
      category: "Tourist Attraction",
      buildingType: "Plaza",
      createdAt: "2023-05-25T18:45:00Z",
      mapUrl: "https://maps.google.com/?q=Times+Square+NY"
    }
  ];
  
  const filteredLocations = mockLocations.filter(location => 
    location.name.toLowerCase().includes(filter.toLowerCase()) || 
    location.address.toLowerCase().includes(filter.toLowerCase())
  );
  
  const handleLocationClick = (location: any) => {
    if (onLocationSelect) {
      onLocationSelect(location);
    }
  };
  
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
            <div key={location.id} onClick={() => handleLocationClick(location)}>
              <LocationCard location={location} compact={!expanded} />
            </div>
          ))
        ) : (
          <div className="text-center py-6 text-muted-foreground">
            <p>No locations found</p>
          </div>
        )}
      </div>
      
      {expanded && filteredLocations.length > 0 && (
        <Button variant="outline" className="w-full">
          Load More
        </Button>
      )}
    </div>
  );
}