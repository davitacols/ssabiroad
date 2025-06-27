"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { ImageIcon, MapPin, Building2 } from "lucide-react"

export function CameraRecognition({ onLocationSelect }) {
  const [previewUrl, setPreviewUrl] = useState(null)
  const fileInputRef = useRef(null)

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0]
      const fileUrl = URL.createObjectURL(file)
      setPreviewUrl(fileUrl)
    }
  }

  return (
    <div className="space-y-6">
      <div className="relative h-[500px] min-h-[500px] bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-800 rounded-xl overflow-hidden shadow-lg">
        {previewUrl ? (
          <div className="absolute inset-0 flex flex-col overflow-auto">
            <div className="flex-1 overflow-auto p-4">
              <div className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm p-6 rounded-xl border border-slate-200/50 dark:border-slate-700/50 shadow-lg">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                    <MapPin className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-xl">Identified Location</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                      123 Example Street, City
                    </p>
                  </div>
                </div>
              </div>

              {/* Location Photos Gallery */}
              <div className="mt-4 space-y-3">
                <h4 className="text-sm font-medium flex items-center">
                  <ImageIcon className="h-4 w-4 mr-2 text-teal-500" />
                  Location Photos
                </h4>
                
                {/* Main photo */}
                <div className="aspect-video w-full overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-700">
                  <img
                    src={previewUrl}
                    alt="Location"
                    className="w-full h-full object-cover"
                  />
                </div>
                
                {/* Different views of the same image */}
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {[0, 1, 2].map((index) => (
                    <div key={index} className="aspect-square rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-700">
                      <img 
                        src={previewUrl}
                        alt={`Location view ${index + 1}`}
                        className={`w-full h-full object-cover ${
                          // Apply different styling to each image to make them look different
                          index === 0 ? "brightness-110 contrast-105" : 
                          index === 1 ? "saturate-125 hue-rotate-5" : 
                          "brightness-95 contrast-110"
                        }`}
                      />
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Nearby Places */}
              <div className="mt-4 space-y-3">
                <h4 className="text-sm font-medium flex items-center">
                  <MapPin className="h-4 w-4 mr-2 text-teal-500" />
                  Nearby Places
                </h4>
                
                <div className="grid grid-cols-1 gap-2">
                  {[
                    { name: "Coffee Shop", type: "Restaurant", color: "teal" },
                    { name: "City Park", type: "Park", color: "cyan" },
                    { name: "Shopping Mall", type: "Shopping", color: "amber" }
                  ].map((place, index) => (
                    <div key={index} className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-16 h-16 rounded-md overflow-hidden mr-3">
                          <img 
                            src={previewUrl}
                            alt={place.name}
                            className={`w-full h-full object-cover ${
                              index === 0 ? "brightness-110 contrast-105" : 
                              index === 1 ? "saturate-125 hue-rotate-5" : 
                              "brightness-95 contrast-110"
                            }`}
                          />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{place.name}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{place.type}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <Building2 className="w-16 h-16 text-teal-500/80 dark:text-teal-400/80 mx-auto mb-4" />
              <h2 className="text-xl font-bold mb-2">Upload a Photo</h2>
              <p className="text-slate-600 dark:text-slate-300 mb-4 max-w-xs text-center text-sm">
                Select an image to identify the location
              </p>
              <Button
                onClick={() => fileInputRef.current?.click()}
                className="w-full max-w-xs h-12 rounded-xl"
              >
                Select Photo
              </Button>
            </div>
          </div>
        )}
      </div>

      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
    </div>
  )
}