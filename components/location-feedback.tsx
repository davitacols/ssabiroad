'use client';

import { useState } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { ThumbsUp, ThumbsDown } from 'lucide-react';

interface LocationFeedbackProps {
  query: string;
  result: any;
  onFeedback?: (isCorrect: boolean) => void;
}

export function LocationFeedback({ query, result, onFeedback }: LocationFeedbackProps) {
  const [feedback, setFeedback] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFeedback = async (isCorrect: boolean) => {
    setLoading(true);
    try {
      await fetch('/api/location-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, result, isCorrect })
      });
      setFeedback(isCorrect);
      onFeedback?.(isCorrect);
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    } finally {
      setLoading(false);
    }
  };

  if (feedback !== null) {
    return (
      <Card className="p-3 bg-green-50 border-green-200">
        <p className="text-sm text-green-700">
          Thanks for your feedback! This helps improve our location accuracy.
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-3 border-gray-200">
      <p className="text-sm text-gray-600 mb-2">Was this location result accurate?</p>
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleFeedback(true)}
          disabled={loading}
          className="flex items-center gap-1"
        >
          <ThumbsUp className="w-4 h-4" />
          Yes
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleFeedback(false)}
          disabled={loading}
          className="flex items-center gap-1"
        >
          <ThumbsDown className="w-4 h-4" />
          No
        </Button>
      </div>
    </Card>
  );
}