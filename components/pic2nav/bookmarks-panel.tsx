"use client";

import { LocationCard } from "./location-card";
import { Button } from "@/components/ui/button";
import { Bookmark } from "lucide-react";

interface BookmarksPanelProps {
  onLocationSelect?: (location: any) => void;
}

export function BookmarksPanel({ onLocationSelect }: BookmarksPanelProps) {
  // Mock data for bookmarked locations
  const mockBookmarks = [
    {
      id: "4",
      name: "Statue of Liberty",
      address: "New York, NY 10004",
      category: "Monument",
      createdAt: "2023-05-20T10:15:00Z",
      mapUrl: "https://maps.google.com/?q=Statue+of+Liberty"
    },
    {
      id: "5",
      name: "Brooklyn Bridge",
      address: "Brooklyn Bridge, New York, NY 10038",
      category: "Bridge",
      createdAt: "2023-05-18T14:20:00Z",
      mapUrl: "https://maps.google.com/?q=Brooklyn+Bridge"
    }
  ];
  
  const handleLocationClick = (location: any) => {
    if (onLocationSelect) {
      onLocationSelect(location);
    }
  };
  
  return (
    <div className="space-y-3">
      {mockBookmarks.length > 0 ? (
        mockBookmarks.map(location => (
          <div key={location.id} onClick={() => handleLocationClick(location)}>
            <LocationCard location={location} compact={true} />
          </div>
        ))
      ) : (
        <div className="text-center py-6 text-muted-foreground">
          <p>No bookmarks yet</p>
          <Button variant="outline" size="sm" className="mt-2">
            <Bookmark className="h-4 w-4 mr-2" /> Add Bookmarks
          </Button>
        </div>
      )}
    </div>
  );
}