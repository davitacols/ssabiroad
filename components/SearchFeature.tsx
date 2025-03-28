import React, { useState, useEffect } from "react";
import { GoogleMap, useJsApiLoader, Autocomplete } from "@react-google-maps/api";
import { Input, Button } from "@/components/ui/input";
import { Loader2, Search } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

const libraries = ["places"];

const SearchFeature = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries,
  });

  const onLoad = (autocompleteInstance: google.maps.places.Autocomplete) => {
    setAutocomplete(autocompleteInstance);
  };

  const onPlaceChanged = () => {
    if (autocomplete) {
      const place = autocomplete.getPlace();
      if (place.geometry) {
        const location = {
          latitude: place.geometry.location.lat(),
          longitude: place.geometry.location.lng(),
        };
        toast({
          title: "Place Selected",
          description: `You selected ${place.name}`,
        });
        // Handle the selected place details here
      } else {
        toast({
          title: "No Details Available",
          description: "Please select a valid place from the suggestions.",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div className="relative">
          {isLoaded && (
            <Autocomplete onLoad={onLoad} onPlaceChanged={onPlaceChanged}>
              <Input
                placeholder="Search for locations, landmarks, businesses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-20"
              />
            </Autocomplete>
          )}
          <Button
            className="absolute right-0 top-0 h-full rounded-l-none bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600"
            onClick={onPlaceChanged}
            disabled={isLoading}
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive p-3 rounded-md">
          <div className="flex items-start">
            <Search className="h-5 w-5 mr-2 mt-0.5" />
            <div>
              <p className="font-medium">Search Error</p>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchFeature;