"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Activity } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts'

interface ActivityData {
  day: string
  detections: number
}

interface ActivityChartProps {
  data: ActivityData[]
  loading?: boolean
}

export function ActivityChart({ data, loading = false }: ActivityChartProps) {
  if (loading || data.length === 0) {
    return (
      <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
            <Activity className="h-5 w-5 text-blue-600" />
            Weekly Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center">
            <div className="animate-pulse text-slate-400">Loading activity data...</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const maxValue = Math.max(...data.map(d => d.detections))
  
  return (
    <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
          <Activity className="h-5 w-5 text-blue-600" />
          Weekly Activity
          <div className="ml-auto text-sm font-normal text-slate-500">
            {data.reduce((sum, d) => sum + d.detections, 0)} total detections
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorDetections" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="opacity-20" />
              <XAxis 
                dataKey="day" 
                className="text-xs text-slate-600 dark:text-slate-400"
                axisLine={false}
                tickLine={false}
              />
              <YAxis 
                className="text-xs text-slate-600 dark:text-slate-400"
                axisLine={false}
                tickLine={false}
                domain={[0, maxValue + 2]}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                  border: 'none', 
                  borderRadius: '12px',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                  backdropFilter: 'blur(10px)'
                }}
                labelStyle={{ color: '#374151', fontWeight: '600' }}
                formatter={(value: number) => [value, 'Detections']}
              />
              <Area
                type="monotone"
                dataKey="detections"
                stroke="#3b82f6"
                strokeWidth={3}
                fill="url(#colorDetections)"
                dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2, fill: '#ffffff' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}