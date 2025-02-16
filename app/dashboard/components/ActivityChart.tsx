import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Info, Loader2 } from "lucide-react";

interface ActivityChartProps {
  data: Array<{ day: string; detections: number }>;
  isLoading?: boolean;
}

export default function ActivityChart({ data, isLoading = false }: ActivityChartProps) {
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month'>('day');
  const [isMobile, setIsMobile] = useState(false);

  // Handle responsive layout detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const ranges = {
    day: { label: 'Day', color: 'from-blue-500 via-purple-500 to-pink-500' },
    week: { label: 'Week', color: 'from-green-500 via-teal-500 to-blue-500' },
    month: { label: 'Month', color: 'from-orange-500 via-red-500 to-purple-500' }
  };

  if (isLoading) {
    return (
      <Card className="bg-gradient-to-br from-gray-100 to-gray-200 shadow-lg rounded-xl">
        <CardContent className="h-[300px] md:h-[400px] flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            <p className="text-gray-500">Loading activity data...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`bg-gradient-to-br ${ranges[timeRange].color} text-white shadow-lg rounded-xl transition-all duration-300`}>
      <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 md:p-6 gap-4 md:gap-2">
        <div className="flex items-center gap-2">
          <CardTitle className="text-lg md:text-xl font-bold">Detection Activity</CardTitle>
          <div className="group relative">
            <Info className="w-4 h-4 cursor-help opacity-70 hover:opacity-100 transition-opacity" />
            <div className="invisible group-hover:visible absolute left-0 md:left-auto md:right-0 top-6 w-64 p-2 bg-white text-gray-800 text-sm rounded-lg shadow-lg z-10">
              This chart shows the number of detections over time. Toggle between different time ranges to analyze trends.
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          {Object.entries(ranges).map(([key, value]) => (
            <Button
              key={key}
              variant={timeRange === key ? "secondary" : "ghost"}
              size={isMobile ? "default" : "sm"}
              onClick={() => setTimeRange(key as 'day' | 'week' | 'month')}
              className={`
                flex-1 md:flex-none
                text-white border-white/20 hover:bg-white/20 
                ${timeRange === key ? 'bg-white/30' : ''}
                transition-all duration-200
                text-sm md:text-base
              `}
            >
              {value.label}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="p-2 md:p-6">
        <div className="h-[250px] md:h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart 
              data={data}
              margin={{
                top: 5,
                right: isMobile ? 10 : 20,
                left: isMobile ? -20 : 0,
                bottom: 5,
              }}
            >
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="rgba(255, 255, 255, 0.1)" 
                vertical={false}
              />
              <XAxis 
                dataKey="day" 
                stroke="rgba(255, 255, 255, 0.8)"
                tickMargin={8}
                tick={{ fontSize: isMobile ? 10 : 12 }}
                interval={isMobile ? 1 : 0}
              />
              <YAxis 
                stroke="rgba(255, 255, 255, 0.8)"
                tickMargin={8}
                tick={{ fontSize: isMobile ? 10 : 12 }}
                width={isMobile ? 30 : 40}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(255, 255, 255, 0.95)",
                  borderRadius: "8px",
                  border: "none",
                  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                  padding: "12px",
                  fontSize: isMobile ? "12px" : "14px",
                }}
                labelStyle={{ color: "#374151", fontWeight: "bold" }}
                itemStyle={{ color: "#374151" }}
                formatter={(value: number) => [`${value} detections`, "Activity"]}
                wrapperStyle={{ outline: 'none' }}
              />
              <Line
                type="monotone"
                dataKey="detections"
                stroke="#ffffff"
                strokeWidth={isMobile ? 2 : 3}
                dot={{ fill: "#ffffff", r: isMobile ? 3 : 4, strokeWidth: 2 }}
                activeDot={{ r: isMobile ? 6 : 8, fill: "#ffffff" }}
                animationDuration={500}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}