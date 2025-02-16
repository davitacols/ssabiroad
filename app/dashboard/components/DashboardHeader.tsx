"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { loadGoogleMapsScript } from "../utils/googleMaps";
import {
  Settings,
  LogOut,
  Menu,
  X,
  Home,
  Clock,
  BookmarkPlus,
  Loader2,
  Navigation,
  Sun,
  Moon,
  Laptop,
} from "lucide-react";

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
  onLocationUpdate,
}: DashboardHeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [watchId, setWatchId] = useState<number | null>(null);
  const [theme, setTheme] = useState("system");
  const [isMobile, setIsMobile] = useState(false);

  const navigationItems = [
    { name: "Dashboard", path: "/dashboard", icon: Home },
    { name: "History", path: "/history", icon: Clock },
    { name: "Saved", path: "/saved", icon: BookmarkPlus },
  ];

  const themeOptions = [
    { value: "light", icon: Sun, label: "Light" },
    { value: "dark", icon: Moon, label: "Dark" },
    { value: "system", icon: Laptop, label: "System" },
  ];

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    startLocationTracking();
    loadGoogleMapsScript();
    return () => stopLocationTracking();
  }, []);

  useEffect(() => {
    applyTheme();
  }, [theme]);

  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMenuOpen]);

  const applyTheme = () => {
    const isDark =
      theme === "dark" ||
      (theme === "system" &&
        window.matchMedia?.("(prefers-color-scheme: dark)").matches);
    document.documentElement.classList.toggle("dark", isDark);
  };

  const startLocationTracking = () => {
    setIsLoadingLocation(true);
    stopLocationTracking();

    if (!navigator.geolocation) {
      handleLocationError("Geolocation is not supported");
      return;
    }

    const id = navigator.geolocation.watchPosition(
      handleLocationSuccess,
      handleLocationError,
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
    setWatchId(id);
  };

  const stopLocationTracking = () => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }
  };

  const handleLocationSuccess = (position: GeolocationPosition) => {
    onLocationUpdate({
      lat: position.coords.latitude,
      lng: position.coords.longitude,
      accuracy: position.coords.accuracy,
      timestamp: position.timestamp,
    });
    setIsLoadingLocation(false);
  };

  const handleLocationError = (error: any) => {
    setIsLoadingLocation(false);
    toast({
      title: "Location Error",
      description: typeof error === "string" ? error : "Unable to track location. Please enable GPS.",
      variant: "destructive",
    });
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/60 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-800 shadow-md transition-all">
      <nav className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-4">
          {/* Logo and Desktop Nav */}
          <div className="flex items-center gap-4 sm:gap-6">
            <span
              className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent cursor-pointer whitespace-nowrap"
              onClick={() => onNavigate("/dashboard")}
            >
              SabiRoad
            </span>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-2 lg:gap-4">
              {navigationItems.map((item) => (
                <Button
                  key={item.name}
                  variant="ghost"
                  onClick={() => onNavigate(item.path)}
                  className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white text-sm lg:text-base"
                >
                  <item.icon className="w-4 h-4 mr-2" />
                  {item.name}
                </Button>
              ))}
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-1 sm:gap-2 lg:gap-3">
            {/* Location Button */}
            <Button
              variant="ghost"
              size={isMobile ? "sm" : "icon"}
              onClick={startLocationTracking}
              disabled={isLoadingLocation}
              className="relative"
            >
              {isLoadingLocation ? (
                <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin text-blue-500" />
              ) : (
                <Navigation
                  className={`w-4 h-4 sm:w-5 sm:h-5 ${
                    currentLocation ? "text-green-500" : "text-gray-500"
                  }`}
                />
              )}
            </Button>

            {/* Theme Toggle */}
            <div className="hidden sm:flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
              {themeOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <Button
                    key={option.value}
                    variant={theme === option.value ? "default" : "ghost"}
                    size="icon"
                    onClick={() => setTheme(option.value)}
                    className={`w-8 h-8 ${
                      theme === option.value
                        ? "bg-white dark:bg-gray-700"
                        : "hover:bg-white/50 dark:hover:bg-gray-700/50"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </Button>
                );
              })}
            </div>

            {/* Settings */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onNavigate("/settings")}
              className="hidden sm:flex"
            >
              <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>

            {/* Logout */}
            <Button
              variant="ghost"
              size={isMobile ? "sm" : "icon"}
              onClick={onLogout}
              className="text-red-600 dark:text-red-400"
            >
              <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>

            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              size={isMobile ? "sm" : "icon"}
              className="md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? 
                <X className="w-5 h-5 sm:w-6 sm:h-6" /> : 
                <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
              }
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        <div 
          className={`md:hidden fixed inset-0 top-14 sm:top-16 bg-white dark:bg-gray-900 transition-transform duration-300 ease-in-out ${
            isMenuOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="p-4 space-y-2">
            {navigationItems.map((item) => (
              <Button
                key={item.name}
                variant="ghost"
                onClick={() => {
                  onNavigate(item.path);
                  setIsMenuOpen(false);
                }}
                className="w-full justify-start text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
              >
                <item.icon className="w-5 h-5 mr-2" />
                {item.name}
              </Button>
            ))}
            
            {/* Mobile Theme Selector */}
            <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Theme</p>
              <div className="grid grid-cols-3 gap-2">
                {themeOptions.map((option) => {
                  const Icon = option.icon;
                  return (
                    <Button
                      key={option.value}
                      variant={theme === option.value ? "default" : "ghost"}
                      onClick={() => setTheme(option.value)}
                      className="justify-center"
                    >
                      <Icon className="w-4 h-4 mr-2" />
                      {option.label}
                    </Button>
                  );
                })}
              </div>
            </div>

            {/* Mobile Settings */}
            <Button
              variant="ghost"
              onClick={() => {
                onNavigate("/settings");
                setIsMenuOpen(false);
              }}
              className="w-full justify-start text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
            >
              <Settings className="w-5 h-5 mr-2" />
              Settings
            </Button>
          </div>
        </div>
      </nav>
    </header>
  );
}