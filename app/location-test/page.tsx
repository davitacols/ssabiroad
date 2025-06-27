"use client";

import { LocationTest } from "@/components/pic2nav/location-test";

export default function LocationTestPage() {
  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <h1 className="text-2xl font-bold mb-6">Location Recognition API Test</h1>
      <LocationTest />
    </div>
  );
}