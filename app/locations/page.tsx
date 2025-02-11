// app/locations/page.tsx
"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

interface Location {
  id: string
  address: string
  visits: number
  description?: string
}

export default function LocationsPage() {
  const [locations, setLocations] = useState<Location[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const response = await fetch("/api/saved-locations", {
          method: "GET",
          credentials: "include", // To send cookies with the request
        })

        if (response.ok) {
          const data = await response.json()
          setLocations(data)
        } else {
          setError("Failed to fetch saved locations")
        }
      } catch (err) {
        console.error(err)
        setError("Failed to fetch saved locations")
      }
    }

    fetchLocations()
  }, [])

  return (
    <div className="container">
      <h1 className="text-2xl font-bold mb-4">Saved Locations</h1>
      {error && <p className="text-red-500">{error}</p>}
      {locations.length === 0 ? (
        <p>No saved locations found.</p>
      ) : (
        <ul>
          {locations.map((location) => (
            <li key={location.id} className="mb-4 p-4 border rounded-lg">
              <h2 className="text-xl font-semibold">{location.address}</h2>
              <p>{location.description}</p>
              <p>Visits: {location.visits}</p>
              <Link href={`/map?id=${location.id}`}>View on Map</Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
