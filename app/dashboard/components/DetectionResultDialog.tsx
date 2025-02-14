import React from 'react';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Info, MapPin, X, Navigation } from "lucide-react";

interface DetectionResult {
  success: boolean;
  confidence: number;
  description?: string;
  address?: string;
  type: string;
}

interface DetectionResultDialogProps {
  showResult: boolean;
  setShowResult: (show: boolean) => void;
  detectionResult: DetectionResult | null;
}

const DetectionResultDialog = ({
  showResult,
  setShowResult,
  detectionResult,
}: DetectionResultDialogProps) => {
  if (!detectionResult) return null;

  const handleNavigate = () => {
    if (detectionResult?.address) {
      const destination = encodeURIComponent(detectionResult.address);
      const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${destination}`;
      window.open(mapsUrl, "_blank");
    }
  };

  return (
    <Dialog open={showResult} onOpenChange={setShowResult}>
      <DialogContent className="max-w-md bg-white rounded-lg p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Building Details</h2>
          <button
            onClick={() => setShowResult(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="flex gap-4 border-b">
            <button className="px-4 py-2 text-blue-600 border-b-2 border-blue-600">
              Details
            </button>
            <button className="px-4 py-2 text-gray-500">
              Amenities
            </button>
            <button className="px-4 py-2 text-gray-500">
              Business Info
            </button>
            <button className="px-4 py-2 text-gray-500">
              Nearby
            </button>
          </div>

          <div className="flex items-center gap-2 text-green-600">
            <Info className="w-5 h-5" />
            <span>
              Building detected ({(detectionResult.confidence * 100).toFixed(1)}% confidence)
            </span>
          </div>

          {detectionResult.description && (
            <p className="text-gray-700 whitespace-pre-line">
              {detectionResult.description}
            </p>
          )}

          {detectionResult.address && (
            <>
              <div className="flex items-start gap-2 text-gray-600">
                <MapPin className="w-5 h-5 mt-1 flex-shrink-0" />
                <span>{detectionResult.address}</span>
              </div>
              
              <button 
                onClick={handleNavigate}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg flex items-center justify-center gap-2"
              >
                <Navigation className="w-5 h-5" />
                Open in Maps
              </button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DetectionResultDialog;