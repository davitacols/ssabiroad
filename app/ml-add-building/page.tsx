'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function AddBuildingPage() {
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('metadata', JSON.stringify({
      name,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude)
    }));

    try {
      const response = await fetch('/api/ml-add-building', {
        method: 'POST',
        body: formData
      });
      const data = await response.json();
      setResult(data.success ? `✅ Added! Total: ${data.total_buildings}` : '❌ Failed');
      if (data.success) {
        setName('');
        setLatitude('');
        setLongitude('');
        setFile(null);
      }
    } catch (err) {
      setResult('❌ Error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">Add Building to Index</h1>
      
      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-2 font-semibold">Image</label>
            <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} required />
          </div>
          
          <div>
            <label className="block mb-2 font-semibold">Name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Empire State Building" required />
          </div>
          
          <div>
            <label className="block mb-2 font-semibold">Latitude</label>
            <Input type="number" step="any" value={latitude} onChange={(e) => setLatitude(e.target.value)} placeholder="40.7484" required />
          </div>
          
          <div>
            <label className="block mb-2 font-semibold">Longitude</label>
            <Input type="number" step="any" value={longitude} onChange={(e) => setLongitude(e.target.value)} placeholder="-73.9857" required />
          </div>
          
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Adding...' : 'Add Building'}
          </Button>
        </form>
        
        {result && <div className="mt-4 p-4 bg-gray-100 rounded">{result}</div>}
      </Card>
    </div>
  );
}
