"use client";

import { useState, useEffect } from "react";
import usePlacesAutocomplete, { getGeocode, getLatLng } from "use-places-autocomplete";
import { Search, MapPin } from "lucide-react";
import { motion } from "framer-motion";
import { keyframes } from "@emotion/react";
import { LoadScript } from "@react-google-maps/api";

interface LocationSearchProps {
  onSelectLocation: (location: { lat: number; lng: number; accuracy: number }) => void;
}

const gradientAnimation = keyframes`
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
`;

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "your_api_key_here";
const libraries = ["places"];

export default function LocationSearch({ onSelectLocation }: LocationSearchProps) {
  const [search, setSearch] = useState("");
  const [activeSuggestion, setActiveSuggestion] = useState<number | null>(null);
  const { suggestions, setValue, clearSuggestions, ready, init } = usePlacesAutocomplete({
    requestOptions: { /* Define search scope here if needed */ },
  });

  useEffect(() => {
    setActiveSuggestion(null);
  }, [search]);

  const handleSelect = async (address: string) => {
    setSearch(address);
    setValue(address, false);
    clearSuggestions();

    try {
      const results = await getGeocode({ address });
      const { lat, lng } = await getLatLng(results[0]);
      onSelectLocation({ lat, lng, accuracy: 20 }); // Approximate accuracy
    } catch (error) {
      console.error("Error fetching location:", error);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim() !== "") {
      const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(search)}`;
      window.open(mapsUrl, "_blank");
      handleSelect(search);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!suggestions.data.length) return;

    if (e.key === "ArrowDown") {
      setActiveSuggestion((prev) => (prev === null ? 0 : Math.min(prev + 1, suggestions.data.length - 1)));
    } else if (e.key === "ArrowUp") {
      setActiveSuggestion((prev) => (prev === null ? 0 : Math.max(prev - 1, 0)));
    } else if (e.key === "Enter" && activeSuggestion !== null) {
      e.preventDefault();
      handleSelect(suggestions.data[activeSuggestion].description);
    }
  };

  useEffect(() => {
    if (!ready) {
      init();
    }
  }, [ready, init]);

  return (
    <LoadScript googleMapsApiKey={GOOGLE_MAPS_API_KEY} libraries={libraries}>
      <motion.div
        className="relative w-full"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <form onSubmit={handleSubmit} className="relative flex items-center">
          <Search className="absolute left-4 text-gray-400 w-5 h-5" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setValue(e.target.value);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Enter address, zip code, or postcode"
            className="w-full pl-12 pr-14 py-3 border rounded-lg bg-gray-100 focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:bg-gray-800 dark:border-gray-700 dark:text-white"
            style={{
              borderImageSource: "linear-gradient(to right, #3498db, #8e44ad, #e84393)",
              borderImageSlice: 1,
              animation: `${gradientAnimation} 3s infinite`,
            }}
          />
          <button
            type="submit"
            className="absolute right-1 top-1/2 transform -translate-y-1/2 px-4 py-2 rounded-lg text-white transition duration-300 shadow-md"
            style={{
              backgroundImage: "linear-gradient(to right, #3498db, #8e44ad, #e84393)",
            }}
          >
            Search
          </button>
        </form>

        {suggestions.status === "OK" && (
          <ul className="absolute left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-auto z-10">
            {suggestions.data.map((suggestion, index) => (
              <li
                key={suggestion.place_id}
                onClick={() => handleSelect(suggestion.description)}
                className={`p-3 flex items-center gap-3 cursor-pointer ${
                  activeSuggestion === index ? "bg-gray-100 dark:bg-gray-700" : "hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                <MapPin className="text-blue-500 w-5 h-5" />
                <div>
                  <p className="font-medium">{suggestion.structured_formatting.main_text}</p>
                  <p className="text-xs text-gray-500">{suggestion.structured_formatting.secondary_text}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </motion.div>
    </LoadScript>
  );
}
