export async function submitLocationFeedback(
  recognitionId: string,
  imageHash: string,
  correctLocation: { latitude: number; longitude: number },
  correctAddress: string,
  correctBusinessName?: string,
  feedback?: string,
  userId?: string
) {
  try {
    const response = await fetch('/api/location-feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recognitionId,
        imageHash,
        correctLocation,
        correctAddress,
        correctBusinessName,
        feedback,
        userId
      })
    });

    if (!response.ok) throw new Error('Feedback submission failed');
    
    const data = await response.json();
    console.log('✅ Feedback submitted:', data);
    return data;
  } catch (error) {
    console.error('Feedback error:', error);
    throw error;
  }
}

export async function getFeedbackStats(userId: string) {
  try {
    const response = await fetch(`/api/location-feedback?stats=true&userId=${userId}`);
    if (!response.ok) throw new Error('Failed to fetch stats');
    return await response.json();
  } catch (error) {
    console.error('Stats error:', error);
    return null;
  }
}

export async function trainModelFromFeedback(imageBuffer: string, location: any, address: string) {
  try {
    const response = await fetch('/api/location-feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recognitionId: `train-${Date.now()}`,
        imageHash: `hash-${Date.now()}`,
        correctLocation: location,
        correctAddress: address,
        imageBuffer
      })
    });

    if (!response.ok) throw new Error('Training failed');
    return await response.json();
  } catch (error) {
    console.error('Training error:', error);
    throw error;
  }
}
