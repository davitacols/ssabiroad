"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LocationCard } from "./location-card";
import { Search, MapPin, History, Navigation } from "lucide-react";

interface SearchPanelProps {
  onLocationSelect?: (location: any) => void;
}

export function SearchPanel({ onLocationSelect }: SearchPanelProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  const handleSearch = async (query: string) => {
    if (!query.trim()) return;
    
    setIsSearching(true);
    
    try {
      const response = await fetch(`/api/saved-locations?limit=50`);
      if (response.ok) {
        const data = await response.json();
        const filtered = data.locations.filter(location => 
          location.name.toLowerCase().includes(query.toLowerCase()) ||
          location.address.toLowerCase().includes(query.toLowerCase()) ||
          location.category?.toLowerCase().includes(query.toLowerCase())
        );
        setSearchResults(filtered.slice(0, 10));
      }
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };
  
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(searchQuery);
  };
  
  const handleLocationClick = (location: any) => {
    if (onLocationSelect) {
      onLocationSelect(location);
    }
  };
  
  return (
    <div className="space-y-6">
      <form onSubmit={handleFormSubmit} className="space-y-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              placeholder="Search saved locations..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
          </div>
          <Button type="submit" disabled={isSearching}>
            {isSearching ? "Searching..." : "Search"}
          </Button>
        </div>
      </form>
      
      {searchResults.length > 0 ? (
        <div className="space-y-4">
          <h3 className="text-sm font-medium">Search Results ({searchResults.length})</h3>
          <div className="space-y-3">
            {searchResults.map(location => (
              <div key={location.id} className="group">
                <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer" onClick={() => handleLocationClick(location)}>
                  <div className="flex-1">
                    <h4 className="font-medium">{location.name}</h4>
                    <p className="text-sm text-muted-foreground">{location.address}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {location.category && (
                        <span className="inline-block px-2 py-1 text-xs bg-primary/10 text-primary rounded-full">
                          {location.category}
                        </span>
                      )}
                      {location.apiVersion && (
                        <span className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">
                          {location.apiVersion.toUpperCase()}
                        </span>
                      )}
                      {location.confidence && (
                        <span className="text-xs text-green-600">
                          {Math.round(location.confidence * 100)}% confident
                        </span>
                      )}
                    </div>
                  </div>
                  {location.location && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(`https://www.google.com/maps/dir/?api=1&destination=${location.location.latitude},${location.location.longitude}`, '_blank');
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Navigation className="h-4 w-4 mr-1" />
                      Navigate
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : searchQuery ? (
        <div className="text-center py-6 text-muted-foreground">
          <p>No locations found for "{searchQuery}"</p>
        </div>
      ) : (
        <div className="text-center py-6 text-muted-foreground">
          <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>Search through your saved locations</p>
        </div>
      )}
    </div>
  );
}