"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2, Navigation, MapPin, Compass, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";

interface LocationSuggestionsProps {
  location: any;
  currentLocation?: { latitude: number; longitude: number };
}

export function LocationSuggestions({ location, currentLocation }: LocationSuggestionsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [rawText, setRawText] = useState("");
  const [preferences, setPreferences] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showRaw, setShowRaw] = useState(false);

  const generateSuggestions = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch("/api/location-suggestions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          location,
          currentLocation,
          preferences,
        }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to generate suggestions");
      }
      
      const data = await response.json();
      setSuggestions(data.suggestions || []);
      setRawText(data.text || "");
    } catch (err) {
      console.error("Error generating suggestions:", err);
      setError("Failed to generate suggestions. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Compass className="h-5 w-5 text-primary" />
          Where to Next?
        </CardTitle>
        <CardDescription>
          Get AI-powered suggestions for places to visit near {location.name || "this location"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!suggestions.length && !isLoading ? (
          <div className="space-y-4">
            <Input
              placeholder="Any preferences? (e.g., 'historical sites', 'family-friendly', 'outdoor activities')"
              value={preferences}
              onChange={(e) => setPreferences(e.target.value)}
              className="w-full"
            />
            <Button onClick={generateSuggestions} className="w-full">
              <Navigation className="mr-2 h-4 w-4" />
              Generate Suggestions
            </Button>
          </div>
        ) : isLoading ? (
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Finding interesting places nearby...</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Suggested Places</h3>
              <Button variant="outline" size="sm" onClick={() => setShowRaw(!showRaw)}>
                {showRaw ? "Show Cards" : "Show Raw Text"}
              </Button>
            </div>
            
            {showRaw ? (
              <div className="prose prose-sm dark:prose-invert max-w-none">
                {rawText.split('\n').map((line, i) => (
                  <p key={i}>{line}</p>
                ))}
              </div>
            ) : (
              <AnimatePresence>
                <div className="grid gap-4">
                  {suggestions.map((suggestion, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card>
                        <CardContent className="pt-6">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-medium text-lg">{suggestion.name}</h4>
                              <p className="text-muted-foreground text-sm mt-1">{suggestion.description}</p>
                            </div>
                            <Badge variant="outline" className="ml-2 shrink-0">
                              {suggestion.distance || "Nearby"}
                            </Badge>
                          </div>
                          
                          {suggestion.reason && (
                            <div className="mt-4 bg-muted/50 p-3 rounded-md text-sm">
                              <p>{suggestion.reason}</p>
                            </div>
                          )}
                          
                          <div className="mt-4 flex justify-end">
                            <Button variant="outline" size="sm" asChild>
                              <a 
                                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(suggestion.name)}`} 
                                target="_blank" 
                                rel="noopener noreferrer"
                              >
                                <MapPin className="mr-2 h-4 w-4" />
                                Find on Map
                              </a>
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </AnimatePresence>
            )}
            
            <Button onClick={() => {
              setSuggestions([]);
              setRawText("");
              setPreferences("");
            }} variant="outline" className="w-full">
              Generate New Suggestions
            </Button>
          </div>
        )}
        
        {error && (
          <div className="text-destructive text-center py-4">
            {error}
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2"
              onClick={generateSuggestions}
            >
              Try Again
            </Button>
          </div>
        )}
      </CardContent>
      <CardFooter className="text-xs text-muted-foreground">
        Suggestions are AI-generated and may require verification before visiting.
      </CardFooter>
    </Card>
  );
}
