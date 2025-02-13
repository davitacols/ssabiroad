"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { loadGoogleMapsScript } from "../utils/googleMaps";
import { Search, Settings, LogOut, Menu, X, Home, Clock, BookmarkPlus, Loader2, Navigation } from "lucide-react";

interface Location {
  lat: number;
  lng: number;
  accuracy: number;
  timestamp: number;
}

interface DashboardHeaderProps {
  onLogout: () => void;
  onNavigate: (path: string) => void;
  currentLocation: Location | null;
  onLocationUpdate: (location: Location) => void;
}

export default function DashboardHeader({ 
  onLogout, 
  onNavigate, 
  currentLocation, 
  onLocationUpdate 
}: DashboardHeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [predictions, setPredictions] = useState([]);
  const [autocompleteService, setAutocompleteService] = useState(null);
  const [placesService, setPlacesService] = useState(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [watchId, setWatchId] = useState<number | null>(null);

  useEffect(() => {
    startLocationTracking();
    loadGoogleMapsScript().then(() => {
      if (window.google) {
        setAutocompleteService(new window.google.maps.places.AutocompleteService());
        const mapDiv = document.createElement("div");
        const map = new window.google.maps.Map(mapDiv);
        setPlacesService(new window.google.maps.places.PlacesService(map));
      }
    });

    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, []);

  const startLocationTracking = () => {
    setIsLoadingLocation(true);

    if (navigator.geolocation) {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }

      const id = navigator.geolocation.watchPosition(
        (position) => {
          const newLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp
          };
          onLocationUpdate(newLocation);
          setIsLoadingLocation(false);
        },
        (error) => {
          setIsLoadingLocation(false);
          toast({
            title: "Location Error",
            description: "Unable to track your location. Please enable GPS.",
            variant: "destructive"
          });
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
      setWatchId(id);
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/60 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-800 shadow-md transition-all">
      <nav className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 flex justify-between items-center h-16">
        
        {/* Logo */}
        <div className="flex items-center gap-6">
          <span 
            className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent cursor-pointer"
            onClick={() => onNavigate("/dashboard")}
          >
            SabiRoad
          </span>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            {[
              { name: "Dashboard", path: "/dashboard", icon: Home },
              { name: "History", path: "/history", icon: Clock },
              { name: "Saved", path: "/saved", icon: BookmarkPlus }
            ].map((item) => (
              <Button
                key={item.name}
                variant="ghost"
                onClick={() => onNavigate(item.path)}
                className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition"
              >
                <item.icon className="w-5 h-5 mr-2" />
                {item.name}
              </Button>
            ))}
          </div>
        </div>

        {/* Search Bar */}
        <form 
          className="relative hidden md:flex items-center w-80 bg-gray-100 dark:bg-gray-800 rounded-full px-4 py-2 shadow-inner transition"
        >
          <Search className="text-gray-500 w-5 h-5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by address or zip code..."
            className="w-full bg-transparent outline-none px-2 text-gray-800 dark:text-gray-200"
          />
        </form>

        {/* Right Controls */}
        <div className="flex items-center gap-4">
          {/* Location Tracking */}
          <Button
            variant="ghost"
            size="icon"
            onClick={startLocationTracking}
            className="relative"
            disabled={isLoadingLocation}
          >
            {isLoadingLocation ? (
              <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
            ) : (
              <Navigation className={`h-5 w-5 ${currentLocation ? 'text-green-500' : 'text-gray-500'}`} />
            )}
          </Button>

          {/* Settings */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onNavigate("/settings")}
            className="hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <Settings className="h-5 w-5" />
          </Button>

          {/* Logout */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onLogout}
            className="hover:bg-red-100 dark:hover:bg-red-800 text-red-600 dark:text-red-400"
          >
            <LogOut className="h-5 w-5" />
          </Button>

          {/* Mobile Menu */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden hover:bg-gray-100 dark:hover:bg-gray-800"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden py-4 px-6 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
          {[
            { name: "Dashboard", path: "/dashboard", icon: Home },
            { name: "History", path: "/history", icon: Clock },
            { name: "Saved", path: "/saved", icon: BookmarkPlus }
          ].map((item) => (
            <Button
              key={item.name}
              variant="ghost"
              onClick={() => {
                onNavigate(item.path);
                setIsMenuOpen(false);
              }}
              className="w-full justify-start text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition"
            >
              <item.icon className="w-5 h-5 mr-2" />
              {item.name}
            </Button>
          ))}
        </div>
      )}
    </header>
  );
}
