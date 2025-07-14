import React, { useState } from 'react';

interface VerificationData {
  verified: boolean;
  sources: string[];
  warnings: string[];
  alternatives: Array<{
    address: string;
    confidence: number;
    reason: string;
  }>;
}

interface LocationVerificationBadgeProps {
  verification?: VerificationData;
  businessName: string;
  address: string;
  confidence: number;
  onCorrection?: (correctAddress: string) => void;
}

export default function LocationVerificationBadge({
  verification,
  businessName,
  address,
  confidence,
  onCorrection
}: LocationVerificationBadgeProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [showCorrectionForm, setShowCorrectionForm] = useState(false);
  const [correctionAddress, setCorrectionAddress] = useState('');

  const getConfidenceColor = (conf: number) => {
    if (conf >= 0.8) return 'text-green-600 bg-green-50';
    if (conf >= 0.6) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getConfidenceText = (conf: number) => {
    if (conf >= 0.8) return 'High Confidence';
    if (conf >= 0.6) return 'Medium Confidence';
    return 'Low Confidence';
  };

  const handleSubmitCorrection = async () => {
    if (!correctionAddress.trim()) return;
    
    try {
      const response = await fetch('/api/location-corrections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName,
          incorrectAddress: address,
          correctAddress: correctionAddress
        })
      });
      
      if (response.ok) {
        onCorrection?.(correctionAddress);
        setShowCorrectionForm(false);
        setCorrectionAddress('');
        alert('Thank you! Your correction has been submitted.');
      }
    } catch (error) {
      alert('Failed to submit correction. Please try again.');
    }
  };

  return (
    <div className="mt-3 space-y-2">
      {/* Confidence Badge */}
      <div className="flex items-center gap-2">
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getConfidenceColor(confidence)}`}>
          {getConfidenceText(confidence)} ({Math.round(confidence * 100)}%)
        </span>
        
        {verification?.verified && (
          <span className="px-2 py-1 rounded-full text-xs font-medium text-blue-600 bg-blue-50">
            ✓ Verified by {verification.sources.length} source{verification.sources.length > 1 ? 's' : ''}
          </span>
        )}
        
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-xs text-gray-500 hover:text-gray-700"
        >
          Details
        </button>
      </div>

      {/* Warnings */}
      {verification?.warnings && verification.warnings.length > 0 && (
        <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded">
          ⚠️ {verification.warnings.join(', ')}
        </div>
      )}

      {/* Details Panel */}
      {showDetails && (
        <div className="text-xs bg-gray-50 p-3 rounded space-y-2">
          {verification?.sources && (
            <div>
              <strong>Sources:</strong> {verification.sources.join(', ')}
            </div>
          )}
          
          {verification?.alternatives && verification.alternatives.length > 0 && (
            <div>
              <strong>Alternative locations:</strong>
              <ul className="mt-1 space-y-1">
                {verification.alternatives.map((alt, idx) => (
                  <li key={idx} className="text-gray-600">
                    • {alt.address} ({Math.round(alt.confidence * 100)}% - {alt.reason})
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          <div className="pt-2 border-t">
            <button
              onClick={() => setShowCorrectionForm(!showCorrectionForm)}
              className="text-blue-600 hover:text-blue-800"
            >
              Report incorrect address
            </button>
          </div>
        </div>
      )}

      {/* Correction Form */}
      {showCorrectionForm && (
        <div className="bg-blue-50 p-3 rounded space-y-2">
          <div className="text-sm font-medium">Submit Address Correction</div>
          <input
            type="text"
            placeholder="Enter correct address"
            value={correctionAddress}
            onChange={(e) => setCorrectionAddress(e.target.value)}
            className="w-full px-3 py-2 border rounded text-sm"
          />
          <div className="flex gap-2">
            <button
              onClick={handleSubmitCorrection}
              className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
            >
              Submit
            </button>
            <button
              onClick={() => setShowCorrectionForm(false)}
              className="px-3 py-1 bg-gray-300 text-gray-700 rounded text-sm hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}