'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Loader2, Play, Database, Brain, Eye, CheckCircle, XCircle, AlertCircle, RefreshCw, Activity } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface MLStats {
  total_recognitions: number;
  verified_feedback: number;
  vectors_in_pinecone: number;
  ready_for_training: number;
  navisense_training: number;
  feedback_ready: number;
}

interface MLHealth {
  status: string;
  model: string;
  device: string;
  vectors_in_db: number;
}

interface SyncResult {
  success: boolean;
  synced: number;
  skipped: number;
  failed: number;
  message: string;
}

export default function MLTrainingPage() {
  const [stats, setStats] = useState<MLStats | null>(null);
  const [health, setHealth] = useState<MLHealth | null>(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<SyncResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const ML_URL = process.env.NEXT_PUBLIC_ML_API_URL || 'https://navisense-ml-678649320532.us-east1.run.app';
      
      const [healthRes, statsRes] = await Promise.all([
        fetch(`${ML_URL}/health`).catch(() => null),
        fetch(`${ML_URL}/stats`).catch(() => null)
      ]);

      if (healthRes?.ok) {
        const healthData = await healthRes.json();
        setHealth(healthData);
      } else {
        console.warn('Health endpoint failed:', healthRes?.status);
      }

      if (statsRes?.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      } else {
        console.warn('Stats endpoint failed:', statsRes?.status);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch ML service data');
    } finally {
      setLoading(false);
    }
  };

  const triggerSync = async () => {
    setSyncing(true);
    setError(null);
    try {
      const ML_URL = process.env.NEXT_PUBLIC_ML_API_URL || 'https://navisense-ml-678649320532.us-east1.run.app';
      const res = await fetch(`${ML_URL}/sync-training`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (res.ok) {
        const data: SyncResult = await res.json();
        setLastSync(data);
        await fetchData();
      } else {
        const errorText = await res.text();
        setError(`Sync failed (${res.status}): ${errorText}`);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to trigger sync');
    } finally {
      setSyncing(false);
    }
  };

  const trainingProgress = stats ? 
    Math.round((stats.vectors_in_pinecone / Math.max(stats.verified_feedback, 1)) * 100) : 0;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Navisense ML Training Dashboard</h1>
          <p className="text-muted-foreground">Monitor and manage ML model training</p>
        </div>
        <Button onClick={fetchData} disabled={loading} variant="outline">
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Service Health */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            ML Service Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          {health ? (
            <div className="grid gap-4 md:grid-cols-4">
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <div className="flex items-center gap-2 mt-1">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="font-semibold">{health.status}</span>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Model</p>
                <p className="font-mono text-sm mt-1">{health.model}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Device</p>
                <p className="font-semibold mt-1">{health.device.toUpperCase()}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Vectors Stored</p>
                <p className="text-2xl font-bold mt-1 text-blue-600">{health.vectors_in_db}</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-muted-foreground">
              <XCircle className="h-4 w-4 text-red-500" />
              <span>ML Service Offline</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Training Statistics */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Total Recognitions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.total_recognitions || 0}</div>
            <p className="text-sm text-muted-foreground">Location detections</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Verified Feedback
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.verified_feedback || 0}</div>
            <p className="text-sm text-muted-foreground">User confirmations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Trained Locations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.vectors_in_pinecone || 0}</div>
            <p className="text-sm text-muted-foreground">In Pinecone DB</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Ready to Train
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.ready_for_training || 0}</div>
            <p className="text-sm text-muted-foreground">Pending training</p>
          </CardContent>
        </Card>
      </div>

      {/* Training Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Training Progress</CardTitle>
          <CardDescription>
            {stats?.vectors_in_pinecone || 0} of {stats?.verified_feedback || 0} verified locations trained
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Training Coverage</span>
              <span className="font-semibold">{trainingProgress}%</span>
            </div>
            <Progress value={trainingProgress} className="h-2" />
          </div>
          
          {stats && stats.ready_for_training > 0 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {stats.ready_for_training} verified location(s) are ready for training:
                {stats.navisense_training > 0 && ` ${stats.navisense_training} from training data`}
                {stats.feedback_ready > 0 && ` ${stats.feedback_ready} from user feedback`}.
                Note: Only locations with images can be trained.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Training Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Training Actions</CardTitle>
          <CardDescription>Sync verified feedback and train the model</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex-1">
              <h3 className="font-semibold">Sync Training Data</h3>
              <p className="text-sm text-muted-foreground">
                Download images from S3, generate CLIP embeddings, and store in Pinecone.
                Processes both NavisenseTraining data and verified user feedback.
              </p>
              <div className="mt-2 flex gap-2">
                {health ? (
                  <Badge variant="default">Service Online</Badge>
                ) : (
                  <Badge variant="destructive">Service Offline</Badge>
                )}
                {stats && stats.ready_for_training > 0 && (
                  <Badge variant="secondary">{stats.ready_for_training} Ready</Badge>
                )}
              </div>
            </div>
            <Button
              onClick={triggerSync}
              disabled={syncing || !health}
              size="lg"
            >
              {syncing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Sync Training Data
                </>
              )}
            </Button>
          </div>

          {lastSync && (
            <div className="p-4 border rounded-lg bg-muted/50">
              <h4 className="font-semibold mb-2">Last Sync Result</h4>
              <div className="grid grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Synced</p>
                  <p className="text-lg font-bold text-green-600">{lastSync.synced}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Skipped</p>
                  <p className="text-lg font-bold text-yellow-600">{lastSync.skipped}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Failed</p>
                  <p className="text-lg font-bold text-red-600">{lastSync.failed}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <p className="text-lg font-bold">
                    {lastSync.success ? (
                      <span className="text-green-600">Success</span>
                    ) : (
                      <span className="text-red-600">Failed</span>
                    )}
                  </p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-2">{lastSync.message}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Model Information */}
      <Card>
        <CardHeader>
          <CardTitle>Model Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Model Architecture</p>
                <p className="font-semibold">CLIP ViT-B/32</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Embedding Dimensions</p>
                <p className="font-semibold">512</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Vector Database</p>
                <p className="font-semibold">Pinecone</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Similarity Metric</p>
                <p className="font-semibold">Cosine Similarity</p>
              </div>
            </div>
            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground mb-2">Training Process</p>
              <ol className="text-sm space-y-1 list-decimal list-inside">
                <li>User uploads image and confirms location</li>
                <li>Image stored in S3 with metadata</li>
                <li>Sync training downloads image from S3</li>
                <li>CLIP generates 512-dimensional embedding</li>
                <li>Embedding stored in Pinecone with location data</li>
                <li>Model automatically improves for future predictions</li>
              </ol>
            </div>
            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground mb-2">Service Endpoints</p>
              <div className="text-xs font-mono space-y-1">
                <div>GET /health - Service status and model info</div>
                <div>GET /stats - Training statistics from database</div>
                <div>POST /sync-training - Sync verified data to Pinecone</div>
                <div>POST /predict - Location prediction from image</div>
                <div>POST /train - Add new training data directly</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
