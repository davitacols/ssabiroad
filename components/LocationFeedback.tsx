'use client';

import { useState } from 'react';
import { submitLocationFeedback } from '@/lib/feedback-training';

interface FeedbackProps {
  recognitionId: string;
  imageHash: string;
  detectedLocation: { latitude: number; longitude: number };
  detectedAddress: string;
  userId?: string;
}

export function LocationFeedback({ recognitionId, imageHash, detectedLocation, detectedAddress, userId }: FeedbackProps) {
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [correctAddress, setCorrectAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!isCorrect && !correctAddress) {
      alert('Please provide the correct address');
      return;
    }

    setLoading(true);
    try {
      await submitLocationFeedback(
        recognitionId,
        imageHash,
        isCorrect ? detectedLocation : { latitude: 0, longitude: 0 },
        isCorrect ? detectedAddress : correctAddress,
        undefined,
        isCorrect ? 'correct' : 'corrected',
        userId
      );
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 3000);
    } catch (error) {
      alert('Failed to submit feedback');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '16px', border: '1px solid #ccc', borderRadius: '8px', backgroundColor: '#f9f9f9' }}>
      <h3 style={{ fontWeight: 'bold', marginBottom: '12px' }}>Is this correct?</h3>
      
      <p style={{ fontSize: '14px', color: '#666', marginBottom: '12px' }}>{detectedAddress}</p>
      
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <button
          onClick={() => setIsCorrect(true)}
          style={{
            flex: 1,
            padding: '10px',
            borderRadius: '6px',
            border: 'none',
            fontSize: '14px',
            fontWeight: 'bold',
            cursor: 'pointer',
            backgroundColor: isCorrect === true ? '#22c55e' : '#e5e7eb',
            color: isCorrect === true ? 'white' : '#000'
          }}
        >
          Yes
        </button>
        <button
          onClick={() => setIsCorrect(false)}
          style={{
            flex: 1,
            padding: '10px',
            borderRadius: '6px',
            border: 'none',
            fontSize: '14px',
            fontWeight: 'bold',
            cursor: 'pointer',
            backgroundColor: isCorrect === false ? '#ef4444' : '#e5e7eb',
            color: isCorrect === false ? 'white' : '#000'
          }}
        >
          No
        </button>
      </div>

      {isCorrect === false && (
        <div style={{ marginBottom: '16px' }}>
          <input
            type="text"
            placeholder="Correct address"
            value={correctAddress}
            onChange={(e) => setCorrectAddress(e.target.value)}
            style={{
              width: '100%',
              padding: '8px',
              marginBottom: '8px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontSize: '14px',
              boxSizing: 'border-box'
            }}
          />
        </div>
      )}

      {isCorrect !== null && (
        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{
            width: '100%',
            padding: '10px',
            backgroundColor: loading ? '#9ca3af' : '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: 'bold',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1
          }}
        >
          {loading ? 'Submitting...' : submitted ? '✓ Submitted' : 'Submit'}
        </button>
      )}
    </div>
  );
}
