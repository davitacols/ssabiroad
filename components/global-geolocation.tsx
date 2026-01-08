'use client';

import { useState } from 'react';
import { MapPin, Upload, ThumbsUp, ThumbsDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface Prediction {
  latitude: number;
  longitude: number;
  confidence: number;
  method: string;
  metadata: any;
}

export default function GlobalGeolocation() {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const predictLocation = async () => {
    if (!selectedFile) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('top_k', '5');
    formData.append('min_confidence', '0.1');

    try {
      const response = await fetch('/api/global-geolocation', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (data.success) {
        setPredictions(data.predictions);
      }
    } catch (error) {
      console.error('Prediction error:', error);
    } finally {
      setLoading(false);
    }
  };

  const submitFeedback = async (prediction: Prediction, correct: boolean) => {
    try {
      await fetch('/api/global-geolocation', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_id: Date.now().toString(),
          predicted_lat: prediction.latitude,
          predicted_lon: prediction.longitude,
          true_lat: prediction.latitude,
          true_lon: prediction.longitude,
          confidence: prediction.confidence,
          user_corrected: !correct,
        }),
      });
    } catch (error) {
      console.error('Feedback error:', error);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Global Location Predictor</h1>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Upload Image</h2>
          
          <div className="border-2 border-dashed rounded-lg p-8 text-center">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              id="file-upload"
            />
            <label htmlFor="file-upload" className="cursor-pointer">
              <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-sm text-gray-600">Click to upload image</p>
            </label>
          </div>

          {previewUrl && (
            <div className="mt-4">
              <img src={previewUrl} alt="Preview" className="w-full rounded-lg" />
              <Button onClick={predictLocation} disabled={loading} className="w-full mt-4">
                {loading ? 'Analyzing...' : 'Predict Location'}
              </Button>
            </div>
          )}
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Top Predictions</h2>
          
          {predictions.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No predictions yet</p>
          ) : (
            <div className="space-y-3">
              {predictions.map((pred, idx) => (
                <div key={idx} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-blue-500" />
                      <span className="font-semibold">#{idx + 1}</span>
                    </div>
                    <span className="text-sm bg-blue-100 px-2 py-1 rounded">
                      {(pred.confidence * 100).toFixed(1)}%
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-2">
                    {pred.latitude.toFixed(4)}, {pred.longitude.toFixed(4)}
                  </p>
                  
                  <div className="flex gap-2 mt-3">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => submitFeedback(pred, true)}
                    >
                      <ThumbsUp className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => submitFeedback(pred, false)}
                    >
                      <ThumbsDown className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {pred.metadata?.ocr && pred.metadata.ocr.length > 0 && (
                    <div className="mt-2 text-xs text-gray-500">
                      OCR: {pred.metadata.ocr.map((o: any) => o.text).join(', ')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
