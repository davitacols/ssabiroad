// /app/api/weather/route.ts
import { NextRequest, NextResponse } from 'next/server';

const OPEN_WEATHER_API_KEY = process.env.OPEN_WEATHER_API_KEY || ''; // You'll need to obtain an API key from OpenWeatherMap

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');
  
  if (!lat || !lng) {
    return NextResponse.json({ error: 'lat and lng parameters are required' }, { status: 400 });
  }
  
  try {
    if (!OPEN_WEATHER_API_KEY) {
      return NextResponse.json({
        note: 'Weather data requires an API key',
        data: {
          message: 'For weather data, integrate with a service like OpenWeatherMap, WeatherAPI, or similar'
        }
      });
    }
    
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&units=metric&appid=${OPEN_WEATHER_API_KEY}`
    );
    
    if (!response.ok) {
      throw new Error(`Weather API error: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    return NextResponse.json({
      current_weather: {
        temperature: data.main.temp,
        feels_like: data.main.feels_like,
        humidity: data.main.humidity,
        pressure: data.main.pressure,
        weather_condition: data.weather[0].main,
        description: data.weather[0].description,
        wind_speed: data.wind.speed,
        wind_direction: data.wind.deg,
        cloudiness: data.clouds.all,
        visibility: data.visibility
      },
      location: {
        name: data.name,
        country: data.sys.country,
        sunrise: new Date(data.sys.sunrise * 1000).toISOString(),
        sunset: new Date(data.sys.sunset * 1000).toISOString()
      },
      raw_data: data
    });
    
  } catch (error) {
    console.error('Error fetching weather data:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch weather data',
      message: 'Weather data may not be available for this location or API key is invalid'
    }, { status: 200 });
  }
}