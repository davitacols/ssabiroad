"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, Clock, BookOpen, MapPin, LightbulbIcon, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from "framer-motion";

interface AIContentGeneratorProps {
  location: any;
}

export function AIContentGenerator({ location }: AIContentGeneratorProps) {
  const [activeTab, setActiveTab] = useState("description");
  const [content, setContent] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({
    description: false,
    history: false,
    itinerary: false,
    tips: false,
  });
  const [error, setError] = useState<string | null>(null);

  const generateContent = async (type: string) => {
    if (content[type]) return; // Already generated
    
    setIsLoading({ ...isLoading, [type]: true });
    setError(null);
    
    try {
      const response = await fetch("/api/ai-descriptions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          location,
          type,
        }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to generate content");
      }
      
      const data = await response.json();
      setContent({ ...content, [type]: data.text });
    } catch (err) {
      console.error("Error generating content:", err);
      setError("Failed to generate content. Please try again.");
    } finally {
      setIsLoading({ ...isLoading, [type]: false });
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          AI-Generated Content
        </CardTitle>
        <CardDescription>
          Discover AI-generated insights about {location}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={(value) => {
          setActiveTab(value);
          if (!content[value]) {
            generateContent(value);
          }
        }}>
          <TabsList className="grid grid-cols-4 mb-4">
            <TabsTrigger value="description" className="flex items-center gap-1">
              <Sparkles className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Description</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-1">
              <BookOpen className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">History</span>
            </TabsTrigger>
            <TabsTrigger value="itinerary" className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Itinerary</span>
            </TabsTrigger>
            <TabsTrigger value="tips" className="flex items-center gap-1">
              <LightbulbIcon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Tips</span>
            </TabsTrigger>
          </TabsList>
          
          <AnimatePresence mode="wait">
            {["description", "history", "itinerary", "tips"].map((type) => (
              <TabsContent key={type} value={type} className="min-h-[200px]">
                {isLoading[type] ? (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center h-[200px]"
                  >
                    <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                    <p className="text-muted-foreground">Generating {type}...</p>
                  </motion.div>
                ) : error ? (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-destructive text-center py-8"
                  >
                    {error}
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-4"
                      onClick={() => generateContent(type)}
                    >
                      Try Again
                    </Button>
                  </motion.div>
                ) : content[type] ? (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="prose prose-sm dark:prose-invert max-w-none"
                  >
                    {content[type].split('\n').map((paragraph, i) => (
                      <p key={i}>{paragraph}</p>
                    ))}
                  </motion.div>
                ) : (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center h-[200px]"
                  >
                    <Button onClick={() => generateContent(type)}>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate {type.charAt(0).toUpperCase() + type.slice(1)}
                    </Button>
                  </motion.div>
                )}
              </TabsContent>
            ))}
          </AnimatePresence>
        </Tabs>
      </CardContent>
      <CardFooter className="text-xs text-muted-foreground">
        AI-generated content may not always be accurate. Please verify important information.
      </CardFooter>
    </Card>
  );
}
