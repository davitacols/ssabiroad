"use client";
import { useEffect, useState } from 'react';

export default function VerifyStreetView() {
  const [locations, setLocations] = useState<any[]>([]);
  const [selectedCity, setSelectedCity] = useState('');

  useEffect(() => {
    fetch('/api/get-streetview-locations')
      .then(r => r.json())
      .then(data => {
        setLocations(data.locations || []);
        if (data.locations?.length > 0) {
          const firstCity = data.locations[0].name.split('_')[0] + '_' + data.locations[0].name.split('_')[1];
          setSelectedCity(firstCity);
        }
      });
  }, []);

  const cities = [...new Set(locations.map(l => l.name.split('_')[0] + '_' + l.name.split('_')[1]))];
  const filtered = locations.filter(l => l.name.startsWith(selectedCity));

  return (
    <div className="p-4">
      <h1 className="text-3xl font-bold mb-6">Nigerian Cities Coverage - {locations.length} locations</h1>
      <div className="mb-4 flex gap-2 flex-wrap">
        {cities.map(city => (
          <button key={city} onClick={() => setSelectedCity(city)} className={`px-4 py-2 rounded ${selectedCity === city ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
            {city.replace('_', ' ')}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-4">
        {filtered.slice(0, 12).map((loc, i) => (
          <div key={i} className="border rounded overflow-hidden">
            <img src={loc.image} alt={loc.name} className="w-full h-48 object-cover" />
            <div className="p-2">
              <p className="text-sm font-bold">{loc.name}</p>
              <p className="text-xs text-gray-600">Lat: {loc.latitude.toFixed(4)}, Lon: {loc.longitude.toFixed(4)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
