'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, MapPin, Loader2 } from 'lucide-react';
import Image from 'next/image';

export default function NaviSensePage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
      setResult(null);
    }
  };

  const handleAnalyze = async () => {
    if (!file) return;

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/navisense', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      setResult(data);
    } catch (error) {
      alert('Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">NaviSense AI</h1>
        <p className="text-muted-foreground">Intelligent Location Recognition System</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Upload Building Image</CardTitle>
            <CardDescription>Upload a photo to identify the location</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              {preview ? (
                <div className="relative w-full h-64">
                  <Image
                    src={preview}
                    alt="Preview"
                    fill
                    className="object-cover rounded"
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Upload className="h-12 w-12 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Click to upload or drag and drop
                  </p>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <Button variant="outline" className="mt-4" asChild>
                  <span>Choose Image</span>
                </Button>
              </label>
            </div>

            <Button
              onClick={handleAnalyze}
              disabled={!file || loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <MapPin className="mr-2 h-4 w-4" />
                  Analyze Location
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Results</CardTitle>
            <CardDescription>Location prediction and details</CardDescription>
          </CardHeader>
          <CardContent>
            {result ? (
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Latitude</p>
                  <p className="text-2xl font-bold">{result.latitude?.toFixed(4) || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Longitude</p>
                  <p className="text-2xl font-bold">{result.longitude?.toFixed(4) || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Confidence</p>
                  <p className="text-2xl font-bold">{(result.confidence * 100).toFixed(1)}%</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Method</p>
                  <p className="text-lg">{result.method}</p>
                </div>
                {result.latitude && result.longitude && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => window.open(`https://www.google.com/maps?q=${result.latitude},${result.longitude}`, '_blank')}
                  >
                    View on Map
                  </Button>
                )}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-12">
                Upload an image to see results
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
