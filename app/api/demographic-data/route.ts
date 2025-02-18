// /app/api/demographic-data/route.ts
import { NextRequest, NextResponse } from 'next/server';

const CENSUS_API_KEY = process.env.CENSUS_API_KEY || ''; // You'll need to get a Census API key

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');
  
  if (!lat || !lng) {
    return NextResponse.json({ error: 'lat and lng parameters are required' }, { status: 400 });
  }
  
  try {
    // First, convert lat/lng to FIPS (Federal Information Processing Standards) code
    // This is just a simplified example. In practice, you'd need a geocoding service 
    // that can convert coordinates to census tracts or block groups
    
    const geocodeResponse = await fetch(
      `https://geocoding.geo.census.gov/geocoder/geographies/coordinates?x=${lng}&y=${lat}&benchmark=Public_AR_Current&vintage=Current_Current&layers=Census%20Tracts,Block%20Groups&format=json`
    );
    
    const geocodeData = await geocodeResponse.json();
    
    if (!geocodeData.result?.geographies?.['Census Tracts']?.[0]) {
      return NextResponse.json({ 
        note: 'No demographic data available for this location',
        data: {} 
      });
    }
    
    const tract = geocodeData.result.geographies['Census Tracts'][0];
    const state = tract.STATE;
    const county = tract.COUNTY;
    const tract_id = tract.TRACT;
    
    // Now fetch demographic data from Census API
    if (CENSUS_API_KEY) {
      const censusResponse = await fetch(
        `https://api.census.gov/data/2020/acs/acs5?get=NAME,B01001_001E,B19013_001E,B15003_022E,B15003_023E,B15003_024E,B15003_025E&for=tract:${tract_id}&in=state:${state}%20county:${county}&key=${CENSUS_API_KEY}`
      );
      
      const censusData = await censusResponse.json();
      
      if (Array.isArray(censusData) && censusData.length > 1) {
        const [headers, data] = [censusData[0], censusData[1]];
        
        return NextResponse.json({
          total_population: parseInt(data[headers.indexOf('B01001_001E')], 10),
          median_household_income: parseInt(data[headers.indexOf('B19013_001E')], 10),
          college_graduates: parseInt(data[headers.indexOf('B15003_022E')], 10) + 
                           parseInt(data[headers.indexOf('B15003_023E')], 10) + 
                           parseInt(data[headers.indexOf('B15003_024E')], 10) + 
                           parseInt(data[headers.indexOf('B15003_025E')], 10),
          census_tract: data[headers.indexOf('tract')],
          county: data[headers.indexOf('county')],
          state: data[headers.indexOf('state')]
        });
      }
    }
    
    // If no Census API key or failed to fetch data
    return NextResponse.json({ 
      note: 'Basic demographic data',
      data: {
        census_tract: tract_id,
        county: county,
        state: state,
        message: 'For detailed demographic data, a Census API key is required.'
      } 
    });
    
  } catch (error) {
    console.error('Error fetching demographic data:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch demographic data',
      note: 'Demographic data may not be available for all locations'
    }, { status: 200 });
  }
}