"use client";

import { CameraRecognition } from "@/components/pic2nav";
import { Separator } from "@/components/ui/separator";

export default function CameraPage() {
  return (
    <div className="container max-w-md mx-auto py-6 px-4">
      <div className="space-y-2 mb-6">
        <h1 className="text-2xl font-bold">Location Recognition</h1>
        <p className="text-sm text-muted-foreground">
          Take a photo to identify buildings, landmarks, and businesses
        </p>
      </div>
      
      <Separator className="my-4" />
      
      <CameraRecognition />
      
      <div className="mt-8 text-xs text-muted-foreground">
        <p className="mb-1">
          This feature uses your camera and location to identify places around you.
        </p>
        <p>
          Results include environmental data, business information, and architectural details when available.
        </p>
      </div>
    </div>
  );
}