"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Building, Calendar, Search, ArrowUpDown, ChevronLeft, MapPin, ArrowRight } from "lucide-react";

interface HistoricalDetection {
  id: string;
  buildingName: string;
  address: string;
  confidence: number;
  timestamp: string;
  features: string[];
  coordinates: {
    lat: number;
    lng: number;
  };
}

export default function HistoryPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<"date" | "confidence">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [timeFilter, setTimeFilter] = useState("all");
  const [detections, setDetections] = useState<HistoricalDetection[]>([]);
  const router = useRouter();

  useEffect(() => {
    // Fetch real data from API
    const fetchDetections = async () => {
      try {
        const response = await fetch('/api/detections', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`, // Assuming token is stored in localStorage
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setDetections(data);
      } catch (error) {
        console.error('Error fetching detection history:', error);
      }
    };

    fetchDetections();
  }, []);

  const handleSort = (field: "date" | "confidence") => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  const filterDetections = (detections: HistoricalDetection[]) => {
    return detections
      .filter(detection => {
        const matchesSearch = 
          detection.buildingName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          detection.address.toLowerCase().includes(searchTerm.toLowerCase());

        const date = new Date(detection.timestamp);
        const now = new Date();
        const daysDiff = (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);

        switch (timeFilter) {
          case "today":
            return daysDiff < 1 && matchesSearch;
          case "week":
            return daysDiff < 7 && matchesSearch;
          case "month":
            return daysDiff < 30 && matchesSearch;
          default:
            return matchesSearch;
        }
      })
      .sort((a, b) => {
        if (sortField === "date") {
          return sortOrder === "asc" 
            ? new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
            : new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        } else {
          return sortOrder === "asc"
            ? a.confidence - b.confidence
            : b.confidence - a.confidence;
        }
      });
  };

  const filteredDetections = filterDetections(detections);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-emerald-50 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Button
              variant="ghost"
              className="mb-4 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-900"
              onClick={() => router.back()}
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Detection History</h1>
            <p className="text-gray-600 dark:text-gray-400">View and analyze your past building detections</p>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-6 bg-white/80 backdrop-blur dark:bg-gray-800/80 border-blue-200 dark:border-blue-800">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search buildings or addresses..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select
                value={timeFilter}
                onValueChange={setTimeFilter}
              >
                <SelectTrigger className="w-[180px]">
                  <Calendar className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Time period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">Past week</SelectItem>
                  <SelectItem value="month">Past month</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <Card className="bg-white/80 backdrop-blur dark:bg-gray-800/80 border-blue-200 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-blue-600 dark:text-blue-400">Detection Results</CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">
              {filteredDetections.length} detections found
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Building</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        onClick={() => handleSort("confidence")}
                        className="hover:text-blue-600 dark:hover:text-blue-400"
                      >
                        Confidence
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        onClick={() => handleSort("date")}
                        className="hover:text-blue-600 dark:hover:text-blue-400"
                      >
                        Date
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDetections.map((detection) => (
                    <TableRow key={detection.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          <span>{detection.buildingName}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <span>{detection.address}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          detection.confidence > 0.9
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                            : detection.confidence > 0.7
                            ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
                            : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                        }`}>
                          {Math.round(detection.confidence * 100)}%
                        </span>
                      </TableCell>
                      <TableCell>
                        {new Date(detection.timestamp).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/detection/${detection.id}`)}
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-900"
                        >
                          View Details <ArrowRight className="ml-2 w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
