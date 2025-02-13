import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface ActivityChartProps {
  data: Array<{ day: string; detections: number }>;
}

export default function ActivityChart({ data }: ActivityChartProps) {
  return (
    <Card className="bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 text-white shadow-lg rounded-xl">
      <CardHeader className="flex items-center justify-between p-4">
        <CardTitle className="text-lg font-bold">Detection Activity</CardTitle>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="text-white border-white">
            Day
          </Button>
          <Button variant="ghost" size="sm" className="text-white border-white">
            Week
          </Button>
          <Button variant="ghost" size="sm" className="text-white border-white">
            Month
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.2)" />
              <XAxis dataKey="day" stroke="rgba(255, 255, 255, 0.8)" />
              <YAxis stroke="rgba(255, 255, 255, 0.8)" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(255, 255, 255, 0.9)",
                  borderRadius: "8px",
                  border: "none",
                  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                  padding: "12px",
                }}
              />
              <Line
                type="monotone"
                dataKey="detections"
                stroke="#ffffff"
                strokeWidth={3}
                dot={{ fill: "#ffffff", r: 4 }}
                activeDot={{ r: 8, fill: "#ffffff" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
