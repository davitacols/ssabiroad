"use client"

import { useEffect, useRef, useState } from "react"
import { Loader } from "@googlemaps/js-api-loader"
import { GoogleMap, LoadScript, Marker } from "@react-google-maps/api"

interface Location {
  lat: number
  lng: number
}

export function MapDisplay() {
  const mapRef = useRef<HTMLDivElement>(null)
  const [userLocation, setUserLocation] = useState<Location | null>(null)

  useEffect(() => {
    const getUserLocation = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setUserLocation({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            })
          },
          () => {
            console.error("Error: The Geolocation service failed.")
          },
        )
      } else {
        console.error("Error: Your browser doesn't support geolocation.")
      }
    }

    getUserLocation()
  }, [])

  useEffect(() => {
    if (!userLocation) return

    const loader = new Loader({
      apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
      version: "weekly",
    })

    loader.load().then(() => {
      if (mapRef.current) {
        //Removed old map creation and replaced with react-google-maps
        // const map = new google.maps.Map(mapRef.current, {
        //   center: userLocation,
        //   zoom: 15,
        // })
        // new google.maps.Marker({
        //   position: userLocation,
        //   map: map,
        //   title: "Your Location",
        // })
      }
    })
  }, [userLocation])

  return (
    <LoadScript googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""}>
      <GoogleMap
        mapContainerStyle={{ width: "100%", height: "100%" }}
        center={userLocation || { lat: 0, lng: 0 }}
        zoom={15}
      >
        {userLocation && <Marker position={userLocation} title="Your Location" />}
      </GoogleMap>
    </LoadScript>
  )
}

