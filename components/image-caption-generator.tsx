"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Image, Copy, Check, RefreshCw } from 'lucide-react';
import { motion } from "framer-motion";
import { toast } from "@/components/ui/use-toast";

interface ImageCaptionGeneratorProps {
  location: any;
  imageUrl?: string;
}

export function ImageCaptionGenerator({ location, imageUrl }: ImageCaptionGeneratorProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [caption, setCaption] = useState("");
  const [captionStyle, setCaptionStyle] = useState("informative");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const generateCaption = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch("/api/image-caption", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          location,
          style: captionStyle,
        }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to generate caption");
      }
      
      const data = await response.json();
      setCaption(data.caption || "");
    } catch (err) {
      console.error("Error generating caption:", err);
      setError("Failed to generate caption. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(caption);
    setCopied(true);
    toast({
      title: "Caption copied",
      description: "Caption has been copied to clipboard",
    });
    
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Image className="h-5 w-5 text-primary" />
          Caption Generator
        </CardTitle>
        <CardDescription>
          Create the perfect caption for your photo of {location || "this location"}.name
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {imageUrl && (
            <div className="relative w-full h-48 rounded-md overflow-hidden mb-4">
              <img 
                src={imageUrl || "/placeholder.svg"} 
                alt={location.name || "Location"} 
                className="w-full h-full object-cover"
              />
            </div>
          )}
          
          <div className="flex flex-col sm:flex-row gap-2">
            <Select value={captionStyle} onValueChange={setCaptionStyle}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Caption style" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="informative">Informative</SelectItem>
                <SelectItem value="social">Social Media</SelectItem>
                <SelectItem value="poetic">Poetic</SelectItem>
                <SelectItem value="humorous">Humorous</SelectItem>
              </SelectContent>
            </Select>
            
            <Button 
              onClick={generateCaption} 
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Image className="mr-2 h-4 w-4" />
                  Generate Caption
                </>
              )}
            </Button>
          </div>
          
          {error && (
            <div className="text-destructive text-center py-2">
              {error}
            </div>
          )}
          
          {caption && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative mt-4 p-4 bg-muted rounded-md"
            >
              <p className="pr-10">{caption}</p>
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2"
                onClick={copyToClipboard}
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                className="mt-2"
                onClick={generateCaption}
              >
                <RefreshCw className="h-3 w-3 mr-2" />
                Regenerate
              </Button>
            </motion.div>
          )}
        </div>
      </CardContent>
      <CardFooter className="text-xs text-muted-foreground">
        AI-generated captions may need editing to perfectly match your photo.
      </CardFooter>
    </Card>
  );
}
