"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle, AlertCircle, Sparkles } from "lucide-react";
import { enhanceLocationData } from "@/lib/location-enhancer";

export function LocationEnhancerButton() {
  const [result, setResult] = useState(null);

  const enhanceLatestLocation = () => {
    // Get recent locations from localStorage
    const recentLocations = localStorage.getItem('recentLocations');
    
    if (!recentLocations) {
      setResult({
        success: false,
        message: 'No recent locations found in localStorage'
      });
      return;
    }
    
    try {
      const parsedLocations = JSON.parse(recentLocations);
      
      if (parsedLocations.length === 0) {
        setResult({
          success: false,
          message: 'No locations found in the recent locations array'
        });
        return;
      }
      
      // Get the latest location
      const latestLocation = parsedLocations[0];
      const originalLocation = {...latestLocation};
      
      // Enhance the location data
      const enhancedLocation = enhanceLocationData(latestLocation);
      
      // Check if any changes were made
      const hasChanges = JSON.stringify(enhancedLocation) !== JSON.stringify(originalLocation);
      
      if (hasChanges) {
        // Update the location in localStorage
        parsedLocations[0] = enhancedLocation;
        localStorage.setItem('recentLocations', JSON.stringify(parsedLocations));
        
        setResult({
          success: true,
          message: 'Location data enhanced successfully',
          original: originalLocation,
          enhanced: enhancedLocation,
          changes: getChanges(originalLocation, enhancedLocation)
        });
      } else {
        setResult({
          success: true,
          message: 'No enhancements needed for this location',
          location: originalLocation
        });
      }
    } catch (e) {
      setResult({
        success: false,
        message: 'Failed to enhance location data',
        error: e.message
      });
    }
  };
  
  // Helper to identify changes between original and enhanced location
  const getChanges = (original, enhanced) => {
    const changes = {};
    
    for (const key in enhanced) {
      if (JSON.stringify(original[key]) !== JSON.stringify(enhanced[key])) {
        changes[key] = {
          from: original[key],
          to: enhanced[key]
        };
      }
    }
    
    return changes;
  };

  return (
    <div className="space-y-4">
      <Button 
        onClick={enhanceLatestLocation} 
        className="w-full bg-gradient-to-r from-purple-600 to-indigo-600"
      >
        <Sparkles className="mr-2 h-4 w-4" />
        Enhance Location Data
      </Button>
      
      {result && (
        <Alert variant={result.success ? "default" : "destructive"}>
          <div className="flex items-center gap-2">
            {result.success ? 
              <CheckCircle className="h-4 w-4" /> : 
              <AlertCircle className="h-4 w-4" />
            }
            <AlertTitle>{result.success ? "Success" : "Error"}</AlertTitle>
          </div>
          <AlertDescription>
            <p>{result.message}</p>
            
            {result.changes && Object.keys(result.changes).length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="font-medium">Changes made:</p>
                {Object.entries(result.changes).map(([key, change]) => (
                  <div key={key} className="bg-slate-100 dark:bg-slate-800 p-2 rounded">
                    <p className="font-medium text-sm">{key}:</p>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="line-through text-red-500">
                        {typeof change.from === 'object' 
                          ? JSON.stringify(change.from) 
                          : change.from}
                      </span>
                      <span>→</span>
                      <span className="text-green-500">
                        {typeof change.to === 'object' 
                          ? JSON.stringify(change.to) 
                          : change.to}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {result.location && (
              <pre className="mt-2 p-2 bg-slate-100 dark:bg-slate-800 rounded text-xs overflow-auto">
                {JSON.stringify(result.location, null, 2)}
              </pre>
            )}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}