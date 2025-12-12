'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';

export default function MLTestPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [showVerify, setShowVerify] = useState(false);
  const [buildingName, setBuildingName] = useState('');

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCurrentFile(file);
    setLoading(true);
    setError('');
    setResult(null);
    setShowVerify(false);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/ml-predict-and-learn', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      
      if (data.success) {
        setResult(data);
        setShowVerify(true);
      } else {
        setError(data.error || 'Prediction failed');
      }
    } catch (err) {
      setError('Failed to connect to ML API');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!currentFile || !buildingName) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('file', currentFile);
    formData.append('name', buildingName);
    formData.append('latitude', result.latitude);
    formData.append('longitude', result.longitude);

    try {
      const response = await fetch('/api/ml-predict-and-learn?action=verify', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (data.success) {
        alert('✅ Added to training data!');
        setShowVerify(false);
        setBuildingName('');
      }
    } catch (err) {
      alert('❌ Failed to add');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">ML Backend Test</h1>
      
      <Card className="p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Upload Building Image</h2>
        <input
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
      </Card>

      {loading && (
        <Card className="p-6 mb-6">
          <p className="text-center">Analyzing image...</p>
        </Card>
      )}

      {error && (
        <Card className="p-6 mb-6 border-red-500">
          <p className="text-red-600">{error}</p>
          <p className="text-sm text-gray-600 mt-2">
            Make sure ML server is running: <code>cd ml-models && python start_server.py</code>
          </p>
        </Card>
      )}

      {result && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Results</h2>
          
          <div className="space-y-3">
            <div>
              <span className="font-semibold">Latitude:</span> {result.latitude || 'N/A'}
            </div>
            <div>
              <span className="font-semibold">Longitude:</span> {result.longitude || 'N/A'}
            </div>
            <div>
              <span className="font-semibold">Confidence:</span> {((result.confidence || 0) * 100).toFixed(1)}%
            </div>
            <div>
              <span className="font-semibold">Method:</span> {result.method}
            </div>
            
            {result.details && (
              <div className="mt-4 p-4 bg-gray-50 rounded">
                <p className="font-semibold mb-2">Details:</p>
                <pre className="text-xs overflow-auto">{JSON.stringify(result.details, null, 2)}</pre>
              </div>
            )}

            {showVerify && result.latitude && (
              <div className="mt-6 p-4 border-2 border-blue-500 rounded">
                <h3 className="font-semibold mb-3">✅ Help Train the Model</h3>
                <p className="text-sm mb-3">Is this correct? Add it to improve future predictions!</p>
                <input
                  type="text"
                  placeholder="Building name (e.g., Eiffel Tower)"
                  value={buildingName}
                  onChange={(e) => setBuildingName(e.target.value)}
                  className="w-full p-2 border rounded mb-3"
                />
                <button
                  onClick={handleVerify}
                  disabled={!buildingName || loading}
                  className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 disabled:bg-gray-300"
                >
                  {loading ? 'Adding...' : 'Verify & Add to Training Data'}
                </button>
              </div>
            )}
          </div>
        </Card>
      )}

      <Card className="p-6 mt-6 bg-blue-50">
        <h3 className="font-semibold mb-2">Instructions:</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm">
          <li>Start ML server: <code className="bg-white px-2 py-1 rounded">cd ml-models && python start_server.py</code></li>
          <li>Upload a building image above</li>
          <li>View prediction results</li>
        </ol>
      </Card>
    </div>
  );
}
