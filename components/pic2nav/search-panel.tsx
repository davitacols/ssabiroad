"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LocationCard } from "./location-card";
import { PlacesAutocomplete } from "@/components/places-autocomplete";
import { Search, MapPin, History, Navigation } from "lucide-react";
import { useRouter } from "next/navigation";

interface SearchPanelProps {
  onLocationSelect?: (location: any) => void;
}

export function SearchPanel({ onLocationSelect }: SearchPanelProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const router = useRouter();
  
  // Mock search history
  const searchHistory = [
    "Empire State Building",
    "Central Park",
    "Times Square",
    "Brooklyn Bridge"
  ];
  
  const handleSearch = async (query: string) => {
    if (!query.trim()) return;
    
    setIsSearching(true);
    
    try {
      const response = await fetch(`/api/location-search?q=${encodeURIComponent(query)}`);
      if (response.ok) {
        const results = await response.json();
        setSearchResults(results.slice(0, 5));
      } else {
        // Fallback to mock results
        const mockResults = [
          {
            id: "search1",
            name: `${query}`,
            address: "Search result location",
            category: "Place",
            createdAt: new Date().toISOString(),
            mapUrl: `https://maps.google.com/?q=${query}`
          }
        ];
        setSearchResults(mockResults);
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
  
  const handlePlaceSelect = (place: any) => {
    const searchTerm = typeof place === 'string' ? place : (place?.formatted_address || place?.name || '');
    if (searchTerm) {
      setSearchQuery(searchTerm);
      handleSearch(searchTerm);
    }
  };
  
  const navigateToMaps = (location: any) => {
    const query = location.name || location.address || searchQuery;
    router.push(`/map?query=${encodeURIComponent(query)}`);
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
            <PlacesAutocomplete
              placeholder="Search for places, addresses, landmarks..."
              className="pl-8"
              onPlaceSelect={handlePlaceSelect}
              onValueChange={setSearchQuery}
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
          <h3 className="text-sm font-medium">Search Results</h3>
          <div className="space-y-3">
            {searchResults.map(location => (
              <div key={location.id} className="group">
                <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer" onClick={() => handleLocationClick(location)}>
                  <div className="flex-1">
                    <h4 className="font-medium">{location.name}</h4>
                    <p className="text-sm text-muted-foreground">{location.address}</p>
                    {location.category && (
                      <span className="inline-block px-2 py-1 text-xs bg-primary/10 text-primary rounded-full mt-1">
                        {location.category}
                      </span>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigateToMaps(location);
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
      ) : (
        <div className="space-y-4">
          <h3 className="text-sm font-medium flex items-center">
            <History className="h-4 w-4 mr-2 text-muted-foreground" />
            Recent Searches
          </h3>
          <div className="flex flex-wrap gap-2">
            {searchHistory.map((term, index) => (
              <Button 
                key={index} 
                variant="outline" 
                size="sm" 
                className="flex items-center"
                onClick={() => {
                  setSearchQuery(term);
                  handleSearch(term);
                }}
              >
                <MapPin className="h-3 w-3 mr-1" />
                {term}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}