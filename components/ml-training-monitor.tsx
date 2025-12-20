'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, TrendingUp, Database } from 'lucide-react';

export function MLTrainingMonitor() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [queueRes, statsRes] = await Promise.all([
        fetch('/api/ml/training-queue'),
        fetch('/api/ml-stats')
      ]);
      const queue = await queueRes.json();
      const stats = await statsRes.json();
      setData({ queue, stats });
    } catch (error) {
      console.error('Failed to fetch ML data:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  if (!data) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            ML Training Status
          </span>
          <Button onClick={fetchData} disabled={loading} size="sm" variant="ghost">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Database className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Queue</span>
            </div>
            <div className="text-2xl font-bold">{data.queue?.queue?.length || 0}</div>
            <Badge variant={data.queue?.queue?.length > 10 ? 'destructive' : 'secondary'} className="mt-1">
              {data.queue?.queue?.length > 10 ? 'High' : 'Normal'}
            </Badge>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Buildings</span>
            </div>
            <div className="text-2xl font-bold">{data.stats?.total_buildings || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {data.stats?.index_size || 0} vectors
            </p>
          </div>
        </div>
        <Button asChild className="w-full mt-4" variant="outline">
          <a href="/ml-training">View Dashboard</a>
        </Button>
      </CardContent>
    </Card>
  );
}
