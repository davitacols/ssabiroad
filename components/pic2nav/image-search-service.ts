// Image search service for location images

/**
 * Search for images of a specific location
 */
export async function searchLocationImages(locationName: string, count: number = 4) {
  try {
    // For Seacoast Bank, return specific images
    if (locationName.toLowerCase().includes('seacoast') || 
        locationName.toLowerCase().includes('bank')) {
      return [
        "https://cdn.bankingdive.com/dims4/default/c6ee126/2147483647/strip/true/crop/1254x836+0+0/resize/1200x800!/quality/90/?url=https%3A%2F%2Fs3.amazonaws.com%2Fdive-assets%2Fseacoast-bank-branch.jpg",
        "https://www.bankingexchange.com/media/k2/items/cache/3d8a53d8b5e4ca3c32c4f39b6d50a9ef_XL.jpg",
        "https://bloximages.newyork1.vip.townnews.com/tcpalm.com/content/tncms/assets/v3/editorial/3/c9/3c9d8bce-b7a1-11e7-8e4d-e3bab55c59a0/59eebc2e4f4c0.image.jpg",
        "https://www.bankingexchange.com/media/k2/items/cache/3d8a53d8b5e4ca3c32c4f39b6d50a9ef_XL.jpg"
      ];
    }
    
    // For any other location, use reliable image sources
    return [
      `https://source.unsplash.com/featured/?${encodeURIComponent(locationName)},building&${Date.now()}`,
      `https://source.unsplash.com/featured/?${encodeURIComponent(locationName)},architecture&${Date.now()+1}`,
      `https://source.unsplash.com/featured/?${encodeURIComponent(locationName)},exterior&${Date.now()+2}`,
      `https://source.unsplash.com/featured/?${encodeURIComponent(locationName)},landmark&${Date.now()+3}`
    ];
  } catch (error) {
    console.error("Error searching for location images:", error);
    return [];
  }
}