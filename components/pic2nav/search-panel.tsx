"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LocationCard } from "./location-card";
import { Search, MapPin, History } from "lucide-react";

interface SearchPanelProps {
  onLocationSelect?: (location: any) => void;
}

export function SearchPanel({ onLocationSelect }: SearchPanelProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  // Mock search history
  const searchHistory = [
    "Empire State Building",
    "Central Park",
    "Times Square",
    "Brooklyn Bridge"
  ];
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    
    // Mock search results - in a real app, this would be an API call
    setTimeout(() => {
      const mockResults = [
        {
          id: "search1",
          name: `${searchQuery} Building`,
          address: "123 Main St, New York, NY",
          category: "Building",
          createdAt: new Date().toISOString(),
          mapUrl: `https://maps.google.com/?q=${searchQuery}`
        },
        {
          id: "search2",
          name: `${searchQuery} Park`,
          address: "456 Park Ave, New York, NY",
          category: "Park",
          createdAt: new Date().toISOString(),
          mapUrl: `https://maps.google.com/?q=${searchQuery}+Park`
        }
      ];
      
      setSearchResults(mockResults);
      setIsSearching(false);
    }, 1000);
  };
  
  const handleLocationClick = (location: any) => {
    if (onLocationSelect) {
      onLocationSelect(location);
    }
  };
  
  return (
    <div className="space-y-6">
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search locations..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button type="submit" disabled={isSearching}>
          {isSearching ? "Searching..." : "Search"}
        </Button>
      </form>
      
      {searchResults.length > 0 ? (
        <div className="space-y-4">
          <h3 className="text-sm font-medium">Search Results</h3>
          <div className="space-y-3">
            {searchResults.map(location => (
              <div key={location.id} onClick={() => handleLocationClick(location)}>
                <LocationCard location={location} />
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
                onClick={() => setSearchQuery(term)}
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