"use client";

import { DashboardChecker } from "@/components/pic2nav/dashboard-checker";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function CheckDashboardPage() {
  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <div className="mb-6">
        <Link href="/dashboard">
          <Button variant="outline" size="sm" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Dashboard Data Verification</h1>
        <p className="text-slate-500">Verify if location recognition data is correctly rendered</p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Location Recognition Check</CardTitle>
        </CardHeader>
        <CardContent>
          <DashboardChecker />
        </CardContent>
      </Card>
    </div>
  );
}