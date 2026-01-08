'use client';

import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { ThumbsUp, ThumbsDown, X } from 'lucide-react';

interface ResultFeedbackProps {
  recognitionId?: string;
  address?: string;
}

export function ResultFeedback({ recognitionId, address }: ResultFeedbackProps) {
  const { toast } = useToast();
  const [showCorrection, setShowCorrection] = useState(false);
  const [correctAddress, setCorrectAddress] = useState('');
  const [correctBusinessName, setCorrectBusinessName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFeedback = async (isCorrect: boolean) => {
    if (isCorrect) {
      try {
        await fetch('/api/location-feedback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            recognitionId: recognitionId || `result-${Date.now()}`,
            imageHash: `hash-${Date.now()}`,
            feedback: 'correct'
          })
        });
        toast({ title: 'Thanks!' });
      } catch (error) {
        console.error('Feedback error:', error);
      }
    } else {
      setShowCorrection(true);
    }
  };

  const handleSubmitCorrection = async () => {
    if (!correctAddress.trim()) {
      toast({ title: 'Please enter the correct address', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    try {
      await fetch('/api/location-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recognitionId: recognitionId || `result-${Date.now()}`,
          imageHash: `hash-${Date.now()}`,
          feedback: 'incorrect',
          correctAddress,
          correctBusinessName: correctBusinessName || null
        })
      });
      toast({ title: 'Help us improve!' });
      setShowCorrection(false);
      setCorrectAddress('');
      setCorrectBusinessName('');
    } catch (error) {
      console.error('Correction error:', error);
      toast({ title: 'Error submitting correction', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (showCorrection) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-bold text-stone-900">What's the correct location?</h4>
          <button
            onClick={() => setShowCorrection(false)}
            className="text-stone-600 hover:text-stone-900"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <input
          type="text"
          placeholder="Correct address"
          value={correctAddress}
          onChange={(e) => setCorrectAddress(e.target.value)}
          className="w-full border-2 border-stone-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
        />
        <input
          type="text"
          placeholder="Business name (optional)"
          value={correctBusinessName}
          onChange={(e) => setCorrectBusinessName(e.target.value)}
          className="w-full border-2 border-stone-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
        />
        <button
          onClick={handleSubmitCorrection}
          disabled={isSubmitting}
          className="w-full bg-black hover:bg-gray-800 text-white font-semibold py-2 rounded-full transition-colors disabled:opacity-50"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Correction'}
        </button>
      </div>
    );
  }

  return (
    <div className="flex gap-3">
      <button
        onClick={() => handleFeedback(true)}
        className="flex-1 bg-black hover:bg-gray-800 text-white font-semibold py-3 rounded-full transition-colors flex items-center justify-center gap-2"
      >
        <ThumbsUp className="w-4 h-4" />
        Yes
      </button>
      <button
        onClick={() => handleFeedback(false)}
        className="flex-1 bg-white border-2 border-black text-black hover:bg-gray-100 font-semibold py-3 rounded-full transition-colors flex items-center justify-center gap-2"
      >
        <ThumbsDown className="w-4 h-4" />
        No
      </button>
    </div>
  );
}
