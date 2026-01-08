'use client';

import { useState } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';

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
    <Card className="p-4 border-gray-200">
      <p className="text-sm text-gray-700 font-medium mb-3">Is this location correct?</p>
      <div className="flex gap-2">
        <Button
          size="lg"
          onClick={() => handleFeedback(true)}
          disabled={loading}
          className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold"
        >
          Yes
        </Button>
        <Button
          size="lg"
          onClick={() => handleFeedback(false)}
          disabled={loading}
          className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold"
        >
          No
        </Button>
      </div>
    </Card>
  );
}
