'use client';

import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';
import { LocationFeedback } from './location-feedback';
import { Search, MapPin } from 'lucide-react';

export function LocationSearchWithFeedback() {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async () => {
    if (!query.trim()) return;
    
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch(`/api/location?q=${encodeURIComponent(query)}`);
      if (!response.ok) throw new Error('Location not found');
      
      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError('Failed to find location. Please try a different search.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-4">
      <div className="flex gap-2">
        <Input
          placeholder="Search for a location..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
        />
        <Button onClick={handleSearch} disabled={loading}>
          <Search className="w-4 h-4" />
        </Button>
      </div>

      {error && (
        <Card className="p-3 bg-red-50 border-red-200">
          <p className="text-sm text-red-700">{error}</p>
        </Card>
      )}

      {result && (
        <div className="space-y-3">
          <Card className="p-4">
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-blue-500 mt-0.5" />
              <div>
                <h3 className="font-medium">{result.address}</h3>
                <p className="text-sm text-gray-500">
                  {result.lat.toFixed(6)}, {result.lng.toFixed(6)}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Provider: {result.provider} • Confidence: {(result.confidence * 100).toFixed(0)}%
                </p>
              </div>
            </div>
          </Card>

          <LocationFeedback
            query={query}
            result={result}
            onFeedback={(isCorrect) => {
              console.log(`Feedback for "${query}":`, isCorrect ? 'Correct' : 'Incorrect');
            }}
          />
        </div>
      )}
    </div>
  );
}