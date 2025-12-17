'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Play, Database, Brain, Eye } from 'lucide-react';

export default function MLTrainingPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [training, setTraining] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/ml/train');
      const data = await res.json();
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const triggerTraining = async (model: string) => {
    setTraining(model);
    setLoading(true);
    try {
      const res = await fetch('/api/ml/train', {
        method: 'POST',
      });
      const data = await res.json();
      alert(data.success ? `Training started: ${data.version}` : data.message);
      fetchStats();
    } catch (error) {
      alert('Training failed');
    } finally {
      setLoading(false);
      setTraining(null);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">NaviSense AI Training</h1>
        <p className="text-muted-foreground">Train and monitor NaviSense AI models</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Index Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.index?.total_buildings || 0}</div>
            <p className="text-sm text-muted-foreground">Buildings indexed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Active Model
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-mono">{stats?.models?.active_version || 'None'}</div>
            <p className="text-sm text-muted-foreground">Current version</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Training Queue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.active_learning?.queue_size || 0}</div>
            <p className="text-sm text-muted-foreground">Samples ready</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Model Training</CardTitle>
          <CardDescription>Trigger training for specific models</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h3 className="font-semibold">Geolocation Model</h3>
              <p className="text-sm text-muted-foreground">Predicts location from building images</p>
              <div className="mt-2">
                {stats?.models?.loaded?.geolocation ? (
                  <Badge variant="default">Loaded</Badge>
                ) : (
                  <Badge variant="secondary">Not Loaded</Badge>
                )}
              </div>
            </div>
            <Button
              onClick={() => triggerTraining('geolocation')}
              disabled={loading || training === 'geolocation'}
            >
              {training === 'geolocation' ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Training...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Train
                </>
              )}
            </Button>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h3 className="font-semibold">Landmark Model</h3>
              <p className="text-sm text-muted-foreground">Identifies famous landmarks</p>
              <div className="mt-2">
                {stats?.models?.loaded?.landmark ? (
                  <Badge variant="default">Loaded</Badge>
                ) : (
                  <Badge variant="secondary">Not Loaded</Badge>
                )}
              </div>
            </div>
            <Button
              onClick={() => triggerTraining('landmark')}
              disabled={loading || training === 'landmark'}
            >
              {training === 'landmark' ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Training...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Train
                </>
              )}
            </Button>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h3 className="font-semibold">Auto Training</h3>
              <p className="text-sm text-muted-foreground">
                Automatically retrain when samples ready
              </p>
              <div className="mt-2">
                {stats?.active_learning?.should_retrain ? (
                  <Badge variant="default">Ready to Train</Badge>
                ) : (
                  <Badge variant="secondary">Collecting Data</Badge>
                )}
              </div>
            </div>
            <Button
              onClick={() => triggerTraining('auto')}
              disabled={!stats?.active_learning?.should_retrain || loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Training...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Train Now
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
