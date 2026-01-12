"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { CheckCircle2, XCircle, MapPin } from 'lucide-react'

interface LocationFeedbackProps {
  imageUrl: string
  latitude: number
  longitude: number
  address?: string
  businessName?: string
  onFeedbackSubmitted?: () => void
}

export function LocationFeedback({
  imageUrl,
  latitude,
  longitude,
  address,
  businessName,
  onFeedbackSubmitted
}: LocationFeedbackProps) {
  const [showCorrection, setShowCorrection] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleCorrect = async () => {
    setLoading(true)
    try {
      await fetch('/api/navisense/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl,
          latitude,
          longitude,
          address,
          businessName,
          wasCorrect: true,
        })
      })
      setSubmitted(true)
      onFeedbackSubmitted?.()
    } catch (error) {
      console.error('Feedback error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleWrong = () => {
    setShowCorrection(true)
  }

  const handleCorrection = async (newLat: number, newLng: number) => {
    setLoading(true)
    try {
      await fetch('/api/navisense/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl,
          latitude: newLat,
          longitude: newLng,
          address,
          businessName,
          wasCorrect: false,
        })
      })
      setSubmitted(true)
      onFeedbackSubmitted?.()
    } catch (error) {
      console.error('Feedback error:', error)
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
        <CheckCircle2 className="h-6 w-6 text-green-600 mx-auto mb-2" />
        <p className="text-sm text-green-800 font-medium">
          Thank you! Your feedback helps improve our AI.
        </p>
      </div>
    )
  }

  if (showCorrection) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-900 font-medium mb-3">
          <MapPin className="h-4 w-4 inline mr-1" />
          Please tap the correct location on the map above
        </p>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => setShowCorrection(false)}
        >
          Cancel
        </Button>
      </div>
    )
  }

  return (
    <div className="bg-stone-50 border border-stone-200 rounded-lg p-4">
      <p className="text-sm text-stone-700 font-medium mb-3">
        Is this location correct?
      </p>
      <div className="flex gap-2">
        <Button
          onClick={handleCorrect}
          disabled={loading}
          className="flex-1 bg-green-600 hover:bg-green-700 text-white"
          size="sm"
        >
          <CheckCircle2 className="h-4 w-4 mr-2" />
          Yes, Correct
        </Button>
        <Button
          onClick={handleWrong}
          disabled={loading}
          variant="outline"
          className="flex-1 border-red-300 text-red-700 hover:bg-red-50"
          size="sm"
        >
          <XCircle className="h-4 w-4 mr-2" />
          No, Wrong
        </Button>
      </div>
    </div>
  )
}
