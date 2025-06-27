/**
 * Place Photos API Module
 * 
 * This module provides functionality to fetch photos for identified locations
 * using the Google Places API.
 */

import axios from "axios";
import { getEnv } from "../utils/env";

// Interface for photo metadata
export interface PlacePhoto {
  photoReference: string;
  width: number;
  height: number;
  htmlAttributions: string[];
  url?: string; // URL to the actual image
}

/**
 * Fetch photos for a place using its placeId
 * @param placeId Google Places API place ID
 * @param maxResults Maximum number of photos to return (default: 5)
 * @returns Array of photo metadata objects
 */
export async function getPlacePhotos(placeId: string, maxResults: number = 5): Promise<PlacePhoto[]> {
  try {
    // First get place details to get photo references
    const response = await axios.get("https://maps.googleapis.com/maps/api/place/details/json", {
      params: {
        place_id: placeId,
        fields: "photos",
        key: getEnv("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY"),
      },
      timeout: 5000, // 5 second timeout
    });

    if (!response.data.result || !response.data.result.photos) {
      return [];
    }

    // Extract photo references
    const photos = response.data.result.photos.slice(0, maxResults).map((photo: any) => ({
      photoReference: photo.photo_reference,
      width: photo.width,
      height: photo.height,
      htmlAttributions: photo.html_attributions || [],
      // Generate URL for each photo
      url: `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${photo.photo_reference}&key=${getEnv("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY")}`,
    }));

    return photos;
  } catch (error) {
    console.error("Error fetching place photos:", error);
    return [];
  }
}

/**
 * Fetch photos for a location using its coordinates
 * @param latitude Location latitude
 * @param longitude Location longitude
 * @param maxResults Maximum number of photos to return (default: 5)
 * @returns Array of photo metadata objects
 */
export async function getLocationPhotosByCoordinates(
  latitude: number,
  longitude: number,
  maxResults: number = 5
): Promise<PlacePhoto[]> {
  try {
    // First find the place ID using nearby search
    const nearbyResponse = await axios.get("https://maps.googleapis.com/maps/api/place/nearbysearch/json", {
      params: {
        location: `${latitude},${longitude}`,
        radius: 50, // 50 meters radius (very close to the exact location)
        key: getEnv("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY"),
      },
      timeout: 5000,
    });

    if (!nearbyResponse.data.results || nearbyResponse.data.results.length === 0) {
      return [];
    }

    // Get the place ID of the nearest result
    const placeId = nearbyResponse.data.results[0].place_id;
    
    // Now get photos using the place ID
    return await getPlacePhotos(placeId, maxResults);
  } catch (error) {
    console.error("Error fetching location photos by coordinates:", error);
    return [];
  }
}

/**
 * Fetch photos for a location by name and optional coordinates
 * @param locationName Name of the location to search for
 * @param latitude Optional latitude to improve search accuracy
 * @param longitude Optional longitude to improve search accuracy
 * @param maxResults Maximum number of photos to return (default: 5)
 * @returns Array of photo metadata objects
 */
export async function getLocationPhotosByName(
  locationName: string,
  latitude?: number,
  longitude?: number,
  maxResults: number = 5
): Promise<PlacePhoto[]> {
  try {
    // Build search parameters
    const params: any = {
      query: locationName,
      key: getEnv("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY"),
    };

    // Add location bias if coordinates are provided
    if (latitude !== undefined && longitude !== undefined) {
      params.location = `${latitude},${longitude}`;
      params.radius = 5000; // 5km radius
    }

    // Search for the place
    const searchResponse = await axios.get("https://maps.googleapis.com/maps/api/place/textsearch/json", {
      params,
      timeout: 5000,
    });

    if (!searchResponse.data.results || searchResponse.data.results.length === 0) {
      return [];
    }

    // Get the place ID of the top result
    const placeId = searchResponse.data.results[0].place_id;
    
    // Now get photos using the place ID
    return await getPlacePhotos(placeId, maxResults);
  } catch (error) {
    console.error("Error fetching location photos by name:", error);
    return [];
  }
}