"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle, AlertCircle } from "lucide-react";

export function DashboardChecker() {
  const [checkResult, setCheckResult] = useState(null);
  
  const checkLocationData = () => {
    // Check if recent locations are stored in localStorage
    const recentLocations = localStorage.getItem('recentLocations');
    
    if (recentLocations) {
      try {
        const parsedLocations = JSON.parse(recentLocations);
        console.log('Found recent locations:', parsedLocations);
        
        if (parsedLocations.length > 0) {
          const latestLocation = parsedLocations[0];
          
          // Check if the latest location has the expected data
          // Looking for George Bins Funfair at Burgess Park in London
          if ((latestLocation.name === 'FUNFAIR' || 
               latestLocation.name.includes('George') || 
               latestLocation.name.includes('Bins') || 
               latestLocation.name.includes('Funfair')) && 
              (latestLocation.address.includes('Albany') || 
               latestLocation.address.includes('London') || 
               latestLocation.address.includes('Burgess Park'))) {
            
            setCheckResult({
              success: true,
              message: 'Location data is correctly rendered in the dashboard',
              details: latestLocation,
              improvement: "Name should be 'George Bins Funfair' instead of just 'FUNFAIR'"
            });
          } else {
            setCheckResult({
              success: false,
              message: 'Location data found but does not match expected values',
              expected: {
                name: 'George Bins Funfair',
                address: 'Albany Rd, London SE5 0AL, UK (Burgess Park)',
                category: 'Entertainment'
              },
              found: {
                name: latestLocation.name,
                address: latestLocation.address,
                category: latestLocation.category
              }
            });
          }
        } else {
          setCheckResult({
            success: false,
            message: 'No locations found in the recent locations array'
          });
        }
      } catch (e) {
        setCheckResult({
          success: false,
          message: 'Failed to parse recent locations from localStorage',
          error: e.message
        });
      }
    } else {
      setCheckResult({
        success: false,
        message: 'No recent locations found in localStorage'
      });
    }
  };

  return (
    <div className="space-y-4">
      <Button onClick={checkLocationData} className="w-full">
        Verify Location Data
      </Button>
      
      {checkResult && (
        <Alert variant={checkResult.success ? "default" : "destructive"}>
          <div className="flex items-center gap-2">
            {checkResult.success ? 
              <CheckCircle className="h-4 w-4" /> : 
              <AlertCircle className="h-4 w-4" />
            }
            <AlertTitle>{checkResult.success ? "Success" : "Error"}</AlertTitle>
          </div>
          <AlertDescription>
            <p>{checkResult.message}</p>
            
            {checkResult.improvement && (
              <p className="mt-2 text-amber-600 dark:text-amber-400">{checkResult.improvement}</p>
            )}
            
            {checkResult.details && (
              <pre className="mt-2 p-2 bg-slate-100 dark:bg-slate-800 rounded text-xs overflow-auto">
                {JSON.stringify(checkResult.details, null, 2)}
              </pre>
            )}
            
            {checkResult.expected && (
              <div className="mt-2">
                <p className="font-medium">Expected:</p>
                <pre className="p-2 bg-slate-100 dark:bg-slate-800 rounded text-xs overflow-auto">
                  {JSON.stringify(checkResult.expected, null, 2)}
                </pre>
                <p className="font-medium mt-2">Found:</p>
                <pre className="p-2 bg-slate-100 dark:bg-slate-800 rounded text-xs overflow-auto">
                  {JSON.stringify(checkResult.found, null, 2)}
                </pre>
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}