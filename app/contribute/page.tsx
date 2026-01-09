'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, Upload, CheckCircle2, ArrowLeft, Trophy, Share2, Copy, Check } from 'lucide-react';
import Link from 'next/link';
import exifr from 'exifr';

export default function ContributePage() {
  const [uploading, setUploading] = useState(false);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [myStats, setMyStats] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [uploadCount, setUploadCount] = useState(0);

  useEffect(() => {
    fetchLeaderboard();
    const deviceId = localStorage.getItem('deviceId');
    if (deviceId) {
      fetchMyStats(deviceId);
    }
  }, [uploadCount]);

  const fetchLeaderboard = async () => {
    const res = await fetch('/api/gamification/contribute');
    const data = await res.json();
    setLeaderboard(data.leaderboard?.slice(0, 10) || []);
  };

  const fetchMyStats = async (deviceId: string) => {
    const res = await fetch(`/api/gamification/contribute?deviceId=${deviceId}`);
    const data = await res.json();
    setMyStats(data);
  };

  const shareProgress = () => {
    const text = `I just contributed ${myStats?.contributions || 0} geotagged images to GeoVision-10M! Help build the world's largest open visual geolocation dataset. 🌍📸`;
    const url = window.location.origin + '/contribute';
    
    if (navigator.share) {
      navigator.share({ title: 'GeoVision-10M', text, url });
    } else {
      navigator.clipboard.writeText(`${text}\n${url}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);

    try {
      const deviceId = localStorage.getItem('deviceId') || `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('deviceId', deviceId);

      // Extract EXIF GPS data
      const exif = await exifr.parse(file, { gps: true });
      
      if (!exif?.latitude || !exif?.longitude) {
        alert('❌ No GPS data found in image. Please upload a geotagged photo.');
        setUploading(false);
        return;
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('latitude', exif.latitude.toString());
      formData.append('longitude', exif.longitude.toString());
      formData.append('deviceId', deviceId);

      const geocodeRes = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${exif.latitude},${exif.longitude}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
      );
      const geocodeData = await geocodeRes.json();
      const address = geocodeData.results[0]?.formatted_address || '';
      formData.append('address', address);

      const res = await fetch('/api/gamification/contribute', {
        method: 'POST',
        body: formData
      });

      const result = await res.json();
      
      if (result.success) {
        setUploadCount(prev => prev + 1);
        alert(`✓ Image uploaded successfully! +${result.points.earned} points\n\nYour rank: #${result.rank}`);
      }

      setUploading(false);
    } catch (error) {
      console.error('Upload error:', error);
      alert('❌ Error processing image. Please try again.');
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-stone-200">
        <div className="max-w-[1400px] mx-auto px-6 py-5 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <img src="/pic2nav.png" alt="Pic2Nav" className="h-9" />
            <span className="text-base font-mono tracking-wide text-stone-900">
              Pic2Nav Research
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-12 text-sm font-medium">
            <Link href="/blog" className="text-stone-700 hover:text-stone-900 transition-colors">Publications</Link>
            <Link href="/datasets" className="text-stone-700 hover:text-stone-900 transition-colors">Datasets</Link>
            <Link href="/research" className="text-stone-700 hover:text-stone-900 transition-colors">Research</Link>
          </div>

          <Button variant="outline" className="border-stone-900 text-stone-900 hover:bg-stone-900 hover:text-white transition-all font-medium" asChild>
            <Link href="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back Home
            </Link>
          </Button>
        </div>
      </nav>

      {/* Hero */}
      <section className="py-32 bg-gradient-to-b from-white to-stone-50">
        <div className="max-w-[1400px] mx-auto px-6">
          <p className="text-sm uppercase tracking-[0.2em] text-stone-500 mb-6 font-mono">
            Contribute Data
          </p>

          <h1 className="text-6xl leading-[1.1] font-bold text-stone-900 mb-6 tracking-tight">
            Help Build GeoVision-10M
          </h1>

          <p className="text-xl text-stone-600 leading-relaxed mb-10 max-w-[800px]">
            Contribute your geotagged photos to help create the world's largest open visual geolocation dataset for research.
          </p>
        </div>
      </section>

      {/* Upload Section */}
      <section className="py-32 border-t border-stone-200 bg-white">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16">
            <div>
              <h2 className="text-4xl font-bold mb-6 tracking-tight text-stone-900">
                Upload Your Photos
              </h2>
              <p className="text-lg text-stone-600 mb-8 leading-relaxed">
                Share geotagged images of buildings, landmarks, and urban environments. Each contribution helps improve our AI models.
              </p>

              {myStats && (
                <div className="bg-gradient-to-br from-stone-900 to-stone-700 text-white p-6 mb-8">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Your Progress</h3>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="border-white text-white hover:bg-white hover:text-stone-900"
                      onClick={shareProgress}
                    >
                      {copied ? <Check className="h-4 w-4 mr-2" /> : <Share2 className="h-4 w-4 mr-2" />}
                      {copied ? 'Copied!' : 'Share'}
                    </Button>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <div className="text-3xl font-bold">{myStats.contributions}</div>
                      <div className="text-sm text-stone-300">Images</div>
                    </div>
                    <div>
                      <div className="text-3xl font-bold">{myStats.points}</div>
                      <div className="text-sm text-stone-300">Points</div>
                    </div>
                    <div>
                      <div className="text-3xl font-bold">#{myStats.rank}</div>
                      <div className="text-sm text-stone-300">Rank</div>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-stone-900 mb-1">GPS Data Required</h3>
                    <p className="text-stone-600">Images must contain GPS coordinates in EXIF metadata</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-stone-900 mb-1">Privacy Protected</h3>
                    <p className="text-stone-600">All images are processed to remove personal information</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-stone-900 mb-1">Open Research</h3>
                    <p className="text-stone-600">Your contributions will be part of an open dataset</p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <div className="border-2 border-dashed border-stone-300 bg-stone-50 p-12 text-center hover:border-stone-400 transition-colors">
                <Camera className="h-16 w-16 text-stone-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-stone-900 mb-2">Upload Image</h3>
                <p className="text-stone-600 mb-6">Select a geotagged photo from your device</p>
                
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleUpload}
                  disabled={uploading}
                  className="hidden"
                  id="photo-upload"
                />
                <label htmlFor="photo-upload">
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
                <h4 className="font-semibold text-blue-900 mb-2">Image Guidelines</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Buildings and architectural structures</li>
                  <li>• Landmarks and monuments</li>
                  <li>• Urban and rural environments</li>
                  <li>• Clear, well-lit photos preferred</li>
                  <li>• No people or vehicles in focus</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Leaderboard */}
      <section className="py-32 border-t border-stone-200 bg-white">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="text-center mb-12">
            <Trophy className="h-12 w-12 text-amber-500 mx-auto mb-4" />
            <h2 className="text-4xl font-bold mb-4 tracking-tight text-stone-900">
              Top Contributors
            </h2>
            <p className="text-lg text-stone-600">
              Leading researchers helping build GeoVision-10M
            </p>
          </div>

          <div className="max-w-[800px] mx-auto">
            {leaderboard.length > 0 ? (
              <div className="space-y-2">
                {leaderboard.map((user, index) => (
                  <div 
                    key={user.rank}
                    className={`flex items-center justify-between p-4 border border-stone-200 ${
                      index < 3 ? 'bg-gradient-to-r from-amber-50 to-white' : 'bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-8 h-8 flex items-center justify-center font-bold ${
                        index === 0 ? 'text-amber-500 text-xl' :
                        index === 1 ? 'text-stone-400 text-lg' :
                        index === 2 ? 'text-amber-700 text-lg' :
                        'text-stone-600'
                      }`}>
                        {index < 3 ? '🏆' : `#${user.rank}`}
                      </div>
                      <div>
                        <div className="font-semibold text-stone-900">{user.name}</div>
                        <div className="text-sm text-stone-600">{user.contributions} images</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-stone-900">{user.points}</div>
                      <div className="text-xs text-stone-500">points</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-stone-600">
                Be the first contributor!
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Impact */}
      <section className="py-32 border-t border-stone-200 bg-stone-50">
        <div className="max-w-[1400px] mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold mb-6 tracking-tight text-stone-900">
            Your Impact
          </h2>
          <p className="text-lg text-stone-600 mb-12 max-w-[700px] mx-auto">
            Every image you contribute helps train better AI models for visual geolocation research
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white border border-stone-200 p-8">
              <h3 className="text-3xl font-bold text-stone-900 mb-2">2.3M+</h3>
              <p className="text-stone-600">Images Collected</p>
            </div>
            <div className="bg-white border border-stone-200 p-8">
              <h3 className="text-3xl font-bold text-stone-900 mb-2">1,200+</h3>
              <p className="text-stone-600">Contributors</p>
            </div>
            <div className="bg-white border border-stone-200 p-8">
              <h3 className="text-3xl font-bold text-stone-900 mb-2">150+</h3>
              <p className="text-stone-600">Countries</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
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
