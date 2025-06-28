const getOptimalProvider = (query) => {
  if (/^\d{5}(-\d{4})?$/.test(query)) return 'geocodio';
  if (/\b(restaurant|store|hotel|business)\b/i.test(query)) return 'places';
  return 'maps';
};

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
      provider: 'google_maps'
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
      provider: 'google_places'
    };
  }
  throw new Error('No results');
};

export const getLocation = async (query) => {
  const optimal = getOptimalProvider(query);
  const providers = {
    maps: googleMaps,
    geocodio: geocodio,
    places: googlePlaces
  };

  const cascade = optimal === 'geocodio' 
    ? [providers.geocodio, providers.maps, providers.places]
    : optimal === 'places'
    ? [providers.places, providers.maps, providers.geocodio]
    : [providers.maps, providers.geocodio, providers.places];

  for (const provider of cascade) {
    try {
      const result = await provider(query);
      if (result.confidence > 0.7) {
        return result;
      }
    } catch (e) {
      continue;
    }
  }

  throw new Error('Location not found');
};