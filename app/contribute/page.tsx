'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Camera, Trophy, Zap, Target, Upload, Award, TrendingUp } from 'lucide-react';
import Link from 'next/link';

export default function GamificationPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (session?.user?.id) {
      fetchStats();
    }
    fetchLeaderboard();
  }, [session]);

  const fetchStats = async () => {
    const res = await fetch(`/api/gamification/contribute?userId=${session?.user?.id}`);
    const data = await res.json();
    setStats(data);
  };

  const fetchLeaderboard = async () => {
    const res = await fetch('/api/gamification/contribute');
    const data = await res.json();
    setLeaderboard(data.leaderboard);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);

    const deviceId = localStorage.getItem('deviceId') || `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('deviceId', deviceId);

    navigator.geolocation.getCurrentPosition(async (position) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('latitude', position.coords.latitude.toString());
      formData.append('longitude', position.coords.longitude.toString());
      formData.append('deviceId', deviceId);

      const geocodeRes = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${position.coords.latitude},${position.coords.longitude}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
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
        alert(`🎉 +${result.points.earned} points! ${result.badges.new.length > 0 ? `New badge: ${result.badges.new[0].icon} ${result.badges.new[0].name}!` : ''}`);
        fetchStats();
        fetchLeaderboard();
      }

      setUploading(false);
    });
  };

  const badges = [
    { name: 'Explorer', requirement: 10, icon: '🗺️' },
    { name: 'Contributor', requirement: 50, icon: '⭐' },
    { name: 'Champion', requirement: 100, icon: '🏆' },
    { name: 'Legend', requirement: 500, icon: '👑' },
    { name: 'Master', requirement: 1000, icon: '💎' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Contribute & Earn Rewards</h1>
              <p className="text-slate-600 mt-1">Help improve our AI by sharing location photos</p>
            </div>
            <Button variant="outline" asChild>
              <Link href="/">← Back Home</Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-yellow-500 to-orange-500 text-white border-0">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-100 text-sm font-medium">Total Points</p>
                  <p className="text-4xl font-bold mt-1">{stats?.points || 0}</p>
                </div>
                <Trophy className="h-12 w-12 text-yellow-100 opacity-80" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500 to-cyan-500 text-white border-0">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Contributions</p>
                  <p className="text-4xl font-bold mt-1">{stats?.contributions || 0}</p>
                </div>
                <Camera className="h-12 w-12 text-blue-100 opacity-80" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500 to-red-500 text-white border-0">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm font-medium">Day Streak</p>
                  <p className="text-4xl font-bold mt-1">{stats?.streak || 0}</p>
                </div>
                <Zap className="h-12 w-12 text-orange-100 opacity-80" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-emerald-500 text-white border-0">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Global Rank</p>
                  <p className="text-4xl font-bold mt-1">#{stats?.rank || '-'}</p>
                </div>
                <Target className="h-12 w-12 text-green-100 opacity-80" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Upload Section */}
            <Card className="border-slate-200 shadow-lg">
              <CardHeader className="border-b border-slate-100">
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5 text-blue-600" />
                  Upload Photo & Earn Points
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-6">
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-100">
                    <p className="text-slate-700 mb-4">
                      Take a photo of any building or location in Nigeria and contribute to our AI training dataset.
                    </p>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div className="text-center">
                        <div className="text-2xl mb-1">💰</div>
                        <div className="font-semibold text-slate-900">10 points</div>
                        <div className="text-slate-600">Per photo</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl mb-1">🔥</div>
                        <div className="font-semibold text-slate-900">+20 points</div>
                        <div className="text-slate-600">Daily streak</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl mb-1">🎁</div>
                        <div className="font-semibold text-slate-900">+50 points</div>
                        <div className="text-slate-600">First upload</div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-center gap-4">
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleUpload}
                      disabled={uploading}
                      className="hidden"
                      id="photo-upload"
                    />
                    <label htmlFor="photo-upload" className="w-full">
                      <Button 
                        disabled={uploading} 
                        className="w-full h-14 text-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                        asChild
                      >
                        <span>
                          <Camera className="mr-2 h-5 w-5" />
                          {uploading ? 'Uploading...' : 'Take Photo & Contribute'}
                        </span>
                      </Button>
                    </label>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Badges */}
            <Card className="border-slate-200 shadow-lg">
              <CardHeader className="border-b border-slate-100">
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-yellow-600" />
                  Achievement Badges
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-5 gap-4">
                  {badges.map((badge) => {
                    const earned = (stats?.contributions || 0) >= badge.requirement;
                    return (
                      <div
                        key={badge.name}
                        className={`text-center p-4 rounded-xl transition-all ${
                          earned 
                            ? 'bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-300 shadow-md' 
                            : 'bg-slate-50 border-2 border-slate-200 opacity-60'
                        }`}
                      >
                        <div className="text-4xl mb-2">{badge.icon}</div>
                        <div className="font-semibold text-sm text-slate-900">{badge.name}</div>
                        <div className="text-xs text-slate-600 mt-1">{badge.requirement}</div>
                        {earned && <div className="text-xs text-green-600 font-semibold mt-1">✓ Unlocked</div>}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Leaderboard */}
          <div>
            <Card className="border-slate-200 shadow-lg sticky top-4">
              <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-slate-100">
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  Top Contributors
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {leaderboard.slice(0, 10).map((user) => (
                    <div
                      key={user.rank}
                      className={`flex items-center justify-between p-3 rounded-lg transition-all ${
                        user.rank <= 3 
                          ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200' 
                          : 'bg-slate-50 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="font-bold text-lg w-8">
                          {user.rank === 1 ? '🥇' : user.rank === 2 ? '🥈' : user.rank === 3 ? '🥉' : `#${user.rank}`}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900">{user.name}</div>
                          <div className="text-xs text-slate-500">{user.contributions} photos</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-yellow-600">{user.points}</div>
                        <div className="text-xs text-slate-500">points</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
