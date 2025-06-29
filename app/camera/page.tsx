"use client";

import { CameraRecognition } from "@/components/pic2nav";
import { CameraDiagnostic } from "@/components/CameraDiagnostic";
import { SimpleCamera } from "@/components/SimpleCamera";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function CameraPage() {
  return (
    <div className="container max-w-4xl mx-auto py-6 px-4">
      <div className="space-y-2 mb-6">
        <h1 className="text-2xl font-bold">Camera & Location Recognition</h1>
        <p className="text-sm text-muted-foreground">
          Take a photo to identify buildings, landmarks, and businesses
        </p>
      </div>
      
      <Tabs defaultValue="camera" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="camera">Camera Recognition</TabsTrigger>
          <TabsTrigger value="diagnostic">Camera Test</TabsTrigger>
        </TabsList>
        
        <TabsContent value="camera" className="space-y-4">
          <CameraRecognition />
          <div className="mt-8 text-xs text-muted-foreground">
            <p className="mb-1">
              This feature uses your camera and location to identify places around you.
            </p>
            <p>
              Results include environmental data, business information, and architectural details when available.
            </p>
          </div>
        </TabsContent>
        
        <TabsContent value="diagnostic">
          <div className="space-y-6">
            <CameraDiagnostic />
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4">Simple Camera Test</h3>
              <SimpleCamera />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}