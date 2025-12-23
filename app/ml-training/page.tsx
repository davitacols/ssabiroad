'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Play, Clock, CheckCircle, AlertCircle } from 'lucide-react';

export default function MLTrainingDashboard() {
  const [queue, setQueue] = useState<any>(null);
  const [status, setStatus] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [training, setTraining] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [queueRes, statusRes, statsRes] = await Promise.all([
        fetch('/api/ml/training-queue'),
        fetch('/api/ml/training-status'),
        fetch('/api/ml-stats')
      ]);
      setQueue(await queueRes.json());
      setStatus(await statusRes.json());
      setStats(await statsRes.json());
    } catch (error) {
      console.error('Failed to fetch data:', error);
    }
    setLoading(false);
  };

  const triggerTraining = async () => {
    setTraining(true);
    try {
      const res = await fetch('/api/ml/train', { method: 'POST' });
      const result = await res.json();
      alert(result.message || 'Training started');
      fetchData();
    } catch (error) {
      alert('Failed to trigger training');
    }
    setTraining(false);
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="container mx-auto p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">ML Training Dashboard</h1>
        <div className="flex gap-2">
          <Button onClick={fetchData} disabled={loading} variant="outline">
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={triggerTraining} disabled={training || !((queue?.items || queue?.samples || queue?.queue)?.length || queue?.total || queue?.queue_size)}>
            <Play className="w-4 h-4 mr-2" />
            {training ? 'Training...' : 'Start Training'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Queue Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{queue?.total || queue?.queue_size || queue?.samples?.length || queue?.queue?.length || 0}</div>
            <p className="text-sm text-muted-foreground">Items waiting</p>
            {queue?.last_training && (
              <p className="text-xs mt-2">Last: {new Date(queue.last_training).toLocaleString()}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {status?.status === 'training' ? <RefreshCw className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
              Training Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={status?.status === 'training' ? 'default' : 'secondary'}>
              {status?.status || 'idle'}
            </Badge>
            {status?.progress && (
              <div className="mt-2">
                <div className="text-sm">{status.progress}%</div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${status.progress}%` }} />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Model Stats
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.index?.total_buildings || stats?.total_buildings || 0}</div>
            <p className="text-sm text-muted-foreground">Total buildings</p>
            <p className="text-xs mt-2">Index: {stats?.index?.index_size || stats?.index_size || 0} vectors</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Training Queue</CardTitle>
        </CardHeader>
        <CardContent>
          {queue?.error ? (
            <p className="text-center text-red-500 py-8">{queue.error}</p>
          ) : (queue?.items || queue?.samples || queue?.queue)?.length > 0 ? (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {(queue?.items || queue?.samples || queue?.queue || []).map((item: any, idx: number) => (
                <div key={idx} className="flex justify-between items-center p-3 border rounded">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{item.image_path || item.filename || `Item ${idx + 1}`}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.metadata?.address || item.address || 'No address'}
                    </p>
                    {item.timestamp && (
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(item.timestamp * 1000).toLocaleString()}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2 items-center">
                    <Badge variant={item.priority === 'high' ? 'destructive' : 'secondary'}>
                      {item.priority || 'normal'}
                    </Badge>
                    {item.metadata?.correction && <Badge variant="outline">Correction</Badge>}
                  </div>
                </div>
              ))}
            </div>
          ) : (queue?.total || queue?.queue_size) > 0 ? (
            <p className="text-center text-muted-foreground py-8">
              {queue?.total || queue?.queue_size} items in queue (details not available)
            </p>
          ) : (
            <p className="text-center text-muted-foreground py-8">No items in queue</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
