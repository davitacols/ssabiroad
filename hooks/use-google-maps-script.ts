"use client"

import { useState, useEffect } from "react"

interface UseGoogleMapsScriptOptions {
  googleMapsApiKey: string
  libraries?: string[]
}

export function useGoogleMapsScript({ googleMapsApiKey, libraries = [] }: UseGoogleMapsScriptOptions) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [loadError, setLoadError] = useState<Error | null>(null)

  useEffect(() => {
    if (!googleMapsApiKey) {
      setLoadError(new Error("Google Maps API key is required"))
      return
    }

    // Check if script is already loaded
    if (window.google && window.google.maps) {
      setIsLoaded(true)
      return
    }

    // Create callback function for script
    const callbackName = `googleMapsCallback_${Math.round(Math.random() * 1000000)}`
    window[callbackName] = () => {
      setIsLoaded(true)
      delete window[callbackName]
    }

    // Create script element
    const script = document.createElement("script")
    script.src = `https://maps.googleapis.com/maps/api/js?key=${googleMapsApiKey}&callback=${callbackName}&libraries=${libraries.join(",")}`
    script.async = true
    script.defer = true
    script.onerror = () => {
      setLoadError(new Error("Failed to load Google Maps script"))
    }

    // Add script to document
    document.head.appendChild(script)

    return () => {
      // Clean up
      if (window[callbackName]) {
        delete window[callbackName]
      }
      script.remove()
    }
  }, [googleMapsApiKey, libraries])

  return { isLoaded, loadError }
}
