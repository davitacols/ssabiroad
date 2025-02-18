// /app/api/government-data/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const address = searchParams.get('address');
  
  if (!address) {
    return NextResponse.json({ error: 'address parameter is required' }, { status: 400 });
  }
  
  // Extract ZIP code from address if possible
  const zipMatch = address.match(/\b\d{5}(?:[-\s]\d{4})?\b/);
  const zipCode = zipMatch ? zipMatch[0] : null;
  
  // Try to determine state from address
  const stateAbbrs = [
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
    'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
    'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
    'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
    'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
    'DC'
  ];
  
  let state = null;
  for (const abbr of stateAbbrs) {
    if (address.includes(` ${abbr} `) || address.endsWith(` ${abbr}`)) {
      state = abbr;
      break;
    }
  }
  
  try {
    let governmentData: Record<string, any> = {};
    
    // Fetch zip code information
    if (zipCode) {
      try {
        const zipResponse = await fetch(`https://api.zippopotam.us/us/${zipCode}`);
        if (zipResponse.ok) {
          const zipData = await zipResponse.json();
          governmentData.zip_info = zipData;
        }
      } catch (e) {
        console.error('Error fetching ZIP code data:', e);
      }
    }
    
    // Fetch voting information if state is available
    if (state) {
      try {
        const votingResponse = await fetch(`https://www.googleapis.com/civicinfo/v2/voterinfo?address=${encodeURIComponent(address)}&electionId=2000&key=${process.env.GOOGLE_CIVIC_API_KEY || ''}`);
        if (votingResponse.ok) {
          const votingData = await votingResponse.json();
          governmentData.voting_info = votingData;
        }
      } catch (e) {
        console.error('Error fetching voting data:', e);
      }
    }
    
    // If we have a zip code, try to get congressional district
    if (zipCode) {
      try {
        const districtResponse = await fetch(`https://api.geocod.io/v1.7/congressional_district?postal_code=${zipCode}&api_key=${process.env.GEOCODIO_API_KEY || ''}`);
        if (districtResponse.ok) {
          const districtData = await districtResponse.json();
          governmentData.congressional_district = districtData;
        }
      } catch (e) {
        console.error('Error fetching congressional district:', e);
      }
    }
    
    // If no data was fetched, provide basic information
    if (Object.keys(governmentData).length === 0) {
      return NextResponse.json({
        note: 'To get detailed government data, you would need to integrate with various government APIs',
        data: {
          potential_sources: [
            'Google Civic Information API for voting data',
            'census.gov for demographic and governmental district data',
            'Local government APIs for city-specific information',
            'State government APIs for state-specific information'
          ],
          message: 'Complete government data would require multiple API integrations'
        }
      });
    }
    
    return NextResponse.json(governmentData);
    
  } catch (error) {
    console.error('Error fetching government data:', error);
    return NextResponse.json({ 
      error: 'Unable to fetch government data',
      message: 'Government data may require specific API keys and might not be available for all locations'
    }, { status: 200 });
  }
}