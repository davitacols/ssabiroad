"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, MapPin, Navigation } from "lucide-react";

interface SearchPanelProps {
  onLocationSelect?: (location: any) => void;
}

export function SearchPanel({ onLocationSelect }: SearchPanelProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  useEffect(() => {
    const searchPlaces = async () => {
      if (!searchQuery.trim() || searchQuery.length < 3) {
        setSearchResults([]);
        return;
      }
      
      setIsSearching(true);
      
      try {
        const response = await fetch(`/api/places-search?q=${encodeURIComponent(searchQuery)}`);
        if (response.ok) {
          const data = await response.json();
          setSearchResults(data.results || []);
        }
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    const debounceTimer = setTimeout(searchPlaces, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);
  
  const handleLocationClick = (location: any) => {
    if (onLocationSelect) {
      onLocationSelect({
        ...location,
        location: null, // Will be filled by place details API if needed
        success: true
      });
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="relative">
          <Input
            placeholder="Search addresses, zip codes, places..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
        </div>
      </div>
      
      {isSearching && (
        <div className="text-center py-4 text-muted-foreground">
          <p>Searching...</p>
        </div>
      )}
      
      {searchResults.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-medium">Places ({searchResults.length})</h3>
          <div className="space-y-3">
            {searchResults.map(location => (
              <div key={location.id} className="group">
                <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer" onClick={() => handleLocationClick(location)}>
                  <div className="flex-1">
                    <h4 className="font-medium">{location.name}</h4>
                    <p className="text-sm text-muted-foreground">{location.address}</p>
                    {location.category && (
                      <span className="inline-block px-2 py-1 text-xs bg-primary/10 text-primary rounded-full mt-1">
                        {location.category.replace(/_/g, ' ')}
                      </span>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location.address)}`, '_blank');
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Navigation className="h-4 w-4 mr-1" />
                    Navigate
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {!isSearching && searchQuery.length >= 3 && searchResults.length === 0 && (
        <div className="text-center py-6 text-muted-foreground">
          <p>No places found for "{searchQuery}"</p>
        </div>
      )}
      
      {searchQuery.length === 0 && (
        <div className="text-center py-6 text-muted-foreground">
          <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>Search for addresses, zip codes, or places</p>
          <p className="text-xs mt-1">Start typing to see suggestions</p>
        </div>
      )}
    </div>
  );
}