"use client"

import { CameraDiagnostic } from "@/components/CameraDiagnostic"

export default function CameraTestPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Camera Diagnostic</h1>
        <p className="text-muted-foreground">
          Test your camera functionality and troubleshoot issues
        </p>
      </div>
      
      <CameraDiagnostic />
    </div>
  )
}