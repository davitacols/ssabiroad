"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Navigation, ChevronRight } from "lucide-react";

interface Coordinates {
  lat: number;
  lng: number;
}

export default function MapsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <MapsContent />
    </Suspense>
  );
}

function MapsContent() {
  const searchParams = useSearchParams();
  const [fromCoords, setFromCoords] = useState<Coordinates | null>(null);
  const [toCoords, setToCoords] = useState<Coordinates | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");

  useEffect(() => {
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const query = searchParams.get("query");

    if (query) {
      setSearchQuery(decodeURIComponent(query));
    }

    if (from && to) {
      const [fromLat, fromLng] = from.split(",").map(Number);
      const [toLat, toLng] = to.split(",").map(Number);

      setFromCoords({ lat: fromLat, lng: fromLng });
      setToCoords({ lat: toLat, lng: toLng });
    }
  }, [searchParams]);

  const openInGoogleMaps = () => {
    if (searchQuery) {
      const encodedQuery = encodeURIComponent(searchQuery);
      window.open(`https://www.google.com/maps/search/?api=1&query=${encodedQuery}`, "_blank");
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-3xl">
      {searchQuery && (
        <div className="mb-4">
          <h1 className="text-2xl font-bold mb-2">Search Results for: {searchQuery}</h1>
          <Button onClick={openInGoogleMaps} className="mb-4">
            <Navigation className="w-4 h-4 mr-2" />
            Open in Google Maps
          </Button>
        </div>
      )}
      <Card className="bg-white">
        <div className="bg-gray-50 h-[300px] flex items-center justify-center text-gray-500">
          {searchQuery ? `Map showing results for: ${searchQuery}` : "Map visualization would appear here"}
        </div>

        <div className="p-6 space-y-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-bold mb-1">Distance: 0.8 mi</h2>
              <p className="text-gray-600">Estimated Time: 17 mins</p>
            </div>
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => alert("Starting navigation...")}
            >
              <Navigation className="w-4 h-4 mr-2" />
              Start Navigation
            </Button>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-4">Navigation Steps:</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <ChevronRight className="w-5 h-5 text-blue-600 mt-1" />
                <div>
                  <p className="font-medium">
                    Head south on <span className="text-blue-600">Broadway</span>
                  </p>
                  <p className="text-gray-600 text-sm">towards W 44th St</p>
                  <p className="text-gray-500 text-sm mt-1">0.6 mi</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <ChevronRight className="w-5 h-5 text-blue-600 mt-1" />
                <div>
                  <p className="font-medium">
                    Turn right onto{" "}
                    <span className="text-blue-600">6th Ave/Ave of the Americas</span>
                  </p>
                  <p className="text-gray-500 text-sm mt-1">26 ft</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <ChevronRight className="w-5 h-5 text-blue-600 mt-1" />
                <div>
                  <p className="font-medium">
                    Turn left onto <span className="text-blue-600">W 33rd St</span>
                  </p>
                  <p className="text-gray-600 text-sm">
                    Destination will be on the left
                  </p>
                  <p className="text-gray-500 text-sm mt-1">0.1 mi</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
