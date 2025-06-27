"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle, AlertCircle, Upload } from "lucide-react";

export function LocationTest() {
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [file, setFile] = useState(null);
  
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };
  
  const testLocationRecognition = async () => {
    if (!file) {
      setError("Please select an image file first");
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append("image", file);
      
      // Add current location if available
      if (navigator.geolocation) {
        try {
          const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 5000,
              maximumAge: 0,
            });
          });
          
          formData.append("latitude", position.coords.latitude.toString());
          formData.append("longitude", position.coords.longitude.toString());
        } catch (locationError) {
          console.warn("Could not get location:", locationError);
        }
      }
      
      const response = await fetch("/api/location-recognition", {
        method: "POST",
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err.message || "Failed to test location recognition");
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Test Location Recognition API</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleFileChange}
                className="block w-full text-sm text-slate-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-md file:border-0
                  file:text-sm file:font-semibold
                  file:bg-slate-50 file:text-slate-700
                  hover:file:bg-slate-100"
              />
              <Button 
                onClick={testLocationRecognition} 
                disabled={isLoading || !file}
                className="flex items-center gap-2"
              >
                {isLoading ? "Processing..." : "Test API"}
                {!isLoading && <Upload className="h-4 w-4" />}
              </Button>
            </div>
            
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {result && (
              <div className="mt-4">
                <Alert variant={result.success ? "default" : "destructive"}>
                  <div className="flex items-center gap-2">
                    {result.success ? 
                      <CheckCircle className="h-4 w-4" /> : 
                      <AlertCircle className="h-4 w-4" />
                    }
                    <AlertTitle>{result.success ? "Success" : "Failed"}</AlertTitle>
                  </div>
                  <AlertDescription>
                    {result.success ? (
                      <div className="mt-2">
                        <p><strong>Name:</strong> {result.name}</p>
                        <p><strong>Address:</strong> {result.address}</p>
                        <p><strong>Type:</strong> {result.type}</p>
                        <p><strong>Confidence:</strong> {Math.round(result.confidence * 100)}%</p>
                        <p><strong>Category:</strong> {result.category}</p>
                        <p><strong>Processing Time:</strong> {result.processingTime}ms</p>
                      </div>
                    ) : (
                      <p>{result.error || "Unknown error"}</p>
                    )}
                  </AlertDescription>
                </Alert>
                
                <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-md overflow-auto max-h-96">
                  <pre className="text-xs">{JSON.stringify(result, null, 2)}</pre>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}