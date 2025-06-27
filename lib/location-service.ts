export async function saveLocation(locationData: {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  confidence?: number;
  recognitionType?: string;
  description?: string;
  category?: string;
  userId?: string;
}) {
  const response = await fetch('/api/locations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(locationData)
  });
  
  return response.json();
}