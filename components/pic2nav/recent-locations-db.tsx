"use client";

import { useState, useEffect } from "react";
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
    </div>
  );
}