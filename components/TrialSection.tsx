import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { useRouter } from 'next/navigation';

const TrialSection = () => {
  const router = useRouter();

  return (
    <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-none mt-6">
      <CardHeader>
        <CardTitle className="text-2xl">Start Your Free Trial Today</CardTitle>
        <CardDescription className="text-blue-100">
          Unlock all features for 14 days, no credit card required
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Unlimited detections</span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Advanced analytics</span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Location history</span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Priority support</span>
          </div>
        </div>
        <Button 
          onClick={() => router.push('/auth/signup')}
          className="w-full bg-white text-blue-600 hover:bg-blue-50"
        >
          Start Free Trial
        </Button>
      </CardContent>
    </Card>
  );
};

export default TrialSection;