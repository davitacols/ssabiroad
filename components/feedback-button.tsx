'use client';

import { useState } from 'react';
import { Button } from './ui/button';
import { ThumbsUp, ThumbsDown, Check } from 'lucide-react';

interface FeedbackButtonProps {
  query: string;
  result: any;
  size?: 'sm' | 'default';
}

export function FeedbackButton({ query, result, size = 'sm' }: FeedbackButtonProps) {
  const [feedback, setFeedback] = useState<boolean | null>(null);

  const handleFeedback = async (isCorrect: boolean) => {
    try {
      await fetch('/api/location-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, result, isCorrect })
      });
      setFeedback(isCorrect);
    } catch (error) {
      console.error('Feedback failed:', error);
    }
  };

  if (feedback !== null) {
    return (
      <Button size={size} variant="ghost" disabled className="text-green-600">
        <Check className="w-4 h-4 mr-1" />
        Thanks!
      </Button>
    );
  }

  return (
    <div className="flex gap-1">
      <Button
        size={size}
        variant="ghost"
        onClick={() => handleFeedback(true)}
        className="text-green-600 hover:text-green-700"
      >
        <ThumbsUp className="w-4 h-4" />
      </Button>
      <Button
        size={size}
        variant="ghost"
        onClick={() => handleFeedback(false)}
        className="text-red-600 hover:text-red-700"
      >
        <ThumbsDown className="w-4 h-4" />
      </Button>
    </div>
  );
}