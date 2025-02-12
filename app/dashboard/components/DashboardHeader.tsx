"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Search, Settings, LogOut, Menu, X, Home, Clock, BookmarkPlus } from "lucide-react"
import { loadGoogleMapsScript } from "../utils/googleMaps"

interface DashboardHeaderProps {
  onLogout: () => void
  onNavigate: (path: string) => void
}

export default function DashboardHeader({ onLogout, onNavigate }: DashboardHeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [predictions, setPredictions] = useState([])
  const [autocompleteService, setAutocompleteService] = useState(null)

  useEffect(() => {
    loadGoogleMapsScript().then(() => {
      if (window.google) {
        setAutocompleteService(new window.google.maps.places.AutocompleteService())
      }
    })
  }, [])

  useEffect(() => {
    if (!autocompleteService || !searchQuery || searchQuery.length <= 2) {
      setPredictions([])
      return
    }

    const fetchPredictions = async () => {
      try {
        const results = await new Promise((resolve, reject) => {
          autocompleteService.getPlacePredictions(
            {
              input: searchQuery,
              types: ["establishment", "geocode"],
              componentRestrictions: { country: "US" },
            },
            (results, status) => {
              if (status === window.google.maps.places.PlacesServiceStatus.OK) {
                resolve(results)
              } else {
                reject(status)
              }
            },
          )
        })
        setPredictions(results)
      } catch (error) {
        console.error("Error fetching predictions:", error)
        setPredictions([])
      }
    }

    fetchPredictions()
  }, [searchQuery, autocompleteService])

  const handleSearchSelect = (prediction) => {
    setSearchQuery(prediction.description)
    setPredictions([])
    onNavigate(`/building/${prediction.place_id}`)
  }

  const navItems = [
    { name: "Dashboard", path: "/dashboard", icon: Home },
    { name: "History", path: "/history", icon: Clock },
    { name: "Saved", path: "/saved", icon: BookmarkPlus },
  ]

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl dark:bg-gray-900/90 border-b border-gray-200 dark:border-gray-800">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent cursor-pointer">
              BuildingAI
            </span>
            <div className="hidden md:flex items-center gap-6">
              {navItems.map((item) => (
                <Button
                  key={item.name}
                  variant="ghost"
                  onClick={() => onNavigate(item.path)}
                  className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
                >
                  <item.icon className="w-4 h-4 mr-2" />
                  {item.name}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative hidden md:block w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search buildings..."
                className="w-full pl-10 pr-4 py-2 rounded-full bg-gray-100 dark:bg-gray-800 border-none focus:ring-2 focus:ring-blue-500"
              />
              {predictions.length > 0 && (
                <div className="absolute mt-2 w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
                  {predictions.map((prediction) => (
                    <div
                      key={prediction.place_id}
                      onClick={() => handleSearchSelect(prediction)}
                      className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                    >
                      <p className="text-sm font-medium">{prediction.structured_formatting.main_text}</p>
                      <p className="text-xs text-gray-500">{prediction.structured_formatting.secondary_text}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onNavigate("/settings")}
              className="hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <Settings className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onLogout} className="hover:bg-gray-100 dark:hover:bg-gray-800">
              <LogOut className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden hover:bg-gray-100 dark:hover:bg-gray-800"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {isMenuOpen && (
          <div className="md:hidden py-4 space-y-2 border-t border-gray-200 dark:border-gray-800">
            {navItems.map((item) => (
              <Button
                key={item.name}
                variant="ghost"
                onClick={() => {
                  onNavigate(item.path)
                  setIsMenuOpen(false)
                }}
                className="w-full justify-start text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
              >
                <item.icon className="w-4 h-4 mr-2" />
                {item.name}
              </Button>
            ))}
          </div>
        )}
      </nav>
    </header>
  )
}

