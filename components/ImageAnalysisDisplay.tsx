import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Camera, MapPin, Paint, Shield, Sun } from 'lucide-react';

const ImageAnalysisDisplay = () => {
  const [imageUrl, setImageUrl] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch('/api/process-image', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      setAnalysis(data);
      setImageUrl(URL.createObjectURL(file));
    } catch (error) {
      console.error('Error analyzing image:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="w-6 h-6" />
            Image Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            
            {isLoading && (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                <p className="mt-2 text-gray-600">Analyzing image...</p>
              </div>
            )}

            {imageUrl && (
              <div className="space-y-4">
                <div className="aspect-video relative rounded-lg overflow-hidden bg-gray-100">
                  <img
                    src={imageUrl}
                    alt="Analyzed"
                    className="absolute inset-0 w-full h-full object-contain"
                  />
                </div>

                {analysis && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Building Information */}
                    {analysis.buildings?.map((building, index) => (
                      <Card key={index} className="p-4">
                        <div className="flex items-start gap-2">
                          <MapPin className="w-5 h-5 text-blue-600 mt-1" />
                          <div>
                            <h3 className="font-medium">{building.description}</h3>
                            <p className="text-sm text-gray-600">
                              Confidence: {(building.confidence * 100).toFixed(1)}%
                            </p>
                            {building.location && (
                              <p className="text-sm text-gray-600">
                                Location: {building.location.lat.toFixed(4)}, {building.location.lng.toFixed(4)}
                              </p>
                            )}
                          </div>
                        </div>
                      </Card>
                    ))}

                    {/* Analysis Results */}
                    <Card className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Sun className="w-5 h-5 text-yellow-600" />
                          <div>
                            <p className="font-medium">Lighting</p>
                            <p className="text-sm text-gray-600">
                              {analysis.analysis?.lightingConditions}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Paint className="w-5 h-5 text-purple-600" />
                          <div>
                            <p className="font-medium">Main Colors</p>
                            <div className="flex gap-2 mt-1">
                              {analysis.analysis?.mainColors.map((color, index) => (
                                <div
                                  key={index}
                                  className="w-6 h-6 rounded"
                                  style={{ backgroundColor: color }}
                                />
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Shield className="w-5 h-5 text-green-600" />
                          <div>
                            <p className="font-medium">Content Safety</p>
                            <p className="text-sm text-gray-600">
                              {analysis.contentModerationScore < 0.3
                                ? 'Safe'
                                : analysis.contentModerationScore < 0.7
                                ? 'Moderate'
                                : 'Sensitive'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ImageAnalysisDisplay;