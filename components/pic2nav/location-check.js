// Simple script to check if location data is being rendered in the dashboard
// This can be run in the browser console to verify the data flow

function checkLocationRendering() {
  // Check if recent locations are stored in localStorage
  const recentLocations = localStorage.getItem('recentLocations');
  
  if (recentLocations) {
    try {
      const parsedLocations = JSON.parse(recentLocations);
      console.log('Found recent locations in localStorage:', parsedLocations);
      
      // Check if the most recent location matches what we expect
      if (parsedLocations.length > 0) {
        const latestLocation = parsedLocations[0];
        console.log('Latest location:', latestLocation);
        
        // Check if the latest location has the expected data from the API response
        if (latestLocation.name === 'Venchi' && 
            latestLocation.address.includes('Wisconsin') &&
            latestLocation.category === 'Retail') {
          console.log('✅ SUCCESS: The analyzed location data is correctly stored in localStorage');
          return true;
        } else {
          console.log('❌ Location data doesn\'t match expected values from API response');
          console.log('Expected: name=Venchi, address containing Wisconsin, category=Retail');
          console.log('Found:', {
            name: latestLocation.name,
            address: latestLocation.address,
            category: latestLocation.category
          });
          return false;
        }
      } else {
        console.log('❌ No locations found in the recent locations array');
        return false;
      }
    } catch (e) {
      console.error('Failed to parse recent locations from localStorage:', e);
      return false;
    }
  } else {
    console.log('❌ No recent locations found in localStorage');
    return false;
  }
}

// Execute the check
checkLocationRendering();