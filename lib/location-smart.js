import { trainer } from './location-trainer.js';

const googleMaps = async (query) => {
  const response = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${process.env.GOOGLE_MAPS_API_KEY}`
  );
  const data = await response.json();
  
  if (data.results?.[0]) {
    const result = data.results[0];
    return {
      lat: result.geometry.location.lat,
      lng: result.geometry.location.lng,
      address: result.formatted_address,
      confidence: result.geometry.location_type === 'ROOFTOP' ? 1.0 : 0.8,
      provider: 'maps'
    };
  }
  throw new Error('No results');
};

const geocodio = async (query) => {
  const response = await fetch(
    `https://api.geocod.io/v1.7/geocode?q=${encodeURIComponent(query)}&api_key=${process.env.GEOCODIO_API_KEY}`
  );
  const data = await response.json();
  
  if (data.results?.[0]) {
    const result = data.results[0];
    return {
      lat: result.location.lat,
      lng: result.location.lng,
      address: result.formatted_address,
      confidence: result.accuracy,
      provider: 'geocodio'
    };
  }
  throw new Error('No results');
};

const googlePlaces = async (query) => {
  const response = await fetch(
    `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${process.env.GOOGLE_PLACES_API_KEY}`
  );
  const data = await response.json();
  
  if (data.results?.[0]) {
    const result = data.results[0];
    return {
      lat: result.geometry.location.lat,
      lng: result.geometry.location.lng,
      address: result.formatted_address,
      confidence: result.rating ? 0.9 : 0.7,
      provider: 'places'
    };
  }
  throw new Error('No results');
};

export const getLocation = async (query) => {
  const providers = { maps: googleMaps, geocodio, places: googlePlaces };
  
  // Use trained model to get optimal provider
  const optimal = trainer.getOptimalProvider(query);
  const cascade = [optimal, ...Object.keys(providers).filter(p => p !== optimal)];

  for (const providerName of cascade) {
    try {
      const result = await providers[providerName](query);
      const trainedConfidence = trainer.getConfidenceScore(query, providerName);
      
      // Combine API confidence with trained confidence
      result.confidence = (result.confidence + trainedConfidence) / 2;
      
      if (result.confidence > 0.6) {
        // Record successful query for training
        trainer.recordSuccess(query, result, providerName);
        return result;
      }
    } catch (e) {
      continue;
    }
  }

  throw new Error('Location not found');
};

// Function to record user feedback
export const recordFeedback = (query, result, isCorrect) => {
  trainer.recordFeedback(query, result, isCorrect);
};