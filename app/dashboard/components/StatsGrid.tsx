import { Card, CardContent } from "@/components/ui/card";
import { BarChart3, Star, Navigation, History } from "lucide-react";
import type React from "react";

interface StatsCardProps {
  title: string;
  value: string | number;
  change: number;
  icon: React.ElementType;
}

const StatsCard = ({ title, value, change, icon: Icon }: StatsCardProps) => (
  <Card className="bg-white/90 dark:bg-gray-800 border-0 shadow-xl group hover:scale-105 transition-transform duration-300 rounded-xl">
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
          <p className="text-3xl font-bold mt-2 text-gray-900 dark:text-gray-100">{value}</p>
        </div>
        <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-500 dark:from-blue-900 dark:to-purple-900 rounded-full">
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
      <div className="mt-4 flex items-center">
        <span className={`text-sm ${change >= 0 ? "text-green-600" : "text-red-600"}`}>
          {change >= 0 ? "+" : ""}
          {change}%
        </span>
        <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">from last month</span>
      </div>
    </CardContent>
  </Card>
);

interface StatsGridProps {
  stats: {
    totalDetections: number;
    savedBuildings: number;
    detectionAccuracy: number;
    detectionHistory: number;
  };
}

export default function StatsGrid({ stats }: StatsGridProps) {
  const statsCards = [
    {
      title: "Total Detections",
      value: stats.totalDetections,
      change: 12.5,
      icon: BarChart3,
    },
    {
      title: "Saved Buildings",
      value: stats.savedBuildings,
      change: 8.2,
      icon: Star,
    },
    {
      title: "Detection Accuracy",
      value: `${stats.detectionAccuracy}%`,
      change: 3.1,
      icon: Navigation,
    },
    {
      title: "Detection History",
      value: stats.detectionHistory,
      change: -2.4,
      icon: History,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
      {statsCards.map((stat) => (
        <StatsCard key={stat.title} {...stat} />
      ))}
    </div>
  );
}
