"use client"

import { useState, useEffect } from "react"
import { getGeocode, getLatLng } from "use-places-autocomplete"
import { Search, MapPin, Loader2, X } from 'lucide-react'
import { motion, AnimatePresence } from "framer-motion"

interface LocationSearchProps {
  onSelectLocation: (location: { lat: number; lng: number; accuracy: number }) => void
}

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "AIzaSyC56tMVTlDcInBCHog0YqkuQ2cgH9JJuhU"

export default function LocationSearch({ onSelectLocation }: LocationSearchProps) {
  const [search, setSearch] = useState("")
  const [activeSuggestion, setActiveSuggestion] = useState<number | null>(null)
  const [suggestions, setSuggestions] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [isApiLoaded, setIsApiLoaded] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640)
    }

    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  useEffect(() => {
    let timeoutId: NodeJS.Timeout

    if (search.trim() === "") {
      setSuggestions([])
      return
    }

    setIsLoading(true);
    timeoutId = setTimeout(async () => {
      try {
        const response = await fetch(`/api/location-search?query=${encodeURIComponent(search)}`);
        if (!response.ok) {
          throw new Error('Failed to fetch suggestions');
        }
        const data = await response.json();
        setSuggestions(data);
      } catch (error) {
        console.error('Error fetching suggestions:', error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId)
  }, [search])

  const processLocation = async (location: { lat: number; lng: number; accuracy: number }) => {
    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append('lat', location.lat.toString());
      formData.append('lng', location.lng.toString());

      const response = await fetch('/api/location-search', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to process location');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error processing location:', error);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSelect = async (address: string) => {
    setSearch(address)
    setSuggestions([])
    setIsLoading(true)

    try {
      const results = await getGeocode({ address })
      const { lat, lng } = await getLatLng(results[0])
      const location = { lat, lng, accuracy: 20 }

      onSelectLocation(location)

      await processLocation(location)
    } catch (error) {
      console.error("Error handling location:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (search.trim() !== "") {
      handleSelect(search)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!suggestions.length) return

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault()
        setActiveSuggestion((prev) => (prev === null ? 0 : Math.min(prev + 1, suggestions.length - 1)))
        break
      case "ArrowUp":
        e.preventDefault()
        setActiveSuggestion((prev) => (prev === null ? suggestions.length - 1 : Math.max(prev - 1, 0)))
        break
      case "Enter":
        if (activeSuggestion !== null) {
          e.preventDefault()
          handleSelect(suggestions[activeSuggestion].description)
        }
        break
      case "Escape":
        setSuggestions([])
        setActiveSuggestion(null)
        break
    }
  }

  useEffect(() => {
    const loadScript = async () => {
      try {
        await new Promise((resolve, reject) => {
          const script = document.createElement("script")
          script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`
          script.async = true
          script.onload = resolve
          script.onerror = reject
          document.head.appendChild(script)
        })
        setIsApiLoaded(true)
      } catch (error) {
        console.error("Error loading Google Maps API:", error)
      }
    }

    if (!window.google) {
      loadScript()
    } else {
      setIsApiLoaded(true)
    }
  }, [])

  return (
    <motion.div
      className="relative w-full max-w-2xl mx-auto px-4 sm:px-0"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <form onSubmit={handleSubmit} className="relative flex items-center">
        <div className="absolute left-3 sm:left-4 text-gray-400">
          {isLoading || isProcessing ? (
            <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
          ) : (
            <Search className="w-4 h-4 sm:w-5 sm:h-5" />
          )}
        </div>

        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search location..."
          className="w-full pl-9 sm:pl-12 pr-16 sm:pr-24 py-2 sm:py-3 rounded-lg 
            bg-white dark:bg-gray-800 
            border-2 border-gray-200 dark:border-gray-700
            focus:border-blue-500 dark:focus:border-blue-400
            shadow-sm focus:ring-2 focus:ring-blue-500/20 
            outline-none transition-all
            text-gray-900 dark:text-gray-100
            placeholder-gray-500 dark:placeholder-gray-400
            text-sm sm:text-base"
        />

        {search && (
          <button
            type="button"
            onClick={() => setSearch("")}
            className="absolute right-20 sm:right-24 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        <button
          type="submit"
          disabled={!search.trim() || isLoading || isProcessing}
          className="absolute right-2 px-3 sm:px-4 py-1 sm:py-1.5 rounded-md
            bg-gradient-to-r from-blue-500 to-blue-600
            hover:from-blue-600 hover:to-blue-700
            text-white text-xs sm:text-sm font-medium
            transition-all duration-200
            disabled:opacity-50 disabled:cursor-not-allowed
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
            dark:focus:ring-offset-gray-800"
        >
          Search
        </button>
      </form>

      <AnimatePresence>
        {suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="fixed sm:absolute inset-x-0 sm:left-0 sm:right-0 top-16 sm:top-auto mt-0 sm:mt-2 
              bg-white dark:bg-gray-800 
              border-t sm:border border-gray-200 dark:border-gray-700 
              sm:rounded-lg shadow-lg 
              max-h-[60vh] sm:max-h-64 
              overflow-auto z-50
              mx-0 sm:mx-4"
          >
            <ul>
              {suggestions.map((suggestion, index) => (
                <motion.li
                  key={suggestion.place_id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                  onClick={() => handleSelect(suggestion.description)}
                  className={`p-3 sm:p-4 flex items-start gap-3 cursor-pointer
                    ${
                      activeSuggestion === index
                        ? "bg-blue-50 dark:bg-blue-900/30"
                        : "hover:bg-gray-50 dark:hover:bg-gray-700/50"
                    }
                    transition-colors duration-150
                    border-b border-gray-100 dark:border-gray-700 last:border-0`}
                >
                  <MapPin className="text-blue-500 w-4 h-4 sm:w-5 sm:h-5 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-gray-100 truncate text-sm sm:text-base">
                      {suggestion.structured_formatting.main_text}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">
                      {suggestion.structured_formatting.secondary_text}
                    </p>
                  </div>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
