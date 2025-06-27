"use client";

import axios from 'axios';

/**
 * Searches for a business by name using Google Places API
 * @param {string} businessName - The name of the business to search for
 * @returns {Promise<{address: string, location: {latitude: number, longitude: number}} | null>}
 */
export async function searchBusinessByName(businessName) {
  try {
    const response = await axios.get(`https://maps.googleapis.com/maps/api/place/findplacefromtext/json`, {
      params: {
        input: businessName,
        inputtype: 'textquery',
        fields: 'formatted_address,geometry,name',
        key: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
      }
    });

    if (response.data.candidates && response.data.candidates.length > 0) {
      const place = response.data.candidates[0];
      return {
        address: place.formatted_address,
        location: {
          latitude: place.geometry.location.lat,
          longitude: place.geometry.location.lng
        }
      };
    }
    return null;
  } catch (error) {
    console.error("Error searching for business:", error);
    return null;
  }
}