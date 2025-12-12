'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';

export default function MLStatsPage() {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    const ML_URL = process.env.NEXT_PUBLIC_ML_API_URL || 'http://localhost:8000';
    fetch(`${ML_URL}/stats`)
      .then(r => r.json())
      .then(setStats)
      .catch(() => setStats({ error: 'ML server offline' }));
  }, []);

  if (!stats) return <div className="p-8">Loading...</div>;

  return (
    <div className="container mx-auto p-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">ML Training Stats</h1>
      
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex justify-between text-lg">
            <span className="font-semibold">Buildings Trained:</span>
            <span className="text-2xl font-bold text-blue-600">{stats.total_buildings || 0}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="font-semibold">Index Size:</span>
            <span>{stats.index_size || 0}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="font-semibold">Status:</span>
            <span className={stats.status === 'running' ? 'text-green-600' : 'text-red-600'}>
              {stats.status || 'offline'}
            </span>
          </div>

          {stats.total_buildings > 0 && (
            <div className="mt-6 p-4 bg-green-50 rounded">
              <p className="text-green-800 font-semibold">✅ Model is trained!</p>
              <p className="text-sm text-green-600 mt-1">
                {stats.total_buildings} buildings in the index. Upload similar images to test matching.
              </p>
            </div>
          )}

          {stats.total_buildings === 0 && (
            <div className="mt-6 p-4 bg-yellow-50 rounded">
              <p className="text-yellow-800 font-semibold">⚠️ No training data yet</p>
              <p className="text-sm text-yellow-600 mt-1">
                Upload images and verify them to start training the model.
              </p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
