'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, Upload, ArrowLeft, MapPin, Building2, Trophy, Share2, Check } from 'lucide-react';
import Link from 'next/link';
import exifr from 'exifr';

export default function LandmarkRecognitionPage() {
  const [uploading, setUploading] = useState(false);
  const [stats, setStats] = useState({ total: 847, target: 50000 });
  const [myContributions, setMyContributions] = useState(0);
  const [copied, setCopied] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);

    try {
      const deviceId = localStorage.getItem('deviceId') || `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('deviceId', deviceId);

      const exif = await exifr.parse(file, { gps: true });
      
      if (!exif?.latitude || !exif?.longitude) {
        alert('❌ No GPS data found. Please upload a geotagged photo of a landmark.');
        setUploading(false);
        return;
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('latitude', exif.latitude.toString());
      formData.append('longitude', exif.longitude.toString());
      formData.append('deviceId', deviceId);
      formData.append('dataset', 'landmark-recognition');

      const res = await fetch('/api/gamification/contribute', {
        method: 'POST',
        body: formData
      });

      const result = await res.json();
      
      if (result.success) {
        setStats(prev => ({ ...prev, total: prev.total + 1 }));
        setMyContributions(prev => prev + 1);
        alert(`✓ Landmark image uploaded! Total: ${stats.total + 1}/50,000`);
      }

      setUploading(false);
    } catch (error) {
      console.error('Upload error:', error);
      alert('❌ Error processing image. Please try again.');
      setUploading(false);
    }
  };

  const shareProgress = () => {
    const text = `I contributed ${myContributions} landmark images to Landmark-Recognition-50K! Help build this open dataset for AI research. 🏛️📸`;
    const url = window.location.href;
    
    if (navigator.share) {
      navigator.share({ title: 'Landmark-Recognition-50K', text, url });
    } else {
      navigator.clipboard.writeText(`${text}\n${url}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const progress = (stats.total / stats.target) * 100;

  return (
    <div className="min-h-screen bg-white">
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-stone-200">
        <div className="max-w-[1400px] mx-auto px-6 py-5 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <img src="/pic2nav.png" alt="Pic2Nav" className="h-9" />
            <span className="text-base font-mono tracking-wide text-stone-900">
              Pic2Nav Research
            </span>
          </Link>

          <Button variant="outline" className="border-stone-900 text-stone-900 hover:bg-stone-900 hover:text-white transition-all font-medium" asChild>
            <Link href="/datasets">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Datasets
            </Link>
          </Button>
        </div>
      </nav>

      <section className="py-32 bg-gradient-to-b from-white to-stone-50">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="flex items-center gap-3 mb-6">
            <Building2 className="h-8 w-8 text-stone-600" />
            <span className="text-sm uppercase tracking-[0.2em] text-stone-500 font-mono">
              Dataset
            </span>
          </div>

          <h1 className="text-6xl leading-[1.1] font-bold text-stone-900 mb-6 tracking-tight">
            Landmark-Recognition-50K
          </h1>

          <p className="text-xl text-stone-600 leading-relaxed mb-10 max-w-[800px]">
            A curated dataset of 50,000 landmark images with GPS coordinates, building names, and architectural metadata for training landmark recognition models.
          </p>

          <div className="flex items-center gap-4">
            <span className="px-4 py-2 bg-amber-100 text-amber-800 text-sm font-medium rounded-full">
              In Collection
            </span>
            <span className="text-stone-600">
              {stats.total.toLocaleString()} / {stats.target.toLocaleString()} images
            </span>
          </div>
        </div>
      </section>

      <section className="py-16 border-t border-stone-200 bg-white">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="bg-stone-50 border border-stone-200 p-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-stone-900">Collection Progress</h3>
              <span className="text-2xl font-bold text-stone-900">{progress.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-stone-200 h-4 rounded-full overflow-hidden">
              <div 
                className="bg-gradient-to-r from-stone-900 to-stone-700 h-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="mt-4 text-sm text-stone-600">
              {(stats.target - stats.total).toLocaleString()} images remaining
            </div>
          </div>
        </div>
      </section>

      <section className="py-32 border-t border-stone-200 bg-stone-50">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16">
            <div>
              <h2 className="text-4xl font-bold mb-6 tracking-tight text-stone-900">
                Contribute Landmarks
              </h2>
              <p className="text-lg text-stone-600 mb-8 leading-relaxed">
                Upload photos of famous landmarks, monuments, historical buildings, and iconic structures from around the world.
              </p>

              {myContributions > 0 && (
                <div className="bg-white border border-stone-200 p-6 mb-8">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-stone-900">Your Contributions</h3>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={shareProgress}
                    >
                      {copied ? <Check className="h-4 w-4 mr-2" /> : <Share2 className="h-4 w-4 mr-2" />}
                      {copied ? 'Copied!' : 'Share'}
                    </Button>
                  </div>
                  <div className="text-3xl font-bold text-stone-900">{myContributions}</div>
                  <div className="text-sm text-stone-600">Landmark images uploaded</div>
                </div>
              )}

              <div className="space-y-4 text-stone-600">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-stone-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-stone-900">Famous Landmarks:</strong> Eiffel Tower, Statue of Liberty, Taj Mahal, etc.
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Building2 className="h-5 w-5 text-stone-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-stone-900">Historical Buildings:</strong> Castles, temples, cathedrals, monuments
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Trophy className="h-5 w-5 text-stone-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-stone-900">Iconic Structures:</strong> Bridges, towers, modern architecture
                  </div>
                </div>
              </div>
            </div>

            <div>
              <div className="border-2 border-dashed border-stone-300 bg-white p-12 text-center hover:border-stone-400 transition-colors">
                <Camera className="h-16 w-16 text-stone-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-stone-900 mb-2">Upload Landmark Photo</h3>
                <p className="text-stone-600 mb-6">Must include GPS coordinates in EXIF data</p>
                
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleUpload}
                  disabled={uploading}
                  className="hidden"
                  id="landmark-upload"
                />
                <label htmlFor="landmark-upload">
                  <Button 
                    disabled={uploading} 
                    className="bg-stone-900 hover:bg-stone-800 text-white font-medium"
                    asChild
                  >
                    <span>
                      {uploading ? (
                        <>
                          <Upload className="mr-2 h-4 w-4 animate-pulse" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="mr-2 h-4 w-4" />
                          Choose File
                        </>
                      )}
                    </span>
                  </Button>
                </label>
              </div>

              <div className="mt-6 bg-blue-50 border border-blue-200 p-6">
                <h4 className="font-semibold text-blue-900 mb-2">What We Need</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>✓ Clear view of the landmark</li>
                  <li>✓ GPS coordinates in EXIF</li>
                  <li>✓ Well-lit, high quality</li>
                  <li>✓ Multiple angles welcome</li>
                  <li>✓ No heavy filters or edits</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-32 border-t border-stone-200 bg-white">
        <div className="max-w-[1400px] mx-auto px-6">
          <h2 className="text-4xl font-bold mb-12 tracking-tight text-stone-900">
            Dataset Structure
          </h2>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-stone-50 border border-stone-200 p-8">
              <h3 className="text-xl font-semibold text-stone-900 mb-4">Metadata Schema</h3>
              <pre className="text-sm text-stone-700 overflow-x-auto">
{`{
  "image_id": "landmark_00001",
  "landmark_name": "Eiffel Tower",
  "latitude": 48.8584,
  "longitude": 2.2945,
  "country": "France",
  "city": "Paris",
  "category": "monument",
  "year_built": 1889,
  "architect": "Gustave Eiffel"
}`}
              </pre>
            </div>

            <div className="bg-stone-50 border border-stone-200 p-8">
              <h3 className="text-xl font-semibold text-stone-900 mb-4">Categories</h3>
              <div className="space-y-2 text-stone-700">
                <div>• Monuments & Memorials</div>
                <div>• Religious Buildings</div>
                <div>• Historical Structures</div>
                <div>• Modern Architecture</div>
                <div>• Natural Landmarks</div>
                <div>• Bridges & Infrastructure</div>
                <div>• Cultural Sites</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-stone-200 py-16 px-6 bg-white">
        <div className="max-w-[1400px] mx-auto">
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <img src="/pic2nav.png" alt="Pic2Nav" className="h-10 w-auto" />
            <p className="text-base text-stone-600">© {new Date().getFullYear()} Pic2Nav Research. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
